/**
 * Utilitários para calcular progresso de etapas e subetapas
 * Alteração 01: Sistema de 3 níveis hierárquicos
 */

import { Tables } from '@/lib/types/database';

type Etapa = Tables<'etapas'>;
type Subetapa = Tables<'subetapas'>;
type Tarefa = Tables<'tarefas'>;

/**
 * Calcula o progresso de uma subetapa com base nas suas tarefas
 * Nota: O trigger do banco já calcula automaticamente, mas esta função
 * é útil para previsualização no frontend antes de salvar
 *
 * @param tarefas - Lista de tarefas da subetapa
 * @returns Percentual de progresso (0-100)
 */
export function calcularProgressoSubetapa(tarefas: Tarefa[]): number {
  if (tarefas.length === 0) return 0;

  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluida').length;

  return Math.round((tarefasConcluidas / tarefas.length) * 100);
}

/**
 * Calcula o progresso de uma etapa com base em suas subetapas
 * Média ponderada dos progressos das subetapas
 *
 * @param subetapas - Lista de subetapas da etapa
 * @returns Percentual de progresso (0-100)
 */
export function calcularProgressoEtapa(subetapas: Subetapa[]): number {
  if (subetapas.length === 0) return 0;

  // Soma do progresso de todas as subetapas
  const somaProgresso = subetapas.reduce((acc, sub) => {
    return acc + (sub.progresso_percentual || 0);
  }, 0);

  // Média simples (todas as subetapas têm o mesmo peso)
  return Math.round(somaProgresso / subetapas.length);
}

/**
 * Calcula progresso considerando peso das subetapas por orçamento
 * Subetapas com maior orçamento têm mais peso no cálculo
 *
 * @param subetapas - Lista de subetapas da etapa
 * @returns Percentual de progresso (0-100)
 */
export function calcularProgressoEtapaPonderado(subetapas: Subetapa[]): number {
  if (subetapas.length === 0) return 0;

  // Verificar se alguma subetapa tem orçamento definido
  const temOrcamento = subetapas.some(s => s.orcamento_previsto && s.orcamento_previsto > 0);

  // Se nenhuma tem orçamento, usar média simples
  if (!temOrcamento) {
    return calcularProgressoEtapa(subetapas);
  }

  // Calcular soma total do orçamento
  const orcamentoTotal = subetapas.reduce((acc, sub) => {
    return acc + (sub.orcamento_previsto || 0);
  }, 0);

  if (orcamentoTotal === 0) {
    return calcularProgressoEtapa(subetapas);
  }

  // Calcular progresso ponderado
  const progressoPonderado = subetapas.reduce((acc, sub) => {
    const peso = (sub.orcamento_previsto || 0) / orcamentoTotal;
    const progresso = sub.progresso_percentual || 0;
    return acc + progresso * peso;
  }, 0);

  return Math.round(progressoPonderado);
}

/**
 * Verifica se uma subetapa pode ser considerada concluída
 * Todas as tarefas devem estar concluídas
 *
 * @param tarefas - Lista de tarefas da subetapa
 * @returns true se todas as tarefas estão concluídas
 */
export function subetapaConcluida(tarefas: Tarefa[]): boolean {
  if (tarefas.length === 0) return false;
  return tarefas.every(t => t.status === 'concluida');
}

/**
 * Verifica se uma etapa pode ser considerada concluída
 * Todas as subetapas devem estar concluídas
 *
 * @param subetapas - Lista de subetapas da etapa
 * @returns true se todas as subetapas estão concluídas
 */
export function etapaConcluida(subetapas: Subetapa[]): boolean {
  if (subetapas.length === 0) return false;
  return subetapas.every(s => s.status === 'concluida');
}

/**
 * Sugere o status de uma subetapa com base no progresso e nas tarefas
 *
 * @param subetapa - Subetapa a analisar
 * @param tarefas - Lista de tarefas da subetapa
 * @returns Status sugerido
 */
