import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesUpdate } from '@/lib/types/database'
type Stage = Tables<'etapas'>

// ===== SELECT =====

export async function fetchStages(supabase: TypedSupabaseClient): Promise<Stage[]> {
  const { data, error } = await supabase.from('etapas').select('*').order('ordem')
  if (error) throw error
  return data
}

export async function fetchStageName(
  supabase: TypedSupabaseClient,
  id: string
): Promise<{ nome: string } | null> {
  const { data, error } = await supabase.from('etapas').select('nome').eq('id', id).single()
  if (error) throw error
  return data
}

export async function fetchStagesForDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<Stage, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('etapas')
    .select('id, nome')
    .order('ordem')
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function createStage(
  supabase: TypedSupabaseClient,
  data: {
    nome: string
    descricao?: string | null
    responsavel_id?: string | null
    ordem: number
  }
): Promise<Stage> {
  const { data: etapa, error } = await supabase
    .from('etapas')
    .insert({
      nome: data.nome,
      descricao: data.descricao || null,
      responsavel_id: data.responsavel_id || null,
      ordem: data.ordem,
      status: 'nao_iniciada',
      data_inicio_prevista: null,
      data_fim_prevista: null,
    })
    .select()
    .single()
  if (error) throw error
  return etapa
}

// ===== UPDATE =====

export async function updateStage(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'etapas'>
): Promise<Stage> {
  const updatesWithDates = { ...updates }

  if (updates.status === 'em_andamento') {
    updatesWithDates.data_inicio_real = updatesWithDates.data_inicio_real ?? new Date().toISOString().split('T')[0]
  }
  if (updates.status === 'concluida') {
    updatesWithDates.data_fim_real = updatesWithDates.data_fim_real ?? new Date().toISOString().split('T')[0]
    updatesWithDates.progresso_percentual = 100
  }

  const { data, error } = await supabase
    .from('etapas')
    .update(updatesWithDates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reorderStages(
  supabase: TypedSupabaseClient,
  orderedStages: { id: string; ordem: number }[]
): Promise<void> {
  for (const item of orderedStages) {
    const { error } = await supabase
      .from('etapas')
      .update({ ordem: item.ordem })
      .eq('id', item.id)
    if (error) throw error
  }
}

// ===== DELETE =====

export async function deleteStage(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('etapas').delete().eq('id', id)
  if (error) throw error
}

// ===== DEPENDÊNCIAS =====

export async function createStageDependency(
  supabase: TypedSupabaseClient,
  data: { etapa_id: string; depende_de_etapa_id: string; tipo: string }
): Promise<void> {
  const { error } = await supabase.from('etapas_dependencias').insert(data)
  if (error) throw error
}

// ===== CÁLCULOS =====

export function calculateStageProgress(
  etapa: { progresso_percentual?: number | null; subetapas: { status: string }[] }
): number {
  if (etapa.subetapas.length === 0) return etapa.progresso_percentual ?? 0
  const concluidas = etapa.subetapas.filter((s) => s.status === 'concluida').length
  return Math.round((concluidas / etapa.subetapas.length) * 100)
}

export function calculateStageDates(
  subetapas: { data_inicio_prevista: string | null; data_fim_prevista: string | null }[]
): { inicio: string | null; fim: string | null } {
  if (subetapas.length === 0) return { inicio: null, fim: null }

  const datasInicio = subetapas
    .map((s) => s.data_inicio_prevista)
    .filter((d): d is string => d !== null)
  const datasFim = subetapas
    .map((s) => s.data_fim_prevista)
    .filter((d): d is string => d !== null)

  const inicio =
    datasInicio.length > 0
      ? datasInicio.reduce((min, date) => (date < min ? date : min))
      : null
  const fim =
    datasFim.length > 0
      ? datasFim.reduce((max, date) => (date > max ? date : max))
      : null

  return { inicio, fim }
}
