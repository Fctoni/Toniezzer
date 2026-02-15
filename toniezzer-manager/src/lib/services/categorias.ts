import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
type Category = Tables<'categorias'>

// ===== SELECT =====

export async function fetchCategories(supabase: TypedSupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase.from('categorias').select('*').order('ordem')
  if (error) throw error
  return data
}

export async function fetchActiveCategories(supabase: TypedSupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('ativo', true)
    .order('ordem')
  if (error) throw error
  return data
}

export async function fetchCategoriesForDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<Category, 'id' | 'nome' | 'cor'>[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, cor')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

export async function fetchAllCategoriesForDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<Category, 'id' | 'nome' | 'cor'>[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, cor')
    .order('nome')
  if (error) throw error
  return data
}

export async function fetchMaxOrder(supabase: TypedSupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from('categorias')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0]?.ordem || 0
}

// ===== INSERT =====

export async function createCategory(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'categorias'>
): Promise<Category> {
  const { data: categoria, error } = await supabase
    .from('categorias')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return categoria
}

// ===== UPDATE =====

export async function updateCategory(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'categorias'>
): Promise<Category> {
  const { data, error } = await supabase
    .from('categorias')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reorderCategories(
  supabase: TypedSupabaseClient,
  items: { id: string; ordem: number }[]
): Promise<void> {
  for (const item of items) {
    const { error } = await supabase
      .from('categorias')
      .update({ ordem: item.ordem })
      .eq('id', item.id)
    if (error) throw error
  }
}

export async function toggleActiveCategory(
  supabase: TypedSupabaseClient,
  id: string,
  ativo: boolean
): Promise<void> {
  const { error } = await supabase
    .from('categorias')
    .update({ ativo })
    .eq('id', id)
  if (error) throw error
}

export async function updateCategoryBudget(
  supabase: TypedSupabaseClient,
  id: string,
  orcamento: number
): Promise<void> {
  const { error } = await supabase
    .from('categorias')
    .update({ orcamento })
    .eq('id', id)
  if (error) throw error
}

// ===== DELETE =====

export async function deleteCategory(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw error
}

// ===== VALIDATIONS =====

export async function checkDuplicateCategory(
  supabase: TypedSupabaseClient,
  nome: string,
  excludeId?: string
): Promise<boolean> {
  const query = supabase
    .from('categorias')
    .select('id', { count: 'exact', head: true })
    .ilike('nome', nome)

  if (excludeId) {
    query.neq('id', excludeId)
  }

  const { count, error } = await query
  if (error) throw error
  return (count || 0) > 0
}

export async function checkCategoryUsage(
  supabase: TypedSupabaseClient,
  id: string
): Promise<{ compras: number; gastos: number; orcamento: number }> {
  const { count: comprasCount } = await supabase
    .from('compras')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', id)

  const { count: gastosCount } = await supabase
    .from('gastos')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', id)

  const { count: orcamentoCount } = await supabase
    .from('orcamento_detalhado')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', id)

  return {
    compras: comprasCount || 0,
    gastos: gastosCount || 0,
    orcamento: orcamentoCount || 0,
  }
}
