import { TypedSupabaseClient } from '@/lib/types/supabase'
import { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
type Fornecedor = Tables<'fornecedores'>

// ===== SELECT =====

export async function buscarFornecedores(
  supabase: TypedSupabaseClient,
  filtros?: { tipo?: string; search?: string }
): Promise<Fornecedor[]> {
  let query = supabase
    .from('fornecedores')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  if (filtros?.tipo) {
    query = query.eq('tipo', filtros.tipo)
  }
  if (filtros?.search) {
    query = query.ilike('nome', `%${filtros.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function buscarFornecedorPorId(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Fornecedor> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function buscarFornecedoresParaDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<Fornecedor, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

export async function buscarTodosFornecedoresParaDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<Fornecedor, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('id, nome')
    .order('nome')
  if (error) throw error
  return data
}

export async function buscarFornecedoresAtivos(
  supabase: TypedSupabaseClient
): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function criarFornecedor(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'fornecedores'>
): Promise<Fornecedor> {
  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return fornecedor
}

export async function criarFornecedorRapido(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'fornecedores'>
): Promise<Fornecedor> {
  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return fornecedor
}

// ===== UPDATE =====

export async function atualizarFornecedor(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'fornecedores'>
): Promise<Fornecedor> {
  const { data, error } = await supabase
    .from('fornecedores')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}


export async function desativarFornecedor(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('fornecedores')
    .update({ ativo: false })
    .eq('id', id)
  if (error) throw error
}
