'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useEmailSort, type SortColumn } from '@/lib/hooks/useEmailSort'
import type { Tables, EmailStatus } from '@/lib/types/database'

type Email = Tables<'emails_monitorados'>

interface EmailsTableProps {
  emails: Email[]
}

const STATUS_CONFIG: Record<EmailStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: string }> = {
  'aguardando_revisao': { label: 'Aguardando Revisão', variant: 'destructive', icon: '⚠️' },
  'processando': { label: 'Processando', variant: 'default', icon: '🔄' },
  'nao_processado': { label: 'Não Processado', variant: 'secondary', icon: '📥' },
  'processado': { label: 'Processado', variant: 'outline', icon: '✅' },
  'erro': { label: 'Erro', variant: 'destructive', icon: '❌' },
  'ignorado': { label: 'Ignorado', variant: 'secondary', icon: '🚫' },
}

export function EmailsTable({ emails }: EmailsTableProps) {
  const router = useRouter()
  const { sortConfigs, handleHeaderClick, sortedEmails } = useEmailSort(emails)

  const handleRowClick = (emailId: string) => {
    router.push(`/emails/${emailId}`)
  }

  const getSortIcon = (column: SortColumn) => {
    const config = sortConfigs.find(c => c.column === column)
    if (!config) return null

    return config.direction === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline" />
    )
  }

  const handleHeaderClickWrapper = (column: SortColumn, e: React.MouseEvent) => {
    handleHeaderClick(column, e.shiftKey)
  }

  const formatValor = (dadosExtraidos: any) => {
    const valor = dadosExtraidos?.valor
    if (!valor) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto" style={{ minWidth: '650px' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[170px] cursor-pointer hover:bg-muted/50"
                onClick={(e) => handleHeaderClickWrapper('status', e)}
              >
                Status {getSortIcon('status')}
              </TableHead>
              <TableHead
                className="w-[140px] cursor-pointer hover:bg-muted/50"
                onClick={(e) => handleHeaderClickWrapper('data_recebimento', e)}
              >
                Data {getSortIcon('data_recebimento')}
              </TableHead>
              <TableHead
                className="w-[220px] cursor-pointer hover:bg-muted/50"
                onClick={(e) => handleHeaderClickWrapper('remetente', e)}
              >
                Remetente {getSortIcon('remetente')}
              </TableHead>
              <TableHead
                className="flex-1 cursor-pointer hover:bg-muted/50"
                onClick={(e) => handleHeaderClickWrapper('assunto', e)}
              >
                Assunto {getSortIcon('assunto')}
              </TableHead>
              <TableHead
                className="w-[120px] text-right cursor-pointer hover:bg-muted/50"
                onClick={(e) => handleHeaderClickWrapper('valor', e)}
              >
                Valor {getSortIcon('valor')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEmails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum email encontrado
                </TableCell>
              </TableRow>
            ) : (
              sortedEmails.map((email) => {
                const statusConfig = STATUS_CONFIG[email.status as EmailStatus] || STATUS_CONFIG['nao_processado']
                const remetenteDisplay = email.remetente_nome || email.remetente

                return (
                  <TableRow
                    key={email.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(email.id)}
                  >
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        <span>{statusConfig.icon}</span>
                        <span>{statusConfig.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(email.data_recebimento), 'dd/MM HH:mm')}
                    </TableCell>
                    <TableCell className="truncate max-w-[220px]" title={remetenteDisplay}>
                      {remetenteDisplay}
                    </TableCell>
                    <TableCell className="truncate" title={email.assunto}>
                      {email.assunto}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatValor(email.dados_extraidos)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
