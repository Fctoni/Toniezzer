import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { createClient } from '@/lib/supabase/server'

// Percorre a bodyStructure recursivamente procurando text/plain (prioridade) ou text/html (fallback)
function findTextPart(structure: Record<string, unknown> | null): { partId: string; isHtml: boolean } | null {
  if (!structure) return null

  const type = structure.type as string | undefined
  const subtype = (structure as Record<string, unknown>).subtype as string | undefined

  // Nó folha com text/plain — retorna imediatamente (prioridade)
  if (type === 'text/plain' || (type === 'text' && subtype === 'plain')) {
    return { partId: (structure.part as string) || '1', isHtml: false }
  }

  // Nó folha com text/html — guarda como fallback
  let htmlFallback: { partId: string; isHtml: boolean } | null = null
  if (type === 'text/html' || (type === 'text' && subtype === 'html')) {
    htmlFallback = { partId: (structure.part as string) || '1', isHtml: true }
  }

  // Percorre filhos
  const children = structure.childNodes as Record<string, unknown>[] | undefined
  if (children) {
    for (const child of children) {
      const result = findTextPart(child)
      if (result && !result.isHtml) return result // text/plain encontrado
      if (result && result.isHtml && !htmlFallback) htmlFallback = result
    }
  }

  return htmlFallback
}

// Converte HTML em texto puro preservando line breaks
function stripHtmlToText(html: string): string {
  let text = html
  // Converte tags de bloco em quebras de linha
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n')
  // Remove todas as demais tags HTML
  text = text.replace(/<[^>]+>/g, '')
  // Decode entidades HTML básicas
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&#39;/g, "'")
  // Colapsa múltiplas linhas vazias consecutivas em no máximo 2
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
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
      // Buscar emails não lidos dos últimos 7 dias
      const since = new Date()
      since.setDate(since.getDate() - 7)

      console.log('[EMAIL SYNC] Buscando emails desde:', since.toISOString())

      for await (const message of client.fetch(
        { seen: false, since },
        { envelope: true, bodyStructure: true, uid: true }
      )) {
        if (!message.envelope) continue;
        
        const emailId = message.envelope.messageId || `msg-${message.uid}`

        console.log('[EMAIL SYNC] Processando:', emailId, message.envelope.subject)

        // Verificar se já existe
        const { data: existing } = await supabase
          .from('emails_monitorados')
          .select('id')
          .eq('email_id_externo', emailId)
          .single()

        if (existing) {
          console.log('[EMAIL SYNC] Email já existe, pulando...')
          continue
        }

        // Extrair informações dos anexos da estrutura e salvar no Storage
        const anexos: Array<{
          nome: string
          tipo: string
          tamanho: number
          part: string
          uid: number
          url_storage: string
        }> = []

        // Função recursiva para encontrar anexos na estrutura
        function findAttachments(structure: any, partPath: string = '') {
          if (!structure) return
          
          // Verificar se é um anexo processável
          const isAttachment = structure.disposition === 'attachment'
          const isProcessableType = structure.type && (
            structure.type.includes('image') ||
            structure.type.includes('pdf') ||
            structure.type.includes('xml')
          )
          
          if ((isAttachment || isProcessableType) && structure.size > 0) {
            const filename = structure.dispositionParameters?.filename || 
                           structure.parameters?.name ||
                           `anexo-${anexos.length + 1}.${structure.subtype || 'bin'}`
            
            anexos.push({
              nome: filename,
              tipo: `${structure.type}/${structure.subtype}` || 'application/octet-stream',
              tamanho: structure.size || 0,
              part: partPath || '1',
              uid: message.uid,
              url_storage: '',
            })
          }
          
          if (structure.childNodes) {
            structure.childNodes.forEach((child: any, index: number) => {
              const newPath = partPath ? `${partPath}.${index + 1}` : `${index + 1}`
              findAttachments(child, newPath)
            })
          }
        }

        findAttachments(message.bodyStructure)
        console.log('[EMAIL SYNC] Anexos encontrados:', anexos.length)

        // Baixar e salvar cada anexo no Supabase Storage
        const sanitizedEmailId = emailId.replace(/[<>]/g, '').replace(/[^a-zA-Z0-9._@-]/g, '_')
        for (const anexo of anexos) {
          try {
            const { content: attachContent } = await client.download(message.uid.toString(), anexo.part, { uid: true })
            if (attachContent) {
              const attachChunks: Buffer[] = []
              for await (const chunk of attachContent) {
                attachChunks.push(Buffer.from(chunk))
              }
              const attachBuffer = Buffer.concat(attachChunks)

              const storagePath = `${sanitizedEmailId}/${anexo.nome}`
              const { error: uploadError } = await supabase.storage
                .from('email-anexos')
                .upload(storagePath, attachBuffer, {
                  contentType: anexo.tipo,
                  upsert: false,
                })

              if (uploadError) {
                console.error('[EMAIL SYNC] Erro upload anexo:', anexo.nome, uploadError.message)
                anexo.url_storage = ''
              } else {
                const { data: publicUrlData } = supabase.storage
                  .from('email-anexos')
                  .getPublicUrl(storagePath)
                anexo.url_storage = publicUrlData.publicUrl
                console.log('[EMAIL SYNC] Anexo salvo no Storage:', anexo.nome)
              }
            } else {
              anexo.url_storage = ''
            }
          } catch (attachError) {
            console.error('[EMAIL SYNC] Erro ao baixar/salvar anexo:', anexo.nome, attachError)
            anexo.url_storage = ''
          }
        }

        // Extrair corpo do email
        let corpoTexto: string | null = null
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
              corpoTexto = rawText.trim() || null
            }
          }
        } catch (bodyError) {
          console.error('[EMAIL SYNC] Erro ao extrair corpo (continuando):', bodyError)
        }

        // Determinar status inicial baseado nos anexos
        const temAnexoProcessavel = anexos.some(a =>
          a.tipo.includes('image') ||
          a.tipo.includes('pdf') ||
          a.tipo.includes('xml')
        )

        // Inserir no banco (anexos já foram salvos no Storage acima)
        const { error } = await supabase
          .from('emails_monitorados')
          .insert({
            email_id_externo: emailId,
            remetente: message.envelope.from?.[0]?.address || '',
            remetente_nome: message.envelope.from?.[0]?.name || null,
            assunto: message.envelope.subject || '(Sem assunto)',
            corpo: corpoTexto,
            data_recebimento: message.envelope.date?.toISOString() || new Date().toISOString(),
            status: temAnexoProcessavel ? 'nao_processado' : 'aguardando_revisao',
            anexos: anexos.length > 0 ? anexos : null,
          })

        if (error) {
          console.error('[EMAIL SYNC] Erro ao inserir:', error)
          continue
        }

        newEmails++
        console.log('[EMAIL SYNC] Email inserido com sucesso!')
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
