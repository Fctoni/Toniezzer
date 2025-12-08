'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'

export interface DadosExtraidos {
  fornecedor: string | null
  cnpj: string | null
  valor: number | null
  data: string | null
  descricao: string | null
  forma_pagamento: string | null
  categoria_sugerida: string | null
  confianca: number
}

interface PreviewOcrProps {
  imageUrl: string
  dados: DadosExtraidos
  isLoading?: boolean
}

export function PreviewOcr({ imageUrl, dados, isLoading }: PreviewOcrProps) {
  const confiancaPercent = Math.round(dados.confianca * 100)
  
  const getConfiancaColor = () => {
    if (confiancaPercent >= 80) return 'bg-green-100 text-green-800'
    if (confiancaPercent >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getConfiancaIcon = () => {
    if (confiancaPercent >= 80) return <CheckCircle2 className="h-4 w-4" />
    if (confiancaPercent >= 60) return <AlertTriangle className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Preview da imagem */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Imagem Capturada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt="Recibo capturado"
              className="w-full h-full object-contain"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin text-4xl mb-2">⏳</div>
                  <p>Processando OCR...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dados extraídos */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Dados Extraídos</CardTitle>
            <Badge className={getConfiancaColor()}>
              {getConfiancaIcon()}
              <span className="ml-1">{confiancaPercent}% confiança</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <DataRow label="Fornecedor" value={dados.fornecedor} />
            <DataRow label="CNPJ/CPF" value={dados.cnpj} />
            <DataRow 
              label="Valor" 
              value={formatCurrency(dados.valor)} 
              highlight={dados.valor !== null}
            />
            <DataRow label="Data" value={formatDate(dados.data)} />
            <DataRow label="Descrição" value={dados.descricao} />
            <DataRow label="Forma Pgto" value={dados.forma_pagamento} />
            <DataRow 
              label="Categoria" 
              value={dados.categoria_sugerida}
              badge
            />
          </div>
          
          {confiancaPercent < 70 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Verificação recomendada
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    A confiança da extração está baixa. Revise os dados antes de confirmar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DataRow({ 
  label, 
  value, 
  highlight, 
  badge 
}: { 
  label: string
  value: string | null
  highlight?: boolean
  badge?: boolean
}) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {badge && value ? (
        <Badge variant="secondary">{value}</Badge>
      ) : (
        <span className={`text-sm ${highlight ? 'font-semibold text-green-700' : ''} ${!value ? 'text-gray-400' : ''}`}>
          {value || '-'}
        </span>
      )}
    </div>
  )
}

