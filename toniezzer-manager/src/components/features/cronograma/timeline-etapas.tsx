"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatDateToString } from "@/lib/utils";
import { TimelineEtapaCard } from "@/components/features/cronograma/timeline-etapa-card";
import type { Etapa, User } from "@/components/features/cronograma/cronograma-config";

// --- Tipos locais ---

interface Dependencia {
  id: string;
  etapa_id: string;
  depende_de_etapa_id: string;
  tipo: string;
}

interface TimelineEtapasProps {
  etapas: Etapa[];
  dependencias: Dependencia[];
  users: User[];
  onRefresh?: () => void;
}

// --- Componente ---

export function TimelineEtapas({ etapas, dependencias, users, onRefresh }: TimelineEtapasProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());

  const toggleExpanded = (etapaId: string) => {
    const newExpanded = new Set(expandedEtapas);
    if (newExpanded.has(etapaId)) {
      newExpanded.delete(etapaId);
    } else {
      newExpanded.add(etapaId);
    }
    setExpandedEtapas(newExpanded);
  };

  const updateStatus = async (etapaId: string, novoStatus: string) => {
    setUpdating(etapaId);
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { status: novoStatus };

      if (novoStatus === "em_andamento") {
        updates.data_inicio_real = formatDateToString(new Date());
      } else if (novoStatus === "concluida") {
        updates.data_fim_real = formatDateToString(new Date());
        updates.progresso_percentual = 100;
      }

      const { error } = await supabase
        .from("etapas")
        .update(updates)
        .eq("id", etapaId);

      if (error) throw error;

      toast.success("Status atualizado!");

      // Notificar o parent ou fazer refresh da pagina
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdating(null);
    }
  };

  const getDependencias = (etapaId: string) => {
    return dependencias
      .filter((d) => d.etapa_id === etapaId)
      .map((d) => {
        const etapaDep = etapas.find((e) => e.id === d.depende_de_etapa_id);
        return { ...d, etapa: etapaDep };
      });
  };

  if (etapas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">Nenhuma etapa cadastrada</p>
        <p className="text-sm text-muted-foreground">
          Clique em &quot;Nova Etapa&quot; para começar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {etapas.map((etapa, index) => (
        <TimelineEtapaCard
          key={etapa.id}
          etapa={etapa}
          isExpanded={expandedEtapas.has(etapa.id)}
          isUpdating={updating === etapa.id}
          isLastItem={index === etapas.length - 1}
          dependencias={getDependencias(etapa.id)}
          users={users}
          onToggle={() => toggleExpanded(etapa.id)}
          onStatusUpdate={updateStatus}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
