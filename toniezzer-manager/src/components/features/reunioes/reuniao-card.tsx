'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, CheckCircle2, Circle, AlertTriangle } from 'lucide-react'
import type { Tables } from '@/lib/types/database'

type Reuniao = Tables<'reunioes'> & {
  acoes_count?: number
  acoes_pendentes?: number
  created_by_user?: { nome_completo: string } | null
}

interface ReuniaoCardProps {
  reuniao: Reuniao
}

export function ReuniaoCard({ reuniao }: ReuniaoCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const acoesConcluidas = (reuniao.acoes_count || 0) - (reuniao.acoes_pendentes || 0)
  const percentualConcluido = reuniao.acoes_count 
    ? Math.round((acoesConcluidas / reuniao.acoes_count) * 100) 
    : 0

  return (
    <Link href={`/reunioes/${reuniao.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {reuniao.titulo}
            </CardTitle>
            {reuniao.acoes_pendentes && reuniao.acoes_pendentes > 0 && (
              <Badge variant="secondary" className="ml-2 shrink-0">
                {reuniao.acoes_pendentes} pendente{reuniao.acoes_pendentes > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Data e participantes */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(reuniao.data_reuniao)}</span>
              </div>
              {reuniao.participantes && reuniao.participantes.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{reuniao.participantes.length} participante{reuniao.participantes.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            
            {/* Progress de ações */}
            {reuniao.acoes_count && reuniao.acoes_count > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Ações: {acoesConcluidas}/{reuniao.acoes_count}
                  </span>
                  <span className={`font-medium ${
                    percentualConcluido === 100 ? 'text-green-600' : 
                    percentualConcluido >= 50 ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {percentualConcluido}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      percentualConcluido === 100 ? 'bg-green-500' : 
                      percentualConcluido >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${percentualConcluido}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Participantes badges */}
            {reuniao.participantes && reuniao.participantes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {reuniao.participantes.slice(0, 3).map((p, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {p}
                  </Badge>
                ))}
                {reuniao.participantes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{reuniao.participantes.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

