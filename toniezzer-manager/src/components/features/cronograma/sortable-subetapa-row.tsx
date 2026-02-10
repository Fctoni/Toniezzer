"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import { ChevronDown, ChevronRight, Plus, GripVertical, Pencil } from "lucide-react";
import { cn, formatDateToString } from "@/lib/utils";
import { calcularProgressoSubetapa } from "@/lib/services/subetapas";
import { NovaTarefaDialog } from "@/components/features/tarefas/nova-tarefa-dialog";
import { SortableTarefaRow } from "./sortable-tarefa-row";
import {
  type Tarefa,
  type Subetapa,
  type User,
  subetapaStatusOptions,
  gridCols,
  formatDate,
  parseDate,
  getStatusConfig,
} from "./cronograma-config";

interface SortableSubetapaRowProps {
  subetapa: Subetapa;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  users: User[];
  updating: string | null;
  onUpdateSubetapa: (subetapaId: string, field: string, value: string | null) => void;
  onUpdateTarefa: (tarefaId: string, field: string, value: string | null) => void;
  onReorderTarefas: (subetapaId: string, tarefas: Tarefa[]) => void;
  onEditSubetapa: (subetapa: Subetapa) => void;
  subetapasOptions: { id: string; nome: string; etapa_nome: string }[];
  onTarefaCreated: () => void;
}

export function SortableSubetapaRow({
  subetapa,
  isLast,
  isExpanded,
  onToggleExpand,
  users,
  updating,
  onUpdateSubetapa,
  onUpdateTarefa,
  onReorderTarefas,
  onEditSubetapa,
  subetapasOptions,
  onTarefaCreated,
}: SortableSubetapaRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subetapa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasTarefas = subetapa.tarefas.length > 0;
  const subetapaStatus = getStatusConfig(subetapa.status, subetapaStatusOptions);
  const progresso = calcularProgressoSubetapa(subetapa);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleTarefaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = subetapa.tarefas.findIndex((t) => t.id === active.id);
      const newIndex = subetapa.tarefas.findIndex((t) => t.id === over.id);
      const newTarefas = arrayMove(subetapa.tarefas, oldIndex, newIndex);
      onReorderTarefas(subetapa.id, newTarefas);
    }
  };

  return (
    <>
      {/* Linha da Subetapa */}
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "grid items-center border-b group bg-muted/20 hover:bg-muted/40",
          gridCols,
          updating === subetapa.id && "opacity-50",
          isDragging && "opacity-50 bg-muted z-10"
        )}
      >
        {/* Expand/Collapse */}
        <div className="p-0 pl-2 flex items-center justify-center">
          {hasTarefas ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-5" />
          )}
        </div>

        {/* Drag Handle + Tree indicator */}
        <div className="p-0 pl-1 flex items-center gap-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground" />
          </button>
          <span className="text-muted-foreground/50 text-xs">
            {isLast ? "\u2514" : "\u251C"}
          </span>
        </div>

        {/* Nome - Clicável para editar */}
        <div className="p-1 pl-1">
          <button
            onClick={() => onEditSubetapa(subetapa)}
            className="flex items-center gap-2 text-sm hover:text-primary transition-colors text-left"
          >
            {subetapa.nome}
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
          </button>
          {hasTarefas && (
            <span className="text-[10px] text-muted-foreground ml-1">
              ({subetapa.tarefas.filter((t) => t.status === "concluida").length}/{subetapa.tarefas.length})
            </span>
          )}
        </div>

        {/* Status */}
        <div className="p-1">
          <Select
            value={subetapa.status}
            onValueChange={(value) => onUpdateSubetapa(subetapa.id, "status", value)}
          >
            <SelectTrigger className="h-7 border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
              <div className={cn("flex items-center gap-2", subetapaStatus.color)}>
                <subetapaStatus.icon className="h-3 w-3" />
                <span className="text-xs">{subetapaStatus.label}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {subetapaStatusOptions.map((option) => (
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

        {/* Data Início */}
        <div className="p-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-7 px-2 text-xs font-normal justify-start hover:bg-muted/50"
              >
                {formatDate(subetapa.data_inicio_prevista)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseDate(subetapa.data_inicio_prevista)}
                onSelect={(date) =>
                  onUpdateSubetapa(
                    subetapa.id,
                    "data_inicio_prevista",
                    date ? formatDateToString(date) : null
                  )
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data Fim */}
        <div className="p-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-7 px-2 text-xs font-normal justify-start hover:bg-muted/50"
              >
                {formatDate(subetapa.data_fim_prevista)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseDate(subetapa.data_fim_prevista)}
                onSelect={(date) =>
                  onUpdateSubetapa(
                    subetapa.id,
                    "data_fim_prevista",
                    date ? formatDateToString(date) : null
                  )
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Responsável */}
        <div className="p-1">
          <Select
            value={subetapa.responsavel_id || "none"}
            onValueChange={(value) =>
              onUpdateSubetapa(subetapa.id, "responsavel_id", value === "none" ? null : value)
            }
          >
            <SelectTrigger className="h-7 border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
              <span className="text-xs truncate">
                {users.find((u) => u.id === subetapa.responsavel_id)?.nome_completo || "-"}
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

        {/* Orçamento (vazio para subetapas) */}
        <div className="p-2"></div>

        {/* Gasto (vazio para subetapas) */}
        <div className="p-2"></div>

        {/* Progresso */}
        <div className="text-right pr-4">
          <span
            className={cn(
              "text-xs font-medium",
              progresso === 100 && "text-green-500",
              progresso > 0 && progresso < 100 && "text-blue-500"
            )}
          >
            {progresso}%
          </span>
        </div>

        <div className="p-1"></div>
      </div>

      {/* Linhas das Tarefas */}
      {isExpanded && subetapa.tarefas.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTarefaDragEnd}
        >
          <SortableContext
            items={subetapa.tarefas.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {subetapa.tarefas.map((tarefa, idx) => (
              <SortableTarefaRow
                key={tarefa.id}
                tarefa={tarefa}
                isLast={idx === subetapa.tarefas.length - 1}
                users={users}
                updating={updating}
                onUpdateTarefa={onUpdateTarefa}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* + Nova Tarefa */}
      {isExpanded && (
        <div className={cn("grid items-center border-b", gridCols)}>
          <div />
          <div />
          <div className="p-1 pl-4">
            <NovaTarefaDialog
              users={users}
              subetapas={subetapasOptions}
              defaultSubetapaId={subetapa.id}
              proximaOrdem={subetapa.tarefas.length + 1}
              onSuccess={onTarefaCreated}
              trigger={
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-0.5">
                  <Plus className="h-3 w-3" />
                  Nova Tarefa
                </button>
              }
            />
          </div>
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      )}
    </>
  );
}
