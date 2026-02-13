import { TypedSupabaseClient } from '@/lib/types/supabase'
import type { Tables, TablesInsert } from '@/lib/types/database'
type FeedComunicacao = Tables<'feed_comunicacao'>
type FeedComentario = Tables<'feed_comentarios'>

// ===== SELECT =====

export async function buscarMensagensPorTopico(supabase: TypedSupabaseClient, topicoId: string) {
  const { data, error } = await supabase
    .from('feed_comunicacao')
    .select('*, autor:autor_id(*)')
    .eq('topico_id', topicoId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function contarMensagensPorTopico(
  supabase: TypedSupabaseClient,
  topicoId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('feed_comunicacao')
    .select('*', { count: 'exact', head: true })
    .eq('topico_id', topicoId)
  if (error) throw error
  return count ?? 0
}

// ===== INSERT =====

export async function criarMensagem(
  supabase: TypedSupabaseClient,
  data: { tipo: string; conteudo: string; autor_id: string; topico_id: string; mencoes?: string[] | null }
): Promise<FeedComunicacao> {
  const { data: mensagem, error } = await supabase
    .from('feed_comunicacao')
    .insert({
      tipo: data.tipo,
      conteudo: data.conteudo,
      autor_id: data.autor_id,
      topico_id: data.topico_id,
      mencoes: data.mencoes ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return mensagem
}

export async function criarPost(
  supabase: TypedSupabaseClient,
  data: { tipo: string; conteudo: string; autor_id: string; mencoes?: string[] | null; etapa_relacionada_id?: string | null }
): Promise<FeedComunicacao> {
  const { data: post, error } = await supabase
    .from('feed_comunicacao')
    .insert({
      tipo: data.tipo,
      conteudo: data.conteudo,
      autor_id: data.autor_id,
      mencoes: data.mencoes ?? null,
      etapa_relacionada_id: data.etapa_relacionada_id ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return post
}

export async function criarPostDecisao(
  supabase: TypedSupabaseClient,
  data: { tipo: string; conteudo: string; autor_id: string; reuniao_relacionada_id: string }
): Promise<FeedComunicacao> {
  const { data: post, error } = await supabase
    .from('feed_comunicacao')
    .insert({
      tipo: data.tipo,
      conteudo: data.conteudo,
      autor_id: data.autor_id,
      reuniao_relacionada_id: data.reuniao_relacionada_id,
    })
    .select()
    .single()
  if (error) throw error
  return post
}

// ===== DELETE =====

export async function deletarPost(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('feed_comunicacao').delete().eq('id', id)
  if (error) throw error
}

export async function deletarMensagem(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('feed_comunicacao').delete().eq('id', id)
  if (error) throw error
}

// ===== COMENTÁRIOS =====

export async function criarComentario(
  supabase: TypedSupabaseClient,
  data: { feed_id: string; conteudo: string; autor_id: string }
) {
  const { data: comentario, error } = await supabase
    .from('feed_comentarios')
    .insert({
      feed_id: data.feed_id,
      conteudo: data.conteudo,
      autor_id: data.autor_id,
    })
    .select('*, autor:autor_id(*)')
    .single()
  if (error) throw error
  return comentario
}
