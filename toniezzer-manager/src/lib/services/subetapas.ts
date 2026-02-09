import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesUpdate } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type Subetapa = Tables<'subetapas'>

// ===== SELECT =====

export async function buscarSubetapas(supabase: TypedSupabaseClient): Promise<Subetapa[]> {
  const { data, error } = await supabase.from('subetapas').select('*').order('ordem')
  if (error) throw error
  return data
}

export async function buscarSubetapasResumidas(
  supabase: TypedSupabaseClient
): Promise<Pick<Subetapa, 'id' | 'etapa_id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('subetapas')
    .select('id, etapa_id, nome')
    .order('ordem')
  if (error) throw error
  return data
}

export async function buscarSubetapaPorId(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Pick<Subetapa, 'id' | 'nome' | 'etapa_id'> | null> {
  const { data, error } = await supabase
    .from('subetapas')
    .select('id, nome, etapa_id')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function buscarSubetapasDoResponsavel(
  supabase: TypedSupabaseClient,
  responsavelId: string
): Promise<Pick<Subetapa, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('subetapas')
    .select('id, nome')
    .eq('responsavel_id', responsavelId)
    .neq('status', 'cancelada')
  if (error) throw error
  return data
}

export async function buscarSubetapasPorIds(
  supabase: TypedSupabaseClient,
  ids: string[]
): Promise<Pick<Subetapa, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('subetapas')
    .select('id, nome')
    .in('id', ids)
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function criarSubetapa(
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
): Promise<Subetapa> {
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

export async function atualizarSubetapa(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'subetapas'>
): Promise<Subetapa> {
  const updatesComDatas = { ...updates }

  if (updates.status === 'em_andamento') {
    updatesComDatas.data_inicio_real = updatesComDatas.data_inicio_real ?? new Date().toISOString().split('T')[0]
  }
  if (updates.status === 'concluida') {
    updatesComDatas.data_fim_real = updatesComDatas.data_fim_real ?? new Date().toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('subetapas')
    .update(updatesComDatas)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reordenarSubetapas(
  supabase: TypedSupabaseClient,
  subetapasOrdenadas: { id: string; ordem: number }[]
): Promise<void> {
  for (const item of subetapasOrdenadas) {
    const { error } = await supabase
      .from('subetapas')
      .update({ ordem: item.ordem })
      .eq('id', item.id)
    if (error) throw error
  }
}

// ===== DELETE =====

export async function deletarSubetapa(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('subetapas').delete().eq('id', id)
  if (error) throw error
}

// ===== CÁLCULOS =====

export function calcularProgressoSubetapa(
  subetapa: { progresso_percentual?: number | null; tarefas: { status: string }[] }
): number {
  if (subetapa.tarefas.length === 0) return subetapa.progresso_percentual ?? 0
  const concluidas = subetapa.tarefas.filter((t) => t.status === 'concluida').length
  return Math.round((concluidas / subetapa.tarefas.length) * 100)
}
