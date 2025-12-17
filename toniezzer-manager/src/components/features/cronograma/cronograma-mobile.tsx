"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Circle,
  Clock,
  AlertTriangle,
  Pause,
  Play,
} from "lucide-react";
import { cn, formatDateToString } from "@/lib/utils";

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

interface Etapa {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_inicio_prevista: string | null;
  data_fim_prevista: string | null;
  data_inicio_real: string | null;
  data_fim_real: string | null;
  progresso_percentual: number;
  ordem: number;
  responsavel_id: string | null;
  responsavel: { nome_completo: string } | null;
  tarefas: Tarefa[];
  orcamento?: number | null;
  gasto_realizado?: number;
}

interface User {
  id: string;
  nome_completo: string;
}

interface CronogramaMobileProps {
  etapas: Etapa[];
  users: User[];
}

const statusOptions = [
  { value: "nao_iniciada", label: "Nao Iniciada", icon: Circle, color: "text-muted-foreground" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "aguardando_aprovacao", label: "Aguardando", icon: Clock, color: "text-yellow-500" },
  { value: "pausada", label: "Pausada", icon: Pause, color: "text-gray-500" },
  { value: "atrasada", label: "Atrasada", icon: AlertTriangle, color: "text-red-500" },
  { value: "concluida", label: "Concluida", icon: Check, color: "text-green-500" },
];

function getStatusConfig(status: string) {
  return statusOptions.find((s) => s.value === status) || statusOptions[0];
}

function calcularProgresso(etapa: Etapa) {
  if (etapa.tarefas.length === 0) return etapa.progresso_percentual;
  const concluidas = etapa.tarefas.filter((t) => t.status === "concluida").length;
  return Math.round((concluidas / etapa.tarefas.length) * 100);
}

export function CronogramaMobile({ etapas: initialEtapas, users }: CronogramaMobileProps) {
  const [etapas, setEtapas] = useState(initialEtapas);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null);
  const [selectedEtapaId, setSelectedEtapaId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const toggleExpanded = (etapaId: string) => {
    const newExpanded = new Set(expandedEtapas);
    if (newExpanded.has(etapaId)) {
      newExpanded.delete(etapaId);
    } else {
      newExpanded.add(etapaId);
    }
    setExpandedEtapas(newExpanded);
  };

  const updateTarefaStatus = async (tarefaId: string, newStatus: string) => {
    setUpdating(true);
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { status: newStatus };

      if (newStatus === "em_andamento") {
        updates.data_inicio_real = formatDateToString(new Date());
      } else if (newStatus === "concluida") {
        updates.data_fim_real = formatDateToString(new Date());
      }

      const { error } = await supabase
        .from("tarefas")
        .update(updates)
        .eq("id", tarefaId);

      if (error) throw error;

      // Atualizar estado local
      setEtapas((prev) =>
        prev.map((e) => ({
          ...e,
          tarefas: e.tarefas.map((t) =>
            t.id === tarefaId ? { ...t, status: newStatus } : t
          ),
        }))
      );

      toast.success("Status atualizado!");
      setSelectedTarefa(null);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdating(false);
    }
  };

  if (etapas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma etapa cadastrada</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {etapas.map((etapa) => {
          const statusConfig = getStatusConfig(etapa.status);
          const progresso = calcularProgresso(etapa);
          const isExpanded = expandedEtapas.has(etapa.id);
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={etapa.id} className="overflow-hidden">
              {/* Header da Etapa */}
              <button
                onClick={() => toggleExpanded(etapa.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {etapa.nome}
                    </span>
                    <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", statusConfig.color)} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={progresso} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">
                      {progresso}%
                    </span>
                  </div>
                </div>

                {etapa.tarefas.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {etapa.tarefas.filter((t) => t.status === "concluida").length}/
                    {etapa.tarefas.length}
                  </Badge>
                )}
              </button>

              {/* Lista de Tarefas */}
              {isExpanded && etapa.tarefas.length > 0 && (
                <CardContent className="pt-0 pb-2 px-2">
                  <div className="space-y-1 ml-6 border-l border-border pl-3">
                    {etapa.tarefas.map((tarefa, idx) => {
                      const tarefaStatusConfig = getStatusConfig(tarefa.status);
                      const TarefaStatusIcon = tarefaStatusConfig.icon;
                      const isLast = idx === etapa.tarefas.length - 1;

                      return (
                        <button
                          key={tarefa.id}
                          onClick={() => {
                            setSelectedTarefa(tarefa);
                            setSelectedEtapaId(etapa.id);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-muted/50 transition-colors",
                            tarefa.status === "concluida" && "opacity-60"
                          )}
                        >
                          <span className="text-muted-foreground/50 text-xs">
                            {isLast ? "└" : "├"}
                          </span>
                          <TarefaStatusIcon
                            className={cn("h-3.5 w-3.5 shrink-0", tarefaStatusConfig.color)}
                          />
                          <span
                            className={cn(
                              "text-sm flex-1 truncate",
                              tarefa.status === "concluida" && "line-through"
                            )}
                          >
                            {tarefa.nome}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              )}

              {isExpanded && etapa.tarefas.length === 0 && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Nenhuma tarefa nesta etapa
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom Sheet para editar tarefa */}
      <Sheet open={!!selectedTarefa} onOpenChange={() => setSelectedTarefa(null)}>
        <SheetContent side="bottom" className="h-auto max-h-[50vh]">
          {selectedTarefa && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">{selectedTarefa.nome}</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mt-4">
                {/* Datas */}
                <div className="flex gap-4">
                  <div className="flex-1 p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Inicio</p>
                    <p className="text-sm font-medium mt-0.5">
                      {selectedTarefa.data_inicio_prevista
                        ? new Date(selectedTarefa.data_inicio_prevista + "T12:00:00").toLocaleDateString("pt-BR")
                        : "Nao definida"}
                    </p>
                    {selectedTarefa.data_inicio_real && (
                      <p className="text-[10px] text-green-500 mt-0.5">
                        Real: {new Date(selectedTarefa.data_inicio_real + "T12:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fim</p>
                    <p className="text-sm font-medium mt-0.5">
                      {selectedTarefa.data_fim_prevista
                        ? new Date(selectedTarefa.data_fim_prevista + "T12:00:00").toLocaleDateString("pt-BR")
                        : "Nao definida"}
                    </p>
                    {selectedTarefa.data_fim_real && (
                      <p className="text-[10px] text-green-500 mt-0.5">
                        Real: {new Date(selectedTarefa.data_fim_real + "T12:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={selectedTarefa.status}
                    onValueChange={(value) =>
                      updateTarefaStatus(selectedTarefa.id, value)
                    }
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className={cn("flex items-center gap-2", option.color)}>
                            <option.icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Acoes rapidas */}
                <div className="flex gap-2">
                  {selectedTarefa.status !== "em_andamento" &&
                    selectedTarefa.status !== "concluida" && (
                      <Button
                        className="flex-1"
                        onClick={() =>
                          updateTarefaStatus(selectedTarefa.id, "em_andamento")
                        }
                        disabled={updating}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    )}

                  {selectedTarefa.status !== "concluida" && (
                    <Button
                      variant={
                        selectedTarefa.status === "em_andamento"
                          ? "default"
                          : "outline"
                      }
                      className="flex-1"
                      onClick={() =>
                        updateTarefaStatus(selectedTarefa.id, "concluida")
                      }
                      disabled={updating}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

