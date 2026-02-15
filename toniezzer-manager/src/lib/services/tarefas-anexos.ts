import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables } from '@/lib/types/database'
type TaskAttachment = Tables<'tarefas_anexos'>

// ===== SELECT =====

export async function fetchTaskAttachments(
  supabase: TypedSupabaseClient,
  tarefaId: string
): Promise<Pick<TaskAttachment, 'id' | 'nome_original' | 'tipo_arquivo' | 'tamanho_bytes' | 'storage_path' | 'created_at' | 'created_by'>[]> {
  const { data, error } = await supabase
    .from('tarefas_anexos')
    .select('id, nome_original, tipo_arquivo, tamanho_bytes, storage_path, created_at, created_by')
    .eq('tarefa_id', tarefaId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ===== UPLOAD =====

export async function uploadAttachment(
  supabase: TypedSupabaseClient,
  tarefaId: string,
  file: File,
  userId: string
): Promise<TaskAttachment> {
  const fileName = `${tarefaId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('tarefas-anexos')
    .upload(fileName, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('tarefas_anexos')
    .insert({
      tarefa_id: tarefaId,
      nome_arquivo: fileName,
      nome_original: file.name,
      tipo_arquivo: file.type,
      tamanho_bytes: file.size,
      storage_path: fileName,
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ===== DOWNLOAD =====

export async function downloadAttachment(
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

export async function deleteAttachment(
  supabase: TypedSupabaseClient,
  id: string,
  storagePath: string
): Promise<void> {
  const { error: storageError } = await supabase.storage.from('tarefas-anexos').remove([storagePath])
  if (storageError) throw storageError
  const { error } = await supabase.from('tarefas_anexos').delete().eq('id', id)
  if (error) throw error
}
