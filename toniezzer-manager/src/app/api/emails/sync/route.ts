import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { createClient } from '@/lib/supabase/server'
import { buscarEmailPorIdExterno, criarEmail } from '@/lib/services/emails-monitorados'

// Estrutura de body do IMAP
interface BodyStructure {
  disposition?: string
  type?: string
  subtype?: string
  size?: number
  dispositionParameters?: { filename?: string }
  parameters?: { name?: string }
  childNodes?: BodyStructure[]
}

interface TextPartInfo {
  partId: string
  isHtml: boolean
}

interface PendingEmail {
  uid: number
  emailId: string
  remetente: string
  remetente_nome: string | null
  assunto: string
  data_recebimento: string
  status: string
  anexos: Array<{ nome: string; tipo: string; tamanho: number; part: string; uid: number }> | null
  textPart: TextPartInfo | null
}

// Percorre bodyStructure recursivamente para encontrar text/plain (prioridade) ou text/html (fallback)
// ImapFlow retorna type como "text/plain" (combinado) — tratar ambos os formatos
function findTextPart(structure: BodyStructure, partPath: string = ''): TextPartInfo | null {
  if (!structure) return null

  const mimeType = structure.type || ''
  const isTextPlain = mimeType === 'text/plain' || (structure.type === 'text' && structure.subtype === 'plain')
  const isTextHtml = mimeType === 'text/html' || (structure.type === 'text' && structure.subtype === 'html')
  const isAttachment = structure.disposition === 'attachment'

  const partId = (structure as BodyStructure & { part?: string }).part || partPath || '1'

  if (isTextPlain && !isAttachment) {
    return { partId, isHtml: false }
  }

  if (isTextHtml && !isAttachment) {
    return { partId, isHtml: true }
  }

  if (structure.childNodes) {
    let htmlFallback: TextPartInfo | null = null

    for (let i = 0; i < structure.childNodes.length; i++) {
      const child = structure.childNodes[i]
      const childPath = partPath ? `${partPath}.${i + 1}` : `${i + 1}`
      const result = findTextPart(child, childPath)

      if (result && !result.isHtml) return result
      if (result && result.isHtml && !htmlFallback) htmlFallback = result
    }

    return htmlFallback
  }

  return null
}

