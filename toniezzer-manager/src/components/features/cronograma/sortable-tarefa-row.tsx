"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { GripVertical, Check } from "lucide-react";
import { cn, formatDateToString } from "@/lib/utils";
import {
  type Tarefa,
  type User,
  tarefaStatusOptions,
  prioridadeConfig,
  gridCols,
  formatDate,
  parseDate,
  getStatusConfig,
} from "./cronograma-config";

interface SortableTarefaRowProps {
  tarefa: Tarefa;
  isLast: boolean;
  users: User[];
  updating: string | null;
  onUpdateTarefa: (tarefaId: string, field: string, value: string | null) => void;
}

export function SortableTarefaRow({
  tarefa,
  isLast,
  users,
  updating,
  onUpdateTarefa,
}: SortableTarefaRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tarefaStatus = getStatusConfig(tarefa.status, tarefaStatusOptions);
  const prioridade = prioridadeConfig[tarefa.prioridade || "media"];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid items-center border-b group bg-muted/10 hover:bg-muted/30",
        gridCols,
        updating === tarefa.id && "opacity-50",
        isDragging && "opacity-50 bg-muted z-10"
      )}
    >
      {/* Empty for align */}
      <div className="p-0"></div>

      {/* Drag handle + Tree indicator (deeper indent) */}
      <div className="p-0 pl-1 flex items-center gap-0.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground" />
        </button>
        <span className="text-muted-foreground/30 text-[10px] ml-2">
          {isLast ? "└" : "├"}
        </span>
      </div>

      {/* Nome - clicável para detalhes */}
      <div className="p-1 pl-4">
        <a
          href={`/tarefas/${tarefa.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "text-xs hover:text-primary hover:underline transition-colors",
            tarefa.status === "concluida" && "line-through text-muted-foreground"
          )}
        >
          {tarefa.nome}
        </a>
      </div>

      {/* Status */}
      <div className="p-1">
        <Select
          value={tarefa.status}
          onValueChange={(value) => onUpdateTarefa(tarefa.id, "status", value)}
        >
          <SelectTrigger className="h-7 border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
            <div className={cn("flex items-center gap-2", tarefaStatus.color)}>
              <tarefaStatus.icon className="h-3 w-3" />
              <span className="text-[11px]">{tarefaStatus.label}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {tarefaStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className={cn("flex items-center gap-2", option.color)}>
                  <option.icon className="h-3 w-3" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Prevista */}
      <div className="p-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-7 px-2 text-xs font-normal justify-start hover:bg-muted/50"
            >
              {formatDate(tarefa.data_prevista)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseDate(tarefa.data_prevista)}
              onSelect={(date) =>
                onUpdateTarefa(
                  tarefa.id,
                  "data_prevista",
                  date ? formatDateToString(date) : null
                )
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Empty (fim) */}
      <div className="p-1">
        <span className="text-xs text-muted-foreground/50 px-2">-</span>
      </div>

      {/* Responsável */}
      <div className="p-1">
        <Select
          value={tarefa.responsavel_id || "none"}
          onValueChange={(value) =>
            onUpdateTarefa(tarefa.id, "responsavel_id", value === "none" ? null : value)
          }
        >
          <SelectTrigger className="h-7 border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
            <span className="text-xs truncate">
              {users.find((u) => u.id === tarefa.responsavel_id)?.nome_completo || "-"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.nome_completo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Prioridade (em vez de Orçamento) */}
      <div className="p-2 text-right">
        <span className={cn("text-[10px] font-medium", prioridade?.color)}>
          {prioridade?.label || "-"}
        </span>
      </div>

      {/* Empty (gasto) */}
      <div className="p-2"></div>

      {/* Progresso (checkbox) */}
      <div className="text-right pr-4 flex items-center justify-end">
        {tarefa.status === "concluida" ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>

      <div></div>
    </div>
  );
}
