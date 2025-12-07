'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { FornecedorCard } from '@/components/features/fornecedores/fornecedor-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Plus, 
  Search, 
  Loader2,
  Filter,
  Inbox
} from 'lucide-react'
import type { Fornecedor } from '@/lib/types/database'

const tiposFornecedor = [
  'Todos',
  'Empreiteiro',
  'Fornecedor de Material',
  'Prestador de Serviço',
  'Arquiteto',
  'Engenheiro',
  'Eletricista',
  'Encanador',
  'Pintor',
  'Pedreiro',
  'Serralheiro',
  'Vidraceiro',
  'Marceneiro',
  'Outros',
]

export default function FornecedoresPage() {
  const { can, isLoading: permissionsLoading } = usePermissions()
  const [fornecedores, setFornecedores] = useState<(Fornecedor & { total_pagamentos?: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('Todos')
  const [showInativos, setShowInativos] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchFornecedores = async () => {
      setIsLoading(true)
      try {
        // Buscar fornecedores
        let query = supabase
          .from('fornecedores')
          .select('*')
          .order('nome')

        if (!showInativos) {
          query = query.eq('ativo', true)
        }

        const { data: fornecedoresData, error } = await query

        if (error) throw error

        // Buscar total de pagamentos para cada fornecedor
        if (fornecedoresData && fornecedoresData.length > 0) {
          const fornecedoresIds = fornecedoresData.map(f => f.id)
          
          const { data: gastosData } = await supabase
            .from('gastos')
            .select('fornecedor_id, valor')
            .in('fornecedor_id', fornecedoresIds)
            .eq('status', 'aprovado')

          // Calcular total por fornecedor
          const totais = gastosData?.reduce((acc, g) => {
            acc[g.fornecedor_id] = (acc[g.fornecedor_id] || 0) + Number(g.valor)
            return acc
          }, {} as Record<string, number>) || {}

          const fornecedoresComTotal = fornecedoresData.map(f => ({
            ...f,
            total_pagamentos: totais[f.id] || 0
          }))

          setFornecedores(fornecedoresComTotal)
        } else {
          setFornecedores([])
        }
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFornecedores()
  }, [showInativos])

  // Filtrar fornecedores
  const fornecedoresFiltrados = fornecedores.filter(f => {
    const matchesSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.especialidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTipo = tipoFiltro === 'Todos' || f.tipo === tipoFiltro

    return matchesSearch && matchesTipo
  })

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!can.verFornecedores()) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para visualizar fornecedores.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Fornecedores</h1>
            <p className="text-sm text-muted-foreground">
              {fornecedoresFiltrados.length} fornecedor{fornecedoresFiltrados.length !== 1 ? 'es' : ''} cadastrado{fornecedoresFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {can.criarFornecedor() && (
          <Link href="/fornecedores/novo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, especialidade ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tiposFornecedor.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showInativos ? 'secondary' : 'outline'}
            onClick={() => setShowInativos(!showInativos)}
          >
            {showInativos ? 'Ocultar Inativos' : 'Mostrar Inativos'}
          </Button>
        </div>
      </div>

      {/* Lista de fornecedores */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : fornecedoresFiltrados.length === 0 ? (
        <Card className="p-8 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum fornecedor encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || tipoFiltro !== 'Todos'
              ? 'Tente ajustar os filtros para ver mais resultados.'
              : 'Cadastre seu primeiro fornecedor.'
            }
          </p>
          {can.criarFornecedor() && !searchTerm && tipoFiltro === 'Todos' && (
            <Link href="/fornecedores/novo">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Fornecedor
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedoresFiltrados.map((fornecedor) => (
            <FornecedorCard key={fornecedor.id} fornecedor={fornecedor} />
          ))}
        </div>
      )}
    </div>
  )
}

