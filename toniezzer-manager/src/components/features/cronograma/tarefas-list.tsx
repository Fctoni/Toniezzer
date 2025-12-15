"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreVertical,
  GripVertical,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NovaTarefaDialog } from "./nova-tarefa-dialog";
import { formatDateToString, parseDateString } from "@/lib/utils";

interface Tarefa {
  id: string;
  etapa_id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_inicio_prevista: string | null;
  data_fim_prevista: string | null;
  data_inicio_real: string | null;
  data_fim_real: string | null;
  responsavel_id: string | null;
  ordem: number;
}

interface User {
  id: string;
  nome_completo: string;
}

interface TarefasListProps {
  tarefas: Tarefa[];
  etapaId: string;
  etapaNome: string;
  users: User[];
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; dotColor: string }
> = {
  nao_iniciada: {
    label: "Pendente",
    color: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
    icon: <Clock className="h-3 w-3" />,
  },
  em_andamento: {
    label: "Em Andamento",
    color: "text-blue-500",
    dotColor: "bg-blue-500",
    icon: <Play className="h-3 w-3" />,
  },
  aguardando_aprovacao: {
    label: "Aguardando",
    color: "text-yellow-500",
    dotColor: "bg-yellow-500",
    icon: <Clock className="h-3 w-3" />,
  },
  aguardando_qualidade: {
    label: "Qualidade",
    color: "text-purple-500",
    dotColor: "bg-purple-500",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  em_retrabalho: {
    label: "Retrabalho",
    color: "text-orange-500",
    dotColor: "bg-orange-500",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  pausada: {
    label: "Pausada",
    color: "text-gray-500",
    dotColor: "bg-gray-500",
    icon: <Pause className="h-3 w-3" />,
  },
  atrasada: {
    label: "Atrasada",
    color: "text-red-500",
    dotColor: "bg-red-500",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  concluida: {
    label: "Concluída",
    color: "text-green-500",
    dotColor: "bg-green-500",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

export function TarefasList({ tarefas, etapaId, etapaNome, users }: TarefasListProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const updateStatus = async (tarefaId: string, novoStatus: string) => {
    setUpdating(tarefaId);
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { status: novoStatus };

      if (novoStatus === "em_andamento") {
        updates.data_inicio_real = formatDateToString(new Date());
      } else if (novoStatus === "concluida") {
        updates.data_fim_real = formatDateToString(new Date());
      }

      const { error } = await supabase
        .from("tarefas")
        .update(updates)
        .eq("id", tarefaId);

      if (error) throw error;

      toast.success("Tarefa atualizada!");
      router.refresh();
    } catch (error) {
      toast.error("Erro ao atualizar tarefa");
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return format(parseDateString(date), "dd/MM", { locale: ptBR });
  };

  const proximaOrdem = tarefas.length > 0 
    ? Math.max(...tarefas.map(t => t.ordem)) + 1 
    : 1;

  if (tarefas.length === 0) {
    return (
      <div className="pl-14 pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <span>Nenhuma tarefa cadastrada</span>
          <NovaTarefaDialog
            etapaId={etapaId}
            etapaNome={etapaNome}
            users={users}
            proximaOrdem={1}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pl-14 pb-2 space-y-1">
      {tarefas.map((tarefa, index) => {
        const config = statusConfig[tarefa.status] || statusConfig.nao_iniciada;
        const isLast = index === tarefas.length - 1;

        return (
          <div
            key={tarefa.id}
            className="relative flex items-center gap-3 py-1.5 pr-2 group"
          >
            {/* Connector line */}
            <div className="absolute left-[-22px] top-0 bottom-0 flex flex-col items-center">
              <div className="w-px h-1/2 bg-border" />
              <div className={`w-2 h-2 rounded-full ${config.dotColor} shrink-0`} />
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <GripVertical className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab" />
              
              <span className={`text-sm ${tarefa.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
                {tarefa.nome}
              </span>

              {tarefa.data_inicio_prevista && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {formatDate(tarefa.data_inicio_prevista)}
                  {tarefa.data_fim_prevista && ` - ${formatDate(tarefa.data_fim_prevista)}`}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Badge 
                variant="outline" 
                className={`text-[10px] px-1.5 py-0 h-5 ${config.color}`}
              >
                {config.label}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    disabled={updating === tarefa.id}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {tarefa.status === "nao_iniciada" && (
                    <DropdownMenuItem
                      onClick={() => updateStatus(tarefa.id, "em_andamento")}
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Iniciar
                    </DropdownMenuItem>
                  )}
                  {tarefa.status === "em_andamento" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => updateStatus(tarefa.id, "concluida")}
                      >
                        <CheckCircle2 className="mr-2 h-3 w-3" />
                        Concluir
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateStatus(tarefa.id, "pausada")}
                      >
                        <Pause className="mr-2 h-3 w-3" />
                        Pausar
                      </DropdownMenuItem>
                    </>
                  )}
                  {(tarefa.status === "pausada" || tarefa.status === "em_retrabalho") && (
                    <DropdownMenuItem
                      onClick={() => updateStatus(tarefa.id, "em_andamento")}
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Retomar
                    </DropdownMenuItem>
                  )}
                  {tarefa.status === "concluida" && (
                    <DropdownMenuItem
                      onClick={() => updateStatus(tarefa.id, "em_andamento")}
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Reabrir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}

      {/* Add Task Button */}
      <div className="pt-1">
        <NovaTarefaDialog
          etapaId={etapaId}
          etapaNome={etapaNome}
          users={users}
          proximaOrdem={proximaOrdem}
        />
      </div>
    </div>
  );
}

