"use client";

import { CronogramaTable } from "./cronograma-table";
import { CronogramaMobile } from "./cronograma-mobile";
import { useMobile } from "@/lib/hooks/use-media-query";

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

interface CronogramaWrapperProps {
  etapas: Etapa[];
  users: User[];
}

export function CronogramaWrapper({ etapas, users }: CronogramaWrapperProps) {
  const isMobile = useMobile();

  if (isMobile) {
    return <CronogramaMobile etapas={etapas} users={users} />;
  }

  return <CronogramaTable etapas={etapas} users={users} />;
}

