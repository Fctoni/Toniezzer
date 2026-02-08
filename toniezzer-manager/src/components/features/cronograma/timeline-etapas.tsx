"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreVertical,
  Link2,
  ChevronDown,
  ChevronRight,
  ListTodo,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
// import { TarefasList } from "./tarefas-list"; // TODO: Atualizar para 3 níveis (subetapas)
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
}

interface Dependencia {
  id: string;
  etapa_id: string;
  depende_de_etapa_id: string;
  tipo: string;
}

interface User {
  id: string;
  nome_completo: string;
}

interface TimelineEtapasProps {
  etapas: Etapa[];
  dependencias: Dependencia[];
  users: User[];
  onRefresh?: () => void;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; bgColor: string }
> = {
  nao_iniciada: {
    label: "Não Iniciada",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: <Clock className="h-4 w-4" />,
  },
  em_andamento: {
    label: "Em Andamento",
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    icon: <Play className="h-4 w-4" />,
  },
  aguardando_aprovacao: {
    label: "Aguardando Aprovação",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
    icon: <Clock className="h-4 w-4" />,
  },
  aguardando_qualidade: {
    label: "Aguardando Qualidade",
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  em_retrabalho: {
    label: "Em Retrabalho",
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  pausada: {
    label: "Pausada",
    color: "text-gray-500",
    bgColor: "bg-gray-500/20",
    icon: <Pause className="h-4 w-4" />,
  },
  atrasada: {
    label: "Atrasada",
    color: "text-red-500",
    bgColor: "bg-red-500/20",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  concluida: {
    label: "Concluída",
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

export function TimelineEtapas({ etapas, dependencias, users, onRefresh }: TimelineEtapasProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());

  const toggleExpanded = (etapaId: string) => {
    const newExpanded = new Set(expandedEtapas);
    if (newExpanded.has(etapaId)) {
      newExpanded.delete(etapaId);
    } else {
      newExpanded.add(etapaId);
    }
    setExpandedEtapas(newExpanded);
  };

  const updateStatus = async (etapaId: string, novoStatus: string) => {
    setUpdating(etapaId);
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { status: novoStatus };

      if (novoStatus === "em_andamento") {
        updates.data_inicio_real = formatDateToString(new Date());
      } else if (novoStatus === "concluida") {
        updates.data_fim_real = formatDateToString(new Date());
        updates.progresso_percentual = 100;
      }

      const { error } = await supabase
        .from("etapas")
        .update(updates)
        .eq("id", etapaId);

      if (error) throw error;

      toast.success("Status atualizado!");
      
      // Notificar o parent ou fazer refresh da página
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdating(null);
    }
  };

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(parseDateString(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getDependencias = (etapaId: string) => {
    return dependencias
      .filter((d) => d.etapa_id === etapaId)
      .map((d) => {
        const etapaDep = etapas.find((e) => e.id === d.depende_de_etapa_id);
        return { ...d, etapa: etapaDep };
      });
  };

  const calcularProgressoTarefas = (tarefas: Tarefa[]) => {
    if (tarefas.length === 0) return null;
    const concluidas = tarefas.filter(t => t.status === "concluida").length;
    return Math.round((concluidas / tarefas.length) * 100);
  };

  if (etapas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">Nenhuma etapa cadastrada</p>
        <p className="text-sm text-muted-foreground">
          Clique em "Nova Etapa" para começar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {etapas.map((etapa, index) => {
        const config = statusConfig[etapa.status] || statusConfig.nao_iniciada;
        const deps = getDependencias(etapa.id);
        const isExpanded = expandedEtapas.has(etapa.id);
        const tarefasConcluidas = etapa.tarefas.filter(t => t.status === "concluida").length;
        const progressoTarefas = calcularProgressoTarefas(etapa.tarefas);

        return (
          <Collapsible
            key={etapa.id}
            open={isExpanded}
            onOpenChange={() => toggleExpanded(etapa.id)}
          >
            <div
              className="relative rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              {/* Timeline Line */}
              {index < etapas.length - 1 && (
                <div className="absolute left-8 top-16 w-0.5 h-[calc(100%-2rem)] bg-border" />
              )}

              {/* Main Content */}
              <div className="flex gap-4 p-4">
                {/* Status Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor} ${config.color}`}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Expand/Collapse Button */}
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -ml-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <div>
                        <h3 className="font-semibold">{etapa.nome}</h3>
                        {etapa.descricao && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {etapa.descricao}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Tasks Counter Badge */}
                      {etapa.tarefas.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <ListTodo className="h-3 w-3" />
                          {tarefasConcluidas}/{etapa.tarefas.length}
                        </Badge>
                      )}
                      
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={updating === etapa.id}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {etapa.status === "nao_iniciada" && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(etapa.id, "em_andamento")}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Iniciar Etapa
                            </DropdownMenuItem>
                          )}
                          {etapa.status === "em_andamento" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus(etapa.id, "aguardando_aprovacao")
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Solicitar Conclusão
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(etapa.id, "pausada")}
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                Pausar
                              </DropdownMenuItem>
                            </>
                          )}
                          {etapa.status === "aguardando_aprovacao" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus(etapa.id, "aguardando_qualidade")
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(etapa.id, "em_retrabalho")}
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Reprovar
                              </DropdownMenuItem>
                            </>
                          )}
                          {etapa.status === "aguardando_qualidade" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => updateStatus(etapa.id, "concluida")}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Concluir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(etapa.id, "em_retrabalho")}
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Reprovar Qualidade
                              </DropdownMenuItem>
                            </>
                          )}
                          {(etapa.status === "pausada" ||
                            etapa.status === "em_retrabalho") && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(etapa.id, "em_andamento")}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Retomar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex-1">
                      <Progress 
                        value={progressoTarefas !== null ? progressoTarefas : etapa.progresso_percentual} 
                        className="h-2" 
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {progressoTarefas !== null ? progressoTarefas : etapa.progresso_percentual}%
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {/* Responsável */}
                    {etapa.responsavel && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(etapa.responsavel.nome_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{etapa.responsavel.nome_completo}</span>
                      </div>
                    )}

                    {/* Datas */}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDate(etapa.data_inicio_prevista)} -{" "}
                        {formatDate(etapa.data_fim_prevista)}
                      </span>
                    </div>

                    {/* Dependências */}
                    {deps.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Link2 className="h-4 w-4" />
                        <span>
                          Depende de: {deps.map((d) => d.etapa?.nome).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TODO: Atualizar para mostrar subetapas ao invés de tarefas */}
              <CollapsibleContent>
                <div className="border-t p-4 text-sm text-muted-foreground">
                  Visualização de subetapas/tarefas em desenvolvimento
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
