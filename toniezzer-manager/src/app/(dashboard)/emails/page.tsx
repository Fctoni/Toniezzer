import { createClient } from '@/lib/supabase/server'
import { buscarEmails } from '@/lib/services/emails-monitorados'
import { EmailsPageClient } from '@/components/features/emails/emails-page-client'

export default async function EmailsPage() {
  const supabase = await createClient()
  const emails = await buscarEmails(supabase)
  return <EmailsPageClient initialEmails={emails} />
}