export function sugerirStatusSubetapa(
  subetapa: Subetapa,
  tarefas: Tarefa[]
): 'nao_iniciada' | 'em_andamento' | 'concluida' {
  if (tarefas.length === 0) {
    return 'nao_iniciada';
  }

  // Se todas estão concluídas
  if (subetapaConcluida(tarefas)) {
    return 'concluida';
  }

  // Se alguma está em andamento ou concluída
  const temAndamento = tarefas.some(
    t => t.status === 'em_andamento' || t.status === 'concluida'
  );

  if (temAndamento) {
    return 'em_andamento';
  }

  return 'nao_iniciada';
}

/**
 * Sugere o status de uma etapa com base no progresso e nas subetapas
 *
 * @param etapa - Etapa a analisar
 * @param subetapas - Lista de subetapas da etapa
 * @returns Status sugerido
 */
export function sugerirStatusEtapa(
  etapa: Etapa,
  subetapas: Subetapa[]
): 'nao_iniciada' | 'em_andamento' | 'concluida' {
  if (subetapas.length === 0) {
    return 'nao_iniciada';
  }

  // Se todas estão concluídas
  if (etapaConcluida(subetapas)) {
    return 'concluida';
  }

  // Se alguma está em andamento ou concluída
  const temAndamento = subetapas.some(
    s => s.status === 'em_andamento' || s.status === 'concluida'
  );

  if (temAndamento) {
    return 'em_andamento';
  }

  return 'nao_iniciada';
}

/**
 * Calcula estatísticas de progresso de uma subetapa
 *
 * @param tarefas - Lista de tarefas da subetapa
 * @returns Objeto com estatísticas detalhadas
 */
export function estatisticasSubetapa(tarefas: Tarefa[]) {
  const total = tarefas.length;
  const concluidas = tarefas.filter(t => t.status === 'concluida').length;
  const emAndamento = tarefas.filter(t => t.status === 'em_andamento').length;
  const bloqueadas = tarefas.filter(t => t.status === 'bloqueada').length;
  const pendentes = tarefas.filter(t => t.status === 'pendente').length;
  const canceladas = tarefas.filter(t => t.status === 'cancelada').length;

  return {
    total,
    concluidas,
    emAndamento,
    bloqueadas,
    pendentes,
    canceladas,
    progresso: calcularProgressoSubetapa(tarefas),
    percentualConcluidas: total > 0 ? Math.round((concluidas / total) * 100) : 0,
    percentualEmAndamento: total > 0 ? Math.round((emAndamento / total) * 100) : 0,
    percentualBloqueadas: total > 0 ? Math.round((bloqueadas / total) * 100) : 0,
  };
}

/**
 * Calcula estatísticas de progresso de uma etapa
 *
 * @param subetapas - Lista de subetapas da etapa
 * @returns Objeto com estatísticas detalhadas
 */
export function estatisticasEtapa(subetapas: Subetapa[]) {
  const total = subetapas.length;
  const concluidas = subetapas.filter(s => s.status === 'concluida').length;
  const emAndamento = subetapas.filter(s => s.status === 'em_andamento').length;
  const naoIniciadas = subetapas.filter(s => s.status === 'nao_iniciada').length;
  const pausadas = subetapas.filter(s => s.status === 'pausada').length;
  const canceladas = subetapas.filter(s => s.status === 'cancelada').length;

  return {
    total,
    concluidas,
    emAndamento,
    naoIniciadas,
    pausadas,
    canceladas,
    progresso: calcularProgressoEtapa(subetapas),
    progressoPonderado: calcularProgressoEtapaPonderado(subetapas),
    percentualConcluidas: total > 0 ? Math.round((concluidas / total) * 100) : 0,
    percentualEmAndamento: total > 0 ? Math.round((emAndamento / total) * 100) : 0,
  };
}
