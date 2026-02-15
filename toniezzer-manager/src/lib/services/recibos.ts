import { TypedSupabaseClient } from '@/lib/types/supabase'

// ===== STORAGE =====

export async function uploadReceipt(
  supabase: TypedSupabaseClient,
  fileName: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from('recibos').upload(fileName, file)
  if (error) throw error
  const { data } = supabase.storage.from('recibos').getPublicUrl(fileName)
  return data.publicUrl
}
