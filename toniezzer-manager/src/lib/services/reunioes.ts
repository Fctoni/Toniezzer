import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert } from '@/lib/types/database'
type Meeting = Tables<'reunioes'>

// ===== SELECT =====

export async function fetchMeetingsWithDetails(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase
    .from('reunioes')
    .select('*, created_by_user:created_by(nome_completo), reunioes_acoes(id, status)')
    .order('data_reuniao', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchMeetingById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Meeting> {
  const { data, error } = await supabase
    .from('reunioes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function createMeeting(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'reunioes'>
): Promise<Meeting> {
  const { data: reuniao, error } = await supabase
    .from('reunioes')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return reuniao
}

// ===== DELETE =====

export async function deleteMeeting(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('reunioes').delete().eq('id', id)
  if (error) throw error
}
