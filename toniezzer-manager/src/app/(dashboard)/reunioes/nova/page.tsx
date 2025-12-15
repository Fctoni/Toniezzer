'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadPlaud } from '@/components/features/reunioes'
import { ArrowLeft, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { toast } from 'sonner'
import { formatDateToString } from '@/lib/utils'

export default function NovaReuniaoPage() {
  const router = useRouter()
  const { currentUser } = useCurrentUser()
  const [titulo, setTitulo] = useState('')
  const [dataReuniao, setDataReuniao] = useState(formatDateToString(new Date()))
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpload = async (content: string, fileName: string) => {
    if (!currentUser) {
      toast.error('Usuário não encontrado')
      return
    }

    // Extrair título do conteúdo se não preenchido
    let tituloFinal = titulo
    if (!tituloFinal) {
      const match = content.match(/^#\s+(.+)$/m)
      tituloFinal = match ? match[1] : fileName.replace(/\.(md|txt)$/, '')
    }

    // Extrair data do conteúdo se possível
    const dateMatch = content.match(/Data:\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/)
    let dataFinal = dataReuniao
    if (dateMatch) {
      const dateStr = dateMatch[1]
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/')
        dataFinal = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      } else {
        dataFinal = dateStr
      }
    }

    // Extrair participantes
    const participantesMatch = content.match(/## Participantes\n([\s\S]*?)(?=\n##|$)/)
    let participantes: string[] = []
    if (participantesMatch) {
      participantes = participantesMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean)
    }

    setIsProcessing(true)

    try {
      const supabase = createClient()
      
      // 1. Criar a reunião
      const { data: reuniao, error: reuniaoError } = await supabase
        .from('reunioes')
        .insert({
          titulo: tituloFinal,
          data_reuniao: dataFinal,
          participantes: participantes.length > 0 ? participantes : null,
          resumo_markdown: content,
          created_by: currentUser.id,
        })
        .select()
        .single()

      if (reuniaoError) throw reuniaoError

      // 2. Processar com IA via API Route
      try {
        const response = await fetch('/api/plaud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            markdown: content,
            reuniao_id: reuniao.id,
            autor_id: currentUser.id,
          })
        })

        const processedData = await response.json()

        if (!response.ok || !processedData.success) {
          console.warn('Processamento de IA falhou:', processedData.error)
          toast.warning('Reunião criada, mas processamento de IA falhou', {
            description: processedData.error || 'As ações podem ser adicionadas manualmente.'
          })
        } else {
          toast.success('Reunião processada com sucesso!', {
            description: `${processedData.acoes_criadas || 0} ações extraídas`
          })
        }
      } catch (fnError) {
        console.warn('Erro ao processar com IA:', fnError)
        toast.warning('Reunião criada, mas processamento de IA falhou', {
          description: 'As ações podem ser adicionadas manualmente.'
        })
      }

      router.push(`/reunioes/${reuniao.id}`)
      
    } catch (error) {
      console.error('Erro ao criar reunião:', error)
      toast.error('Erro ao criar reunião', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reunioes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Nova Reunião
          </h1>
          <p className="text-muted-foreground">
            Importe um arquivo Markdown do Plaud para extrair decisões e ações
          </p>
        </div>
      </div>

      {/* Configurações opcionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Informações (opcional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Reunião</Label>
              <Input
                id="titulo"
                placeholder="Será extraído do arquivo se vazio"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data da Reunião</Label>
              <Input
                id="data"
                type="date"
                value={dataReuniao}
                onChange={(e) => setDataReuniao(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Se o arquivo seguir o template do Plaud, título, data e participantes serão extraídos automaticamente.
          </p>
        </CardContent>
      </Card>

      {/* Upload */}
      <UploadPlaud onUpload={handleUpload} isLoading={isProcessing} />

      {/* Template info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">📝 Template Recomendado do Plaud</h4>
          <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto">
{`# Reunião: [TÍTULO]
Data: [DATA]

## Participantes
- Nome 1
- Nome 2

## Decisões
- Decisão tomada 1
- Decisão tomada 2

## Action Items
- [ ] Responsável - Tarefa - Prazo: DD/MM/AAAA

## Gastos Mencionados
- R$ 1.000 - Descrição - Categoria: Nome

## Problemas Identificados
- Problema 1`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

