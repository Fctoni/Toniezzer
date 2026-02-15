import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
type Purchase = Tables<'compras'>

type PurchaseWithDetails = Purchase & {
  fornecedor: Pick<Tables<'fornecedores'>, 'nome'> | null
  categoria: Pick<Tables<'categorias'>, 'nome' | 'cor'> | null
  subcategoria: Pick<Tables<'subcategorias'>, 'nome'> | null
  etapa: Pick<Tables<'etapas'>, 'nome'> | null
}

type PurchaseWithSupplierDetails = Purchase & {
  fornecedor: Pick<Tables<'fornecedores'>, 'nome' | 'cnpj_cpf'> | null
  categoria: Pick<Tables<'categorias'>, 'nome' | 'cor'> | null
  subcategoria: Pick<Tables<'subcategorias'>, 'nome'> | null
  etapa: Pick<Tables<'etapas'>, 'nome'> | null
}

// ===== SELECT =====

export async function fetchPurchasesWithDetails(
  supabase: TypedSupabaseClient
): Promise<PurchaseWithDetails[]> {
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

export async function fetchPurchaseByIdWithDetails(
  supabase: TypedSupabaseClient,
  id: string
): Promise<PurchaseWithSupplierDetails> {
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

export async function fetchPurchaseById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Purchase> {
  const { data, error } = await supabase
    .from('compras')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function createPurchase(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'compras'>
): Promise<Purchase> {
  const { data: compra, error } = await supabase
    .from('compras')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return compra
}

// ===== UPDATE =====

export async function updatePurchase(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'compras'>
): Promise<Purchase> {
  const { data, error } = await supabase
    .from('compras')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cancelPurchase(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('compras')
    .update({ status: 'cancelada' })
    .eq('id', id)
  if (error) throw error
}
