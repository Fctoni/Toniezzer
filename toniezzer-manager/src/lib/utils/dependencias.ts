/**
 * Utilitários para gerenciar dependências entre tarefas
 * Alteração 01: Sistema de 3 níveis hierárquicos
 */

import { Tables } from '@/lib/types/database';

type Tarefa = Tables<'tarefas'>;

/**
 * Verifica se há ciclo de dependências entre tarefas
 * Usa algoritmo de detecção de ciclos em grafos direcionados (DFS)
 *
 * @param tarefas - Lista de todas as tarefas da subetapa
 * @param tarefaId - ID da tarefa que está sendo verificada
 * @param novasDependencias - Array de IDs das novas dependências a serem adicionadas
 * @returns true se houver ciclo, false caso contrário
 */
export function verificarCicloDependencias(
  tarefas: Tarefa[],
  tarefaId: string,
  novasDependencias: string[]
): boolean {
  // Criar mapa de dependências (quem depende de quem)
  const grafo = new Map<string, string[]>();

  // Adicionar dependências existentes
  for (const tarefa of tarefas) {
    grafo.set(tarefa.id, tarefa.bloqueada_por || []);
  }

  // Adicionar novas dependências temporariamente
  grafo.set(tarefaId, [...(grafo.get(tarefaId) || []), ...novasDependencias]);

  // Verificar ciclos usando DFS
  const visitados = new Set<string>();
  const pilhaRecursiva = new Set<string>();

  function dfs(nodeId: string): boolean {
    visitados.add(nodeId);
    pilhaRecursiva.add(nodeId);

    const dependencias = grafo.get(nodeId) || [];

    for (const depId of dependencias) {
      if (!visitados.has(depId)) {
        if (dfs(depId)) return true;
      } else if (pilhaRecursiva.has(depId)) {
        // Encontrou ciclo
        return true;
      }
    }

    pilhaRecursiva.delete(nodeId);
    return false;
  }

  return dfs(tarefaId);
}

/**
 * Calcula quais tarefas estão bloqueadas por outras tarefas não concluídas
 *
 * @param tarefas - Lista de todas as tarefas
 * @returns Map com ID da tarefa e array de IDs das tarefas que a bloqueiam
 */
export function calcularTarefasBloqueadas(
  tarefas: Tarefa[]
): Map<string, string[]> {
  const bloqueadas = new Map<string, string[]>();

  // Criar mapa rápido de status por ID
  const statusMap = new Map<string, string>();
  for (const tarefa of tarefas) {
    statusMap.set(tarefa.id, tarefa.status);
  }

  for (const tarefa of tarefas) {
    const bloqueadaPor = tarefa.bloqueada_por || [];

    if (bloqueadaPor.length === 0) {
      bloqueadas.set(tarefa.id, []);
      continue;
    }

    // Verificar quais dependências ainda não foram concluídas
    const dependenciasAtivas = bloqueadaPor.filter(depId => {
      const status = statusMap.get(depId);
      return status !== 'concluida';
    });

    bloqueadas.set(tarefa.id, dependenciasAtivas);
  }

  return bloqueadas;
}

/**
 * Verifica se uma tarefa pode ser iniciada (não está bloqueada)
 *
 * @param tarefa - Tarefa a verificar
 * @param tarefas - Lista de todas as tarefas
 * @returns true se pode ser iniciada, false se está bloqueada
 */
export function podeTarefaSerIniciada(
  tarefa: Tarefa,
  tarefas: Tarefa[]
): boolean {
  const bloqueadas = calcularTarefasBloqueadas(tarefas);
  const dependenciasAtivas = bloqueadas.get(tarefa.id) || [];
  return dependenciasAtivas.length === 0;
}

/**
 * Atualiza automaticamente o status de tarefas bloqueadas quando suas dependências são concluídas
 *
 * @param tarefas - Lista de todas as tarefas
 * @returns Array de IDs de tarefas que devem ter status alterado de 'bloqueada' para 'pendente'
 */
export function calcularTarefasDesbloqueadas(
  tarefas: Tarefa[]
): string[] {
  const bloqueadas = calcularTarefasBloqueadas(tarefas);
  const desbloqueadas: string[] = [];

  for (const tarefa of tarefas) {
    // Se a tarefa está marcada como 'bloqueada' mas não tem mais dependências ativas
    if (tarefa.status === 'bloqueada') {
      const dependenciasAtivas = bloqueadas.get(tarefa.id) || [];
      if (dependenciasAtivas.length === 0) {
        desbloqueadas.push(tarefa.id);
      }
    }
  }

  return desbloqueadas;
}

/**
 * Valida se uma lista de dependências é válida
 *
 * @param tarefaId - ID da tarefa
 * @param dependencias - Array de IDs de dependências
 * @param tarefas - Lista de todas as tarefas
 * @returns Objeto com { valido: boolean, erro?: string }
 */
export function validarDependencias(
  tarefaId: string,
  dependencias: string[],
  tarefas: Tarefa[]
): { valido: boolean; erro?: string } {
  // Não pode depender de si mesma
  if (dependencias.includes(tarefaId)) {
    return {
      valido: false,
      erro: 'Uma tarefa não pode depender de si mesma',
    };
  }

  // Todas as dependências devem existir
  const idsExistentes = new Set(tarefas.map(t => t.id));
  for (const depId of dependencias) {
    if (!idsExistentes.has(depId)) {
      return {
        valido: false,
        erro: `Tarefa de dependência ${depId} não encontrada`,
      };
    }
  }

  // Não pode criar ciclos
  if (verificarCicloDependencias(tarefas, tarefaId, dependencias)) {
    return {
      valido: false,
      erro: 'Esta dependência criaria um ciclo de dependências',
    };
  }

  return { valido: true };
}
