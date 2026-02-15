import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert } from '@/lib/types/database'
type CommunicationTopic = Tables<'topicos_comunicacao'>

// ===== SELECT =====

export async function fetchTopics(
  supabase: TypedSupabaseClient,
  filtros?: { status?: string; search?: string }
) {
  let query = supabase
    .from('topicos_comunicacao')
    .select('*, autor:autor_id(*), etapa:etapa_relacionada_id(*)')
    .order('fixado', { ascending: false })
    .order('updated_at', { ascending: false })

  if (filtros?.status) {
    query = query.eq('status', filtros.status)
  }
  if (filtros?.search) {
    query = query.ilike('titulo', `%${filtros.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchTopicById(supabase: TypedSupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('topicos_comunicacao')
    .select('*, autor:autor_id(*), etapa:etapa_relacionada_id(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function createTopic(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'topicos_comunicacao'>
): Promise<CommunicationTopic> {
  const { data: topico, error } = await supabase
    .from('topicos_comunicacao')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return topico
}

// ===== UPDATE =====

export async function updateTopicStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('topicos_comunicacao')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function togglePinnedTopic(
  supabase: TypedSupabaseClient,
  id: string,
  fixado: boolean
): Promise<void> {
  const { error } = await supabase
    .from('topicos_comunicacao')
    .update({ fixado })
    .eq('id', id)
  if (error) throw error
}

// ===== DELETE =====

export async function deleteTopic(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('topicos_comunicacao').delete().eq('id', id)
  if (error) throw error
}
