"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn, formatDateToString } from "@/lib/utils";
import {
  type Etapa,
  type User,
  statusOptions,
  getStatusConfig,
} from "@/components/features/cronograma/cronograma-config";
import {
  CronogramaMobileSheet,
  type SelectedItem,
} from "@/components/features/cronograma/cronograma-mobile-sheet";
import { CronogramaMobileRow } from "@/components/features/cronograma/cronograma-mobile-row";

// --- Helpers ---

function calcularProgressoEtapa(etapa: Etapa) {
  if (etapa.subetapas.length === 0) return etapa.progresso_percentual;
  const concluidas = etapa.subetapas.filter(
    (s) => s.status === "concluida"
  ).length;
  return Math.round((concluidas / etapa.subetapas.length) * 100);
}

// --- Props ---

interface CronogramaMobileProps {
  etapas: Etapa[];
  users: User[];
}

// --- Componente principal ---

export function CronogramaMobile({
  etapas: initialEtapas,
  users,
}: CronogramaMobileProps) {
  const [etapas, setEtapas] = useState(initialEtapas);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [expandedSubetapas, setExpandedSubetapas] = useState<Set<string>>(
    new Set()
  );
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [updating, setUpdating] = useState(false);

  const subetapasOptions = etapas.flatMap((e) =>
    e.subetapas.map((s) => ({
      id: s.id,
      nome: s.nome,
      etapa_nome: e.nome,
    }))
  );

  const toggleEtapa = (etapaId: string) => {
    const newExpanded = new Set(expandedEtapas);
    if (newExpanded.has(etapaId)) {
      newExpanded.delete(etapaId);
    } else {
      newExpanded.add(etapaId);
    }
    setExpandedEtapas(newExpanded);
  };

  const toggleSubetapa = (subetapaId: string) => {
    const newExpanded = new Set(expandedSubetapas);
    if (newExpanded.has(subetapaId)) {
      newExpanded.delete(subetapaId);
    } else {
      newExpanded.add(subetapaId);
    }
    setExpandedSubetapas(newExpanded);
  };

  const updateSubetapaStatus = async (
    subetapaId: string,
    newStatus: string
  ) => {
    setUpdating(true);
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { status: newStatus };

      if (newStatus === "em_andamento") {
        updates.data_inicio_real = formatDateToString(new Date());
      } else if (newStatus === "concluida") {
        updates.data_fim_real = formatDateToString(new Date());
      }

      const { error } = await supabase
        .from("subetapas")
        .update(updates)
        .eq("id", subetapaId);

      if (error) throw error;

      setEtapas((prev) =>
        prev.map((e) => ({
          ...e,
          subetapas: e.subetapas.map((s) =>
            s.id === subetapaId ? { ...s, status: newStatus } : s
          ),
        }))
      );

      toast.success("Subetapa atualizada!");
      setSelectedItem(null);
    } catch {
      toast.error("Erro ao atualizar subetapa");
    } finally {
      setUpdating(false);
    }
  };

  const updateTarefaStatus = async (tarefaId: string, newStatus: string) => {
    setUpdating(true);
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { status: newStatus };

      if (newStatus === "em_andamento") {
        updates.data_inicio_real = formatDateToString(new Date());
      } else if (newStatus === "concluida") {
        updates.data_conclusao_real = formatDateToString(new Date());
      }

      const { error } = await supabase
        .from("tarefas")
        .update(updates)
        .eq("id", tarefaId);

      if (error) throw error;

      setEtapas((prev) =>
        prev.map((e) => ({
          ...e,
          subetapas: e.subetapas.map((s) => ({
            ...s,
            tarefas: s.tarefas.map((t) =>
              t.id === tarefaId ? { ...t, status: newStatus } : t
            ),
          })),
        }))
      );

      toast.success("Tarefa atualizada!");
      setSelectedItem(null);
    } catch {
      toast.error("Erro ao atualizar tarefa");
    } finally {
      setUpdating(false);
    }
  };

  if (etapas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma etapa cadastrada</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {etapas.map((etapa) => {
          const statusConfig = getStatusConfig(etapa.status, statusOptions);
          const progresso = calcularProgressoEtapa(etapa);
          const isExpanded = expandedEtapas.has(etapa.id);
          const StatusIcon = statusConfig.icon;
          const subetapasConcluidas = etapa.subetapas.filter(
            (s) => s.status === "concluida"
          ).length;

          return (
            <Card key={etapa.id} className="overflow-hidden">
              {/* Header da Etapa */}
              <button
                onClick={() => toggleEtapa(etapa.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {etapa.nome}
                    </span>
                    <StatusIcon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        statusConfig.color
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={progresso} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">
                      {progresso}%
                    </span>
                  </div>
                </div>

                {etapa.subetapas.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {subetapasConcluidas}/{etapa.subetapas.length}
                  </Badge>
                )}
              </button>

              {/* Lista de Subetapas */}
              {isExpanded && etapa.subetapas.length > 0 && (
                <CardContent className="pt-0 pb-2 px-2">
                  <div className="space-y-1 ml-4">
                    {etapa.subetapas.map((subetapa) => (
                      <CronogramaMobileRow
                        key={subetapa.id}
                        subetapa={subetapa}
                        etapaNome={etapa.nome}
                        isExpanded={expandedSubetapas.has(subetapa.id)}
                        users={users}
                        subetapasOptions={subetapasOptions}
                        onToggle={toggleSubetapa}
                        onSelect={setSelectedItem}
                      />
                    ))}
                  </div>
                </CardContent>
              )}

              {isExpanded && etapa.subetapas.length === 0 && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Nenhuma subetapa nesta etapa
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom Sheet para editar subetapa ou tarefa */}
      <CronogramaMobileSheet
        selectedItem={selectedItem}
        updating={updating}
        onClose={() => setSelectedItem(null)}
        onUpdateSubetapa={updateSubetapaStatus}
        onUpdateTarefa={updateTarefaStatus}
      />
    </>
  );
}
