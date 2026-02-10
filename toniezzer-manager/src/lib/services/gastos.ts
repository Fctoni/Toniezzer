import { TypedSupabaseClient } from '@/lib/types/supabase'
import { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
type Gasto = Tables<'gastos'>

// ===== SELECT =====

export async function buscarGastosComDetalhes(supabase: TypedSupabaseClient) {
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

export async function buscarGastosAprovados(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase
    .from('gastos')
    .select('*, categorias(nome, cor)')
    .eq('status', 'aprovado')
  if (error) throw error
  return data
}

export async function buscarGastosAprovadosResumidos(
  supabase: TypedSupabaseClient
): Promise<Pick<Gasto, 'valor' | 'data' | 'parcelas' | 'parcela_atual'>[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('valor, data, parcelas, parcela_atual')
    .eq('status', 'aprovado')
    .order('data')
  if (error) throw error
  return data
}

export async function buscarGastosPorEtapa(
  supabase: TypedSupabaseClient
): Promise<Pick<Gasto, 'etapa_relacionada_id' | 'valor'>[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('etapa_relacionada_id, valor')
    .eq('status', 'aprovado')
  if (error) throw error
  return data
}

export async function buscarGastosMatriz(
  supabase: TypedSupabaseClient
): Promise<Pick<Gasto, 'categoria_id' | 'etapa_relacionada_id' | 'valor'>[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('categoria_id, etapa_relacionada_id, valor')
    .eq('status', 'aprovado')
  if (error) throw error
  return data
}

export async function buscarGastosPorCompra(
  supabase: TypedSupabaseClient,
  compraId: string
): Promise<Pick<Gasto, 'id' | 'valor' | 'data' | 'parcela_atual' | 'parcelas' | 'pago' | 'pago_em' | 'comprovante_pagamento_url'>[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('id, valor, data, parcela_atual, parcelas, pago, pago_em, comprovante_pagamento_url')
    .eq('compra_id', compraId)
    .order('parcela_atual')
  if (error) throw error
  return data
}

export async function buscarGastosPorFornecedor(supabase: TypedSupabaseClient, fornecedorId: string) {
  const { data, error } = await supabase
    .from('gastos')
    .select('*, categoria:categorias(*)')
    .eq('fornecedor_id', fornecedorId)
    .order('data', { ascending: false })
  if (error) throw error
  return data
}

export async function buscarGastosDetalhadosPorCategoria(
  supabase: TypedSupabaseClient,
  categoriaId: string,
  etapaId: string
) {
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
      criado_por_user:criado_por(nome_completo)
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

export async function criarGastos(
  supabase: TypedSupabaseClient,
  parcelas: TablesInsert<'gastos'>[]
): Promise<Gasto[]> {
  const { data, error } = await supabase
    .from('gastos')
    .insert(parcelas)
    .select()
  if (error) throw error
  return data
}

export async function criarGastoAvulso(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'gastos'>
): Promise<Gasto> {
  const { data: gasto, error } = await supabase
    .from('gastos')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return gasto
}

// ===== UPDATE =====

export async function atualizarGastosPorCompra(
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

export async function marcarPago(
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

export async function atualizarComprovante(
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

// ===== VALIDAÇÕES =====

export async function contarGastosPorCategoria(
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

export async function contarGastosPorSubcategoria(
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
