import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
type Subcategoria = Tables<'subcategorias'>

// ===== SELECT =====

export async function buscarSubcategorias(supabase: TypedSupabaseClient): Promise<Subcategoria[]> {
  const { data, error } = await supabase.from('subcategorias').select('*').order('nome')
  if (error) throw error
  return data
}

export async function buscarSubcategoriasAtivas(
  supabase: TypedSupabaseClient
): Promise<Pick<Subcategoria, 'id' | 'nome' | 'categoria_id'>[]> {
  const { data, error } = await supabase
    .from('subcategorias')
    .select('id, nome, categoria_id')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function criarSubcategoria(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'subcategorias'>
): Promise<Subcategoria> {
  const { data: subcategoria, error } = await supabase
    .from('subcategorias')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return subcategoria
}

// ===== UPDATE =====

export async function atualizarSubcategoria(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'subcategorias'>
): Promise<Subcategoria> {
  const { data, error } = await supabase
    .from('subcategorias')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleAtivoSubcategoria(
  supabase: TypedSupabaseClient,
  id: string,
  ativo: boolean
): Promise<void> {
  const { error } = await supabase
    .from('subcategorias')
    .update({ ativo })
    .eq('id', id)
  if (error) throw error
}

// ===== DELETE =====

export async function deletarSubcategoria(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('subcategorias').delete().eq('id', id)
  if (error) throw error
}

// ===== VALIDAÇÕES =====

export async function verificarDuplicataSubcategoria(
  supabase: TypedSupabaseClient,
  categoriaId: string,
  nome: string,
  excludeId?: string
): Promise<boolean> {
  const query = supabase
    .from('subcategorias')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', categoriaId)
    .ilike('nome', nome)

  if (excludeId) {
    query.neq('id', excludeId)
  }

  const { count, error } = await query
  if (error) throw error
  return (count || 0) > 0
}

export async function verificarUsoSubcategoria(
  supabase: TypedSupabaseClient,
  id: string
): Promise<{ compras: number; gastos: number }> {
  const { count: comprasCount } = await supabase
    .from('compras')
    .select('id', { count: 'exact', head: true })
    .eq('subcategoria_id', id)

  const { count: gastosCount } = await supabase
    .from('gastos')
    .select('id', { count: 'exact', head: true })
    .eq('subcategoria_id', id)

  return {
    compras: comprasCount || 0,
    gastos: gastosCount || 0,
  }
}
