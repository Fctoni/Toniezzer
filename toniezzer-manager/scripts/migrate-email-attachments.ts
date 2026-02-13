/**
 * Script de migração: salva anexos de emails antigos do IMAP no Supabase Storage.
 * Executar uma única vez: npx tsx scripts/migrate-email-attachments.ts
 *
 * Requer no .env.local:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   EMAIL_IMAP_HOST, EMAIL_IMAP_USER, EMAIL_IMAP_PASSWORD, EMAIL_IMAP_PORT
 */

import { createClient } from '@supabase/supabase-js'
import { ImapFlow } from 'imapflow'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[MIGRATE] SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios no .env.local')
  process.exit(1)
}

if (!process.env.EMAIL_IMAP_HOST || !process.env.EMAIL_IMAP_USER || !process.env.EMAIL_IMAP_PASSWORD) {
  console.error('[MIGRATE] Credenciais IMAP nao configuradas no .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface Anexo {
  nome: string
  tipo: string
  tamanho: number
  part: string
  uid: number
  url_storage?: string
}

function sanitizeEmailId(emailId: string): string {
  return emailId.replace(/[<>]/g, '').replace(/[^a-zA-Z0-9._@-]/g, '_')
}

async function main() {
  console.log('[MIGRATE] Iniciando migracao de anexos...')

  // Buscar emails com anexos
  const { data: emails, error } = await supabase
    .from('emails_monitorados')
    .select('id, email_id_externo, anexos')
    .not('anexos', 'is', null)

  if (error) {
    console.error('[MIGRATE] Erro ao buscar emails:', error.message)
    process.exit(1)
  }

  // Filtrar emails que tem pelo menos um anexo sem url_storage
  const emailsPendentes = (emails || []).filter((e) => {
    const anexos = e.anexos as Anexo[] | null
    if (!anexos || anexos.length === 0) return false
    return anexos.some((a) => !a.url_storage)
  })

  console.log(`[MIGRATE] Emails com anexos pendentes: ${emailsPendentes.length}`)

  if (emailsPendentes.length === 0) {
    console.log('[MIGRATE] Nenhum anexo para migrar. Encerrando.')
    return
  }

  // Conectar ao IMAP (uma unica conexao para todos)
  const client = new ImapFlow({
    host: process.env.EMAIL_IMAP_HOST!,
    port: parseInt(process.env.EMAIL_IMAP_PORT || '993'),
    secure: true,
    auth: {
      user: process.env.EMAIL_IMAP_USER!,
      pass: process.env.EMAIL_IMAP_PASSWORD!,
    },
    logger: false,
  })

  await client.connect()
  console.log('[MIGRATE] Conectado ao IMAP')

  const lock = await client.getMailboxLock('INBOX')

  let totalMigrados = 0
  let totalFalhas = 0

  try {
    for (const email of emailsPendentes) {
      const anexos = email.anexos as Anexo[]
      const sanitizedId = sanitizeEmailId(email.email_id_externo)
      let migradosNoEmail = 0
      let falhasNoEmail = 0

      for (const anexo of anexos) {
        if (anexo.url_storage) continue

        try {
          const { content } = await client.download(anexo.uid.toString(), anexo.part, { uid: true })

          if (!content) {
            console.error(`[MIGRATE] Email ${sanitizedId}: anexo "${anexo.nome}" sem conteudo`)
            falhasNoEmail++
            continue
          }

          const chunks: Buffer[] = []
          for await (const chunk of content) {
            chunks.push(Buffer.from(chunk))
          }
          const buffer = Buffer.concat(chunks)

          const storagePath = `${sanitizedId}/${anexo.nome}`
          const { error: uploadError } = await supabase.storage
            .from('email-anexos')
            .upload(storagePath, buffer, {
              contentType: anexo.tipo,
              upsert: true,
            })

          if (uploadError) {
            console.error(`[MIGRATE] Email ${sanitizedId}: erro upload "${anexo.nome}":`, uploadError.message)
            falhasNoEmail++
            continue
          }

          const { data: publicUrlData } = supabase.storage
            .from('email-anexos')
            .getPublicUrl(storagePath)

          anexo.url_storage = publicUrlData.publicUrl
          migradosNoEmail++
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro desconhecido'
          console.error(`[MIGRATE] Email ${sanitizedId}: falha anexo "${anexo.nome}": ${msg}`)
          falhasNoEmail++
        }
      }

      // Atualizar o campo anexos no banco com as url_storage preenchidas
      const { error: updateError } = await supabase
        .from('emails_monitorados')
        .update({ anexos: anexos as unknown as Record<string, unknown>[] })
        .eq('id', email.id)

      if (updateError) {
        console.error(`[MIGRATE] Email ${sanitizedId}: erro ao atualizar banco:`, updateError.message)
      }

      totalMigrados += migradosNoEmail
      totalFalhas += falhasNoEmail
      console.log(
        `[MIGRATE] Email ${sanitizedId}: ${migradosNoEmail} anexos migrados` +
          (falhasNoEmail > 0 ? `, ${falhasNoEmail} falha(s)` : '')
      )
    }
  } finally {
    lock.release()
    await client.logout()
    console.log('[MIGRATE] Desconectado do IMAP')
  }

  console.log(`[MIGRATE] Concluido! ${totalMigrados} anexos migrados, ${totalFalhas} falhas.`)
}

main().catch((err) => {
  console.error('[MIGRATE] Erro fatal:', err)
  process.exit(1)
})