// Converte HTML para texto puro preservando line breaks
function stripHtmlToText(html: string): string {
  let text = html
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/(p|div|tr|li|h[1-6]|blockquote)>/gi, '\n')
  text = text.replace(/<hr\s*\/?>/gi, '\n')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()
  return text
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar credenciais
    if (!process.env.EMAIL_IMAP_HOST || !process.env.EMAIL_IMAP_USER || !process.env.EMAIL_IMAP_PASSWORD) {
      return NextResponse.json(
        { error: 'Credenciais IMAP não configuradas no .env.local' },
        { status: 500 }
      )
    }

    console.log('[EMAIL SYNC] Conectando ao servidor IMAP...')

    // Configuração IMAP
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
    console.log('[EMAIL SYNC] Conectado!')

    // Abrir INBOX
    const lock = await client.getMailboxLock('INBOX')
    let newEmails = 0

    try {
      // Buscar todos os emails do último mês (lidos e não lidos)
      const since = new Date()
      since.setMonth(since.getMonth() - 1)

      console.log('[EMAIL SYNC] Buscando emails desde:', since.toISOString())

      // Primeiro passo: coletar metadados de emails novos
      const pendingEmails: PendingEmail[] = []

      for await (const message of client.fetch(
        { since },
        { envelope: true, bodyStructure: true, uid: true }
      )) {
        if (!message.envelope) continue;

        const emailId = message.envelope.messageId || `msg-${message.uid}`

        console.log('[EMAIL SYNC] Processando:', emailId, message.envelope.subject)

        // Verificar se já existe
        const existing = await buscarEmailPorIdExterno(supabase, emailId)

        if (existing) {
          console.log('[EMAIL SYNC] Email já existe, pulando...')
          continue
        }

        // Extrair informações dos anexos da estrutura (SEM BAIXAR)
        const anexos: Array<{
          nome: string
          tipo: string
          tamanho: number
          part: string
          uid: number
        }> = []

        // Função recursiva para encontrar anexos na estrutura
        function findAttachments(structure: BodyStructure, partPath: string = '') {
          if (!structure) return

          // Verificar se é um anexo processável
          const isAttachment = structure.disposition === 'attachment'
          const isProcessableType = structure.type && (
            structure.type.includes('image') ||
            structure.type.includes('pdf') ||
            structure.type.includes('xml')
          )

          if ((isAttachment || isProcessableType) && (structure.size ?? 0) > 0) {
            const filename = structure.dispositionParameters?.filename ||
                           structure.parameters?.name ||
                           `anexo-${anexos.length + 1}.${structure.subtype || 'bin'}`

            anexos.push({
              nome: filename,
              tipo: `${structure.type}/${structure.subtype}` || 'application/octet-stream',
              tamanho: structure.size || 0,
              part: partPath || '1',
              uid: message.uid,
            })
          }

          if (structure.childNodes) {
            structure.childNodes.forEach((child: BodyStructure, index: number) => {
              const newPath = partPath ? `${partPath}.${index + 1}` : `${index + 1}`
              findAttachments(child, newPath)
            })
          }
        }

        if (message.bodyStructure) {
          findAttachments(message.bodyStructure as BodyStructure)
        }
        console.log('[EMAIL SYNC] Anexos encontrados:', anexos.length)

        // Determinar status inicial baseado nos anexos
        const temAnexoProcessavel = anexos.some(a =>
          a.tipo.includes('image') ||
          a.tipo.includes('pdf') ||
          a.tipo.includes('xml')
        )

        // Encontrar parte textual para download posterior
        const textPart = message.bodyStructure
          ? findTextPart(message.bodyStructure as BodyStructure)
          : null

        pendingEmails.push({
          uid: message.uid,
          emailId,
          remetente: message.envelope.from?.[0]?.address || '',
          remetente_nome: message.envelope.from?.[0]?.name || null,
          assunto: message.envelope.subject || '(Sem assunto)',
          data_recebimento: message.envelope.date?.toISOString() || new Date().toISOString(),
          status: temAnexoProcessavel ? 'nao_processado' : 'aguardando_revisao',
          anexos: anexos.length > 0 ? anexos : null,
          textPart,
        })
      }

      // Segundo passo: baixar corpos e inserir no banco
      for (const pending of pendingEmails) {
        let corpo: string | null = null

        if (pending.textPart) {
          try {
            const { content } = await client.download(
              String(pending.uid),
              pending.textPart.partId,
              { uid: true }
            )

            const chunks: Buffer[] = []
            for await (const chunk of content) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
            }
            const rawText = Buffer.concat(chunks).toString('utf-8')
            corpo = pending.textPart.isHtml ? stripHtmlToText(rawText) : rawText

            // Limitar tamanho para evitar armazenar emails muito grandes
            if (corpo && corpo.length > 50000) {
              corpo = corpo.substring(0, 50000) + '\n\n[Texto truncado...]'
            }
          } catch (downloadError) {
            console.error('[EMAIL SYNC] Erro ao baixar corpo do email:', downloadError)
          }
        }

        try {
          await criarEmail(supabase, {
            email_id_externo: pending.emailId,
            remetente: pending.remetente,
            remetente_nome: pending.remetente_nome,
            assunto: pending.assunto,
            corpo,
            data_recebimento: pending.data_recebimento,
            status: pending.status,
            anexos: pending.anexos,
          })
          newEmails++
          console.log('[EMAIL SYNC] Email inserido com sucesso!')
        } catch (insertError) {
          console.error('[EMAIL SYNC] Erro ao inserir:', insertError)
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
    console.log('[EMAIL SYNC] Desconectado. Total novos:', newEmails)

    return NextResponse.json({
      success: true,
      message: `${newEmails} novos emails sincronizados`,
      newEmails,
    })

  } catch (error) {
    console.error('[EMAIL SYNC] Erro:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao sincronizar emails',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
