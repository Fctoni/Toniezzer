'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Bell, 
  Check, 
  CheckCheck,
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  MessageSquare,
  Loader2,
  Inbox,
  ExternalLink,
  Filter,
  Trash2
} from 'lucide-react'
import { formatDateTime, cn } from '@/lib/utils'
import type { Notificacao, NotificacaoTipo } from '@/lib/types/database'
import Link from 'next/link'

const tipoConfig: Record<NotificacaoTipo, { icon: React.ElementType; color: string; label: string }> = {
  orcamento_80: { icon: DollarSign, color: 'text-yellow-500 bg-yellow-500/10', label: 'Orçamento 80%' },
  orcamento_100: { icon: AlertTriangle, color: 'text-red-500 bg-red-500/10', label: 'Orçamento 100%' },
  etapa_atrasada: { icon: Calendar, color: 'text-red-500 bg-red-500/10', label: 'Etapa Atrasada' },
  etapa_aguardando: { icon: Calendar, color: 'text-blue-500 bg-blue-500/10', label: 'Etapa Aguardando' },
  mencao: { icon: MessageSquare, color: 'text-purple-500 bg-purple-500/10', label: 'Menção' },
  gasto_aprovacao: { icon: DollarSign, color: 'text-green-500 bg-green-500/10', label: 'Gasto p/ Aprovar' },
  mudanca_escopo: { icon: AlertTriangle, color: 'text-orange-500 bg-orange-500/10', label: 'Mudança Escopo' },
  email_novo: { icon: MessageSquare, color: 'text-blue-500 bg-blue-500/10', label: 'Email Novo' },
  tarefa_atribuida: { icon: Calendar, color: 'text-indigo-500 bg-indigo-500/10', label: 'Tarefa Atribuída' },
  sistema: { icon: Bell, color: 'text-gray-500 bg-gray-500/10', label: 'Sistema' },
}

const filtroOpcoes = [
  { value: 'todas', label: 'Todas as notificações' },
  { value: 'nao_lidas', label: 'Não lidas' },
  { value: 'lidas', label: 'Lidas' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'etapa', label: 'Etapas' },
  { value: 'mencao', label: 'Menções' },
  { value: 'sistema', label: 'Sistema' },
]

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const supabase = createClient()

  const fetchNotificacoes = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setNotificacoes(data || [])
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotificacoes()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('notificacoes_page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        (payload) => {
          setNotificacoes(prev => [payload.new as Notificacao, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filtrar notificações
  const notificacoesFiltradas = notificacoes.filter(n => {
    switch (filtro) {
      case 'nao_lidas':
        return !n.lida
      case 'lidas':
        return n.lida
      case 'orcamento':
        return n.tipo === 'orcamento_80' || n.tipo === 'orcamento_100'
      case 'etapa':
        return n.tipo === 'etapa_atrasada' || n.tipo === 'etapa_aguardando'
      case 'mencao':
        return n.tipo === 'mencao'
      case 'sistema':
        return n.tipo === 'sistema'
      default:
        return true
    }
  })

  const naoLidasCount = notificacoes.filter(n => !n.lida).length

  const marcarComoLida = async (id: string) => {
    try {
      await supabase
        .from('notificacoes')
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq('id', id)

      setNotificacoes(prev =>
        prev.map(n => (n.id === id ? { ...n, lida: true, lida_em: new Date().toISOString() } : n))
      )
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const marcarTodasComoLidas = async () => {
    try {
      const naoLidas = notificacoes.filter(n => !n.lida).map(n => n.id)
      if (naoLidas.length === 0) return

      await supabase
        .from('notificacoes')
        .update({ lida: true, lida_em: new Date().toISOString() })
        .in('id', naoLidas)

      setNotificacoes(prev =>
        prev.map(n => ({ ...n, lida: true, lida_em: new Date().toISOString() }))
      )
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  const excluirSelecionadas = async () => {
    if (selectedIds.length === 0 || !confirm(`Excluir ${selectedIds.length} notificação(ões)?`)) return

    try {
      await supabase
        .from('notificacoes')
        .delete()
        .in('id', selectedIds)

      setNotificacoes(prev => prev.filter(n => !selectedIds.includes(n.id)))
      setSelectedIds([])
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === notificacoesFiltradas.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(notificacoesFiltradas.map(n => n.id))
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              {naoLidasCount > 0 
                ? `${naoLidasCount} não lida${naoLidasCount > 1 ? 's' : ''}`
                : 'Todas lidas'
              }
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {naoLidasCount > 0 && (
            <Button variant="outline" onClick={marcarTodasComoLidas} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filtroOpcoes.map((opcao) => (
                <SelectItem key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selecionada{selectedIds.length > 1 ? 's' : ''}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={excluirSelecionadas}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        )}
      </div>

      {/* Lista de Notificações */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notificacoesFiltradas.length === 0 ? (
        <Card className="p-8 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
          <p className="text-sm text-muted-foreground">
            {filtro !== 'todas'
              ? 'Tente ajustar o filtro para ver mais resultados.'
              : 'Você será notificado quando houver novidades.'
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Seletor de todos */}
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
            <input
              type="checkbox"
              checked={selectedIds.length === notificacoesFiltradas.length && notificacoesFiltradas.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm text-muted-foreground">
              Selecionar todas
            </span>
          </div>

          {notificacoesFiltradas.map((notificacao) => {
            const config = tipoConfig[notificacao.tipo]
            const Icon = config.icon

            return (
              <Card
                key={notificacao.id}
                className={cn(
                  'transition-colors cursor-pointer hover:bg-muted/50',
                  !notificacao.lida && 'border-l-4 border-l-primary bg-primary/5'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notificacao.id)}
                      onChange={() => toggleSelect(notificacao.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-input mt-1"
                    />

                    {/* Ícone */}
                    <div className={cn('p-2 rounded-lg', config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Conteúdo */}
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => {
                        if (!notificacao.lida) marcarComoLida(notificacao.id)
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn(
                          'font-medium text-sm',
                          !notificacao.lida && 'font-semibold'
                        )}>
                          {notificacao.titulo}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        {!notificacao.lida && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notificacao.mensagem}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDateTime(notificacao.created_at)}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      {notificacao.link && (
                        <Link href={notificacao.link}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => marcarComoLida(notificacao.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

