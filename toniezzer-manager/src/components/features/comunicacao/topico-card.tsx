"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tables, TopicoStatus, TopicoPrioridade } from "@/lib/types/database";
import {
  MessageSquare,
  Pin,
  CheckCircle2,
  Archive,
  AlertTriangle,
  ArrowUp,
  Calendar,
} from "lucide-react";

interface TopicoCardProps {
  topico: Tables<"topicos_comunicacao"> & {
    autor?: Tables<"users"> | null;
    etapa?: Tables<"etapas"> | null;
    _count?: { mensagens: number };
    ultima_mensagem?: {
      autor?: Tables<"users"> | null;
      created_at: string;
    } | null;
  };
}

const statusConfig: Record<
  TopicoStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  aberto: {
    label: "Aberto",
    color: "bg-green-500/20 text-green-600 border-green-500/30",
    icon: <MessageSquare className="h-3 w-3" />,
  },
  resolvido: {
    label: "Resolvido",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  arquivado: {
    label: "Arquivado",
    color: "bg-gray-500/20 text-gray-500 border-gray-500/30",
    icon: <Archive className="h-3 w-3" />,
  },
};

const prioridadeConfig: Record<
  TopicoPrioridade,
  { label: string; color: string; icon?: React.ReactNode }
> = {
  baixa: {
    label: "Baixa",
    color: "text-muted-foreground",
  },
  normal: {
    label: "Normal",
    color: "text-foreground",
  },
  alta: {
    label: "Alta",
    color: "text-amber-600",
    icon: <ArrowUp className="h-3 w-3" />,
  },
  urgente: {
    label: "Urgente",
    color: "text-red-600",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

export function TopicoCard({ topico }: TopicoCardProps) {
  const status = statusConfig[topico.status as TopicoStatus];
  const prioridade = prioridadeConfig[topico.prioridade as TopicoPrioridade];
  const mensagensCount = topico._count?.mensagens || 0;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link href={`/comunicacao/${topico.id}`}>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar do autor */}
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {topico.autor ? getInitials(topico.autor.nome_completo) : "??"}
              </AvatarFallback>
            </Avatar>

            {/* Conteúdo principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {topico.fixado && (
                  <Pin className="h-4 w-4 text-primary shrink-0" />
                )}
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {topico.titulo}
                </h3>
              </div>

              {topico.descricao && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {topico.descricao}
                </p>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline" className={`text-[10px] gap-1 ${status.color}`}>
                  {status.icon}
                  {status.label}
                </Badge>

                {topico.prioridade !== "normal" && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] gap-1 ${prioridade.color}`}
                  >
                    {prioridade.icon}
                    {prioridade.label}
                  </Badge>
                )}

                {topico.etapa && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Calendar className="h-3 w-3" />
                    {topico.etapa.nome}
                  </Badge>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>
                  Por{" "}
                  <span className="font-medium text-foreground/80">
                    {topico.autor?.nome_completo || "Usuário"}
                  </span>
                </span>
                <span>•</span>
                <span>
                  {topico.created_at && formatDistanceToNow(new Date(topico.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>

            {/* Contador de mensagens */}
            <div className="flex flex-col items-center gap-1 shrink-0 text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">{mensagensCount}</span>
              </div>
              <span className="text-[10px]">
                {mensagensCount === 1 ? "resposta" : "respostas"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

