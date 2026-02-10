"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronRight,
  ListTodo,
  Flag,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NovaTarefaDialog } from "@/components/features/tarefas/nova-tarefa-dialog";
import {
  type Subetapa,
  type Tarefa,
  type User,
  subetapaStatusOptions,
  tarefaStatusOptions,
  prioridadeConfig,
  getStatusConfig,
} from "@/components/features/cronograma/cronograma-config";
import type { SelectedItem } from "@/components/features/cronograma/cronograma-mobile-sheet";

// --- Tipos ---

interface SubetapaOption {
  id: string;
  nome: string;
  etapa_nome: string;
}

interface CronogramaMobileRowProps {
  subetapa: Subetapa;
  etapaNome: string;
  isExpanded: boolean;
  users: User[];
  subetapasOptions: SubetapaOption[];
  onToggle: (subetapaId: string) => void;
  onSelect: (item: SelectedItem) => void;
}

// --- Helpers ---

function calcularProgressoSubetapa(subetapa: Subetapa) {
  if (subetapa.tarefas.length === 0) return subetapa.progresso_percentual || 0;
  const concluidas = subetapa.tarefas.filter(
    (t) => t.status === "concluida"
  ).length;
  return Math.round((concluidas / subetapa.tarefas.length) * 100);
}

// --- Componente de linha de tarefa ---

function TarefaRow({ tarefa }: { tarefa: Tarefa }) {
  const tConfig = getStatusConfig(tarefa.status, tarefaStatusOptions);
  const TIcon = tConfig.icon;
  const prio = tarefa.prioridade ? prioridadeConfig[tarefa.prioridade] : null;

  return (
    <a
      href={`/tarefas/${tarefa.id}`}
      className={cn(
        "w-full flex items-center gap-2 p-1.5 rounded text-left hover:bg-muted/50 transition-colors",
        tarefa.status === "concluida" && "opacity-60"
      )}
    >
      <span className="text-muted-foreground/50 text-[10px]">{"├"}</span>
      <TIcon className={cn("h-3 w-3 shrink-0", tConfig.color)} />
      <span
        className={cn(
          "text-sm flex-1 truncate",
          tarefa.status === "concluida" && "line-through"
        )}
      >
        {tarefa.nome}
      </span>
      {prio && <Flag className={cn("h-3 w-3 shrink-0", prio.color)} />}
    </a>
  );
}

// --- Componente principal ---

export function CronogramaMobileRow({
  subetapa,
  etapaNome,
  isExpanded,
  users,
  subetapasOptions,
  onToggle,
  onSelect,
}: CronogramaMobileRowProps) {
  const subConfig = getStatusConfig(subetapa.status, subetapaStatusOptions);
  const SubIcon = subConfig.icon;
  const subProgresso = calcularProgressoSubetapa(subetapa);
  const tarefasConcluidas = subetapa.tarefas.filter(
    (t) => t.status === "concluida"
  ).length;

  return (
    <div>
      {/* Header da Subetapa */}
      <button
        onClick={() => onToggle(subetapa.id)}
        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
      >
        {subetapa.tarefas.length > 0 ? (
          isExpanded ? (
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
              subetapa.status === "concluida" &&
                "line-through text-muted-foreground"
            )}
          >
            {subetapa.nome}
          </span>
          {subetapa.tarefas.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Progress
                value={subProgresso}
                className="h-1 flex-1 max-w-[80px]"
              />
              <span className="text-[10px] text-muted-foreground">
                {subProgresso}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {subetapa.tarefas.length > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1 py-0 h-4 gap-0.5"
            >
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
              onSelect({
                type: "subetapa",
                item: subetapa,
                parentName: etapaNome,
              });
            }}
          >
            <SubIcon className={cn("h-3 w-3", subConfig.color)} />
          </Button>
        </div>
      </button>

      {/* Lista de Tarefas + Nova Tarefa */}
      {isExpanded && (
        <div className="ml-6 border-l border-border pl-3 space-y-0.5">
          {subetapa.tarefas.map((tarefa) => (
            <TarefaRow key={tarefa.id} tarefa={tarefa} />
          ))}

          {/* + Nova Tarefa */}
          <NovaTarefaDialog
            users={users}
            subetapas={subetapasOptions}
            defaultSubetapaId={subetapa.id}
            proximaOrdem={subetapa.tarefas.length + 1}
            trigger={
              <button className="w-full flex items-center gap-2 p-1.5 rounded text-left hover:bg-muted/50 transition-colors text-xs text-muted-foreground hover:text-primary">
                <span className="text-muted-foreground/50 text-[10px]">{"└"}</span>
                <Plus className="h-3 w-3" />
                <span>Nova Tarefa</span>
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}
