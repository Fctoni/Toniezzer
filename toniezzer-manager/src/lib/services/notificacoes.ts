import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables } from '@/lib/types/database'
type Notificacao = Tables<'notificacoes'>

// ===== SELECT =====

export async function buscarNotificacoes(
  supabase: TypedSupabaseClient,
  usuarioId: string,
  filtros?: { tipo?: string; lida?: boolean }
): Promise<Notificacao[]> {
  let query = supabase
    .from('notificacoes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })

  if (filtros?.tipo) {
    query = query.eq('tipo', filtros.tipo)
  }
  if (filtros?.lida !== undefined) {
    query = query.eq('lida', filtros.lida)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function buscarNotificacoesRecentes(
  supabase: TypedSupabaseClient,
  usuarioId: string,
  limit: number
): Promise<Notificacao[]> {
  const { data, error } = await supabase
    .from('notificacoes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function buscarNotificacoesNaoLidas(
  supabase: TypedSupabaseClient
): Promise<Notificacao[]> {
  const { data, error } = await supabase
    .from('notificacoes')
    .select('*')
    .eq('lida', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ===== UPDATE =====

export async function marcarComoLida(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true, lida_em: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function marcarTodasComoLidas(
  supabase: TypedSupabaseClient,
  usuarioId: string
): Promise<void> {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true, lida_em: new Date().toISOString() })
    .eq('lida', false)
    .eq('usuario_id', usuarioId)
  if (error) throw error
}

// ===== DELETE =====

export async function excluirNotificacao(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('notificacoes').delete().eq('id', id)
  if (error) throw error
}
