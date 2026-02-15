import { createClient } from '@/lib/supabase/server'
import { fetchEmails } from '@/lib/services/emails-monitorados'
import { EmailsPageClient } from '@/components/features/emails/emails-page-client'

export default async function EmailsPage() {
  const supabase = await createClient()
  const emails = await fetchEmails(supabase)
  return <EmailsPageClient initialEmails={emails} />
}
