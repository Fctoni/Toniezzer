import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { createClient } from '@/lib/supabase/server'

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

        // Extrair informações dos anexos da estrutura (SEM BAIXAR)
        const anexos: Array<{ 
          nome: string
          tipo: string
          tamanho: number
          part: string
          uid: number
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

        // Determinar status inicial baseado nos anexos
        const temAnexoProcessavel = anexos.some(a => 
          a.tipo.includes('image') ||
          a.tipo.includes('pdf') ||
          a.tipo.includes('xml')
        )

        // Inserir no banco (NÃO baixamos os anexos aqui, apenas metadados)
        const { error } = await supabase
          .from('emails_monitorados')
          .insert({
            email_id_externo: emailId,
            remetente: message.envelope.from?.[0]?.address || '',
            remetente_nome: message.envelope.from?.[0]?.name || null,
            assunto: message.envelope.subject || '(Sem assunto)',
            corpo: null,
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
