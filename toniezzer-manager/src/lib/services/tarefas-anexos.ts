import { TypedSupabaseClient } from '@/lib/types/supabase'
import { Tables } from '@/lib/types/database'
type TarefaAnexo = Tables<'tarefas_anexos'>

// ===== SELECT =====

export async function buscarAnexosDaTarefa(
  supabase: TypedSupabaseClient,
  tarefaId: string
): Promise<Pick<TarefaAnexo, 'id' | 'nome_original' | 'tipo_arquivo' | 'tamanho_bytes' | 'storage_path' | 'created_at' | 'created_by'>[]> {
  const { data, error } = await supabase
    .from('tarefas_anexos')
    .select('id, nome_original, tipo_arquivo, tamanho_bytes, storage_path, created_at, created_by')
    .eq('tarefa_id', tarefaId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ===== UPLOAD =====

export async function uploadAnexo(
  supabase: TypedSupabaseClient,
  tarefaId: string,
  file: File,
  userId: string
): Promise<TarefaAnexo> {
  const nomeArquivo = `${tarefaId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('tarefas-anexos')
    .upload(nomeArquivo, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('tarefas_anexos')
    .insert({
      tarefa_id: tarefaId,
      nome_arquivo: nomeArquivo,
      nome_original: file.name,
      tipo_arquivo: file.type,
      tamanho_bytes: file.size,
      storage_path: nomeArquivo,
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ===== DOWNLOAD =====

export async function downloadAnexo(
  supabase: TypedSupabaseClient,
  storagePath: string
): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from('tarefas-anexos')
    .download(storagePath)
  if (error) throw error
  return data
}

// ===== DELETE =====

export async function deletarAnexo(
  supabase: TypedSupabaseClient,
  id: string,
  storagePath: string
): Promise<void> {
  await supabase.storage.from('tarefas-anexos').remove([storagePath])
  const { error } = await supabase.from('tarefas_anexos').delete().eq('id', id)
  if (error) throw error
}
