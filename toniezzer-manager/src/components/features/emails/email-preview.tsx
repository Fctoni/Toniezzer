'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mail, Paperclip, Calendar, Download, ExternalLink } from 'lucide-react'
import type { Tables } from '@/lib/types/database'

type Email = Tables<'emails_monitorados'>

interface EmailPreviewProps {
  email: Email
}

export function EmailPreview({ email }: EmailPreviewProps) {
  const anexos = email.anexos as Array<{
    nome: string
    url_storage: string
    tipo: string
    tamanho?: number
  }> | null

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Original
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metadados */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">De:</span>
            <span className="font-medium">
              {email.remetente_nome ? `${email.remetente_nome} <${email.remetente}>` : email.remetente}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assunto:</span>
            <span className="font-medium truncate max-w-[200px]">{email.assunto}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Recebido:</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(email.data_recebimento)}
            </span>
          </div>
        </div>

        {/* Corpo do email */}
        <div className="border rounded-lg">
          <div className="p-2 bg-muted/50 border-b text-xs text-muted-foreground">
            Conteúdo do Email
          </div>
          <ScrollArea className="h-[200px] p-3">
            {email.corpo ? (
              <div className="text-sm whitespace-pre-wrap">
                {email.corpo}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Corpo do email não disponível
              </p>
            )}
          </ScrollArea>
        </div>

        {/* Anexos */}
        {anexos && anexos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexos ({anexos.length})
            </h4>
            <div className="space-y-2">
              {anexos.map((anexo, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">
                      {anexo.tipo?.includes('pdf') ? '📄' : 
                       anexo.tipo?.includes('image') ? '🖼️' : 
                       anexo.tipo?.includes('xml') ? '📋' : '📎'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{anexo.nome}</p>
                      {anexo.tamanho && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(anexo.tamanho)}
                        </p>
                      )}
                    </div>
                  </div>
                  {anexo.url_storage && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={anexo.url_storage} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Erro */}
        {email.erro_mensagem && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Erro:</strong> {email.erro_mensagem}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

