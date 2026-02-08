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
  ListTodo,
  Flag,
  Plus,
} from "lucide-react";
import { cn, formatDateToString } from "@/lib/utils";
import { NovaTarefaDialog } from "@/components/features/tarefas/nova-tarefa-dialog";

interface Tarefa {
  id: string;
  subetapa_id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_prevista: string | null;
  data_inicio_real: string | null;
  data_conclusao_real: string | null;
  prioridade: string | null;
  responsavel_id: string | null;
  tags: string[] | null;
  notas: string | null;
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
  data_inicio_real: string | null;
  data_fim_real: string | null;
  responsavel_id: string | null;
  ordem: number;
  progresso_percentual: number | null;
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

const etapaStatusOptions = [
  { value: "nao_iniciada", label: "Não Iniciada", icon: Circle, color: "text-muted-foreground" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "aguardando_aprovacao", label: "Aguardando", icon: Clock, color: "text-yellow-500" },
  { value: "pausada", label: "Pausada", icon: Pause, color: "text-gray-500" },
  { value: "atrasada", label: "Atrasada", icon: AlertTriangle, color: "text-red-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
];

const subetapaStatusOptions = [
  { value: "nao_iniciada", label: "Pendente", icon: Circle, color: "text-muted-foreground" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "pausada", label: "Pausada", icon: Pause, color: "text-gray-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
  { value: "cancelada", label: "Cancelada", icon: AlertTriangle, color: "text-red-500" },
];

const tarefaStatusOptions = [
  { value: "pendente", label: "Pendente", icon: Circle, color: "text-muted-foreground" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
  { value: "cancelada", label: "Cancelada", icon: AlertTriangle, color: "text-red-500" },
  { value: "bloqueada", label: "Bloqueada", icon: Pause, color: "text-orange-500" },
];

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "text-blue-400" },
  media: { label: "Média", color: "text-yellow-500" },
  alta: { label: "Alta", color: "text-orange-500" },
  critica: { label: "Crítica", color: "text-red-500" },
};

function getStatusConfig(status: string, options: typeof etapaStatusOptions) {
  return options.find((s) => s.value === status) || options[0];
}

function calcularProgressoEtapa(etapa: Etapa) {
  if (etapa.subetapas.length === 0) return etapa.progresso_percentual;
  const concluidas = etapa.subetapas.filter((s) => s.status === "concluida").length;
  return Math.round((concluidas / etapa.subetapas.length) * 100);
}

function calcularProgressoSubetapa(subetapa: Subetapa) {
  if (subetapa.tarefas.length === 0) return subetapa.progresso_percentual || 0;
  const concluidas = subetapa.tarefas.filter((t) => t.status === "concluida").length;
  return Math.round((concluidas / subetapa.tarefas.length) * 100);
}

export function CronogramaMobile({ etapas: initialEtapas, users }: CronogramaMobileProps) {
  const [etapas, setEtapas] = useState(initialEtapas);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [expandedSubetapas, setExpandedSubetapas] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<{
    type: "subetapa" | "tarefa";
    item: Subetapa | Tarefa;
    parentName: string;
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  const subetapasOptions = etapas.flatMap((e) =>
    e.subetapas.map((s) => ({
      id: s.id,
      nome: s.nome,
      etapa_nome: e.nome,
    }))
  );

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

  const updateSubetapaStatus = async (subetapaId: string, newStatus: string) => {
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
        .from("subetapas")
        .update(updates)
        .eq("id", subetapaId);

      if (error) throw error;

      setEtapas((prev) =>
        prev.map((e) => ({
          ...e,
          subetapas: e.subetapas.map((s) =>
            s.id === subetapaId ? { ...s, status: newStatus } : s
          ),
        }))
      );

      toast.success("Subetapa atualizada!");
      setSelectedItem(null);
    } catch {
      toast.error("Erro ao atualizar subetapa");
    } finally {
      setUpdating(false);
    }
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

      toast.success("Tarefa atualizada!");
      setSelectedItem(null);
    } catch {
      toast.error("Erro ao atualizar tarefa");
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
          const statusConfig = getStatusConfig(etapa.status, etapaStatusOptions);
          const progresso = calcularProgressoEtapa(etapa);
          const isExpanded = expandedEtapas.has(etapa.id);
          const StatusIcon = statusConfig.icon;
          const subetapasConcluidas = etapa.subetapas.filter(
            (s) => s.status === "concluida"
          ).length;

          return (
            <Card key={etapa.id} className="overflow-hidden">
              {/* Header da Etapa */}
              <button
                onClick={() => toggleEtapa(etapa.id)}
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

                {etapa.subetapas.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {subetapasConcluidas}/{etapa.subetapas.length}
                  </Badge>
                )}
              </button>

              {/* Lista de Subetapas */}
              {isExpanded && etapa.subetapas.length > 0 && (
                <CardContent className="pt-0 pb-2 px-2">
                  <div className="space-y-1 ml-4">
                    {etapa.subetapas.map((subetapa) => {
                      const subConfig = getStatusConfig(subetapa.status, subetapaStatusOptions);
                      const SubIcon = subConfig.icon;
                      const isSubExpanded = expandedSubetapas.has(subetapa.id);
                      const subProgresso = calcularProgressoSubetapa(subetapa);
                      const tarefasConcluidas = subetapa.tarefas.filter(
                        (t) => t.status === "concluida"
                      ).length;

                      return (
                        <div key={subetapa.id}>
                          {/* Header da Subetapa */}
                          <button
                            onClick={() => toggleSubetapa(subetapa.id)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            {subetapa.tarefas.length > 0 ? (
                              isSubExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              )
                            ) : (
                              <div className="w-3.5" />
                            )}

                            <SubIcon className={cn("h-3.5 w-3.5 shrink-0", subConfig.color)} />

                            <div className="flex-1 min-w-0 text-left">
                              <span
                                className={cn(
                                  "text-sm truncate block",
                                  subetapa.status === "concluida" && "line-through text-muted-foreground"
                                )}
                              >
                                {subetapa.nome}
                              </span>
                              {subetapa.tarefas.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Progress value={subProgresso} className="h-1 flex-1 max-w-[80px]" />
                                  <span className="text-[10px] text-muted-foreground">
                                    {subProgresso}%
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {subetapa.tarefas.length > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 gap-0.5">
                                  <ListTodo className="h-2.5 w-2.5" />
                                  {tarefasConcluidas}/{subetapa.tarefas.length}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem({
                                    type: "subetapa",
                                    item: subetapa,
                                    parentName: etapa.nome,
                                  });
                                }}
                              >
                                <SubIcon className={cn("h-3 w-3", subConfig.color)} />
                              </Button>
                            </div>
                          </button>

                          {/* Lista de Tarefas + Nova Tarefa */}
                          {isSubExpanded && (
                            <div className="ml-6 border-l border-border pl-3 space-y-0.5">
                              {subetapa.tarefas.map((tarefa, idx) => {
                                const tConfig = getStatusConfig(tarefa.status, tarefaStatusOptions);
                                const TIcon = tConfig.icon;
                                const isLast = idx === subetapa.tarefas.length - 1;
                                const prio = tarefa.prioridade
                                  ? prioridadeConfig[tarefa.prioridade]
                                  : null;

                                return (
                                  <a
                                    key={tarefa.id}
                                    href={`/tarefas/${tarefa.id}`}
                                    className={cn(
                                      "w-full flex items-center gap-2 p-1.5 rounded text-left hover:bg-muted/50 transition-colors",
                                      tarefa.status === "concluida" && "opacity-60"
                                    )}
                                  >
                                    <span className="text-muted-foreground/50 text-[10px]">
                                      {isLast ? "├" : "├"}
                                    </span>
                                    <TIcon
                                      className={cn("h-3 w-3 shrink-0", tConfig.color)}
                                    />
                                    <span
                                      className={cn(
                                        "text-sm flex-1 truncate",
                                        tarefa.status === "concluida" && "line-through"
                                      )}
                                    >
                                      {tarefa.nome}
                                    </span>
                                    {prio && (
                                      <Flag className={cn("h-3 w-3 shrink-0", prio.color)} />
                                    )}
                                  </a>
                                );
                              })}

                              {/* + Nova Tarefa */}
                              <NovaTarefaDialog
                                users={users}
                                subetapas={subetapasOptions}
                                defaultSubetapaId={subetapa.id}
                                proximaOrdem={subetapa.tarefas.length + 1}
                                trigger={
                                  <button className="w-full flex items-center gap-2 p-1.5 rounded text-left hover:bg-muted/50 transition-colors text-xs text-muted-foreground hover:text-primary">
                                    <span className="text-muted-foreground/50 text-[10px]">└</span>
                                    <Plus className="h-3 w-3" />
                                    <span>Nova Tarefa</span>
                                  </button>
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}

              {isExpanded && etapa.subetapas.length === 0 && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Nenhuma subetapa nesta etapa
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom Sheet para editar subetapa ou tarefa */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent side="bottom" className="h-auto max-h-[50vh]">
          {selectedItem?.type === "subetapa" && (() => {
            const subetapa = selectedItem.item as Subetapa;
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-left text-base">{subetapa.nome}</SheetTitle>
                  <p className="text-xs text-muted-foreground text-left">{selectedItem.parentName}</p>
                </SheetHeader>

                <div className="space-y-4 mt-4">
                  {/* Datas */}
                  <div className="flex gap-4">
                    <div className="flex-1 p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Início</p>
                      <p className="text-sm font-medium mt-0.5">
                        {subetapa.data_inicio_prevista
                          ? new Date(subetapa.data_inicio_prevista + "T12:00:00").toLocaleDateString("pt-BR")
                          : "Não definida"}
                      </p>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fim</p>
                      <p className="text-sm font-medium mt-0.5">
                        {subetapa.data_fim_prevista
                          ? new Date(subetapa.data_fim_prevista + "T12:00:00").toLocaleDateString("pt-BR")
                          : "Não definida"}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={subetapa.status}
                      onValueChange={(value) => updateSubetapaStatus(subetapa.id, value)}
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subetapaStatusOptions.map((option) => (
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
                    {subetapa.status !== "em_andamento" && subetapa.status !== "concluida" && (
                      <Button
                        className="flex-1"
                        onClick={() => updateSubetapaStatus(subetapa.id, "em_andamento")}
                        disabled={updating}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    )}
                    {subetapa.status !== "concluida" && (
                      <Button
                        variant={subetapa.status === "em_andamento" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => updateSubetapaStatus(subetapa.id, "concluida")}
                        disabled={updating}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}

          {selectedItem?.type === "tarefa" && (() => {
            const tarefa = selectedItem.item as Tarefa;
            const prio = tarefa.prioridade ? prioridadeConfig[tarefa.prioridade] : null;
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-left text-base">{tarefa.nome}</SheetTitle>
                  <p className="text-xs text-muted-foreground text-left">{selectedItem.parentName}</p>
                </SheetHeader>

                <div className="space-y-4 mt-4">
                  {/* Prazo + Prioridade */}
                  <div className="flex gap-4">
                    <div className="flex-1 p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prazo</p>
                      <p className="text-sm font-medium mt-0.5">
                        {tarefa.data_prevista
                          ? new Date(tarefa.data_prevista + "T12:00:00").toLocaleDateString("pt-BR")
                          : "Não definido"}
                      </p>
                    </div>
                    {prio && (
                      <div className="flex-1 p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prioridade</p>
                        <p className={cn("text-sm font-medium mt-0.5 flex items-center gap-1", prio.color)}>
                          <Flag className="h-3.5 w-3.5" />
                          {prio.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {tarefa.tags && tarefa.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tarefa.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={tarefa.status}
                      onValueChange={(value) => updateTarefaStatus(tarefa.id, value)}
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tarefaStatusOptions.map((option) => (
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
                    {tarefa.status !== "em_andamento" && tarefa.status !== "concluida" && (
                      <Button
                        className="flex-1"
                        onClick={() => updateTarefaStatus(tarefa.id, "em_andamento")}
                        disabled={updating}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    )}
                    {tarefa.status !== "concluida" && (
                      <Button
                        variant={tarefa.status === "em_andamento" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => updateTarefaStatus(tarefa.id, "concluida")}
                        disabled={updating}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </>
  );
}
