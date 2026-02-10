import {
  Circle,
  Play,
  Check,
  AlertTriangle,
  Pause,
  type LucideIcon,
} from "lucide-react";

// --- Interfaces ---

export interface TarefaComContexto {
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
  subetapa_nome: string;
  etapa_id: string;
  etapa_nome: string;
  responsavel_nome: string | null;
}

// --- Status Config ---

export interface StatusConfigItem {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const statusConfig: Record<string, StatusConfigItem> = {
  pendente: { label: "Pendente", color: "text-muted-foreground", icon: Circle },
  em_andamento: { label: "Em Andamento", color: "text-blue-500", icon: Play },
  concluida: { label: "Concluida", color: "text-green-500", icon: Check },
  bloqueada: { label: "Bloqueada", color: "text-orange-500", icon: Pause },
  cancelada: { label: "Cancelada", color: "text-red-500", icon: AlertTriangle },
};

// --- Prioridade Config ---

export interface PrioridadeConfigItem {
  label: string;
  color: string;
  bgColor: string;
}

export const prioridadeConfig: Record<string, PrioridadeConfigItem> = {
  baixa: {
    label: "Baixa",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  media: {
    label: "Media",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  alta: {
    label: "Alta",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  critica: {
    label: "Critica",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
};

// --- Prioridade Order (para ordenacao) ---

export const prioridadeOrder: Record<string, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

// --- Helpers ---

export function getInitials(nome: string): string {
  return nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}
