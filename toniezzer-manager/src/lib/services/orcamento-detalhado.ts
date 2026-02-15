import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables } from '@/lib/types/database'
type DetailedBudget = Tables<'orcamento_detalhado'>

type BudgetDetailWithCategory = Pick<DetailedBudget, 'id' | 'etapa_id' | 'categoria_id' | 'valor_previsto' | 'observacoes'> & {
  categorias: Pick<Tables<'categorias'>, 'nome' | 'cor'> | null
}

// ===== SELECT =====

export async function fetchBudgetDetailWithCategory(
  supabase: TypedSupabaseClient,
  etapaId: string
): Promise<BudgetDetailWithCategory[]> {
  const { data, error } = await supabase
    .from('orcamento_detalhado')
    .select(`
      id,
      etapa_id,
      categoria_id,
      valor_previsto,
      observacoes,
      categorias:categoria_id(nome, cor)
    `)
    .eq('etapa_id', etapaId)
    .order('valor_previsto', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchBudgetDetailByStage(
  supabase: TypedSupabaseClient
): Promise<Pick<DetailedBudget, 'etapa_id'>[]> {
  const { data, error } = await supabase
    .from('orcamento_detalhado')
    .select('etapa_id')
  if (error) throw error
  return data
}

export async function fetchBudgetDetailMatrix(
  supabase: TypedSupabaseClient
): Promise<Pick<DetailedBudget, 'etapa_id' | 'categoria_id' | 'valor_previsto'>[]> {
  const { data, error } = await supabase
    .from('orcamento_detalhado')
    .select('etapa_id, categoria_id, valor_previsto')
  if (error) throw error
  return data
}

// ===== INSERT/UPDATE (delete-then-reinsert) =====

export async function saveBudgetDetail(
  supabase: TypedSupabaseClient,
  etapaId: string,
  items: { categoria_id: string; valor_previsto: number; observacoes?: string }[]
): Promise<DetailedBudget[]> {
  // 1. Deletar detalhamento existente da etapa
  const { error: deleteError } = await supabase
    .from('orcamento_detalhado')
    .delete()
    .eq('etapa_id', etapaId)
  if (deleteError) throw deleteError

  // 2. Inserir novos registros (se houver)
  if (items.length === 0) return []

  const registros = items.map((item) => ({
    etapa_id: etapaId,
    categoria_id: item.categoria_id,
    valor_previsto: item.valor_previsto,
    observacoes: item.observacoes || null,
  }))

  const { data, error: insertError } = await supabase
    .from('orcamento_detalhado')
    .insert(registros)
    .select()
  if (insertError) throw insertError
  return data
}

// ===== DELETE =====

export async function deleteBudgetDetailByStage(
  supabase: TypedSupabaseClient,
  etapaId: string
): Promise<void> {
  const { error } = await supabase
    .from('orcamento_detalhado')
    .delete()
    .eq('etapa_id', etapaId)
  if (error) throw error
}

// ===== VALIDATIONS =====

export async function countBudgetDetailByCategory(
  supabase: TypedSupabaseClient,
  categoriaId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('orcamento_detalhado')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', categoriaId)
  if (error) throw error
  return count || 0
}
