import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>

// ===== STORAGE =====

export async function uploadComprovante(
  supabase: TypedSupabaseClient,
  fileName: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from('recibos').upload(fileName, file)
  if (error) throw error
  const { data } = supabase.storage.from('recibos').getPublicUrl(fileName)
  return data.publicUrl
}
