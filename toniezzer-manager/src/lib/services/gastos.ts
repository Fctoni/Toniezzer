import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
type Expense = Tables<'gastos'>

type ExpenseWithDetails = Expense & {
  categorias: Pick<Tables<'categorias'>, 'nome' | 'cor'> | null
  fornecedores: Pick<Tables<'fornecedores'>, 'nome'> | null
  etapas: Pick<Tables<'etapas'>, 'nome'> | null
  compras: Pick<Tables<'compras'>, 'id' | 'descricao'> | null
}

type ApprovedExpense = Expense & {
  categorias: Pick<Tables<'categorias'>, 'nome' | 'cor'> | null
}

type ExpenseBySupplier = Expense & {
  categoria: Tables<'categorias'> | null
}

type DetailedExpenseByCategory = Pick<Expense, 'id' | 'descricao' | 'valor' | 'data' | 'forma_pagamento' | 'nota_fiscal_numero' | 'parcela_atual' | 'parcelas'> & {
  fornecedores: Pick<Tables<'fornecedores'>, 'nome'> | null
  criado_por_user: Pick<Tables<'users'>, 'nome_completo'> | null
}

// ===== SELECT =====

export async function fetchExpensesWithDetails(
  supabase: TypedSupabaseClient
): Promise<ExpenseWithDetails[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select(`
      *,
      categorias(nome, cor),
      fornecedores(nome),
      etapas:etapa_relacionada_id(nome),
      compras:compra_id(id, descricao)
    `)
    .order('data', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchApprovedExpenses(
  supabase: TypedSupabaseClient
): Promise<ApprovedExpense[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('*, categorias(nome, cor)')
    .eq('status', 'aprovado')
  if (error) throw error
  return data
}

export async function fetchApprovedExpensesSummary(
  supabase: TypedSupabaseClient
): Promise<Pick<Expense, 'valor' | 'data' | 'parcelas' | 'parcela_atual'>[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('valor, data, parcelas, parcela_atual')
    .eq('status', 'aprovado')
    .order('data')
  if (error) throw error
  return data
}

export async function fetchExpensesByStage(
  supabase: TypedSupabaseClient
): Promise<Pick<Expense, 'etapa_relacionada_id' | 'valor'>[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('etapa_relacionada_id, valor')
    .eq('status', 'aprovado')
  if (error) throw error
  return data
}

export async function fetchExpensesMatrix(
  supabase: TypedSupabaseClient
): Promise<Pick<Expense, 'categoria_id' | 'etapa_relacionada_id' | 'valor'>[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('categoria_id, etapa_relacionada_id, valor')
    .eq('status', 'aprovado')
  if (error) throw error
  return data
}

export async function fetchExpensesByPurchase(
  supabase: TypedSupabaseClient,
  compraId: string
): Promise<Pick<Expense, 'id' | 'valor' | 'data' | 'parcela_atual' | 'parcelas' | 'pago' | 'pago_em' | 'comprovante_pagamento_url'>[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('id, valor, data, parcela_atual, parcelas, pago, pago_em, comprovante_pagamento_url')
    .eq('compra_id', compraId)
    .order('parcela_atual')
  if (error) throw error
  return data
}

export async function fetchExpensesBySupplier(
  supabase: TypedSupabaseClient,
  fornecedorId: string
): Promise<ExpenseBySupplier[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('*, categoria:categorias(*)')
    .eq('fornecedor_id', fornecedorId)
    .order('data', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchDetailedExpensesByCategory(
  supabase: TypedSupabaseClient,
  categoriaId: string,
  etapaId: string
): Promise<DetailedExpenseByCategory[]> {
  let query = supabase
    .from('gastos')
    .select(`
      id,
      descricao,
      valor,
      data,
      forma_pagamento,
      nota_fiscal_numero,
      parcela_atual,
      parcelas,
      fornecedores:fornecedor_id(nome),
      criado_por_user:users!criado_por(nome_completo)
    `)
    .eq('categoria_id', categoriaId)
    .eq('status', 'aprovado')

  if (etapaId === 'sem_etapa') {
    query = query.is('etapa_relacionada_id', null)
  } else {
    query = query.eq('etapa_relacionada_id', etapaId)
  }

  const { data, error } = await query.order('data', { ascending: false })
  if (error) throw error
  return data
}

// ===== INSERT =====

export async function createExpenses(
  supabase: TypedSupabaseClient,
  parcelas: TablesInsert<'gastos'>[]
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('gastos')
    .insert(parcelas)
    .select()
  if (error) throw error
  return data
}

export async function createSingleExpense(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'gastos'>
): Promise<Expense> {
  const { data: gasto, error } = await supabase
    .from('gastos')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return gasto
}

// ===== UPDATE =====

export async function updateExpensesByPurchase(
  supabase: TypedSupabaseClient,
  compraId: string,
  updates: TablesUpdate<'gastos'>
): Promise<void> {
  const { error } = await supabase
    .from('gastos')
    .update(updates)
    .eq('compra_id', compraId)
  if (error) throw error
}

export async function markAsPaid(
  supabase: TypedSupabaseClient,
  id: string,
  data: { pago: boolean; pago_em: string; comprovante_pagamento_url: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('gastos')
    .update({
      pago: data.pago,
      pago_em: data.pago_em,
      comprovante_pagamento_url: data.comprovante_pagamento_url,
    })
    .eq('id', id)
  if (error) throw error
}

export async function updateDueDate(
  supabase: TypedSupabaseClient,
  id: string,
  data: string
): Promise<void> {
  const { error } = await supabase
    .from('gastos')
    .update({ data })
    .eq('id', id)
  if (error) throw error
}

export async function updateReceipt(
  supabase: TypedSupabaseClient,
  id: string,
  url: string
): Promise<void> {
  const { error } = await supabase
    .from('gastos')
    .update({ comprovante_pagamento_url: url })
    .eq('id', id)
  if (error) throw error
}

// ===== VALIDATIONS =====

export async function countExpensesByCategory(
  supabase: TypedSupabaseClient,
  categoriaId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('gastos')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', categoriaId)
  if (error) throw error
  return count || 0
}

export async function countExpensesBySubcategory(
  supabase: TypedSupabaseClient,
  subcategoriaId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('gastos')
    .select('id', { count: 'exact', head: true })
    .eq('subcategoria_id', subcategoriaId)
  if (error) throw error
  return count || 0
}
