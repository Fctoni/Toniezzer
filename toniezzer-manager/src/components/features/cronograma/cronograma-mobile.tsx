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
  subetapa_id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_prevista: string | null;
  responsavel_id: string | null;
  prioridade: string;
  ordem: number;
}

interface Subetapa {
  id: string;
  etapa_id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_inicio_prevista: string | null;
  data_fim_prevista: string | null;
  responsavel_id: string | null;
  progresso_percentual: number;
  ordem: number;
  orcamento_previsto: number | null;
  tarefas: Tarefa[];
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
  subetapas: Subetapa[];
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
  { value: "nao_iniciada", label: "Não Iniciada", icon: Circle, color: "text-muted-foreground" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "pausada", label: "Pausada", icon: Pause, color: "text-gray-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
  { value: "cancelada", label: "Cancelada", icon: AlertTriangle, color: "text-red-500" },
];

function getStatusConfig(status: string) {
  return statusOptions.find((s) => s.value === status) || statusOptions[0];
}

function calcularProgressoEtapa(subetapas: Subetapa[]): number {
  if (subetapas.length === 0) return 0;
  const somaProgresso = subetapas.reduce((acc, sub) => acc + (sub.progresso_percentual || 0), 0);
  return Math.round(somaProgresso / subetapas.length);
}

export function CronogramaMobile({ etapas: initialEtapas, users }: CronogramaMobileProps) {
  const [etapas, setEtapas] = useState(initialEtapas);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [expandedSubetapas, setExpandedSubetapas] = useState<Set<string>>(new Set());
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null);
  const [updating, setUpdating] = useState(false);

  const toggleEtapa = (etapaId: string) => {
    const newExpanded = new Set(expandedEtapas);
    if (newExpanded.has(etapaId)) {
      newExpanded.delete(etapaId);
    } else {
      newExpanded.add(etapaId);
    }
    setExpandedEtapas(newExpanded);
  };

  const toggleSubetapa = (subetapaId: string) => {
    const newExpanded = new Set(expandedSubetapas);
    if (newExpanded.has(subetapaId)) {
      newExpanded.delete(subetapaId);
    } else {
      newExpanded.add(subetapaId);
    }
    setExpandedSubetapas(newExpanded);
  };

