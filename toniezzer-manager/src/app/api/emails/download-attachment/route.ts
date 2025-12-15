import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

export async function POST(request: NextRequest) {
  try {
    const { uid, part } = await request.json()

    if (!uid || !part) {
      return NextResponse.json(
        { error: 'uid e part são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar credenciais
    if (!process.env.EMAIL_IMAP_HOST || !process.env.EMAIL_IMAP_USER || !process.env.EMAIL_IMAP_PASSWORD) {
      return NextResponse.json(
        { error: 'Credenciais IMAP não configuradas' },
        { status: 500 }
      )
    }

    console.log('[DOWNLOAD] Conectando ao IMAP para baixar anexo, uid:', uid, 'part:', part)

    // Conectar ao IMAP
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
    console.log('[DOWNLOAD] Conectado!')

    const lock = await client.getMailboxLock('INBOX')

    try {
      console.log('[DOWNLOAD] Baixando anexo...')
      
      const { content } = await client.download(uid.toString(), part, { uid: true })
      
      if (!content) {
        throw new Error('Conteúdo do anexo não encontrado')
      }

      const chunks: Buffer[] = []
      for await (const chunk of content) {
        chunks.push(Buffer.from(chunk))
      }
      
      const buffer = Buffer.concat(chunks)
      const base64 = buffer.toString('base64')
      
      console.log('[DOWNLOAD] Anexo baixado, tamanho:', buffer.length, 'bytes')

      return NextResponse.json({
        success: true,
        base64,
        size: buffer.length,
      })

    } finally {
      lock.release()
      await client.logout()
      console.log('[DOWNLOAD] Desconectado')
    }

  } catch (error) {
    console.error('[DOWNLOAD] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao baixar anexo' },
      { status: 500 }
    )
  }
}

