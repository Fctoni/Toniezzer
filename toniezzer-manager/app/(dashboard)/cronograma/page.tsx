import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDate } from '@/lib/utils'
import { Plus, Calendar, Clock, CheckCircle2, AlertTriangle, Pause } from 'lucide-react'
import Link from 'next/link'

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  nao_iniciada: { label: 'Nao Iniciada', color: 'bg-gray-500', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-500', icon: Calendar },
  aguardando_aprovacao: { label: 'Aguardando Aprovacao', color: 'bg-orange-500', icon: Clock },
  aguardando_qualidade: { label: 'Aguardando Qualidade', color: 'bg-purple-500', icon: Clock },
  em_retrabalho: { label: 'Em Retrabalho', color: 'bg-red-500', icon: AlertTriangle },
  pausada: { label: 'Pausada', color: 'bg-yellow-500', icon: Pause },
  atrasada: { label: 'Atrasada', color: 'bg-red-600', icon: AlertTriangle },
  concluida: { label: 'Concluida', color: 'bg-green-500', icon: CheckCircle2 },
}

export default async function CronogramaPage() {
  const supabase = createClient()

  // Buscar etapas com responsavel
  const { data: etapas } = await supabase
    .from('etapas')
    .select(`
      *,
      responsavel:users!etapas_responsavel_id_fkey(id, nome_completo, avatar_url)
    `)
    .order('ordem')

  // Contar por status
  const statusCounts = etapas?.reduce((acc, etapa) => {
    acc[etapa.status] = (acc[etapa.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const totalEtapas = etapas?.length || 0
  const concluidas = statusCounts['concluida'] || 0
  const emAndamento = statusCounts['em_andamento'] || 0
  const atrasadas = statusCounts['atrasada'] || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cronograma</h1>
          <p className="text-muted-foreground">
            Timeline e status das etapas da obra
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/cronograma/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova Etapa
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Etapas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEtapas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{concluidas}</div>
            <Progress 
              value={totalEtapas > 0 ? (concluidas / totalEtapas) * 100 : 0} 
              className="mt-2"
              indicatorClassName="bg-green-500"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{emAndamento}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{atrasadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de etapas */}
      <Card>
        <CardHeader>
          <CardTitle>Etapas da Obra</CardTitle>
          <CardDescription>
            Clique em uma etapa para ver detalhes e gerenciar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!etapas || etapas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma etapa cadastrada.</p>
              <Button asChild className="mt-4">
                <Link href="/cronograma/nova">Criar primeira etapa</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {etapas.map((etapa) => {
                const config = statusConfig[etapa.status] || statusConfig.nao_iniciada
                const StatusIcon = config.icon

                return (
                  <Link 
                    key={etapa.id} 
                    href={`/cronograma/${etapa.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      {/* Status indicator */}
                      <div className={`w-1 h-12 rounded-full ${config.color}`} />
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{etapa.nome}</h3>
                          <Badge variant="outline" className="shrink-0">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {etapa.data_inicio_prevista && (
                            <span>
                              Inicio: {formatDate(etapa.data_inicio_prevista)}
                            </span>
                          )}
                          {etapa.data_fim_prevista && (
                            <span>
                              Fim: {formatDate(etapa.data_fim_prevista)}
                            </span>
                          )}
                          {etapa.responsavel && (
                            <span>
                              Resp: {etapa.responsavel.nome_completo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="w-20 text-right">
                        <span className="text-lg font-semibold">
                          {etapa.progresso_percentual}%
                        </span>
                        <Progress 
                          value={etapa.progresso_percentual} 
                          className="mt-1 h-2"
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

