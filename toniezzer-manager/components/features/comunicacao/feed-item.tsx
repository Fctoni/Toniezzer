'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageSquare,
  Calendar,
  DollarSign,
  AlertTriangle,
  Info,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Paperclip,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials, cn } from '@/lib/utils'
import type { FeedComunicacaoWithRelations, FeedComentarioWithRelations, User } from '@/lib/types/database'
import { useUser } from '@/lib/hooks/use-user'

const tipoConfig = {
  post: {
    icon: MessageSquare,
    label: 'Post',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  decisao: {
    icon: Info,
    label: 'Decisão',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  alerta: {
    icon: AlertTriangle,
    label: 'Alerta',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  sistema: {
    icon: Info,
    label: 'Sistema',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
}

interface FeedItemProps {
  post: FeedComunicacaoWithRelations
  comentarios?: FeedComentarioWithRelations[]
  onEdit?: (postId: string, newContent: string) => void
  onDelete?: (postId: string) => void
  onComment?: (postId: string, content: string) => void
}

export function FeedItem({ post, comentarios = [], onEdit, onDelete, onComment }: FeedItemProps) {
  const { user } = useUser()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [localComentarios, setLocalComentarios] = useState(comentarios)

  const supabase = createClient()
  const config = tipoConfig[post.tipo]
  const Icon = config.icon

  // Verificar se pode editar (dentro de 1 hora e é o autor)
  const canEdit = user?.id === post.autor_id && 
    new Date(post.created_at) > new Date(Date.now() - 60 * 60 * 1000)

  // Verificar se é admin (pode deletar)
  const canDelete = user?.perfil === 'admin_sistema'

  // Formatar conteúdo com menções destacadas
  const formatContent = (content: string) => {
    // Simples destaque para @menções (assumindo formato @nome)
    return content.replace(/@(\w+)/g, '<span class="text-primary font-medium">@$1</span>')
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user) return
    
    setIsSubmittingComment(true)
    try {
      const { data, error } = await supabase
        .from('feed_comentarios')
        .insert({
          feed_id: post.id,
          conteudo: commentText,
          autor_id: user.id,
        })
        .select(`
          *,
          autor:users!feed_comentarios_autor_id_fkey(*)
        `)
        .single()

      if (error) throw error

      setLocalComentarios(prev => [...prev, data as FeedComentarioWithRelations])
      setCommentText('')
      onComment?.(post.id, commentText)
    } catch (error) {
      console.error('Erro ao comentar:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.autor?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {post.autor?.nome_completo ? getInitials(post.autor.nome_completo) : '??'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{post.autor?.nome_completo || 'Usuário'}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(post.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
                {post.editado && <span className="italic">(editado)</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', config.color)}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit?.(post.id, post.conteudo)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDelete?.(post.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div 
          className="text-sm whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: formatContent(post.conteudo) }}
        />

        {/* Relacionamentos */}
        <div className="flex flex-wrap gap-2 mt-3">
          {post.etapa_relacionada && (
            <Link href={`/cronograma/${post.etapa_relacionada.id}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                <Calendar className="h-3 w-3 mr-1" />
                {post.etapa_relacionada.nome}
              </Badge>
            </Link>
          )}
          {post.gasto_relacionado && (
            <Link href={`/financeiro/lancamentos/${post.gasto_relacionado.id}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                <DollarSign className="h-3 w-3 mr-1" />
                Gasto vinculado
              </Badge>
            </Link>
          )}
        </div>

        {/* Anexos */}
        {post.anexos && post.anexos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.anexos.map((anexo, idx) => (
              <a
                key={idx}
                href={anexo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Paperclip className="h-3 w-3" />
                {anexo.nome}
              </a>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-3 flex flex-col gap-3">
        {/* Botão de comentários */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="h-4 w-4" />
          {localComentarios.length > 0 
            ? `${localComentarios.length} comentário${localComentarios.length > 1 ? 's' : ''}`
            : 'Comentar'
          }
        </Button>

        {/* Lista de comentários */}
        {showComments && (
          <div className="w-full space-y-3">
            {localComentarios.map((comentario) => (
              <div key={comentario.id} className="flex gap-2 pl-2 border-l-2 border-muted">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comentario.autor?.avatar_url || ''} />
                  <AvatarFallback className="text-xs bg-muted">
                    {comentario.autor?.nome_completo ? getInitials(comentario.autor.nome_completo) : '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comentario.autor?.nome_completo}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comentario.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comentario.conteudo}</p>
                </div>
              </div>
            ))}

            {/* Input de novo comentário */}
            {user && user.perfil !== 'visualizador' && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Escreva um comentário..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <Button 
                  size="icon" 
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

