import {
  Check,
  Circle,
  Clock,
  AlertTriangle,
  Pause,
  Play,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateString } from "@/lib/utils";

// --- Interfaces ---

export interface Tarefa {
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

export interface Subetapa {
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

export interface Etapa {
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

export interface User {
  id: string;
  nome_completo: string;
}

export interface CronogramaTableProps {
  etapas: Etapa[];
  users: User[];
}

// --- Status Options ---

export interface StatusOption {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const statusOptions: StatusOption[] = [
  { value: "nao_iniciada", label: "Não Iniciada", icon: Circle, color: "text-muted-foreground" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "aguardando_aprovacao", label: "Aguardando", icon: Clock, color: "text-yellow-500" },
  { value: "pausada", label: "Pausada", icon: Pause, color: "text-gray-500" },
  { value: "atrasada", label: "Atrasada", icon: AlertTriangle, color: "text-red-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
];

export const subetapaStatusOptions: StatusOption[] = [
  { value: "nao_iniciada", label: "Não Iniciada", icon: Circle, color: "text-muted-foreground" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "pausada", label: "Pausada", icon: Pause, color: "text-gray-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
  { value: "cancelada", label: "Cancelada", icon: AlertTriangle, color: "text-red-500" },
];

export const tarefaStatusOptions: StatusOption[] = [
  { value: "pendente", label: "Pendente", icon: Circle, color: "text-muted-foreground" },
  { value: "bloqueada", label: "Bloqueada", icon: Lock, color: "text-orange-500" },
  { value: "em_andamento", label: "Em Andamento", icon: Play, color: "text-blue-500" },
  { value: "concluida", label: "Concluída", icon: Check, color: "text-green-500" },
  { value: "cancelada", label: "Cancelada", icon: AlertTriangle, color: "text-red-500" },
];

export const prioridadeConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "text-green-500" },
  media: { label: "Média", color: "text-yellow-500" },
  alta: { label: "Alta", color: "text-orange-500" },
  critica: { label: "Crítica", color: "text-red-500" },
};

export const gridCols = "grid-cols-[40px_40px_minmax(200px,1fr)_150px_100px_100px_150px_100px_100px_80px_50px]";

// --- Helpers ---

export function formatDate(date: string | null) {
  if (!date) return "-";
  return format(parseDateString(date), "dd/MM", { locale: ptBR });
}

export function parseDate(date: string | null): Date | undefined {
  if (!date) return undefined;
  return parseDateString(date);
}

export function getStatusConfig(status: string, options: StatusOption[] = statusOptions) {
  return options.find((s) => s.value === status) || options[0];
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value);
