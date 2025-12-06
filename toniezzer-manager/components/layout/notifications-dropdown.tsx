'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, DollarSign, Calendar, AlertTriangle, MessageSquare } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { Notificacao } from '@/lib/types/database'

const iconMap: Record<string, React.ElementType> = {
  orcamento_80: DollarSign,
  orcamento_100: AlertTriangle,
  etapa_atrasada: Calendar,
  etapa_aguardando: Calendar,
  mencao: MessageSquare,
  gasto_aprovacao: DollarSign,
  sistema: Bell,
}

const colorMap: Record<string, string> = {
  orcamento_80: 'text-yellow-500',
  orcamento_100: 'text-red-500',
  etapa_atrasada: 'text-red-500',
  etapa_aguardando: 'text-blue-500',
  mencao: 'text-purple-500',
  gasto_aprovacao: 'text-green-500',
  sistema: 'text-gray-500',
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notificacao[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = createClient()

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.lida).length || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notificacoes')
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq('id', id)

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, lida: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.lida).map(n => n.id)
      
      if (unreadIds.length === 0) return

      await supabase
        .from('notificacoes')
        .update({ lida: true, lida_em: new Date().toISOString() })
        .in('id', unreadIds)

      setNotifications(prev => prev.map(n => ({ ...n, lida: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('notificacoes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        (payload) => {
          setNotifications(prev => [payload.new as Notificacao, ...prev.slice(0, 9)])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificacoes</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificacoes</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificacao
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => {
              const Icon = iconMap[notification.tipo] || Bell
              const colorClass = colorMap[notification.tipo] || 'text-gray-500'

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => {
                    if (!notification.lida) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <div className={`mt-0.5 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm font-medium leading-none ${!notification.lida ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.mensagem}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.lida && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                  )}
                </DropdownMenuItem>
              )
            })}
          </div>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notificacoes" className="w-full text-center text-sm text-primary">
            Ver todas
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

