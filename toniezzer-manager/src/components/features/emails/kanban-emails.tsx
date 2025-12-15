'use client'

import { useState } from 'react'
import { EmailCard } from './email-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { Tables, EmailStatus } from '@/lib/types/database'

type Email = Tables<'emails_monitorados'>

interface KanbanEmailsProps {
  emails: Email[]
  onIgnorar: (id: string) => Promise<void>
}

interface Column {
  id: EmailStatus[]
  title: string
  icon: string
  color: string
}

const columns: Column[] = [
  {
    id: ['nao_processado', 'processando', 'erro'],
    title: 'Não Processados',
    icon: '📥',
    color: 'border-gray-300'
  },
  {
    id: ['aguardando_revisao'],
    title: 'Aguardando Revisão',
    icon: '⚠️',
    color: 'border-yellow-400'
  },
  {
    id: ['processado', 'ignorado'],
    title: 'Processados',
    icon: '✅',
    color: 'border-green-400'
  }
]

export function KanbanEmails({ emails, onIgnorar }: KanbanEmailsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleIgnorar = async (id: string) => {
    setLoadingId(id)
    try {
      await onIgnorar(id)
    } finally {
      setLoadingId(null)
    }
  }

  const getEmailsForColumn = (statusList: EmailStatus[]) => {
    return emails.filter(email => statusList.includes(email.status as EmailStatus))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-250px)]">
      {columns.map((column) => {
        const columnEmails = getEmailsForColumn(column.id)
        
        return (
          <div 
            key={column.title}
            className={`flex flex-col bg-muted/30 rounded-lg border-t-4 ${column.color}`}
          >
            {/* Header da Coluna */}
            <div className="p-3 border-b bg-background/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <span>{column.icon}</span>
                  {column.title}
                </h3>
                <Badge variant="secondary">
                  {columnEmails.length}
                </Badge>
              </div>
            </div>

            {/* Cards */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {columnEmails.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum email
                  </div>
                ) : (
                  columnEmails.map((email) => (
                    <EmailCard
                      key={email.id}
                      email={email}
                      onIgnorar={
                        email.status !== 'processado' && email.status !== 'ignorado'
                          ? handleIgnorar
                          : undefined
                      }
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}

