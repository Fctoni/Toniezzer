'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KanbanEmails } from '@/components/features/emails'
import { Mail, Search, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types/database'

export default function EmailsPage() {
  const [emails, setEmails] = useState<Tables<'emails_monitorados'>[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)

  const loadEmails = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('emails_monitorados')
      .select('*')
      .order('data_recebimento', { ascending: false })

    if (error) {
      console.error('Erro ao carregar emails:', error)
      toast.error('Erro ao carregar emails')
      return
    }

    setEmails(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadEmails()
  }, [])

  const handleIgnorar = async (id: string) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('emails_monitorados')
      .update({ status: 'ignorado' })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao ignorar email')
      return
    }

    setEmails(prev => prev.map(e => 
      e.id === id ? { ...e, status: 'ignorado' as const } : e
    ))
    toast.success('Email marcado como ignorado')
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      // 1. Sincronizar emails do servidor IMAP
      toast.info('Conectando ao servidor de emails...')
      
      const syncResponse = await fetch('/api/emails/sync', { method: 'POST' })
      const syncResult = await syncResponse.json()

      if (!syncResponse.ok) {
        console.error('Erro na sincronização:', syncResult)
        toast.error('Erro ao sincronizar', { 
          description: syncResult.error || 'Erro desconhecido' 
        })
        return
      }

      toast.success(`${syncResult.newEmails} novos emails encontrados`)

      // 2. Processar emails com IA (se houver novos)
      if (syncResult.newEmails > 0) {
        toast.info('Processando emails com IA...')
        
        const processResponse = await fetch('/api/emails/process', { method: 'POST' })
        const processResult = await processResponse.json()

        if (processResponse.ok) {
          toast.success('Emails processados!', {
            description: `${processResult.processed} emails analisados pela IA`
          })
        } else {
          toast.warning('Erro ao processar com IA', {
            description: processResult.error
          })
        }
      }

      await loadEmails()

    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro na sincronização')
    } finally {
      setSyncing(false)
    }
  }

  const emailsFiltrados = emails.filter(e =>
    e.assunto.toLowerCase().includes(search.toLowerCase()) ||
    e.remetente.toLowerCase().includes(search.toLowerCase()) ||
    e.remetente_nome?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Emails Monitorados
          </h1>
          <p className="text-muted-foreground">
            Notas fiscais recebidas em casa@toniezzer.com
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por remetente ou assunto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : emailsFiltrados.length === 0 && !search ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum email encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Emails enviados para casa@toniezzer.com aparecerão aqui automaticamente.
          </p>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Verificar Agora
          </Button>
        </div>
      ) : (
        <KanbanEmails emails={emailsFiltrados} onIgnorar={handleIgnorar} />
      )}

      {/* Info */}
      <div className="text-xs text-muted-foreground text-center">
        💡 O sistema verifica novos emails automaticamente a cada 15 minutos.
      </div>
    </div>
  )
}

