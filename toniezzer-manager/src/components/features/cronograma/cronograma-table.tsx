"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { buscarEtapas, atualizarEtapa, reordenarEtapas } from "@/lib/services/etapas";
import { buscarSubetapas, atualizarSubetapa, reordenarSubetapas } from "@/lib/services/subetapas";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn, formatDateToString } from "@/lib/utils";
import { NovaEtapaDialog } from "./nova-etapa-dialog";
import { EditarEtapaDialog } from "./editar-etapa-dialog";
import { EditarSubetapaDialog } from "./editar-subetapa-dialog";
import { SortableEtapaRow } from "./sortable-etapa-row";
import {
  type Tarefa,
  type Subetapa,
  type Etapa,
  type CronogramaTableProps,
  gridCols,
} from "./cronograma-config";

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
