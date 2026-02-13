import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert } from '@/lib/types/database'
type Reuniao = Tables<'reunioes'>

// ===== SELECT =====

export async function buscarReunioesComDetalhes(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase
    .from('reunioes')
    .select('*, created_by_user:created_by(nome_completo), reunioes_acoes(id, status)')
    .order('data_reuniao', { ascending: false })
  if (error) throw error
  return data
}

export async function buscarReuniaoPorId(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Reuniao> {
  const { data, error } = await supabase
    .from('reunioes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function criarReuniao(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'reunioes'>
): Promise<Reuniao> {
  const { data: reuniao, error } = await supabase
    .from('reunioes')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return reuniao
}

// ===== DELETE =====

export async function deletarReuniao(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('reunioes').delete().eq('id', id)
  if (error) throw error
}
