"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tables, TopicoStatus, TopicoPrioridade } from "@/lib/types/database";
import {
  MessageSquare,
  Pin,
  CheckCircle2,
  Archive,
  AlertTriangle,
  ArrowUp,
} from "lucide-react";

interface TopicoLinhaProps {
  topico: Tables<"topicos_comunicacao"> & {
    autor?: Tables<"users"> | null;
    _count?: { mensagens: number };
  };
}

const statusIcon: Record<TopicoStatus, React.ReactNode> = {
  aberto: <span className="h-2 w-2 rounded-full bg-green-500" />,
  resolvido: <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />,
  arquivado: <Archive className="h-3.5 w-3.5 text-gray-400" />,
};

const prioridadeIcon: Record<TopicoPrioridade, React.ReactNode | null> = {
  baixa: null,
  normal: null,
  alta: <ArrowUp className="h-3.5 w-3.5 text-amber-500" />,
  urgente: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
};

export function TopicoLinha({ topico }: TopicoLinhaProps) {
  const mensagensCount = topico._count?.mensagens || 0;

  return (
    <Link
      href={`/comunicacao/${topico.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors group border-b border-border/30 last:border-0"
    >
      {/* Status indicator */}
      <div className="shrink-0 flex items-center justify-center w-5">
        {statusIcon[topico.status as TopicoStatus]}
      </div>

      {/* Pin icon */}
      {topico.fixado && (
        <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
      )}

      {/* Prioridade */}
      {prioridadeIcon[topico.prioridade as TopicoPrioridade]}

      {/* Título */}
      <span
        className={`flex-1 text-sm truncate group-hover:text-primary transition-colors ${
          topico.status === "arquivado" ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {topico.titulo}
      </span>

      {/* Autor */}
      <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[120px]">
        {topico.autor?.nome_completo || "Usuário"}
      </span>

      {/* Tempo */}
      <span className="text-[11px] text-muted-foreground shrink-0 w-20 text-right">
        {topico.updated_at && formatDistanceToNow(new Date(topico.updated_at), {
          addSuffix: false,
          locale: ptBR,
        })}
      </span>

      {/* Contador de mensagens */}
      <div className="flex items-center gap-1 text-muted-foreground shrink-0 w-12 justify-end">
        <MessageSquare className="h-3.5 w-3.5" />
        <span className="text-xs">{mensagensCount}</span>
      </div>
    </Link>
  );
}

