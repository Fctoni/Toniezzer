import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
type Supplier = Tables<'fornecedores'>

// ===== SELECT =====

export async function fetchSuppliers(
  supabase: TypedSupabaseClient,
  filtros?: { tipo?: string; search?: string }
): Promise<Supplier[]> {
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

export async function fetchSupplierById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Supplier> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchSuppliersForDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<Supplier, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

export async function fetchAllSuppliersForDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<Supplier, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('id, nome')
    .order('nome')
  if (error) throw error
  return data
}

export async function fetchActiveSuppliers(
  supabase: TypedSupabaseClient
): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function createSupplier(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'fornecedores'>
): Promise<Supplier> {
  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return fornecedor
}

export async function createQuickSupplier(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'fornecedores'>
): Promise<Supplier> {
  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return fornecedor
}

// ===== UPDATE =====

export async function updateSupplier(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'fornecedores'>
): Promise<Supplier> {
  const { data, error } = await supabase
    .from('fornecedores')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}


export async function deactivateSupplier(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('fornecedores')
    .update({ ativo: false })
    .eq('id', id)
  if (error) throw error
}
