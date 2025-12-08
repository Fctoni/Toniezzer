'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Paperclip, Calendar, DollarSign, Eye, X } from 'lucide-react'
import type { Tables, EmailStatus } from '@/lib/types/database'
import Link from 'next/link'

type Email = Tables<'emails_monitorados'>

interface EmailCardProps {
  email: Email
  onIgnorar?: (id: string) => void
}

const statusConfig: Record<EmailStatus, { label: string; color: string; icon: string }> = {
  nao_processado: { label: 'Não Processado', color: 'bg-gray-100 text-gray-800', icon: '⏳' },
  processando: { label: 'Processando', color: 'bg-blue-100 text-blue-800', icon: '🔄' },
  aguardando_revisao: { label: 'Aguardando Revisão', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' },
  processado: { label: 'Processado', color: 'bg-green-100 text-green-800', icon: '✅' },
  erro: { label: 'Erro', color: 'bg-red-100 text-red-800', icon: '❌' },
  ignorado: { label: 'Ignorado', color: 'bg-gray-100 text-gray-500', icon: '🚫' },
}

export function EmailCard({ email, onIgnorar }: EmailCardProps) {
  const config = statusConfig[email.status]
  const anexos = email.anexos as Array<{ nome: string; url_storage: string; tipo: string }> | null
  const dadosExtraidos = email.dados_extraidos as {
    valor?: number
    categoria_sugerida?: string
    confianca?: number
  } | null

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge className={config.color}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </Badge>
          {dadosExtraidos?.confianca && (
            <span className={`text-xs ${
              dadosExtraidos.confianca >= 0.8 ? 'text-green-600' :
              dadosExtraidos.confianca >= 0.6 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {Math.round(dadosExtraidos.confianca * 100)}% confiança
            </span>
          )}
        </div>

        {/* Remetente e Assunto */}
        <div>
          <p className="text-sm font-medium truncate">
            De: {email.remetente_nome || email.remetente}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {email.assunto}
          </p>
        </div>

        {/* Dados extraídos */}
        {dadosExtraidos?.valor && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-700">
              {formatCurrency(dadosExtraidos.valor)}
            </span>
            {dadosExtraidos.categoria_sugerida && (
              <Badge variant="outline" className="text-xs">
                {dadosExtraidos.categoria_sugerida}
              </Badge>
            )}
          </div>
        )}

        {/* Anexos e Data */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {anexos && anexos.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {anexos.length} anexo{anexos.length > 1 ? 's' : ''}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(email.data_recebimento)}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="default" size="sm" className="flex-1" asChild>
            <Link href={`/emails/${email.id}`}>
              <Eye className="h-3 w-3 mr-1" />
              {email.status === 'aguardando_revisao' ? 'Revisar' : 'Ver'}
            </Link>
          </Button>
          {email.status !== 'processado' && email.status !== 'ignorado' && onIgnorar && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onIgnorar(email.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

