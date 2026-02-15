import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables } from '@/lib/types/database'
type TaskDependency = Tables<'tarefas_dependencias'>

// ===== SELECT =====

export async function fetchTaskDependencies(
  supabase: TypedSupabaseClient,
  tarefaId: string
): Promise<Pick<TaskDependency, 'id' | 'depende_de_tarefa_id'>[]> {
  const { data, error } = await supabase
    .from('tarefas_dependencias')
    .select('id, depende_de_tarefa_id')
    .eq('tarefa_id', tarefaId)
  if (error) throw error
  return data
}
