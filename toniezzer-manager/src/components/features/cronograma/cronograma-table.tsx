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
import { NovaSubetapaDialog } from "./nova-subetapa-dialog";
import { EditarSubetapaDialog } from "./editar-subetapa-dialog";
import { NovaEtapaDialog } from "./nova-etapa-dialog";
import { EditarEtapaDialog } from "./editar-etapa-dialog";

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

interface CronogramaTableProps {
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

// Grid configuration (simplificado para 3 níveis)
const gridCols = "grid-cols-[40px_40px_minmax(250px,1fr)_120px_120px_150px_100px_50px]";

// Helper functions
function formatDate(date: string | null) {
  if (!date) return "-";
  return format(parseDateString(date), "dd/MM", { locale: ptBR });
}

function getStatusConfig(status: string) {
  return statusOptions.find((s) => s.value === status) || statusOptions[0];
}

function calcularProgressoEtapa(subetapas: Subetapa[]): number {
  if (subetapas.length === 0) return 0;
  const somaProgresso = subetapas.reduce((acc, sub) => acc + (sub.progresso_percentual || 0), 0);
  return Math.round(somaProgresso / subetapas.length);
}

// Componente para linha de Etapa
function SortableEtapaRow({
  etapa,
  isExpanded,
  onToggleExpand,
  users,
  updating,
  onUpdateEtapa,
  onEditEtapa,
  onRefresh,
}: {
  etapa: Etapa;
  isExpanded: boolean;
  onToggleExpand: () => void;
  users: User[];
  updating: string | null;
  onUpdateEtapa: (etapaId: string, field: string, value: string | null) => void;
  onEditEtapa: (etapa: Etapa) => void;
  onRefresh: () => void;
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
  const progresso = calcularProgressoEtapa(etapa.subetapas);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 0,
    }).format(value);

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
          <div className="h-8 px-2 text-xs font-normal flex items-center text-muted-foreground">
            {formatDate(etapa.data_inicio_prevista)}
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
            onSuccess={onRefresh}
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

