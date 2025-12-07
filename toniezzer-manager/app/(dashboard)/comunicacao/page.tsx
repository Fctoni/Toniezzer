'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { FeedItem } from '@/components/features/comunicacao/feed-item'
import { FiltrosFeed, FiltrosState } from '@/components/features/comunicacao/filtros-feed'
import { NovoPostForm } from '@/components/features/comunicacao/novo-post-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  MessageSquare, 
  RefreshCw, 
  Loader2,
  Inbox
} from 'lucide-react'
import type { FeedComunicacaoWithRelations, FeedComentarioWithRelations } from '@/lib/types/database'

export default function ComunicacaoPage() {
  const { can, isLoading: permissionsLoading } = usePermissions()
  const [posts, setPosts] = useState<FeedComunicacaoWithRelations[]>([])
  const [comentariosPorPost, setComentariosPorPost] = useState<Record<string, FeedComentarioWithRelations[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosState>({
    tipo: 'todos',
    autorId: 'todos',
    etapaId: 'todos',
  })

  const supabase = createClient()

  const fetchPosts = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      let query = supabase
        .from('feed_comunicacao')
        .select(`
          *,
          autor:users!feed_comunicacao_autor_id_fkey(*),
          etapa_relacionada:etapas(*),
          gasto_relacionado:gastos(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      // Aplicar filtros
      if (filtros.tipo !== 'todos') {
        query = query.eq('tipo', filtros.tipo)
      }
      if (filtros.autorId !== 'todos') {
        query = query.eq('autor_id', filtros.autorId)
      }
      if (filtros.etapaId !== 'todos') {
        query = query.eq('etapa_relacionada_id', filtros.etapaId)
      }

      const { data, error } = await query

      if (error) throw error

      setPosts(data || [])

      // Buscar comentários para todos os posts
      if (data && data.length > 0) {
        const postIds = data.map(p => p.id)
        const { data: comentarios } = await supabase
          .from('feed_comentarios')
          .select(`
            *,
            autor:users!feed_comentarios_autor_id_fkey(*)
          `)
          .in('feed_id', postIds)
          .order('created_at', { ascending: true })

        if (comentarios) {
          const grouped = comentarios.reduce((acc, c) => {
            if (!acc[c.feed_id]) acc[c.feed_id] = []
            acc[c.feed_id].push(c as FeedComentarioWithRelations)
            return acc
          }, {} as Record<string, FeedComentarioWithRelations[]>)
          setComentariosPorPost(grouped)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar posts:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [filtros])

  useEffect(() => {
    fetchPosts()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('feed_comunicacao_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_comunicacao' },
        () => {
          fetchPosts(true)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'feed_comunicacao' },
        () => {
          fetchPosts(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPosts])

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return

    try {
      const { error } = await supabase
        .from('feed_comunicacao')
        .delete()
        .eq('id', postId)

      if (error) throw error

      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (error) {
      console.error('Erro ao deletar post:', error)
    }
  }

  const handleFilterChange = (newFiltros: FiltrosState) => {
    setFiltros(newFiltros)
  }

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Comunicação</h1>
            <p className="text-sm text-muted-foreground">
              Feed centralizado da obra
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPosts(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Formulário de novo post */}
      {can.postarNoFeed() && (
        <NovoPostForm 
          onSuccess={() => fetchPosts(true)} 
          className="mb-6"
        />
      )}

      {/* Filtros */}
      <div className="mb-6">
        <FiltrosFeed onFilterChange={handleFilterChange} />
      </div>

      {/* Lista de posts */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-8 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum post encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {filtros.tipo !== 'todos' || filtros.autorId !== 'todos' || filtros.etapaId !== 'todos'
                ? 'Tente ajustar os filtros para ver mais resultados.'
                : 'Seja o primeiro a publicar algo!'
              }
            </p>
          </Card>
        ) : (
          posts.map((post) => (
            <FeedItem
              key={post.id}
              post={post}
              comentarios={comentariosPorPost[post.id] || []}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>
    </div>
  )
}

