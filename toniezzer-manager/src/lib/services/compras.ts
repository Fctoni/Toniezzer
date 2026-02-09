import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type Compra = Tables<'compras'>

// ===== SELECT =====

export async function buscarComprasComDetalhes(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase
    .from('compras')
    .select(`
      *,
      fornecedor:fornecedores(nome),
      categoria:categorias(nome, cor),
      subcategoria:subcategorias(nome),
      etapa:etapas(nome)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function buscarCompraPorIdComDetalhes(supabase: TypedSupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('compras')
    .select(`
      *,
      fornecedor:fornecedores(nome, cnpj_cpf),
      categoria:categorias(nome, cor),
      subcategoria:subcategorias(nome),
      etapa:etapas(nome)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function buscarCompraPorId(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Compra> {
  const { data, error } = await supabase
    .from('compras')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function criarCompra(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'compras'>
): Promise<Compra> {
  const { data: compra, error } = await supabase
    .from('compras')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return compra
}

// ===== UPDATE =====

export async function atualizarCompra(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'compras'>
): Promise<Compra> {
  const { data, error } = await supabase
    .from('compras')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cancelarCompra(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('compras')
    .update({ status: 'cancelada' })
    .eq('id', id)
  if (error) throw error
}
