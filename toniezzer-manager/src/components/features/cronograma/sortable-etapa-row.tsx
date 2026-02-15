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
import { ChevronDown, ChevronRight, Plus, GripVertical, Pencil } from "lucide-react";
import { cn, formatDateToString } from "@/lib/utils";
import { calculateStageProgress, calculateStageDates } from "@/lib/services/etapas";
import { NewSubstageDialog } from "./new-substage-dialog";
import { SortableSubetapaRow } from "./sortable-subetapa-row";
import {
  type Tarefa,
  type Subetapa,
  type Etapa,
  type User,
  statusOptions,
  gridCols,
  formatDate,
  getStatusConfig,
  formatCurrency,
} from "./cronograma-config";

interface SortableEtapaRowProps {
  etapa: Etapa;
  isExpanded: boolean;
  expandedSubetapas: Set<string>;
  onToggleExpand: () => void;
  onToggleSubetapaExpand: (subetapaId: string) => void;
  users: User[];
  updating: string | null;
  onUpdateEtapa: (etapaId: string, field: string, value: string | null) => void;
  onUpdateSubetapa: (subetapaId: string, field: string, value: string | null) => void;
  onUpdateTarefa: (tarefaId: string, field: string, value: string | null) => void;
  onReorderSubetapas: (etapaId: string, subetapas: Subetapa[]) => void;
  onReorderTarefas: (subetapaId: string, tarefas: Tarefa[]) => void;
  onEditEtapa: (etapa: Etapa) => void;
  onEditSubetapa: (subetapa: Subetapa) => void;
  onSubetapaCreated: (etapaId?: string) => void;
  subetapasOptions: { id: string; nome: string; etapa_nome: string }[];
  onTarefaCreated: () => void;
}

export function SortableEtapaRow({
  etapa,
  isExpanded,
  expandedSubetapas,
  onToggleExpand,
  onToggleSubetapaExpand,
  users,
  updating,
  onUpdateEtapa,
  onUpdateSubetapa,
  onUpdateTarefa,
  onReorderSubetapas,
  onReorderTarefas,
  onEditEtapa,
  onEditSubetapa,
  onSubetapaCreated,
  subetapasOptions,
  onTarefaCreated,
}: SortableEtapaRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: etapa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasSubetapas = etapa.subetapas.length > 0;
  const statusConfig = getStatusConfig(etapa.status);
  const progresso = calculateStageProgress(etapa);

  const orcamento = Number(etapa.orcamento) || 0;
  const gastoRealizado = etapa.gasto_realizado || 0;
  const percentualOrcamento = orcamento > 0 ? (gastoRealizado / orcamento) * 100 : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSubetapaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = etapa.subetapas.findIndex((s) => s.id === active.id);
      const newIndex = etapa.subetapas.findIndex((s) => s.id === over.id);
      const newSubetapas = arrayMove(etapa.subetapas, oldIndex, newIndex);
      onReorderSubetapas(etapa.id, newSubetapas);
    }
  };

  return (
    <>
      {/* Linha da Etapa */}
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "grid items-center border-b group font-medium bg-background hover:bg-muted/30",
          gridCols,
          updating === etapa.id && "opacity-50",
          isDragging && "opacity-50 bg-muted z-10"
        )}
      >
        {/* Expand/Collapse */}
        <div className="p-0 pl-2 flex items-center justify-center">
          {hasSubetapas ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Drag Handle */}
        <div className="p-0 flex items-center justify-center">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground" />
          </button>
        </div>

        {/* Nome */}
        <div className="p-2">
          <button
            onClick={() => onEditEtapa(etapa)}
            className="flex items-center gap-2 font-semibold hover:text-primary transition-colors text-left"
          >
            {etapa.nome}
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
          </button>
        </div>

        {/* Status */}
        <div className="p-1">
          <Select
            value={etapa.status}
            onValueChange={(value) => onUpdateEtapa(etapa.id, "status", value)}
          >
            <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
              <div className={cn("flex items-center gap-2", statusConfig.color)}>
                <statusConfig.icon className="h-3.5 w-3.5" />
                <span className="text-xs">{statusConfig.label}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className={cn("flex items-center gap-2", option.color)}>
                    <option.icon className="h-3.5 w-3.5" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Início - Calculada das subetapas */}
        <div className="p-1">
          <div className="h-8 px-2 text-xs font-normal flex items-center text-muted-foreground">
            {formatDate(calculateStageDates(etapa.subetapas).inicio)}
          </div>
        </div>

        {/* Data Fim - Calculada das subetapas */}
        <div className="p-1">
          <div className="h-8 px-2 text-xs font-normal flex items-center text-muted-foreground">
            {formatDate(calculateStageDates(etapa.subetapas).fim)}
          </div>
        </div>

        {/* Responsável */}
        <div className="p-1">
          <Select
            value={etapa.responsavel_id || "none"}
            onValueChange={(value) =>
              onUpdateEtapa(etapa.id, "responsavel_id", value === "none" ? null : value)
            }
          >
            <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
              <span className="text-xs truncate">
                {etapa.responsavel?.nome_completo || "-"}
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

        {/* Orçamento */}
        <div className="p-2 text-right">
          <span className="text-xs font-medium text-muted-foreground">
            {orcamento > 0 ? formatCurrency(orcamento) : "-"}
          </span>
        </div>

        {/* Gasto */}
        <div className="p-2 text-right">
          <div className="flex flex-col items-end">
            <span
              className={cn(
                "text-xs font-medium",
                percentualOrcamento >= 100 && "text-destructive",
                percentualOrcamento >= 80 && percentualOrcamento < 100 && "text-yellow-500",
                percentualOrcamento < 80 && gastoRealizado > 0 && "text-green-500"
              )}
            >
              {gastoRealizado > 0 ? formatCurrency(gastoRealizado) : "-"}
            </span>
            {orcamento > 0 && gastoRealizado > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {percentualOrcamento.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

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

        {/* Add Subetapa Button */}
        <div className="p-1 flex items-center justify-center">
          <NewSubstageDialog
            etapaId={etapa.id}
            etapaNome={etapa.nome}
            users={users}
            proximaOrdem={etapa.subetapas.length + 1}
            onSuccess={() => onSubetapaCreated(etapa.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
              >
                <Plus className="h-3 w-3" />
              </Button>
            }
          />
        </div>
      </div>

      {/* Linhas das Subetapas */}
      {isExpanded && etapa.subetapas.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSubetapaDragEnd}
        >
          <SortableContext
            items={etapa.subetapas.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {etapa.subetapas.map((subetapa, idx) => (
              <SortableSubetapaRow
                key={subetapa.id}
                subetapa={subetapa}
                isLast={idx === etapa.subetapas.length - 1}
                isExpanded={expandedSubetapas.has(subetapa.id)}
                onToggleExpand={() => onToggleSubetapaExpand(subetapa.id)}
                users={users}
                updating={updating}
                onUpdateSubetapa={onUpdateSubetapa}
                onUpdateTarefa={onUpdateTarefa}
                onReorderTarefas={onReorderTarefas}
                onEditSubetapa={onEditSubetapa}
                subetapasOptions={subetapasOptions}
                onTarefaCreated={onTarefaCreated}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </>
  );
}
