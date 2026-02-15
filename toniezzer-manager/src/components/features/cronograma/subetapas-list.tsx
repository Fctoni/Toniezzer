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
import { NewSubstageDialog } from "./new-substage-dialog";
import { parseDateString } from "@/lib/utils";

interface Subetapa {
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
  progresso_percentual: number | null;
}

interface User {
  id: string;
  nome_completo: string;
}

interface SubetapasListProps {
  subetapas: Subetapa[];
  etapaId: string;
  etapaNome: string;
  users: User[];
  onRefresh?: () => void;
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
  pausada: {
    label: "Pausada",
    color: "text-gray-500",
    dotColor: "bg-gray-500",
    icon: <Pause className="h-3 w-3" />,
  },
  concluida: {
    label: "Concluída",
    color: "text-green-500",
    dotColor: "bg-green-500",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelada: {
    label: "Cancelada",
    color: "text-red-500",
    dotColor: "bg-red-500",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

export function SubetapasList({ subetapas, etapaId, etapaNome, users, onRefresh }: SubetapasListProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const updateStatus = async (subetapaId: string, novoStatus: string) => {
    setUpdating(subetapaId);
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { status: novoStatus };

      if (novoStatus === "em_andamento") {
        updates.data_inicio_real = new Date().toISOString().split("T")[0];
      } else if (novoStatus === "concluida") {
        updates.data_fim_real = new Date().toISOString().split("T")[0];
      }

      const { error } = await supabase
        .from("subetapas")
        .update(updates)
        .eq("id", subetapaId);

      if (error) throw error;

      toast.success("Subetapa atualizada!");

      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error("Erro ao atualizar subetapa");
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return format(parseDateString(date), "dd/MM", { locale: ptBR });
  };

  const proximaOrdem = subetapas.length > 0
    ? Math.max(...subetapas.map(s => s.ordem)) + 1
    : 1;

  if (subetapas.length === 0) {
    return (
      <div className="pl-14 pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <span>Nenhuma subetapa cadastrada</span>
          <NewSubstageDialog
            etapaId={etapaId}
            etapaNome={etapaNome}
            users={users}
            proximaOrdem={1}
            onSuccess={onRefresh}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pl-14 pb-2 space-y-1">
      {subetapas.map((subetapa, index) => {
        const config = statusConfig[subetapa.status] || statusConfig.nao_iniciada;
        const isLast = index === subetapas.length - 1;

        return (
          <div
            key={subetapa.id}
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

              <span className={`text-sm ${subetapa.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
                {subetapa.nome}
              </span>

              {subetapa.data_inicio_prevista && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {formatDate(subetapa.data_inicio_prevista)}
                  {subetapa.data_fim_prevista && ` - ${formatDate(subetapa.data_fim_prevista)}`}
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
                    disabled={updating === subetapa.id}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {subetapa.status === "nao_iniciada" && (
                    <DropdownMenuItem
                      onClick={() => updateStatus(subetapa.id, "em_andamento")}
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Iniciar
                    </DropdownMenuItem>
                  )}
                  {subetapa.status === "em_andamento" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => updateStatus(subetapa.id, "concluida")}
                      >
                        <CheckCircle2 className="mr-2 h-3 w-3" />
                        Concluir
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateStatus(subetapa.id, "pausada")}
                      >
                        <Pause className="mr-2 h-3 w-3" />
                        Pausar
                      </DropdownMenuItem>
                    </>
                  )}
                  {subetapa.status === "pausada" && (
                    <DropdownMenuItem
                      onClick={() => updateStatus(subetapa.id, "em_andamento")}
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Retomar
                    </DropdownMenuItem>
                  )}
                  {subetapa.status === "concluida" && (
                    <DropdownMenuItem
                      onClick={() => updateStatus(subetapa.id, "em_andamento")}
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

      {/* Add Subetapa Button */}
      <div className="pt-1">
        <NewSubstageDialog
          etapaId={etapaId}
          etapaNome={etapaNome}
          users={users}
          proximaOrdem={proximaOrdem}
          onSuccess={onRefresh}
        />
      </div>
    </div>
  );
}
