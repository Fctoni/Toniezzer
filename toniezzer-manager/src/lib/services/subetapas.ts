import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesUpdate } from '@/lib/types/database'
type Substage = Tables<'subetapas'>

// ===== SELECT =====

export async function fetchSubstages(supabase: TypedSupabaseClient): Promise<Substage[]> {
  const { data, error } = await supabase.from('subetapas').select('*').order('ordem')
  if (error) throw error
  return data
}

export async function fetchSubstagesSummary(
  supabase: TypedSupabaseClient
): Promise<Pick<Substage, 'id' | 'etapa_id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('subetapas')
    .select('id, etapa_id, nome')
    .order('ordem')
  if (error) throw error
  return data
}

export async function fetchSubstageById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Pick<Substage, 'id' | 'nome' | 'etapa_id'> | null> {
  const { data, error } = await supabase
    .from('subetapas')
    .select('id, nome, etapa_id')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchSubstagesByResponsible(
  supabase: TypedSupabaseClient,
  responsavelId: string
): Promise<Pick<Substage, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('subetapas')
    .select('id, nome')
    .eq('responsavel_id', responsavelId)
    .neq('status', 'cancelada')
  if (error) throw error
  return data
}

export async function fetchSubstagesByIds(
  supabase: TypedSupabaseClient,
  ids: string[]
): Promise<Pick<Substage, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('subetapas')
    .select('id, nome')
    .in('id', ids)
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function createSubstage(
  supabase: TypedSupabaseClient,
  data: {
    etapa_id: string
    nome: string
    descricao?: string | null
    data_inicio_prevista?: string | null
    data_fim_prevista?: string | null
    responsavel_id?: string | null
    ordem: number
  }
): Promise<Substage> {
  const { data: subetapa, error } = await supabase
    .from('subetapas')
    .insert({
      etapa_id: data.etapa_id,
      nome: data.nome,
      descricao: data.descricao || null,
      data_inicio_prevista: data.data_inicio_prevista || null,
      data_fim_prevista: data.data_fim_prevista || null,
      responsavel_id: data.responsavel_id || null,
      ordem: data.ordem,
      status: 'nao_iniciada',
    })
    .select()
    .single()
  if (error) throw error
  return subetapa
}

// ===== UPDATE =====

export async function updateSubstage(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'subetapas'>
): Promise<Substage> {
  const updatesWithDates = { ...updates }

  if (updates.status === 'em_andamento') {
    updatesWithDates.data_inicio_real = updatesWithDates.data_inicio_real ?? new Date().toISOString().split('T')[0]
  }
  if (updates.status === 'concluida') {
    updatesWithDates.data_fim_real = updatesWithDates.data_fim_real ?? new Date().toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('subetapas')
    .update(updatesWithDates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reorderSubstages(
  supabase: TypedSupabaseClient,
  orderedSubstages: { id: string; ordem: number }[]
): Promise<void> {
  for (const item of orderedSubstages) {
    const { error } = await supabase
      .from('subetapas')
      .update({ ordem: item.ordem })
      .eq('id', item.id)
    if (error) throw error
  }
}

// ===== DELETE =====

export async function deleteSubstage(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('subetapas').delete().eq('id', id)
  if (error) throw error
}

// ===== CÁLCULOS =====

export function calculateSubstageProgress(
  subetapa: { progresso_percentual?: number | null; tarefas: { status: string }[] }
): number {
  if (subetapa.tarefas.length === 0) return subetapa.progresso_percentual ?? 0
  const concluidas = subetapa.tarefas.filter((t) => t.status === 'concluida').length
  return Math.round((concluidas / subetapa.tarefas.length) * 100)
}
