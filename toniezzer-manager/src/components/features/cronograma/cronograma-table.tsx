"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { buscarEtapas, atualizarEtapa, reordenarEtapas, calcularProgressoEtapa, calcularDatasEtapa } from "@/lib/services/etapas";
import { buscarSubetapas, atualizarSubetapa, reordenarSubetapas, calcularProgressoSubetapa } from "@/lib/services/subetapas";
import { buscarTarefas, atualizarTarefa, reordenarTarefas } from "@/lib/services/tarefas";
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
import {
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  Check,
  Circle,
  Clock,
  AlertTriangle,
  Pause,
  Play,
  Pencil,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatDateToString, parseDateString } from "@/lib/utils";
import { NovaSubetapaDialog } from "./nova-subetapa-dialog";
import { NovaEtapaDialog } from "./nova-etapa-dialog";
import { EditarEtapaDialog } from "./editar-etapa-dialog";
import { EditarSubetapaDialog } from "./editar-subetapa-dialog";
import { NovaTarefaDialog } from "@/components/features/tarefas/nova-tarefa-dialog";

// --- Interfaces ---

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

interface CronogramaTableProps {
  etapas: Etapa[];
  users: User[];
}

// --- Constantes ---

const statusOptions = [
  { value: "nao_iniciada", label: "Não Iniciada", icon: Circle, color: "text-muted-foreground" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "aguardando_aprovacao", label: "Aguardando", icon: Clock, color: "text-yellow-500" },
  { value: "pausada", label: "Pausada", icon: Pause, color: "text-gray-500" },
  { value: "atrasada", label: "Atrasada", icon: AlertTriangle, color: "text-red-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
];

const subetapaStatusOptions = [
  { value: "nao_iniciada", label: "Não Iniciada", icon: Circle, color: "text-muted-foreground" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "pausada", label: "Pausada", icon: Pause, color: "text-gray-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
  { value: "cancelada", label: "Cancelada", icon: AlertTriangle, color: "text-red-500" },
];

const tarefaStatusOptions = [
  { value: "pendente", label: "Pendente", icon: Circle, color: "text-muted-foreground" },
  { value: "bloqueada", label: "Bloqueada", icon: Lock, color: "text-orange-500" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
  { value: "cancelada", label: "Cancelada", icon: AlertTriangle, color: "text-red-500" },
];

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "text-green-500" },
  media: { label: "Média", color: "text-yellow-500" },
  alta: { label: "Alta", color: "text-orange-500" },
  critica: { label: "Crítica", color: "text-red-500" },
};

const gridCols = "grid-cols-[40px_40px_minmax(200px,1fr)_150px_100px_100px_150px_100px_100px_80px_50px]";

// --- Helpers ---

function formatDate(date: string | null) {
  if (!date) return "-";
  return format(parseDateString(date), "dd/MM", { locale: ptBR });
}

function parseDate(date: string | null): Date | undefined {
  if (!date) return undefined;
  return parseDateString(date);
}

function getStatusConfig(status: string, options: typeof statusOptions = statusOptions) {
  return options.find((s) => s.value === status) || options[0];
}

// calcularProgressoEtapa, calcularProgressoSubetapa e calcularDatasEtapa
// agora são importados de @/lib/services/etapas e @/lib/services/subetapas

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value);

// --- Componente: Linha de Tarefa Arrastável ---

