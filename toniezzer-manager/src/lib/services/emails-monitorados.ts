import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/lib/types/database'
type EmailMonitorado = Tables<'emails_monitorados'>

// ===== SELECT =====

export async function buscarEmails(supabase: TypedSupabaseClient): Promise<EmailMonitorado[]> {
  const { data, error } = await supabase
    .from('emails_monitorados')
    .select('*')
    .order('data_recebimento', { ascending: false })
  if (error) throw error
  return data
}

export async function buscarEmailPorId(
  supabase: TypedSupabaseClient,
  id: string
): Promise<EmailMonitorado> {
  const { data, error } = await supabase
    .from('emails_monitorados')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function buscarEmailPorIdExterno(
  supabase: TypedSupabaseClient,
  emailId: string
): Promise<Pick<EmailMonitorado, 'id'> | null> {
  const { data, error } = await supabase
    .from('emails_monitorados')
    .select('id')
    .eq('email_id_externo', emailId)
  if (error) throw error
  return data?.[0] ?? null
}

export async function buscarEmailsParaProcessar(
  supabase: TypedSupabaseClient,
  limit = 10
): Promise<EmailMonitorado[]> {
  const { data, error } = await supabase
    .from('emails_monitorados')
    .select('*')
    .in('status', ['nao_processado', 'erro'])
    .limit(limit)
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function criarEmail(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'emails_monitorados'>
): Promise<EmailMonitorado> {
  const { data: email, error } = await supabase
    .from('emails_monitorados')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return email
}

// ===== UPDATE =====

export async function atualizarAnexosEmail(
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

export async function atualizarStatusEmail(
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

export async function aprovarEmail(
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

export async function rejeitarEmail(
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