  const updateTarefaStatus = async (tarefaId: string, newStatus: string) => {
    setUpdating(true);
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { status: newStatus };

      if (newStatus === "em_andamento") {
        updates.data_inicio_real = formatDateToString(new Date());
      } else if (newStatus === "concluida") {
        updates.data_conclusao_real = formatDateToString(new Date());
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
          subetapas: e.subetapas.map((s) => ({
            ...s,
            tarefas: s.tarefas.map((t) =>
              t.id === tarefaId ? { ...t, status: newStatus } : t
            ),
          })),
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
          const progresso = calcularProgressoEtapa(etapa.subetapas);
          const isEtapaExpanded = expandedEtapas.has(etapa.id);
          const StatusIcon = statusConfig.icon;

          // Contar total de tarefas
          const totalTarefas = etapa.subetapas.reduce((acc, s) => acc + s.tarefas.length, 0);
          const tarefasConcluidas = etapa.subetapas.reduce(
            (acc, s) => acc + s.tarefas.filter((t) => t.status === "concluida").length,
            0
          );

          return (
            <Card key={etapa.id} className="overflow-hidden">
              {/* Header da Etapa */}
              <button
                onClick={() => toggleEtapa(etapa.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                {isEtapaExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">
                      {etapa.nome}
                    </span>
                    <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", statusConfig.color)} />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={progresso} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">
                      {progresso}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {etapa.subetapas.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {etapa.subetapas.length} sub
                    </Badge>
                  )}
                  {totalTarefas > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {tarefasConcluidas}/{totalTarefas}
                    </Badge>
                  )}
                </div>
              </button>

              {/* Lista de Subetapas */}
              {isEtapaExpanded && etapa.subetapas.length > 0 && (
                <CardContent className="pt-0 pb-2 px-2">
                  <div className="space-y-1.5 ml-4 border-l-2 border-border pl-2">
                    {etapa.subetapas.map((subetapa, idx) => {
                      const subStatusConfig = getStatusConfig(subetapa.status);
                      const SubStatusIcon = subStatusConfig.icon;
                      const isSubExpanded = expandedSubetapas.has(subetapa.id);
                      const isLast = idx === etapa.subetapas.length - 1;

                      return (
                        <div key={subetapa.id} className="rounded-lg border bg-card">
                          {/* Header da Subetapa */}
                          <button
                            onClick={() => toggleSubetapa(subetapa.id)}
                            className="w-full p-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors"
                          >
                            {isSubExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}

                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-xs truncate">
                                  {subetapa.nome}
                                </span>
                                <SubStatusIcon
                                  className={cn("h-3 w-3 shrink-0", subStatusConfig.color)}
                                />
                              </div>
                              {subetapa.tarefas.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Progress
                                    value={subetapa.progresso_percentual}
                                    className="h-1 flex-1"
                                  />
                                  <span className="text-[10px] text-muted-foreground">
                                    {subetapa.progresso_percentual}%
                                  </span>
                                </div>
                              )}
                            </div>

                            {subetapa.tarefas.length > 0 && (
                              <Badge variant="outline" className="text-[9px] shrink-0">
                                {subetapa.tarefas.filter((t) => t.status === "concluida").length}/
                                {subetapa.tarefas.length}
                              </Badge>
                            )}
                          </button>

                          {/* Lista de Tarefas */}
                          {isSubExpanded && subetapa.tarefas.length > 0 && (
                            <div className="px-2 pb-2">
                              <div className="space-y-0.5 ml-4 border-l border-border pl-2">
                                {subetapa.tarefas.map((tarefa, tarefaIdx) => {
                                  const tarefaStatusConfig = getStatusConfig(tarefa.status);
                                  const TarefaStatusIcon = tarefaStatusConfig.icon;
                                  const isTarefaLast = tarefaIdx === subetapa.tarefas.length - 1;

                                  return (
                                    <button
                                      key={tarefa.id}
                                      onClick={() => setSelectedTarefa(tarefa)}
                                      className={cn(
                                        "w-full flex items-center gap-1.5 p-1.5 rounded text-left hover:bg-muted/50 transition-colors",
                                        tarefa.status === "concluida" && "opacity-60"
                                      )}
                                    >
                                      <span className="text-muted-foreground/40 text-[10px]">
                                        {isTarefaLast ? "└" : "├"}
                                      </span>
                                      <TarefaStatusIcon
                                        className={cn("h-3 w-3 shrink-0", tarefaStatusConfig.color)}
                                      />
                                      <span
                                        className={cn(
                                          "text-xs flex-1 truncate",
                                          tarefa.status === "concluida" && "line-through"
                                        )}
                                      >
                                        {tarefa.nome}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {isSubExpanded && subetapa.tarefas.length === 0 && (
                            <div className="px-2 pb-2">
                              <p className="text-[10px] text-muted-foreground text-center py-2">
                                Nenhuma tarefa
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}

              {isEtapaExpanded && etapa.subetapas.length === 0 && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Nenhuma subetapa cadastrada
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
                {/* Data */}
                {selectedTarefa.data_prevista && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Data Prevista
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {new Date(
                        selectedTarefa.data_prevista + "T12:00:00"
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={selectedTarefa.status}
                    onValueChange={(value) => updateTarefaStatus(selectedTarefa.id, value)}
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

                {/* Ações rápidas */}
                <div className="flex gap-2">
                  {selectedTarefa.status !== "em_andamento" &&
                    selectedTarefa.status !== "concluida" && (
                      <Button
                        className="flex-1"
                        onClick={() => updateTarefaStatus(selectedTarefa.id, "em_andamento")}
                        disabled={updating}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    )}

                  {selectedTarefa.status !== "concluida" && (
                    <Button
                      variant={
                        selectedTarefa.status === "em_andamento" ? "default" : "outline"
                      }
                      className="flex-1"
                      onClick={() => updateTarefaStatus(selectedTarefa.id, "concluida")}
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
