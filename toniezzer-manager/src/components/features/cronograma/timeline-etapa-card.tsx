"use client";

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
import { SubetapasList } from "@/components/features/cronograma/subetapas-list";
import { parseDateString } from "@/lib/utils";
import type { Etapa, User } from "@/components/features/cronograma/cronograma-config";

// --- Tipos locais ---

interface DependenciaResolvida {
  id: string;
  etapa_id: string;
  depende_de_etapa_id: string;
  tipo: string;
  etapa: Etapa | undefined;
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

// --- Props ---

export interface TimelineEtapaCardProps {
  etapa: Etapa;
  isExpanded: boolean;
  isUpdating: boolean;
  isLastItem: boolean;
  dependencias: DependenciaResolvida[];
  users: User[];
  onToggle: () => void;
  onStatusUpdate: (etapaId: string, novoStatus: string) => void;
  onRefresh?: () => void;
}

// --- Helpers locais ---

function getInitials(nome: string): string {
  return nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function formatDateLocal(date: string | null): string {
  if (!date) return "-";
  return format(parseDateString(date), "dd/MM/yyyy", { locale: ptBR });
}

function calcularProgressoSubetapas(subetapas: Etapa["subetapas"]): number | null {
  if (subetapas.length === 0) return null;
  const concluidas = subetapas.filter((s) => s.status === "concluida").length;
  return Math.round((concluidas / subetapas.length) * 100);
}

// --- Componente ---

export function TimelineEtapaCard({
  etapa,
  isExpanded,
  isUpdating,
  isLastItem,
  dependencias,
  users,
  onToggle,
  onStatusUpdate,
  onRefresh,
}: TimelineEtapaCardProps) {
  const config = statusConfig[etapa.status] || statusConfig.nao_iniciada;
  const subetapasConcluidas = etapa.subetapas.filter(
    (s) => s.status === "concluida"
  ).length;
  const progressoSubetapas = calcularProgressoSubetapas(etapa.subetapas);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="relative rounded-lg border bg-card hover:bg-muted/30 transition-colors">
        {/* Timeline Line */}
        {!isLastItem && (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -ml-1"
                  >
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
                {/* Subetapas Counter Badge */}
                {etapa.subetapas.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <ListTodo className="h-3 w-3" />
                    {subetapasConcluidas}/{etapa.subetapas.length}
                  </Badge>
                )}

                <Badge variant="outline" className={config.color}>
                  {config.label}
                </Badge>

                {/* Status Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isUpdating}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {etapa.status === "nao_iniciada" && (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(etapa.id, "em_andamento")
                        }
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar Etapa
                      </DropdownMenuItem>
                    )}
                    {etapa.status === "em_andamento" && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusUpdate(etapa.id, "aguardando_aprovacao")
                          }
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Solicitar Conclusão
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusUpdate(etapa.id, "pausada")
                          }
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
                            onStatusUpdate(etapa.id, "aguardando_qualidade")
                          }
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Aprovar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusUpdate(etapa.id, "em_retrabalho")
                          }
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Reprovar
                        </DropdownMenuItem>
                      </>
                    )}
                    {etapa.status === "aguardando_qualidade" && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusUpdate(etapa.id, "concluida")
                          }
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Concluir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusUpdate(etapa.id, "em_retrabalho")
                          }
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Reprovar Qualidade
                        </DropdownMenuItem>
                      </>
                    )}
                    {(etapa.status === "pausada" ||
                      etapa.status === "em_retrabalho") && (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(etapa.id, "em_andamento")
                        }
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
                  value={
                    progressoSubetapas !== null
                      ? progressoSubetapas
                      : etapa.progresso_percentual
                  }
                  className="h-2"
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {progressoSubetapas !== null
                  ? progressoSubetapas
                  : etapa.progresso_percentual}
                %
              </span>
            </div>

            {/* Meta Info */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {/* Responsavel */}
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
                  {formatDateLocal(etapa.data_inicio_prevista)} -{" "}
                  {formatDateLocal(etapa.data_fim_prevista)}
                </span>
              </div>

              {/* Dependencias */}
              {dependencias.length > 0 && (
                <div className="flex items-center gap-1">
                  <Link2 className="h-4 w-4" />
                  <span>
                    Depende de:{" "}
                    {dependencias.map((d) => d.etapa?.nome).join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subetapas List (Collapsible) */}
        <CollapsibleContent>
          <div className="border-t">
            <SubetapasList
              subetapas={etapa.subetapas}
              etapaId={etapa.id}
              etapaNome={etapa.nome}
              users={users}
              onRefresh={onRefresh}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
