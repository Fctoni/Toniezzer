import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type TarefaDependencia = Tables<'tarefas_dependencias'>

// ===== SELECT =====

export async function buscarDependenciasDaTarefa(
  supabase: TypedSupabaseClient,
  tarefaId: string
): Promise<Pick<TarefaDependencia, 'id' | 'depende_de_tarefa_id'>[]> {
  const { data, error } = await supabase
    .from('tarefas_dependencias')
    .select('id, depende_de_tarefa_id')
    .eq('tarefa_id', tarefaId)
  if (error) throw error
  return data
}
