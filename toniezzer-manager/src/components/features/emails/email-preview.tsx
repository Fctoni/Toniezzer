'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { Mail, Paperclip, Calendar, Download, Eye, ExternalLink, Loader2, Bug } from 'lucide-react'
import type { Tables } from '@/lib/types/database'

type Email = Tables<'emails_monitorados'>

interface EmailPreviewProps {
  email: Email
}

export function EmailPreview({ email }: EmailPreviewProps) {
  const [loadingAnexo, setLoadingAnexo] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showRawResponse, setShowRawResponse] = useState(false)
  
  const dadosExtraidos = email.dados_extraidos as {
    _gemini_raw?: string
  } | null
  
  const anexos = email.anexos as Array<{
    nome: string
    tipo: string
    tamanho?: number
    part: string
    uid: number
    storage_path?: string
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

  const getAnexoUrl = (anexo: { uid: number; part: string; tipo: string; nome: string; storage_path?: string }) => {
    const params = new URLSearchParams({
      tipo: anexo.tipo,
      nome: anexo.nome,
    })
    if (anexo.storage_path) {
      params.set('storage_path', anexo.storage_path)
    }
    params.set('uid', String(anexo.uid))
    params.set('part', anexo.part)
    return `/api/emails/attachment?${params.toString()}`
  }

  const handlePreview = async (anexo: { uid: number; part: string; tipo: string; nome: string; storage_path?: string }) => {
    setLoadingAnexo(anexo.nome)
    try {
      const url = getAnexoUrl(anexo)
      setPreviewUrl(url)
    } finally {
      setLoadingAnexo(null)
    }
  }

  const isImage = (tipo: string) => tipo?.includes('image')
  const isPdf = (tipo: string) => tipo?.includes('pdf')

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

        {/* Mensagem (corpo do email) */}
        {email.corpo && (
          <div className="border rounded-lg">
            <div className="p-2 bg-muted/50 border-b text-xs text-muted-foreground">
              Mensagem
            </div>
            <ScrollArea className="h-[150px] p-3">
              <div className="text-sm whitespace-pre-wrap">
                {email.corpo}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Anexos */}
        {anexos && anexos.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexos ({anexos.length})
            </h4>
            <div className="space-y-2">
              {anexos.map((anexo, index) => (
                <div 
                  key={index}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Preview de imagem inline */}
                  {isImage(anexo.tipo) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button 
                          className="w-full cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handlePreview(anexo)}
                        >
                          <div className="relative bg-muted/50 flex items-center justify-center min-h-[150px]">
                            {loadingAnexo === anexo.nome ? (
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={getAnexoUrl(anexo)}
                                alt={anexo.nome}
                                className="max-h-[200px] w-auto object-contain"
                                loading="lazy"
                              />
                            )}
                          </div>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>{anexo.nome}</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center p-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getAnexoUrl(anexo)}
                            alt={anexo.nome}
                            className="max-h-[70vh] w-auto object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {/* Info do anexo */}
                  <div className="flex items-center justify-between p-2 bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">
                        {isPdf(anexo.tipo) ? '📄' : 
                         isImage(anexo.tipo) ? '🖼️' : 
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
                    <div className="flex gap-1">
                      {/* Botão ver em nova aba */}
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={getAnexoUrl(anexo)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title="Abrir em nova aba"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      {/* Botão download */}
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={getAnexoUrl(anexo)} 
                          download={anexo.nome}
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sem anexos */}
        {(!anexos || anexos.length === 0) && (
          <div className="text-center py-6 text-muted-foreground">
            <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum anexo encontrado</p>
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

        {/* Botão para ver resposta bruta do Gemini */}
        {dadosExtraidos?._gemini_raw && (
          <Dialog open={showRawResponse} onOpenChange={setShowRawResponse}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Bug className="h-4 w-4" />
                Ver resposta bruta da IA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Resposta bruta do Gemini</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh]">
                <pre className="bg-muted p-4 rounded text-xs whitespace-pre-wrap font-mono">
                  {dadosExtraidos._gemini_raw}
                </pre>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
