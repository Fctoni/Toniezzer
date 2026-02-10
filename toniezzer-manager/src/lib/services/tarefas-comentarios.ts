import { TypedSupabaseClient } from '@/lib/types/supabase'
import { Tables } from '@/lib/types/database'
type TarefaComentario = Tables<'tarefas_comentarios'>

// ===== SELECT =====

export async function buscarComentariosDaTarefa(
  supabase: TypedSupabaseClient,
  tarefaId: string
): Promise<Pick<TarefaComentario, 'id' | 'conteudo' | 'created_at' | 'created_by'>[]> {
  const { data, error } = await supabase
    .from('tarefas_comentarios')
    .select('id, conteudo, created_at, created_by')
    .eq('tarefa_id', tarefaId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function criarComentario(
  supabase: TypedSupabaseClient,
  tarefaId: string,
  conteudo: string,
  userId: string
): Promise<TarefaComentario> {
  const { data, error } = await supabase
    .from('tarefas_comentarios')
    .insert({
      tarefa_id: tarefaId,
      conteudo: conteudo.trim(),
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
