import { TypedSupabaseClient } from '@/lib/types/supabase'
import { Tables, TablesInsert } from '@/lib/types/database'
type ReuniaoAcao = Tables<'reunioes_acoes'>

// ===== SELECT =====

export async function buscarAcoesPorReuniao(supabase: TypedSupabaseClient, reuniaoId: string) {
  const { data, error } = await supabase
    .from('reunioes_acoes')
    .select('*, responsavel:responsavel_id(nome_completo), categoria:categoria_id(nome, cor)')
    .eq('reuniao_id', reuniaoId)
    .order('created_at')
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function criarAcoes(
  supabase: TypedSupabaseClient,
  acoes: TablesInsert<'reunioes_acoes'>[]
): Promise<ReuniaoAcao[]> {
  const { data, error } = await supabase
    .from('reunioes_acoes')
    .insert(acoes)
    .select()
  if (error) throw error
  return data
}

// ===== UPDATE =====

export async function atualizarStatusAcao(
  supabase: TypedSupabaseClient,
  id: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('reunioes_acoes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
