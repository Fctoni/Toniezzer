"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatDateToString, parseDateString } from "@/lib/utils";
import { NovaTarefaDialog } from "./nova-tarefa-dialog";
import { NovaEtapaDialog } from "./nova-etapa-dialog";
import { EditarEtapaDialog } from "./editar-etapa-dialog";
import { EditarTarefaDialog } from "./editar-tarefa-dialog";

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

interface User {
  id: string;
  nome_completo: string;
}

interface CronogramaTableProps {
  etapas: Etapa[];
  users: User[];
}

const statusOptions = [
  { value: "nao_iniciada", label: "Não Iniciada", icon: Circle, color: "text-muted-foreground" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "aguardando_aprovacao", label: "Aguardando", icon: Clock, color: "text-yellow-500" },
  { value: "pausada", label: "Pausada", icon: Pause, color: "text-gray-500" },
  { value: "atrasada", label: "Atrasada", icon: AlertTriangle, color: "text-red-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
];

// Grid columns configuration
const gridCols = "grid-cols-[40px_40px_minmax(200px,1fr)_150px_100px_100px_150px_80px_50px]";

// Componente para linha de etapa arrastável
function SortableEtapaRow({
  etapa,
  isExpanded,
  onToggleExpand,
  users,
  updating,
  onUpdateEtapa,
  onUpdateTarefa,
  onReorderTarefas,
  onEditEtapa,
  onEditTarefa,
}: {
  etapa: Etapa;
  isExpanded: boolean;
  onToggleExpand: () => void;
  users: User[];
  updating: string | null;
  onUpdateEtapa: (etapaId: string, field: string, value: string | null) => void;
  onUpdateTarefa: (tarefaId: string, field: string, value: string | null) => void;
  onReorderTarefas: (etapaId: string, tarefas: Tarefa[]) => void;
  onEditEtapa: (etapa: Etapa) => void;
  onEditTarefa: (tarefa: Tarefa) => void;
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

  const hasTarefas = etapa.tarefas.length > 0;
  const statusConfig = getStatusConfig(etapa.status);
  const progresso = calcularProgresso(etapa);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTarefaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = etapa.tarefas.findIndex((t) => t.id === active.id);
      const newIndex = etapa.tarefas.findIndex((t) => t.id === over.id);
      const newTarefas = arrayMove(etapa.tarefas, oldIndex, newIndex);
      onReorderTarefas(etapa.id, newTarefas);
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
          {hasTarefas ? (
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

        {/* Nome - Clicável para editar */}
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

        {/* Data Início */}
        <div className="p-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 px-2 text-xs font-normal justify-start hover:bg-muted/50"
              >
                {formatDate(etapa.data_inicio_prevista)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseDate(etapa.data_inicio_prevista)}
                onSelect={(date) =>
                  onUpdateEtapa(
                    etapa.id,
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
                className="h-8 px-2 text-xs font-normal justify-start hover:bg-muted/50"
              >
                {formatDate(etapa.data_fim_prevista)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseDate(etapa.data_fim_prevista)}
                onSelect={(date) =>
                  onUpdateEtapa(
                    etapa.id,
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

        {/* Add Task Button */}
        <div className="p-1 flex items-center justify-center">
          <NovaTarefaDialog
            etapaId={etapa.id}
            etapaNome={etapa.nome}
            users={users}
            proximaOrdem={etapa.tarefas.length + 1}
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

      {/* Linhas das Tarefas */}
      {isExpanded && etapa.tarefas.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTarefaDragEnd}
        >
          <SortableContext
            items={etapa.tarefas.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {etapa.tarefas.map((tarefa, idx) => (
              <SortableTarefaRow
                key={tarefa.id}
                tarefa={tarefa}
                isLast={idx === etapa.tarefas.length - 1}
                users={users}
                updating={updating}
                onUpdateTarefa={onUpdateTarefa}
                onEditTarefa={onEditTarefa}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </>
  );
}

// Componente para linha de tarefa arrastável
function SortableTarefaRow({
  tarefa,
  isLast,
  users,
  updating,
  onUpdateTarefa,
  onEditTarefa,
}: {
  tarefa: Tarefa;
  isLast: boolean;
  users: User[];
  updating: string | null;
  onUpdateTarefa: (tarefaId: string, field: string, value: string | null) => void;
  onEditTarefa: (tarefa: Tarefa) => void;
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

  const tarefaStatusConfig = getStatusConfig(tarefa.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid items-center border-b group bg-muted/20 hover:bg-muted/40",
        gridCols,
        updating === tarefa.id && "opacity-50",
        isDragging && "opacity-50 bg-muted z-10"
      )}
    >
      {/* Empty for align */}
      <div className="p-0"></div>

      {/* Drag handle + Tree indicator */}
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
          onClick={() => onEditTarefa(tarefa)}
          className={cn(
            "flex items-center gap-2 text-sm hover:text-primary transition-colors text-left",
            tarefa.status === "concluida" && "line-through text-muted-foreground"
          )}
        >
          {tarefa.nome}
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
        </button>
      </div>

      {/* Status */}
      <div className="p-1">
        <Select
          value={tarefa.status}
          onValueChange={(value) => onUpdateTarefa(tarefa.id, "status", value)}
        >
          <SelectTrigger className="h-7 border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
            <div className={cn("flex items-center gap-2", tarefaStatusConfig.color)}>
              <tarefaStatusConfig.icon className="h-3 w-3" />
              <span className="text-xs">{tarefaStatusConfig.label}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
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
              {formatDate(tarefa.data_inicio_prevista)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseDate(tarefa.data_inicio_prevista)}
              onSelect={(date) =>
                onUpdateTarefa(
                  tarefa.id,
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
              {formatDate(tarefa.data_fim_prevista)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseDate(tarefa.data_fim_prevista)}
              onSelect={(date) =>
                onUpdateTarefa(
                  tarefa.id,
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

      {/* Progresso (checkbox visual) */}
      <div className="text-right pr-4 flex items-center justify-end">
        {tarefa.status === "concluida" ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>

      {/* Empty cell */}
      <div></div>
    </div>
  );
}

// Helper functions
function formatDate(date: string | null) {
  if (!date) return "-";
  return format(new Date(date), "dd/MM", { locale: ptBR });
}

function parseDate(date: string | null): Date | undefined {
  if (!date) return undefined;
  return parseDateString(date);
}

function calcularProgresso(etapa: Etapa) {
  if (etapa.tarefas.length === 0) return etapa.progresso_percentual;
  const concluidas = etapa.tarefas.filter((t) => t.status === "concluida").length;
  return Math.round((concluidas / etapa.tarefas.length) * 100);
}

function getStatusConfig(status: string) {
  return statusOptions.find((s) => s.value === status) || statusOptions[0];
}

// Componente principal
export function CronogramaTable({ etapas: initialEtapas, users }: CronogramaTableProps) {
  const router = useRouter();
  const [etapas, setEtapas] = useState(initialEtapas);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(
    new Set(initialEtapas.map((e) => e.id))
  );
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Estados para edição
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null);
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpanded = (etapaId: string) => {
    const newExpanded = new Set(expandedEtapas);
    if (newExpanded.has(etapaId)) {
      newExpanded.delete(etapaId);
    } else {
      newExpanded.add(etapaId);
    }
    setExpandedEtapas(newExpanded);
  };

  const handleEtapaDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = etapas.findIndex((e) => e.id === active.id);
    const newIndex = etapas.findIndex((e) => e.id === over.id);
    const newEtapas = arrayMove(etapas, oldIndex, newIndex);
    
    // Atualizar estado local imediatamente
    setEtapas(newEtapas);

    // Salvar no banco
    const supabase = createClient();
    try {
      const updates = newEtapas.map((etapa, index) => ({
        id: etapa.id,
        ordem: index + 1,
      }));

      for (const update of updates) {
        await supabase.from("etapas").update({ ordem: update.ordem }).eq("id", update.id);
      }

      toast.success("Ordem atualizada!");
    } catch (error) {
      toast.error("Erro ao reordenar");
      setEtapas(initialEtapas); // Reverter em caso de erro
    }
  };

  const handleReorderTarefas = async (etapaId: string, newTarefas: Tarefa[]) => {
    // Atualizar estado local
    setEtapas((prev) =>
      prev.map((e) => (e.id === etapaId ? { ...e, tarefas: newTarefas } : e))
    );

    // Salvar no banco
    const supabase = createClient();
    try {
      const updates = newTarefas.map((tarefa, index) => ({
        id: tarefa.id,
        ordem: index + 1,
      }));

      for (const update of updates) {
        await supabase.from("tarefas").update({ ordem: update.ordem }).eq("id", update.id);
      }

      toast.success("Ordem atualizada!");
    } catch (error) {
      toast.error("Erro ao reordenar tarefas");
      router.refresh(); // Reverter em caso de erro
    }
  };

  const updateEtapa = async (etapaId: string, field: string, value: string | null) => {
    setUpdating(etapaId);
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { [field]: value };

      if (field === "status") {
        if (value === "em_andamento") {
          updates.data_inicio_real = formatDateToString(new Date());
        } else if (value === "concluida") {
          updates.data_fim_real = formatDateToString(new Date());
          updates.progresso_percentual = 100;
        }
      }

      const { error } = await supabase.from("etapas").update(updates).eq("id", etapaId);

      if (error) throw error;

      toast.success("Atualizado!");
      router.refresh();
    } catch (error) {
      toast.error("Erro ao atualizar");
    } finally {
      setUpdating(null);
    }
  };

  const updateTarefa = async (tarefaId: string, field: string, value: string | null) => {
    setUpdating(tarefaId);
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { [field]: value };

      if (field === "status") {
        if (value === "em_andamento") {
          updates.data_inicio_real = formatDateToString(new Date());
        } else if (value === "concluida") {
          updates.data_fim_real = formatDateToString(new Date());
        }
      }

      const { error } = await supabase.from("tarefas").update(updates).eq("id", tarefaId);

      if (error) throw error;

      toast.success("Atualizado!");
      router.refresh();
    } catch (error) {
      toast.error("Erro ao atualizar");
    } finally {
      setUpdating(null);
    }
  };

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
        <div className={cn("grid items-center bg-muted/50 border-b text-sm font-medium text-muted-foreground", gridCols)}>
          <div className="p-2"></div>
          <div className="p-2"></div>
          <div className="p-2">Nome</div>
          <div className="p-2">Status</div>
          <div className="p-2">Início</div>
          <div className="p-2">Fim</div>
          <div className="p-2">Responsável</div>
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
                onToggleExpand={() => toggleExpanded(etapa.id)}
                users={users}
                updating={updating}
                onUpdateEtapa={updateEtapa}
                onUpdateTarefa={updateTarefa}
                onReorderTarefas={handleReorderTarefas}
                onEditEtapa={setEditingEtapa}
                onEditTarefa={setEditingTarefa}
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
        />
      )}

      {/* Dialog de Edição de Tarefa */}
      {editingTarefa && (
        <EditarTarefaDialog
          tarefa={editingTarefa}
          users={users}
          open={!!editingTarefa}
          onOpenChange={(open) => !open && setEditingTarefa(null)}
        />
      )}
    </>
  );
}
