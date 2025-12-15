'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User, 
  DollarSign,
  AlertTriangle,
  FileText,
  ArrowRight
} from 'lucide-react'
import type { Tables, AcaoTipo, AcaoStatus } from '@/lib/types/database'
import Link from 'next/link'

type Acao = Tables<'reunioes_acoes'>

interface ActionItemsListProps {
  acoes: (Acao & {
    responsavel?: { nome_completo: string } | null
    categoria?: { nome: string; cor: string } | null
  })[]
  onStatusChange?: (id: string, status: AcaoStatus) => Promise<void>
}

const tipoConfig: Record<AcaoTipo, { label: string; icon: React.ReactNode; color: string }> = {
  decisao: { 
    label: 'Decisão', 
    icon: <CheckCircle2 className="h-4 w-4" />, 
    color: 'bg-blue-100 text-blue-800' 
  },
  tarefa: { 
    label: 'Tarefa', 
    icon: <Circle className="h-4 w-4" />, 
    color: 'bg-purple-100 text-purple-800' 
  },
  gasto: { 
    label: 'Gasto', 
    icon: <DollarSign className="h-4 w-4" />, 
    color: 'bg-green-100 text-green-800' 
  },
  problema: { 
    label: 'Problema', 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: 'bg-red-100 text-red-800' 
  },
  mudanca_escopo: { 
    label: 'Mudança', 
    icon: <FileText className="h-4 w-4" />, 
    color: 'bg-orange-100 text-orange-800' 
  },
}

const statusConfig: Record<AcaoStatus, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
}

export function ActionItemsList({ acoes, onStatusChange }: ActionItemsListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggle = async (acao: Acao) => {
    if (!onStatusChange) return
    
    setLoadingId(acao.id)
    try {
      const newStatus: AcaoStatus = acao.status === 'concluido' ? 'pendente' : 'concluido'
      await onStatusChange(acao.id, newStatus)
    } finally {
      setLoadingId(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return null
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Agrupar por tipo
  const acoesAgrupadas = acoes.reduce((acc, acao) => {
    const tipo = acao.tipo as AcaoTipo
    if (!acc[tipo]) acc[tipo] = []
    acc[tipo].push(acao)
    return acc
  }, {} as Record<AcaoTipo, typeof acoes>)

  if (acoes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum item de ação extraído desta reunião.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {(Object.entries(acoesAgrupadas) as [AcaoTipo, typeof acoes][]).map(([tipo, items]) => (
        <Card key={tipo}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Badge className={tipoConfig[tipo].color}>
                {tipoConfig[tipo].icon}
                <span className="ml-1">{tipoConfig[tipo].label}</span>
              </Badge>
              <span className="text-muted-foreground">({items.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-3">
              {items.map((acao) => (
                <li 
                  key={acao.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    acao.status === 'concluido' ? 'bg-muted/50' : ''
                  }`}
                >
                  {tipo === 'tarefa' && onStatusChange && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 mt-0.5"
                      onClick={() => handleToggle(acao)}
                      disabled={loadingId === acao.id}
                    >
                      {loadingId === acao.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : acao.status === 'concluido' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className={`${acao.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>
                      {acao.descricao}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {acao.responsavel && (
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {acao.responsavel.nome_completo}
                        </Badge>
                      )}
                      
                      {acao.prazo && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(acao.prazo)}
                        </Badge>
                      )}
                      
                      {acao.valor && (
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(acao.valor)}
                        </Badge>
                      )}
                      
                      {acao.categoria && (
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ borderColor: acao.categoria.cor }}
                        >
                          <span 
                            className="w-2 h-2 rounded-full mr-1"
                            style={{ backgroundColor: acao.categoria.cor }}
                          />
                          {acao.categoria.nome}
                        </Badge>
                      )}
                      
                      <Badge className={statusConfig[acao.status as AcaoStatus].color}>
                        {statusConfig[acao.status as AcaoStatus].label}
                      </Badge>
                    </div>
                    
                    {/* Backlinks */}
                    {(acao.gasto_criado_id || acao.compra_criada_id || acao.feed_criado_id) && (
                      <div className="flex gap-2 mt-2">
                        {acao.gasto_criado_id && (
                          <Link href={`/financeiro/lancamentos?id=${acao.gasto_criado_id}`}>
                            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Ver Lançamento
                            </Badge>
                          </Link>
                        )}
                        {acao.compra_criada_id && (
                          <Link href={`/compras/${acao.compra_criada_id}`}>
                            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Ver Compra
                            </Badge>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

