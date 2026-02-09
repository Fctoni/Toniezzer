import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type Categoria = Tables<'categorias'>

// ===== SELECT =====

export async function buscarCategorias(supabase: TypedSupabaseClient): Promise<Categoria[]> {
  const { data, error } = await supabase.from('categorias').select('*').order('ordem')
  if (error) throw error
  return data
}

export async function buscarCategoriasAtivas(supabase: TypedSupabaseClient): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('ativo', true)
    .order('ordem')
  if (error) throw error
  return data
}

export async function buscarCategoriasParaDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<Categoria, 'id' | 'nome' | 'cor'>[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, cor')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

export async function buscarTodasCategoriasParaDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<Categoria, 'id' | 'nome' | 'cor'>[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, cor')
    .order('nome')
  if (error) throw error
  return data
}

export async function buscarMaxOrdem(supabase: TypedSupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from('categorias')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0]?.ordem || 0
}

// ===== INSERT =====

export async function criarCategoria(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'categorias'>
): Promise<Categoria> {
  const { data: categoria, error } = await supabase
    .from('categorias')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return categoria
}

// ===== UPDATE =====

export async function atualizarCategoria(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'categorias'>
): Promise<Categoria> {
  const { data, error } = await supabase
    .from('categorias')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reordenarCategorias(
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

export async function toggleAtivoCategoria(
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

export async function atualizarOrcamentoCategoria(
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

export async function deletarCategoria(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw error
}

// ===== VALIDAÇÕES =====

export async function verificarDuplicataCategoria(
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

export async function verificarUsoCategoria(
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