      {/* Subetapas (quando expandida) */}
      {isExpanded && hasSubetapas && (
        <SubetapasSection
          subetapas={etapa.subetapas}
          users={users}
          updating={updating}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}

// Componente para seção de Subetapas
function SubetapasSection({
  subetapas,
  users,
  updating,
  onRefresh,
}: {
  subetapas: Subetapa[];
  users: User[];
  updating: string | null;
  onRefresh: () => void;
}) {
  const [expandedSubetapas, setExpandedSubetapas] = useState<Set<string>>(new Set());
  const [editingSubetapa, setEditingSubetapa] = useState<Subetapa | null>(null);

  const toggleSubetapa = (subetapaId: string) => {
    setExpandedSubetapas((prev) => {
      const next = new Set(prev);
      if (next.has(subetapaId)) {
        next.delete(subetapaId);
      } else {
        next.add(subetapaId);
      }
      return next;
    });
  };

  const updateSubetapaStatus = async (subetapaId: string, novoStatus: string) => {
    const supabase = createClient();
    try {
      const updates: Record<string, unknown> = { status: novoStatus };

      if (novoStatus === "em_andamento") {
        updates.data_inicio_real = formatDateToString(new Date());
      } else if (novoStatus === "concluida") {
        updates.data_fim_real = formatDateToString(new Date());
      }

      const { error } = await supabase
        .from("subetapas")
        .update(updates)
        .eq("id", subetapaId);

      if (error) throw error;

      toast.success("Subetapa atualizada!");
      onRefresh();
    } catch (error) {
      toast.error("Erro ao atualizar subetapa");
    }
  };

  return (
    <>
      {subetapas.map((subetapa, idx) => {
        const isExpanded = expandedSubetapas.has(subetapa.id);
        const hasTarefas = subetapa.tarefas.length > 0;
        const statusConfig = getStatusConfig(subetapa.status);
        const isLast = idx === subetapas.length - 1;

        return (
          <div key={subetapa.id}>
            {/* Linha da Subetapa */}
            <div
              className={cn(
                "grid items-center border-b group bg-muted/10 hover:bg-muted/30",
                gridCols,
                updating === subetapa.id && "opacity-50"
              )}
            >
              {/* Expand/Collapse + Tree Line */}
              <div className="p-0 pl-4 flex items-center justify-center">
                {hasTarefas ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => toggleSubetapa(subetapa.id)}
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

              {/* Tree Indicator */}
              <div className="p-0 pl-1 flex items-center">
                <span className="text-muted-foreground/50 text-sm">
                  {isLast ? "└" : "├"}
                </span>
              </div>

              {/* Nome */}
              <div className="p-1.5 pl-1">
                <button
                  onClick={() => setEditingSubetapa(subetapa)}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors text-left",
                    subetapa.status === "concluida" && "line-through text-muted-foreground"
                  )}
                >
                  {subetapa.nome}
                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                </button>
              </div>

              {/* Status */}
              <div className="p-1">
                <Select
                  value={subetapa.status}
                  onValueChange={(value) => updateSubetapaStatus(subetapa.id, value)}
                >
                  <SelectTrigger className="h-7 border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
                    <div className={cn("flex items-center gap-2", statusConfig.color)}>
                      <statusConfig.icon className="h-3 w-3" />
                      <span className="text-xs">{statusConfig.label}</span>
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

              {/* Data */}
              <div className="p-1">
                <div className="h-7 px-2 text-xs font-normal flex items-center text-muted-foreground">
                  {formatDate(subetapa.data_inicio_prevista)}
                  {subetapa.data_fim_prevista && ` - ${formatDate(subetapa.data_fim_prevista)}`}
                </div>
              </div>

              {/* Responsável */}
              <div className="p-1">
                <span className="text-xs text-muted-foreground truncate block">
                  {users.find((u) => u.id === subetapa.responsavel_id)?.nome_completo || "-"}
                </span>
              </div>

              {/* Progresso */}
              <div className="text-right pr-4">
                <span className="text-xs text-muted-foreground">
                  {subetapa.progresso_percentual}%
                </span>
              </div>

              {/* Empty */}
              <div></div>
            </div>

            {/* Tarefas (quando subetapa expandida) */}
            {isExpanded && hasTarefas && (
              <TarefasSection tarefas={subetapa.tarefas} users={users} />
            )}
          </div>
        );
      })}

      {/* Dialog de Edição */}
      {editingSubetapa && (
        <EditarSubetapaDialog
          subetapa={editingSubetapa}
          users={users}
          open={!!editingSubetapa}
          onOpenChange={(open) => !open && setEditingSubetapa(null)}
          onSuccess={() => {
            setEditingSubetapa(null);
            onRefresh();
          }}
          onDelete={() => {
            setEditingSubetapa(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

// Componente para seção de Tarefas
function TarefasSection({
  tarefas,
  users,
}: {
  tarefas: Tarefa[];
  users: User[];
}) {
  return (
    <>
      {tarefas.map((tarefa, idx) => {
        const isLast = idx === tarefas.length - 1;
        const statusConfig = getStatusConfig(tarefa.status);

        return (
          <div
            key={tarefa.id}
            className={cn(
              "grid items-center border-b group bg-muted/5 hover:bg-muted/20",
              gridCols
            )}
          >
            {/* Empty */}
            <div></div>

            {/* Tree Indicator (nested) */}
            <div className="p-0 pl-6 flex items-center">
              <span className="text-muted-foreground/40 text-xs">
                {isLast ? "└" : "├"}
              </span>
            </div>

            {/* Nome */}
            <div className="p-1 pl-1">
              <span
                className={cn(
                  "text-xs",
                  tarefa.status === "concluida" && "line-through text-muted-foreground"
                )}
              >
                {tarefa.nome}
              </span>
            </div>

            {/* Status */}
            <div className="p-1">
              <div className={cn("flex items-center gap-1.5", statusConfig.color)}>
                <statusConfig.icon className="h-3 w-3" />
                <span className="text-xs">{statusConfig.label}</span>
              </div>
            </div>

            {/* Data */}
            <div className="p-1">
              <span className="text-xs text-muted-foreground">
                {formatDate(tarefa.data_prevista)}
              </span>
            </div>

            {/* Responsável */}
            <div className="p-1">
              <span className="text-xs text-muted-foreground truncate block">
                {users.find((u) => u.id === tarefa.responsavel_id)?.nome_completo || "-"}
              </span>
            </div>

            {/* Progresso/Check */}
            <div className="text-right pr-4">
              {tarefa.status === "concluida" ? (
                <Check className="h-3 w-3 text-green-500 inline" />
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </div>

            {/* Empty */}
            <div></div>
          </div>
        );
      })}
    </>
  );
}

// Componente principal
export function CronogramaTable({ etapas: initialEtapas, users }: CronogramaTableProps) {
  const router = useRouter();
  const [etapas, setEtapas] = useState(initialEtapas);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(
    new Set(initialEtapas.map((e) => e.id))
  );
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null);

  const refreshData = () => {
    router.refresh();
  };

  const toggleExpanded = (etapaId: string) => {
    setExpandedEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(etapaId)) {
        next.delete(etapaId);
      } else {
        next.add(etapaId);
      }
      return next;
    });
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

  const handleEtapaDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = etapas.findIndex((e) => e.id === active.id);
    const newIndex = etapas.findIndex((e) => e.id === over.id);
    const newEtapas = arrayMove(etapas, oldIndex, newIndex);

    setEtapas(newEtapas);

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
      setEtapas(initialEtapas);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
          <div className="p-2">Data</div>
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
                onEditEtapa={setEditingEtapa}
                onRefresh={refreshData}
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
          onSuccess={() => {
            setEditingEtapa(null);
            refreshData();
          }}
          onDelete={() => {
            setEditingEtapa(null);
            refreshData();
          }}
        />
      )}
    </>
  );
}
