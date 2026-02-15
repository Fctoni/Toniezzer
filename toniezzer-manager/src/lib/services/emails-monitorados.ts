import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/lib/types/database'
type MonitoredEmail = Tables<'emails_monitorados'>

// ===== SELECT =====

export async function fetchEmails(supabase: TypedSupabaseClient): Promise<MonitoredEmail[]> {
  const { data, error } = await supabase
    .from('emails_monitorados')
    .select('*')
    .order('data_recebimento', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchEmailById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<MonitoredEmail> {
  const { data, error } = await supabase
    .from('emails_monitorados')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchEmailByExternalId(
  supabase: TypedSupabaseClient,
  emailId: string
): Promise<Pick<MonitoredEmail, 'id'> | null> {
  const { data, error } = await supabase
    .from('emails_monitorados')
    .select('id')
    .eq('email_id_externo', emailId)
  if (error) throw error
  return data?.[0] ?? null
}

export async function fetchEmailsForProcessing(
  supabase: TypedSupabaseClient,
  limit = 10
): Promise<MonitoredEmail[]> {
  const { data, error } = await supabase
    .from('emails_monitorados')
    .select('*')
    .in('status', ['nao_processado', 'erro'])
    .limit(limit)
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function createEmail(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'emails_monitorados'>
): Promise<MonitoredEmail> {
  const { data: email, error } = await supabase
    .from('emails_monitorados')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return email
}

// ===== UPDATE =====

export async function updateEmailAttachments(
  supabase: TypedSupabaseClient,
  id: string,
  anexos: Json
): Promise<void> {
  const { error } = await supabase
    .from('emails_monitorados')
    .update({ anexos })
    .eq('id', id)
  if (error) throw error
}

export async function updateEmailStatus(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'emails_monitorados'>
): Promise<void> {
  const { error } = await supabase
    .from('emails_monitorados')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function approveEmail(
  supabase: TypedSupabaseClient,
  id: string,
  data: { status: string; compra_sugerida_id: string | null; processado_em: string; processado_por: string }
): Promise<void> {
  const { error } = await supabase
    .from('emails_monitorados')
    .update({
      status: data.status,
      compra_sugerida_id: data.compra_sugerida_id,
      processado_em: data.processado_em,
      processado_por: data.processado_por,
    })
    .eq('id', id)
  if (error) throw error
}

export async function rejectEmail(
  supabase: TypedSupabaseClient,
  id: string,
  data: { status: string; processado_em: string; processado_por: string }
): Promise<void> {
  const { error } = await supabase
    .from('emails_monitorados')
    .update({
      status: data.status,
      processado_em: data.processado_em,
      processado_por: data.processado_por,
    })
    .eq('id', id)
  if (error) throw error
}
