import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { createClient } from '@/lib/supabase/server'

function resolveContentType(tipo: string): string {
  if (tipo.includes('image/jpeg') || tipo.includes('jpeg')) return 'image/jpeg'
  if (tipo.includes('image/png') || tipo.includes('png')) return 'image/png'
  if (tipo.includes('pdf')) return 'application/pdf'
  if (tipo.includes('xml')) return 'application/xml'
  return tipo
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storagePath = searchParams.get('storage_path')
    const uid = searchParams.get('uid')
    const part = searchParams.get('part')
    const tipo = searchParams.get('tipo') || 'application/octet-stream'
    const nome = searchParams.get('nome') || 'anexo'

    const contentType = resolveContentType(tipo)

    // Caminho 1: download do Supabase Storage
    if (storagePath) {
      console.log('[ATTACHMENT] Baixando do Storage:', storagePath)
      const supabase = await createClient()
      const { data, error } = await supabase.storage
        .from('email-anexos')
        .download(storagePath)

      if (error) {
        console.error('[ATTACHMENT] Erro ao baixar do Storage:', error.message)
        // Se falhar no Storage mas tem uid+part, tentar IMAP como fallback
        if (uid && part) {
          console.log('[ATTACHMENT] Tentando fallback IMAP...')
          return await downloadFromImap(uid, part, contentType, nome)
        }
        return NextResponse.json({ error: 'Anexo não encontrado no Storage' }, { status: 404 })
      }

      const buffer = Buffer.from(await data.arrayBuffer())
      console.log('[ATTACHMENT] Baixado do Storage, tamanho:', buffer.length, 'bytes')

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
          'Content-Disposition': `inline; filename="${encodeURIComponent(nome)}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    }

    // Caminho 2: fallback IMAP (emails antigos sem storage_path)
    if (!uid || !part) {
      return NextResponse.json(
        { error: 'storage_path ou uid+part são obrigatórios' },
        { status: 400 }
      )
    }

    return await downloadFromImap(uid, part, contentType, nome)

  } catch (error) {
    console.error('[ATTACHMENT] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao baixar anexo' },
      { status: 500 }
    )
  }
}

async function downloadFromImap(
  uid: string,
  part: string,
  contentType: string,
  nome: string
): Promise<NextResponse> {
  if (!process.env.EMAIL_IMAP_HOST || !process.env.EMAIL_IMAP_USER || !process.env.EMAIL_IMAP_PASSWORD) {
    return NextResponse.json(
      { error: 'Credenciais IMAP não configuradas' },
      { status: 500 }
    )
  }

  console.log('[ATTACHMENT] Baixando do IMAP uid:', uid, 'part:', part)

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
      return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 })
    }

    const chunks: Buffer[] = []
    for await (const chunk of content) {
      chunks.push(Buffer.from(chunk))
    }

    const buffer = Buffer.concat(chunks)
    console.log('[ATTACHMENT] Baixado do IMAP, tamanho:', buffer.length, 'bytes')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(nome)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } finally {
    lock.release()
    await client.logout()
  }
}