function SortableTarefaRow({
  tarefa,
  isLast,
  users,
  updating,
  onUpdateTarefa,
}: {
  tarefa: Tarefa;
  isLast: boolean;
  users: User[];
  updating: string | null;
  onUpdateTarefa: (tarefaId: string, field: string, value: string | null) => void;
}) {
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

// --- Componente: Linha de Subetapa Arrastável ---

function SortableSubetapaRow({
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
}: {
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
}) {
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
            {isLast ? "└" : "├"}
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

// --- Componente: Linha de Etapa Arrastável ---

function SortableEtapaRow({
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
}: {
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
}) {
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
  const progresso = calcularProgressoEtapa(etapa);

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
            {formatDate(calcularDatasEtapa(etapa.subetapas).inicio)}
          </div>
        </div>

        {/* Data Fim - Calculada das subetapas */}
        <div className="p-1">
          <div className="h-8 px-2 text-xs font-normal flex items-center text-muted-foreground">
            {formatDate(calcularDatasEtapa(etapa.subetapas).fim)}
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
          <NovaSubetapaDialog
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

// --- Componente Principal ---

export function CronogramaTable({ etapas: initialEtapas, users }: CronogramaTableProps) {
  const router = useRouter();
  const [etapas, setEtapas] = useState(initialEtapas);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(
    new Set(initialEtapas.map((e) => e.id))
  );
  const [expandedSubetapas, setExpandedSubetapas] = useState<Set<string>>(
    new Set(initialEtapas.flatMap((e) => e.subetapas.map((s) => s.id)))
  );
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null);
  const [editingSubetapa, setEditingSubetapa] = useState<Subetapa | null>(null);

  // Recarregar dados do servidor
  const refreshData = async () => {
    const supabase = createClient();

    const [etapasData, subetapasData, tarefasData] = await Promise.all([
      buscarEtapas(supabase),
      buscarSubetapas(supabase),
      buscarTarefas(supabase),
    ]);

    const subetapasComTarefas: Subetapa[] = (subetapasData as unknown as Subetapa[]).map((s) => ({
      ...s,
      tarefas: (tarefasData as Tarefa[]).filter((t) => t.subetapa_id === s.id),
    }));

    const newEtapas: Etapa[] = etapasData.map((e) => ({
      ...e,
      progresso_percentual: e.progresso_percentual ?? 0,
      responsavel: e.responsavel_id
        ? users.find((u) => u.id === e.responsavel_id) || null
        : null,
      subetapas: subetapasComTarefas.filter((s) => s.etapa_id === e.id),
    })) as Etapa[];

    setEtapas(newEtapas);
  };

  const toggleExpanded = (etapaId: string) => {
    const newExpanded = new Set(expandedEtapas);
    if (newExpanded.has(etapaId)) {
      newExpanded.delete(etapaId);
    } else {
      newExpanded.add(etapaId);
    }
    setExpandedEtapas(newExpanded);
  };

  const toggleSubetapaExpanded = (subetapaId: string) => {
    const newExpanded = new Set(expandedSubetapas);
    if (newExpanded.has(subetapaId)) {
      newExpanded.delete(subetapaId);
    } else {
      newExpanded.add(subetapaId);
    }
    setExpandedSubetapas(newExpanded);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Handlers de Drag ---

  const handleEtapaDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = etapas.findIndex((e) => e.id === active.id);
    const newIndex = etapas.findIndex((e) => e.id === over.id);
    const newEtapas = arrayMove(etapas, oldIndex, newIndex);

    setEtapas(newEtapas);

    const supabase = createClient();
    try {
      await reordenarEtapas(
        supabase,
        newEtapas.map((e, i) => ({ id: e.id, ordem: i + 1 }))
      );
      toast.success("Ordem atualizada!");
    } catch {
      toast.error("Erro ao reordenar");
      setEtapas(initialEtapas);
    }
  };

  const handleReorderSubetapas = async (etapaId: string, newSubetapas: Subetapa[]) => {
    setEtapas((prev) =>
      prev.map((e) => (e.id === etapaId ? { ...e, subetapas: newSubetapas } : e))
    );

    const supabase = createClient();
    try {
      await reordenarSubetapas(
        supabase,
        newSubetapas.map((s, i) => ({ id: s.id, ordem: i + 1 }))
      );
      toast.success("Ordem atualizada!");
    } catch {
      toast.error("Erro ao reordenar subetapas");
      router.refresh();
    }
  };

  const handleReorderTarefas = async (subetapaId: string, newTarefas: Tarefa[]) => {
    setEtapas((prev) =>
      prev.map((e) => ({
        ...e,
        subetapas: e.subetapas.map((s) =>
          s.id === subetapaId ? { ...s, tarefas: newTarefas } : s
        ),
      }))
    );

    const supabase = createClient();
    try {
      await reordenarTarefas(
        supabase,
        newTarefas.map((t, i) => ({ id: t.id, ordem: i + 1 }))
      );
      toast.success("Ordem atualizada!");
    } catch {
      toast.error("Erro ao reordenar tarefas");
      router.refresh();
    }
  };

  // --- Handlers de Update ---

  const updateEtapa = async (etapaId: string, field: string, value: string | null) => {
    setUpdating(etapaId);
    const supabase = createClient();
    const previousEtapas = etapas;

    setEtapas((prev) =>
      prev.map((e) => {
        if (e.id !== etapaId) return e;
        const updated = { ...e, [field]: value };
        if (field === "responsavel_id") {
          updated.responsavel = value ? users.find((u) => u.id === value) || null : null;
        }
        if (field === "status") {
          if (value === "em_andamento") updated.data_inicio_real = formatDateToString(new Date());
          else if (value === "concluida") {
            updated.data_fim_real = formatDateToString(new Date());
            updated.progresso_percentual = 100;
          }
        }
        return updated;
      })
    );

    try {
      await atualizarEtapa(supabase, etapaId, { [field]: value });
      toast.success("Atualizado!");
    } catch {
      toast.error("Erro ao atualizar");
      setEtapas(previousEtapas);
    } finally {
      setUpdating(null);
    }
  };

  const updateSubetapa = async (subetapaId: string, field: string, value: string | null) => {
    setUpdating(subetapaId);
    const supabase = createClient();
    const previousEtapas = etapas;

    setEtapas((prev) =>
      prev.map((e) => ({
        ...e,
        subetapas: e.subetapas.map((s) => {
          if (s.id !== subetapaId) return s;
          const updated = { ...s, [field]: value };
          if (field === "status") {
            if (value === "em_andamento")
              updated.data_inicio_real = new Date().toISOString().split("T")[0];
            else if (value === "concluida")
              updated.data_fim_real = new Date().toISOString().split("T")[0];
          }
          return updated;
        }),
      }))
    );

    try {
      await atualizarSubetapa(supabase, subetapaId, { [field]: value });
      toast.success("Atualizado!");
    } catch {
      toast.error("Erro ao atualizar");
      setEtapas(previousEtapas);
    } finally {
      setUpdating(null);
    }
  };

  const updateTarefa = async (tarefaId: string, field: string, value: string | null) => {
    setUpdating(tarefaId);
    const supabase = createClient();
    const previousEtapas = etapas;

    setEtapas((prev) =>
      prev.map((e) => ({
        ...e,
        subetapas: e.subetapas.map((s) => ({
          ...s,
          tarefas: s.tarefas.map((t) => {
            if (t.id !== tarefaId) return t;
            const updated = { ...t, [field]: value };
            if (field === "status") {
              if (value === "em_andamento")
                updated.data_inicio_real = new Date().toISOString();
              else if (value === "concluida")
                updated.data_conclusao_real = new Date().toISOString();
            }
            return updated;
          }),
        })),
      }))
    );

    try {
      await atualizarTarefa(supabase, tarefaId, { [field]: value });
      toast.success("Atualizado!");
    } catch {
      toast.error("Erro ao atualizar");
      setEtapas(previousEtapas);
    } finally {
      setUpdating(null);
    }
  };

  // --- Handlers de Edição Dialog ---

  const handleEtapaUpdated = (updatedEtapa: Partial<Etapa> & { id: string }) => {
    setEtapas((prev) =>
      prev.map((e) => {
        if (e.id !== updatedEtapa.id) return e;
        return {
          ...e,
          ...updatedEtapa,
          responsavel: updatedEtapa.responsavel_id
            ? users.find((u) => u.id === updatedEtapa.responsavel_id) || null
            : null,
        };
      })
    );
    setEditingEtapa(null);
  };

  const handleEtapaDeleted = (etapaId: string) => {
    setEtapas((prev) => prev.filter((e) => e.id !== etapaId));
    setEditingEtapa(null);
  };

  const handleSubetapaUpdated = (updatedSubetapa: Partial<Subetapa> & { id: string }) => {
    setEtapas((prev) =>
      prev.map((e) => ({
        ...e,
        subetapas: e.subetapas.map((s) =>
          s.id === updatedSubetapa.id ? { ...s, ...updatedSubetapa } : s
        ),
      }))
    );
    setEditingSubetapa(null);
  };

  const handleSubetapaDeleted = (subetapaId: string) => {
    setEtapas((prev) =>
      prev.map((e) => ({
        ...e,
        subetapas: e.subetapas.filter((s) => s.id !== subetapaId),
      }))
    );
    setEditingSubetapa(null);
  };

  // Construir opções de subetapas para NovaTarefaDialog
  const subetapasOptions = etapas.flatMap((e) =>
    e.subetapas.map((s) => ({
      id: s.id,
      nome: s.nome,
      etapa_nome: e.nome,
    }))
  );

  if (etapas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-muted-foreground mb-4">Nenhuma etapa cadastrada</p>
        <NovaEtapaDialog users={users} etapas={[]} proximaOrdem={1} />
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div
          className={cn(
            "grid items-center bg-muted/50 border-b text-sm font-medium text-muted-foreground",
            gridCols
          )}
        >
          <div className="p-2"></div>
          <div className="p-2"></div>
          <div className="p-2">Nome</div>
          <div className="p-2">Status</div>
          <div className="p-2">Início</div>
          <div className="p-2">Fim</div>
          <div className="p-2">Responsável</div>
          <div className="p-2 text-right">Orçamento</div>
          <div className="p-2 text-right">Gasto</div>
          <div className="p-2 text-right">Progresso</div>
          <div className="p-2"></div>
        </div>

        {/* Body */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleEtapaDragEnd}
        >
          <SortableContext
            items={etapas.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {etapas.map((etapa) => (
              <SortableEtapaRow
                key={etapa.id}
                etapa={etapa}
                isExpanded={expandedEtapas.has(etapa.id)}
                expandedSubetapas={expandedSubetapas}
                onToggleExpand={() => toggleExpanded(etapa.id)}
                onToggleSubetapaExpand={toggleSubetapaExpanded}
                users={users}
                updating={updating}
                onUpdateEtapa={updateEtapa}
                onUpdateSubetapa={updateSubetapa}
                onUpdateTarefa={updateTarefa}
                onReorderSubetapas={handleReorderSubetapas}
                onReorderTarefas={handleReorderTarefas}
                onEditEtapa={setEditingEtapa}
                onEditSubetapa={setEditingSubetapa}
                onSubetapaCreated={() => refreshData()}
                subetapasOptions={subetapasOptions}
                onTarefaCreated={() => refreshData()}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Dialog de Edição de Etapa */}
      {editingEtapa && (
        <EditarEtapaDialog
          etapa={editingEtapa}
          users={users}
          open={!!editingEtapa}
          onOpenChange={(open) => !open && setEditingEtapa(null)}
          onSuccess={handleEtapaUpdated}
          onDelete={handleEtapaDeleted}
        />
      )}

      {/* Dialog de Edição de Subetapa */}
      {editingSubetapa && (
        <EditarSubetapaDialog
          subetapa={editingSubetapa}
          users={users}
          open={!!editingSubetapa}
          onOpenChange={(open) => !open && setEditingSubetapa(null)}
          onSuccess={handleSubetapaUpdated}
          onDelete={handleSubetapaDeleted}
        />
      )}
    </>
  );
}
