'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { EmailStatus } from '@/lib/types/database'

export interface EmailFiltersState {
  status: EmailStatus | 'all'
  categoria: string | 'all'
}

interface EmailFiltersProps {
  filters: EmailFiltersState
  onFiltersChange: (filters: EmailFiltersState) => void
  categorias: string[]
}

const STATUS_OPTIONS: { value: EmailStatus | 'all', label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'aguardando_revisao', label: 'Aguardando Revisão' },
  { value: 'processando', label: 'Processando' },
  { value: 'nao_processado', label: 'Não Processado' },
  { value: 'processado', label: 'Processado' },
  { value: 'erro', label: 'Erro' },
  { value: 'ignorado', label: 'Ignorado' },
]

export function EmailFilters({ filters, onFiltersChange, categorias }: EmailFiltersProps) {
  const hasActiveFilters = filters.status !== 'all' || filters.categoria !== 'all'

  const handleClearFilters = () => {
    onFiltersChange({
      status: 'all',
      categoria: 'all',
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Filtros:</span>

      {/* Filtro de Status */}
      <Select
        value={filters.status}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, status: value as EmailStatus | 'all' })
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro de Categoria */}
      <Select
        value={filters.categoria}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, categoria: value })
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {categorias.map((categoria) => (
            <SelectItem key={categoria} value={categoria}>
              {categoria}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botão Limpar Filtros */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-8"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
