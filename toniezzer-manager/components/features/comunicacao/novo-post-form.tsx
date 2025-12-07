'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MencoesInput } from './mencoes-input'
import { 
  Send, 
  Paperclip, 
  MessageSquare, 
  AlertTriangle, 
  Info,
  Loader2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Etapa, Gasto, FeedTipo } from '@/lib/types/database'

interface NovoPostFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

const tiposPost = [
  { value: 'post', label: 'Post', icon: MessageSquare, description: 'Compartilhe uma atualização' },
  { value: 'decisao', label: 'Decisão', icon: Info, description: 'Registre uma decisão tomada' },
  { value: 'alerta', label: 'Alerta', icon: AlertTriangle, description: 'Alerte sobre algo importante' },
]

export function NovoPostForm({ onSuccess, onCancel, className }: NovoPostFormProps) {
  const { user } = useUser()
  const [conteudo, setConteudo] = useState('')
  const [mencoes, setMencoes] = useState<string[]>([])
  const [tipo, setTipo] = useState<FeedTipo>('post')
  const [etapaId, setEtapaId] = useState<string>('')
  const [gastoId, setGastoId] = useState<string>('')
  const [etapas, setEtapas] = useState<Etapa[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRelacionamentos, setShowRelacionamentos] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: etapasData }, { data: gastosData }] = await Promise.all([
        supabase.from('etapas').select('*').order('ordem'),
        supabase.from('gastos').select('*').order('created_at', { ascending: false }).limit(20),
      ])

      if (etapasData) setEtapas(etapasData)
      if (gastosData) setGastos(gastosData)
    }
    fetchData()
  }, [])

  const handleContentChange = (value: string, extractedMencoes: string[]) => {
    setConteudo(value)
    setMencoes(extractedMencoes)
  }

  const handleSubmit = async () => {
    if (!conteudo.trim() || !user) return

    setIsSubmitting(true)
    try {
      // Limpar formato de menções antes de salvar
      // De @[Nome](id) para simples texto, e salvar IDs no array
      const conteudoLimpo = conteudo.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')

      const { error } = await supabase.from('feed_comunicacao').insert({
        tipo,
        conteudo: conteudoLimpo,
        autor_id: user.id,
        etapa_relacionada_id: etapaId || null,
        gasto_relacionado_id: gastoId || null,
        mencoes: mencoes.length > 0 ? mencoes : null,
      })

      if (error) throw error

      // Limpar formulário
      setConteudo('')
      setMencoes([])
      setTipo('post')
      setEtapaId('')
      setGastoId('')
      setShowRelacionamentos(false)

      onSuccess?.()
    } catch (error) {
      console.error('Erro ao criar post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user || user.perfil === 'visualizador') {
    return null
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Nova Publicação
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Seletor de tipo */}
        <div className="flex gap-2">
          {tiposPost.map((t) => {
            const Icon = t.icon
            return (
              <Button
                key={t.value}
                type="button"
                variant={tipo === t.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipo(t.value as FeedTipo)}
                className="gap-1"
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </Button>
            )
          })}
        </div>

        {/* Input de conteúdo com menções */}
        <MencoesInput
          value={conteudo}
          onChange={handleContentChange}
          placeholder={
            tipo === 'decisao' 
              ? 'Descreva a decisão tomada...'
              : tipo === 'alerta'
              ? 'Descreva o alerta...'
              : 'O que você quer compartilhar?'
          }
        />

        {/* Relacionamentos */}
        {showRelacionamentos && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Vincular a Etapa
              </label>
              <Select value={etapaId} onValueChange={setEtapaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Vincular a Gasto
              </label>
              <Select value={gastoId} onValueChange={setGastoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um gasto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {gastos.map((gasto) => (
                    <SelectItem key={gasto.id} value={gasto.id}>
                      {gasto.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowRelacionamentos(!showRelacionamentos)}
            className="gap-1"
          >
            <Paperclip className="h-4 w-4" />
            Vincular
          </Button>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!conteudo.trim() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publicar
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

