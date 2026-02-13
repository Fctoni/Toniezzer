import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { uid, part, storage_path } = await request.json()

    // Caminho 1: download do Supabase Storage
    if (storage_path) {
      console.log('[DOWNLOAD] Baixando do Storage:', storage_path)
      const supabase = await createClient()
      const { data, error } = await supabase.storage
        .from('email-anexos')
        .download(storage_path)

      if (error) {
        console.error('[DOWNLOAD] Erro Storage:', error.message)
        if (uid && part) {
          console.log('[DOWNLOAD] Tentando fallback IMAP...')
          return await downloadFromImap(uid, part)
        }
        return NextResponse.json({ error: 'Anexo não encontrado no Storage' }, { status: 404 })
      }

      const buffer = Buffer.from(await data.arrayBuffer())
      const base64 = buffer.toString('base64')
      console.log('[DOWNLOAD] Baixado do Storage, tamanho:', buffer.length, 'bytes')

      return NextResponse.json({ success: true, base64, size: buffer.length })
    }

    // Caminho 2: fallback IMAP
    if (!uid || !part) {
      return NextResponse.json(
        { error: 'storage_path ou uid+part são obrigatórios' },
        { status: 400 }
      )
    }

    return await downloadFromImap(uid, part)

  } catch (error) {
    console.error('[DOWNLOAD] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao baixar anexo' },
      { status: 500 }
    )
  }
}

async function downloadFromImap(uid: number | string, part: string): Promise<NextResponse> {
  if (!process.env.EMAIL_IMAP_HOST || !process.env.EMAIL_IMAP_USER || !process.env.EMAIL_IMAP_PASSWORD) {
    return NextResponse.json(
      { error: 'Credenciais IMAP não configuradas' },
      { status: 500 }
    )
  }

  console.log('[DOWNLOAD] Baixando do IMAP uid:', uid, 'part:', part)

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
    console.log('[DOWNLOAD] Baixado do IMAP, tamanho:', buffer.length, 'bytes')

    return NextResponse.json({ success: true, base64, size: buffer.length })
  } finally {
    lock.release()
    await client.logout()
  }
}
