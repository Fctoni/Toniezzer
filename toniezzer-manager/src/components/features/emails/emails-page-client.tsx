'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmailsTable } from '@/components/features/emails/emails-table'
import { EmailFilters, type EmailFiltersState } from '@/components/features/emails/email-filters'
import { Mail, Search, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { fetchEmails } from '@/lib/services/emails-monitorados'
import type { Tables } from '@/lib/types/database'

interface EmailsPageClientProps {
  initialEmails: Tables<'emails_monitorados'>[]
}

export function EmailsPageClient({ initialEmails }: EmailsPageClientProps) {
  const [emails, setEmails] = useState(initialEmails)
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [filters, setFilters] = useState<EmailFiltersState>({
    status: 'all',
    categoria: 'all',
  })

  const loadEmails = async () => {
    try {
      const supabase = createClient()
      const data = await fetchEmails(supabase)
      setEmails(data)
    } catch (error) {
      console.error('Erro ao carregar emails:', error)
      toast.error('Erro ao carregar emails')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
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

  // Extrair categorias únicas dos emails
  const categorias = useMemo(() => {
    const cats = new Set<string>()
    emails.forEach(email => {
      const dados = email.dados_extraidos as Record<string, unknown> | null
      const categoria = dados?.categoria_sugerida
      if (typeof categoria === 'string') cats.add(categoria)
    })
    return Array.from(cats).sort()
  }, [emails])

  // Aplicar filtros
  const emailsFiltrados = useMemo(() => {
    return emails.filter(email => {
      const matchSearch =
        email.assunto.toLowerCase().includes(search.toLowerCase()) ||
        email.remetente.toLowerCase().includes(search.toLowerCase()) ||
        email.remetente_nome?.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (filters.status === 'all') {
        if (email.status === 'ignorado') return false
      } else {
        if (email.status !== filters.status) return false
      }

      if (filters.categoria !== 'all') {
        const dadosEmail = email.dados_extraidos as Record<string, unknown> | null
        const emailCategoria = dadosEmail?.categoria_sugerida
        if (emailCategoria !== filters.categoria) return false
      }

      return true
    })
  }, [emails, search, filters])

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

      {/* Filtros */}
      <EmailFilters
        filters={filters}
        onFiltersChange={setFilters}
        categorias={categorias}
      />

      {/* Tabela */}
      {emails.length === 0 ? (
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
        <EmailsTable emails={emailsFiltrados} />
      )}

      {/* Info */}
      <div className="text-xs text-muted-foreground text-center">
        💡 O sistema verifica novos emails automaticamente a cada 15 minutos.
      </div>
    </div>
  )
}
