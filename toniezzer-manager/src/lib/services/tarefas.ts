import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesUpdate } from '@/lib/types/database'
type Task = Tables<'tarefas'>

// ===== SELECT =====

export async function fetchTasks(supabase: TypedSupabaseClient): Promise<Task[]> {
  const { data, error } = await supabase.from('tarefas').select('*').order('ordem')
  if (error) throw error
  return data
}

export async function fetchTaskById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Task | null> {
  const { data, error } = await supabase.from('tarefas').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function fetchTasksByResponsible(
  supabase: TypedSupabaseClient,
  responsavelId: string
): Promise<Pick<Task, 'id' | 'nome' | 'status' | 'data_prevista' | 'prioridade' | 'subetapa_id'>[]> {
  const { data, error } = await supabase
    .from('tarefas')
    .select('id, nome, status, data_prevista, prioridade, subetapa_id')
    .eq('responsavel_id', responsavelId)
    .neq('status', 'cancelada')
  if (error) throw error
  return data
}

export async function fetchTasksBySubstages(
  supabase: TypedSupabaseClient,
  subetapaIds: string[]
): Promise<Pick<Task, 'id' | 'subetapa_id' | 'status'>[]> {
  const { data, error } = await supabase
    .from('tarefas')
    .select('id, subetapa_id, status')
    .in('subetapa_id', subetapaIds)
  if (error) throw error
  return data
}

export async function fetchTasksByIds(
  supabase: TypedSupabaseClient,
  ids: string[]
): Promise<Pick<Task, 'id' | 'nome' | 'status'>[]> {
  const { data, error } = await supabase
    .from('tarefas')
    .select('id, nome, status')
    .in('id', ids)
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function createTask(
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
): Promise<Task> {
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

export async function updateTask(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'tarefas'>
): Promise<Task> {
  const updatesWithDates = { ...updates }

  if (updates.status === 'em_andamento') {
    updatesWithDates.data_inicio_real = updatesWithDates.data_inicio_real ?? new Date().toISOString()
  }
  if (updates.status === 'concluida') {
    updatesWithDates.data_conclusao_real = updatesWithDates.data_conclusao_real ?? new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('tarefas')
    .update(updatesWithDates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reorderTasks(
  supabase: TypedSupabaseClient,
  orderedTasks: { id: string; ordem: number }[]
): Promise<void> {
  for (const item of orderedTasks) {
    const { error } = await supabase
      .from('tarefas')
      .update({ ordem: item.ordem })
      .eq('id', item.id)
    if (error) throw error
  }
}

// ===== DELETE =====

export async function deleteTask(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('tarefas').delete().eq('id', id)
  if (error) throw error
}
