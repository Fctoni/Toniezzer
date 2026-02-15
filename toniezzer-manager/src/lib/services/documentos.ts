import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
type Document = Tables<'documentos'>

// ===== SELECT =====

export async function fetchDocumentsWithStage(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase
    .from('documentos')
    .select('id, nome, url, tipo, tags, tamanho_bytes, created_at, etapa_relacionada_id, etapas(nome)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function createDocument(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'documentos'>
): Promise<Document> {
  const { data: documento, error } = await supabase
    .from('documentos')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return documento
}

// ===== UPDATE =====

export async function updateDocument(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'documentos'>
): Promise<Document> {
  const { data, error } = await supabase
    .from('documentos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ===== DELETE =====

export async function deleteDocument(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('documentos').delete().eq('id', id)
  if (error) throw error
}
