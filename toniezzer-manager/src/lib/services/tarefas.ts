import { TypedSupabaseClient } from '@/lib/types/supabase'
import { Tables, TablesUpdate } from '@/lib/types/database'
type Tarefa = Tables<'tarefas'>

// ===== SELECT =====

export async function buscarTarefas(supabase: TypedSupabaseClient): Promise<Tarefa[]> {
  const { data, error } = await supabase.from('tarefas').select('*').order('ordem')
  if (error) throw error
  return data
}

export async function buscarTarefaPorId(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Tarefa | null> {
  const { data, error } = await supabase.from('tarefas').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function buscarTarefasDoResponsavel(
  supabase: TypedSupabaseClient,
  responsavelId: string
): Promise<Pick<Tarefa, 'id' | 'nome' | 'status' | 'data_prevista' | 'prioridade' | 'subetapa_id'>[]> {
  const { data, error } = await supabase
    .from('tarefas')
    .select('id, nome, status, data_prevista, prioridade, subetapa_id')
    .eq('responsavel_id', responsavelId)
    .neq('status', 'cancelada')
  if (error) throw error
  return data
}

export async function buscarTarefasPorSubetapas(
  supabase: TypedSupabaseClient,
  subetapaIds: string[]
): Promise<Pick<Tarefa, 'id' | 'subetapa_id' | 'status'>[]> {
  const { data, error } = await supabase
    .from('tarefas')
    .select('id, subetapa_id, status')
    .in('subetapa_id', subetapaIds)
  if (error) throw error
  return data
}

export async function buscarTarefasPorIds(
  supabase: TypedSupabaseClient,
  ids: string[]
): Promise<Pick<Tarefa, 'id' | 'nome' | 'status'>[]> {
  const { data, error } = await supabase
    .from('tarefas')
    .select('id, nome, status')
    .in('id', ids)
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function criarTarefa(
  supabase: TypedSupabaseClient,
  data: {
    subetapa_id: string
    nome: string
    descricao?: string | null
    responsavel_id?: string | null
    prioridade?: string
    data_prevista?: string | null
    ordem: number
    tags?: string[]
  }
): Promise<Tarefa> {
  const { data: tarefa, error } = await supabase
    .from('tarefas')
    .insert({
      subetapa_id: data.subetapa_id,
      nome: data.nome,
      descricao: data.descricao || null,
      responsavel_id: data.responsavel_id || null,
      prioridade: data.prioridade || 'media',
      data_prevista: data.data_prevista || null,
      status: 'pendente',
      ordem: data.ordem,
      tags: data.tags || [],
    })
    .select()
    .single()
  if (error) throw error
  return tarefa
}

// ===== UPDATE =====

export async function atualizarTarefa(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'tarefas'>
): Promise<Tarefa> {
  const updatesComDatas = { ...updates }

  if (updates.status === 'em_andamento') {
    updatesComDatas.data_inicio_real = updatesComDatas.data_inicio_real ?? new Date().toISOString()
  }
  if (updates.status === 'concluida') {
    updatesComDatas.data_conclusao_real = updatesComDatas.data_conclusao_real ?? new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('tarefas')
    .update(updatesComDatas)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reordenarTarefas(
  supabase: TypedSupabaseClient,
  tarefasOrdenadas: { id: string; ordem: number }[]
): Promise<void> {
  for (const item of tarefasOrdenadas) {
    const { error } = await supabase
      .from('tarefas')
      .update({ ordem: item.ordem })
      .eq('id', item.id)
    if (error) throw error
  }
}

// ===== DELETE =====

export async function deletarTarefa(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('tarefas').delete().eq('id', id)
  if (error) throw error
}
