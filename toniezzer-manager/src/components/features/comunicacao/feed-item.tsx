"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  Megaphone,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Tables, FeedTipo } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface FeedItemProps {
  post: Tables<"feed_comunicacao"> & {
    autor?: Tables<"users"> | null;
    etapa?: Tables<"etapas"> | null;
    gasto?: Tables<"gastos"> | null;
    comentarios?: (Tables<"feed_comentarios"> & {
      autor?: Tables<"users"> | null;
    })[];
    usuarios_mencionados?: Tables<"users">[];
  };
  currentUserId?: string;
  users: Tables<"users">[];
  onDelete?: () => void;
  onUpdate?: () => void;
}

const tipoConfig: Record<
  FeedTipo,
  { label: string; color: string; icon: React.ReactNode }
> = {
  post: {
    label: "Post",
    color: "bg-blue-500/20 text-blue-600",
    icon: <MessageSquare className="h-3 w-3" />,
  },
  decisao: {
    label: "Decisão",
    color: "bg-amber-500/20 text-amber-600",
    icon: <Megaphone className="h-3 w-3" />,
  },
  alerta: {
    label: "Alerta",
    color: "bg-red-500/20 text-red-600",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  sistema: {
    label: "Sistema",
    color: "bg-gray-500/20 text-gray-600",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export function FeedItem({
  post,
  currentUserId,
  users,
  onDelete,
  onUpdate,
}: FeedItemProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState(post.comentarios || []);

  const config = tipoConfig[post.tipo];
  const isOwner = currentUserId === post.autor_id;
  const canEdit = isOwner && new Date(post.created_at) > new Date(Date.now() - 60 * 60 * 1000);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(@\[([^\]]+)\]\(([^)]+)\))/g);
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 4 === 0) {
        elements.push(<span key={i}>{parts[i]}</span>);
      } else if (i % 4 === 2) {
        const userName = parts[i];
        elements.push(
          <span
            key={i}
            className="text-primary font-medium bg-primary/10 px-1 rounded"
          >
            @{userName}
          </span>
        );
        i += 1;
      }
    }

    return elements.length > 0 ? elements : content;
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("feed_comentarios")
        .insert({
          feed_id: post.id,
          conteudo: newComment,
          autor_id: currentUserId || users[0]?.id,
        })
        .select(
          `
          *,
          autor:users(*)
        `
        )
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setNewComment("");
      toast.success("Comentário adicionado!");
    } catch {
      toast.error("Erro ao adicionar comentário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("feed_comunicacao")
        .delete()
        .eq("id", post.id);

      if (error) throw error;
      toast.success("Post excluído!");
      onDelete?.();
    } catch {
      toast.error("Erro ao excluir post");
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {post.autor ? getInitials(post.autor.nome_completo) : "??"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">
                {post.autor?.nome_completo || "Usuário"}
              </span>
              <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Badge>
              {post.editado && (
                <span className="text-[10px] text-muted-foreground">(editado)</span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={onUpdate}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">
              {renderContent(post.conteudo)}
            </div>

            {(post.etapa || post.gasto) && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {post.etapa && (
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.etapa.nome}
                  </Badge>
                )}
                {post.gasto && (
                  <Badge variant="secondary" className="gap-1">
                    <DollarSign className="h-3 w-3" />
                    R$ {post.gasto.valor.toLocaleString("pt-BR")}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-3 pt-0">
        <div className="flex items-center gap-4 border-t border-border/50 pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
            {comments.length > 0 ? `${comments.length} comentário(s)` : "Comentar"}
          </Button>
        </div>

        {showComments && (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 pl-4 border-l-2 border-border/50">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-muted">
                    {comment.autor ? getInitials(comment.autor.nome_completo) : "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {comment.autor?.nome_completo || "Usuário"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">{comment.conteudo}</p>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Textarea
                placeholder="Escreva um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                Enviar
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

