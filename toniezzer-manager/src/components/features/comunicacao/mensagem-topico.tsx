"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Tables } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { deleteMessage } from "@/lib/services/feed-comunicacao";
import { toast } from "sonner";
import { MoreHorizontal, Trash2 } from "lucide-react";

interface MensagemTopicoProps {
  mensagem: Tables<"feed_comunicacao"> & {
    autor?: Tables<"users"> | null;
  };
  currentUserId?: string;
  isFirstMessage?: boolean;
  onDelete?: () => void;
}

export function MensagemTopico({
  mensagem,
  currentUserId,
  isFirstMessage = false,
  onDelete,
}: MensagemTopicoProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUserId === mensagem.autor_id;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderContent = (content: string) => {
    // Renderiza menções com destaque
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

  const handleDelete = async () => {
    if (isFirstMessage) {
      toast.error("Não é possível excluir a primeira mensagem do tópico");
      return;
    }

    setIsDeleting(true);
    try {
      const supabase = createClient();
      await deleteMessage(supabase, mensagem.id);

      toast.success("Mensagem excluída!");
      onDelete?.();
    } catch {
      toast.error("Erro ao excluir mensagem");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`flex gap-4 p-4 rounded-lg ${
        isFirstMessage
          ? "bg-primary/5 border border-primary/20"
          : "bg-muted/30 border border-border/50"
      }`}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback
          className={`text-sm ${
            isFirstMessage
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary"
          }`}
        >
          {mensagem.autor ? getInitials(mensagem.autor.nome_completo) : "??"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">
              {mensagem.autor?.nome_completo || "Usuário"}
            </span>
            {isFirstMessage && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                Autor do tópico
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {mensagem.created_at && formatDistanceToNow(new Date(mensagem.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            {mensagem.editado && (
              <span className="text-[10px] text-muted-foreground">(editado)</span>
            )}
          </div>

          {isOwner && !isFirstMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={isDeleting}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
          {renderContent(mensagem.conteudo)}
        </div>
      </div>
    </div>
  );
}

