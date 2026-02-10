import { TypedSupabaseClient } from '@/lib/types/supabase'
import { Tables } from '@/lib/types/database'
type OrcamentoDetalhado = Tables<'orcamento_detalhado'>

type DetalhamentoComCategoria = Pick<OrcamentoDetalhado, 'id' | 'etapa_id' | 'categoria_id' | 'valor_previsto' | 'observacoes'> & {
  categorias: Pick<Tables<'categorias'>, 'nome' | 'cor'> | null
}

// ===== SELECT =====

export async function buscarDetalhamentoComCategoria(
  supabase: TypedSupabaseClient,
  etapaId: string
): Promise<DetalhamentoComCategoria[]> {
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

export async function buscarDetalhamentoPorEtapa(
  supabase: TypedSupabaseClient
): Promise<Pick<OrcamentoDetalhado, 'etapa_id'>[]> {
  const { data, error } = await supabase
    .from('orcamento_detalhado')
    .select('etapa_id')
  if (error) throw error
  return data
}

export async function buscarDetalhamentoMatriz(
  supabase: TypedSupabaseClient
): Promise<Pick<OrcamentoDetalhado, 'etapa_id' | 'categoria_id' | 'valor_previsto'>[]> {
  const { data, error } = await supabase
    .from('orcamento_detalhado')
    .select('etapa_id, categoria_id, valor_previsto')
  if (error) throw error
  return data
}

// ===== INSERT/UPDATE (delete-then-reinsert) =====

export async function salvarDetalhamento(
  supabase: TypedSupabaseClient,
  etapaId: string,
  items: { categoria_id: string; valor_previsto: number; observacoes?: string }[]
): Promise<OrcamentoDetalhado[]> {
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

export async function deletarDetalhamentoPorEtapa(
  supabase: TypedSupabaseClient,
  etapaId: string
): Promise<void> {
  const { error } = await supabase
    .from('orcamento_detalhado')
    .delete()
    .eq('etapa_id', etapaId)
  if (error) throw error
}

// ===== VALIDAÇÕES =====

export async function contarDetalhamentoPorCategoria(
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
