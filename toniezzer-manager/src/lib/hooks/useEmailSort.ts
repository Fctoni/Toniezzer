'use client'

import { useState, useMemo } from 'react'
import type { Tables } from '@/lib/types/database'

type Email = Tables<'emails_monitorados'>

export type SortColumn = 'status' | 'data_recebimento' | 'remetente' | 'assunto' | 'valor'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  column: SortColumn
  direction: SortDirection
}

interface UseEmailSortReturn {
  sortConfigs: SortConfig[]
  handleHeaderClick: (column: SortColumn, shiftPressed: boolean) => void
  sortedEmails: Email[]
}

const STATUS_PRIORITY: Record<string, number> = {
  'aguardando_revisao': 1,
  'processando': 2,
  'nao_processado': 3,
  'erro': 4,
  'processado': 5,
  'ignorado': 6,
}

export function useEmailSort(emails: Email[]): UseEmailSortReturn {
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([
    { column: 'status', direction: 'asc' },
    { column: 'data_recebimento', direction: 'desc' }
  ])

  const handleHeaderClick = (column: SortColumn, shiftPressed: boolean) => {
    setSortConfigs(prev => {
      // Se já existe ordenação nessa coluna
      const existingIndex = prev.findIndex(config => config.column === column)

      if (shiftPressed) {
        // Shift+Click: adiciona ordenação hierárquica
        if (existingIndex >= 0) {
          // Alterna direção da coluna existente
          const newConfigs = [...prev]
          newConfigs[existingIndex] = {
            ...newConfigs[existingIndex],
            direction: newConfigs[existingIndex].direction === 'asc' ? 'desc' : 'asc'
          }
          return newConfigs
        } else {
          // Adiciona nova coluna à hierarquia
          return [...prev, { column, direction: 'asc' }]
        }
      } else {
        // Click simples: substitui ordenação
        if (existingIndex === 0 && prev.length === 1) {
          // Se é a única coluna, apenas alterna direção
          return [{ column, direction: prev[0].direction === 'asc' ? 'desc' : 'asc' }]
        } else {
          // Substitui por ordenação única nesta coluna
          return [{ column, direction: 'asc' }]
        }
      }
    })
  }

  const sortedEmails = useMemo(() => {
    if (sortConfigs.length === 0) return emails

    return [...emails].sort((a, b) => {
      for (const config of sortConfigs) {
        let comparison = 0

        switch (config.column) {
          case 'status': {
            const priorityA = STATUS_PRIORITY[a.status] || 999
            const priorityB = STATUS_PRIORITY[b.status] || 999
            comparison = priorityA - priorityB
            break
          }
          case 'data_recebimento': {
            const dateA = new Date(a.data_recebimento).getTime()
            const dateB = new Date(b.data_recebimento).getTime()
            comparison = dateA - dateB
            break
          }
          case 'remetente': {
            const remetenteA = a.remetente_nome || a.remetente
            const remetenteB = b.remetente_nome || b.remetente
            comparison = remetenteA.localeCompare(remetenteB)
            break
          }
          case 'assunto': {
            comparison = a.assunto.localeCompare(b.assunto)
            break
          }
          case 'valor': {
            const valorA = (a.dados_extraidos as any)?.valor || 0
            const valorB = (b.dados_extraidos as any)?.valor || 0
            comparison = valorA - valorB
            break
          }
        }

        if (comparison !== 0) {
          return config.direction === 'asc' ? comparison : -comparison
        }
      }

      return 0
    })
  }, [emails, sortConfigs])

  return {
    sortConfigs,
    handleHeaderClick,
    sortedEmails
  }
}
