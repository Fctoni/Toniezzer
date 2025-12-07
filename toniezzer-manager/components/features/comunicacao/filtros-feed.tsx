'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Filter } from 'lucide-react'
import type { Etapa, User, FeedTipo } from '@/lib/types/database'

interface FiltrosFeedProps {
  onFilterChange: (filtros: FiltrosState) => void
}

export interface FiltrosState {
  tipo: FeedTipo | 'todos'
  autorId: string | 'todos'
  etapaId: string | 'todos'
}

const tiposPost = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'post', label: 'Posts' },
  { value: 'decisao', label: 'Decisões' },
  { value: 'alerta', label: 'Alertas' },
  { value: 'sistema', label: 'Sistema' },
]

export function FiltrosFeed({ onFilterChange }: FiltrosFeedProps) {
  const [etapas, setEtapas] = useState<Etapa[]>([])
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [filtros, setFiltros] = useState<FiltrosState>({
    tipo: 'todos',
    autorId: 'todos',
    etapaId: 'todos',
  })
  const [showFilters, setShowFilters] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: etapasData }, { data: usuariosData }] = await Promise.all([
        supabase.from('etapas').select('*').order('ordem'),
        supabase.from('users').select('*').eq('ativo', true).order('nome_completo'),
      ])

      if (etapasData) setEtapas(etapasData)
      if (usuariosData) setUsuarios(usuariosData)
    }
    fetchData()
  }, [])

  const handleFilterChange = (key: keyof FiltrosState, value: string) => {
    const newFiltros = { ...filtros, [key]: value }
    setFiltros(newFiltros)
    onFilterChange(newFiltros)
  }

  const clearFilters = () => {
    const defaultFiltros: FiltrosState = {
      tipo: 'todos',
      autorId: 'todos',
      etapaId: 'todos',
    }
    setFiltros(defaultFiltros)
    onFilterChange(defaultFiltros)
  }

  const hasActiveFilters = 
    filtros.tipo !== 'todos' || 
    filtros.autorId !== 'todos' || 
    filtros.etapaId !== 'todos'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
              {[filtros.tipo, filtros.autorId, filtros.etapaId].filter(f => f !== 'todos').length}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
          {/* Filtro por tipo */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Tipo de Post
            </label>
            <Select
              value={filtros.tipo}
              onValueChange={(value) => handleFilterChange('tipo', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposPost.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por autor */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Autor
            </label>
            <Select
              value={filtros.autorId}
              onValueChange={(value) => handleFilterChange('autorId', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os autores</SelectItem>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    {usuario.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por etapa */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Etapa Relacionada
            </label>
            <Select
              value={filtros.etapaId}
              onValueChange={(value) => handleFilterChange('etapaId', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as etapas</SelectItem>
                {etapas.map((etapa) => (
                  <SelectItem key={etapa.id} value={etapa.id}>
                    {etapa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}

