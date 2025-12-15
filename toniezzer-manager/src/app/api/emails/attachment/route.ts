import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')
    const part = searchParams.get('part')
    const tipo = searchParams.get('tipo') || 'application/octet-stream'
    const nome = searchParams.get('nome') || 'anexo'

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

    console.log('[ATTACHMENT] Baixando anexo uid:', uid, 'part:', part)

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
    const lock = await client.getMailboxLock('INBOX')

    try {
      const { content } = await client.download(uid, part, { uid: true })
      
      if (!content) {
        return NextResponse.json(
          { error: 'Anexo não encontrado' },
          { status: 404 }
        )
      }

      const chunks: Buffer[] = []
      for await (const chunk of content) {
        chunks.push(Buffer.from(chunk))
      }
      
      const buffer = Buffer.concat(chunks)
      console.log('[ATTACHMENT] Anexo baixado, tamanho:', buffer.length, 'bytes')

      // Determinar content-type correto
      let contentType = tipo
      if (tipo.includes('image/jpeg') || tipo.includes('jpeg')) {
        contentType = 'image/jpeg'
      } else if (tipo.includes('image/png') || tipo.includes('png')) {
        contentType = 'image/png'
      } else if (tipo.includes('pdf')) {
        contentType = 'application/pdf'
      } else if (tipo.includes('xml')) {
        contentType = 'application/xml'
      }

      // Retornar como arquivo
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
          'Content-Disposition': `inline; filename="${encodeURIComponent(nome)}"`,
          'Cache-Control': 'private, max-age=3600', // Cache por 1 hora
        },
      })

    } finally {
      lock.release()
      await client.logout()
    }

  } catch (error) {
    console.error('[ATTACHMENT] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao baixar anexo' },
      { status: 500 }
    )
  }
}

