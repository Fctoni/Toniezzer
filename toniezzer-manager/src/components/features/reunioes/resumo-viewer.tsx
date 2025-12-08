'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, Users } from 'lucide-react'

interface ResumoViewerProps {
  titulo: string
  data: string
  participantes?: string[]
  markdown: string
}

export function ResumoViewer({ titulo, data, participantes, markdown }: ResumoViewerProps) {
  // Renderização simples de Markdown para HTML
  const renderMarkdown = (text: string) => {
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Lists
      .replace(/^\- \[ \] (.*$)/gim, '<li class="flex items-start gap-2"><span class="mt-1">☐</span><span>$1</span></li>')
      .replace(/^\- \[x\] (.*$)/gim, '<li class="flex items-start gap-2"><span class="mt-1">✅</span><span>$1</span></li>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
      // Line breaks
      .replace(/\n/gim, '<br />')
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3">
          <CardTitle className="text-xl">{titulo}</CardTitle>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(data)}</span>
            </div>
            {participantes && participantes.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <div className="flex flex-wrap gap-1">
                  {participantes.map((p, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
          />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

