import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { createClient } from '@/lib/supabase/server'
import { atualizarStatusEmail } from '@/lib/services/emails-monitorados'
import type { Json } from '@/lib/types/database'

// Reusa as mesmas funções auxiliares da rota de sync
function findTextPart(structure: Record<string, unknown> | null): { partId: string; isHtml: boolean } | null {
  if (!structure) return null

  const type = structure.type as string | undefined
  const subtype = (structure as Record<string, unknown>).subtype as string | undefined

  if (type === 'text/plain' || (type === 'text' && subtype === 'plain')) {
    return { partId: (structure.part as string) || '1', isHtml: false }
  }

  let htmlFallback: { partId: string; isHtml: boolean } | null = null
  if (type === 'text/html' || (type === 'text' && subtype === 'html')) {
    htmlFallback = { partId: (structure.part as string) || '1', isHtml: true }
  }

  const children = structure.childNodes as Record<string, unknown>[] | undefined
  if (children) {
    for (const child of children) {
      const result = findTextPart(child)
      if (result && !result.isHtml) return result
      if (result && result.isHtml && !htmlFallback) htmlFallback = result
    }
  }

  return htmlFallback
}

function stripHtmlToText(html: string): string {
  let text = html
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

interface AnexoDb {
  nome: string
  tipo: string
  tamanho: number
  part: string
  uid: number
  url_storage?: string
}

interface BodyStructure {
  disposition?: string
  type?: string
  subtype?: string
  size?: number
  dispositionParameters?: { filename?: string }
  parameters?: { name?: string }
  childNodes?: BodyStructure[]
}

// GET para permitir execução via navegador (já autenticado pelo middleware)
export async function GET() {
  return backfill()
}

export async function POST() {
  return backfill()
}

async function backfill() {
  try {
    const supabase = await createClient()

    if (!process.env.EMAIL_IMAP_HOST || !process.env.EMAIL_IMAP_USER || !process.env.EMAIL_IMAP_PASSWORD) {
      return NextResponse.json(
        { error: 'Credenciais IMAP não configuradas no .env.local' },
        { status: 500 }
      )
    }

    // 1. Buscar emails no banco que precisam de backfill (corpo null OU anexos sem url_storage)
    const { data: emailsDb, error: dbError } = await supabase
      .from('emails_monitorados')
      .select('id, email_id_externo, corpo, anexos')

    if (dbError) throw dbError

    // Filtrar emails que precisam de backfill
    const emailsParaBackfill = (emailsDb ?? []).filter(e => {
      const precisaCorpo = !e.corpo
      const anexos = e.anexos as AnexoDb[] | null
      const precisaAnexos = anexos?.some(a => !a.url_storage) ?? false
      return precisaCorpo || precisaAnexos
    })

    if (emailsParaBackfill.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum email precisa de backfill',
        updated: 0,
      })
    }

    console.log(`[BACKFILL] ${emailsParaBackfill.length} emails precisam de backfill`)

    // Criar mapa de email_id_externo → registro do banco para lookup rápido
    const emailMap = new Map(
      emailsParaBackfill.map(e => [e.email_id_externo, e])
    )

    // 2. Conectar ao IMAP
    const client = new ImapFlow({
      host: process.env.EMAIL_IMAP_HOST,
      port: parseInt(process.env.EMAIL_IMAP_PORT || '993'),
      secure: true,
      auth: {
        user: process.env.EMAIL_IMAP_USER,
        pass: process.env.EMAIL_IMAP_PASSWORD,
      },
      logger: false,
    })

    await client.connect()
    console.log('[BACKFILL] Conectado ao IMAP')

    const lock = await client.getMailboxLock('INBOX')
    let updated = 0
    let skipped = 0

    try {
      // Buscar emails do último mês (mesmo range que o sync)
      const since = new Date()
      since.setMonth(since.getMonth() - 1)

      for await (const message of client.fetch(
        { since },
        { envelope: true, bodyStructure: true, uid: true }
      )) {
        if (!message.envelope) continue

        const messageId = message.envelope.messageId || `msg-${message.uid}`
        const dbRecord = emailMap.get(messageId)

        if (!dbRecord) {
          skipped++
          continue
        }

        console.log(`[BACKFILL] Processando: ${messageId}`)
        const updates: { corpo?: string | null; anexos?: Json } = {}

        // 3. Extrair corpo se necessário
        if (!dbRecord.corpo) {
          try {
            const textPart = findTextPart(message.bodyStructure as unknown as Record<string, unknown>)
            if (textPart) {
              const { content } = await client.download(message.uid.toString(), textPart.partId, { uid: true })
              if (content) {
                const chunks: Buffer[] = []
                for await (const chunk of content) {
                  chunks.push(Buffer.from(chunk))
                }
                let rawText = Buffer.concat(chunks).toString('utf-8')
                if (textPart.isHtml) {
                  rawText = stripHtmlToText(rawText)
                }
                updates.corpo = rawText.trim() || null
                console.log(`[BACKFILL] Corpo extraído (${rawText.length} chars)`)
              }
            }
          } catch (bodyError) {
            console.error('[BACKFILL] Erro ao extrair corpo:', bodyError)
          }
        }

        // 4. Baixar e salvar anexos no Storage se necessário
        const anexos = (dbRecord.anexos as AnexoDb[] | null) ?? []
        const anexosSemStorage = anexos.filter(a => !a.url_storage)

        if (anexosSemStorage.length > 0) {
          const sanitizedId = messageId.replace(/[<>]/g, '').replace(/[^a-zA-Z0-9._@-]/g, '_')
          const anexosAtualizados = [...anexos]

          for (const anexo of anexosSemStorage) {
            try {
              const { content: attachContent } = await client.download(message.uid.toString(), anexo.part, { uid: true })
              if (attachContent) {
                const attachChunks: Buffer[] = []
                for await (const chunk of attachContent) {
                  attachChunks.push(Buffer.from(chunk))
                }
                const attachBuffer = Buffer.concat(attachChunks)

                const storagePath = `${sanitizedId}/${anexo.nome}`
                const { error: uploadError } = await supabase.storage
                  .from('email-anexos')
                  .upload(storagePath, attachBuffer, {
                    contentType: anexo.tipo,
                    upsert: true,
                  })

                if (!uploadError) {
                  const { data: publicUrlData } = supabase.storage
                    .from('email-anexos')
                    .getPublicUrl(storagePath)

                  // Atualizar url_storage no array
                  const idx = anexosAtualizados.findIndex(a => a.part === anexo.part)
                  if (idx >= 0) {
                    anexosAtualizados[idx] = { ...anexosAtualizados[idx], url_storage: publicUrlData.publicUrl }
                  }
                  console.log(`[BACKFILL] Anexo salvo: ${anexo.nome}`)
                } else {
                  console.error(`[BACKFILL] Erro upload ${anexo.nome}:`, uploadError.message)
                }
              }
            } catch (attachError) {
              console.error(`[BACKFILL] Erro ao baixar anexo ${anexo.nome}:`, attachError)
            }
          }

          // Só atualiza se algum anexo foi salvo com sucesso
          const temNovosUrls = anexosAtualizados.some((a, i) =>
            a.url_storage && a.url_storage !== (anexos[i]?.url_storage ?? '')
          )
          if (temNovosUrls) {
            updates.anexos = anexosAtualizados as unknown as Json
          }
        }

        // 5. Atualizar no banco se houve mudanças
        if (Object.keys(updates).length > 0) {
          await atualizarStatusEmail(supabase, dbRecord.id, updates)
          updated++
          console.log(`[BACKFILL] Email atualizado: ${messageId}`)
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
    console.log(`[BACKFILL] Concluído. Atualizados: ${updated}, Ignorados: ${skipped}`)

    return NextResponse.json({
      success: true,
      message: `${updated} emails atualizados via backfill`,
      updated,
      skipped,
      total: emailsParaBackfill.length,
    })

  } catch (error) {
    console.error('[BACKFILL] Erro:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao executar backfill',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
