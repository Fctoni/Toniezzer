import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, calculatePercentage } from '@/lib/utils'
import { Plus, DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function FinanceiroPage() {
  const supabase = createClient()

  // Buscar categorias com orcamento
  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .eq('ativo', true)
    .order('ordem')

  // Buscar gastos aprovados agrupados por categoria
  const { data: gastosPorCategoria } = await supabase
    .from('gastos')
    .select('categoria_id, valor')
    .eq('status', 'aprovado')

  // Calcular totais por categoria
  const categoriasComGastos = categorias?.map(cat => {
    const gastosCategoria = gastosPorCategoria?.filter(g => g.categoria_id === cat.id) || []
    const realizado = gastosCategoria.reduce((sum, g) => sum + Number(g.valor), 0)
    const orcamento = Number(cat.orcamento) || 0
    const percentual = orcamento > 0 ? calculatePercentage(realizado, orcamento) : 0

    return {
      ...cat,
      realizado,
      percentual,
      status: percentual >= 100 ? 'danger' : percentual >= 80 ? 'warning' : 'ok'
    }
  }) || []

  // Totais gerais
  const totalOrcado = categoriasComGastos.reduce((sum, c) => sum + (Number(c.orcamento) || 0), 0)
  const totalRealizado = categoriasComGastos.reduce((sum, c) => sum + c.realizado, 0)
  const percentualGeral = totalOrcado > 0 ? calculatePercentage(totalRealizado, totalOrcado) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestao Financeira</h1>
          <p className="text-muted-foreground">
            Controle de orcamento e gastos da obra
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/financeiro/lancamentos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Lancamento
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orcamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOrcado)}</div>
            <p className="text-xs text-muted-foreground">
              Configurado em {categoriasComGastos.length} categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Realizado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRealizado)}</div>
            <Progress value={percentualGeral} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {percentualGeral.toFixed(1)}% do orcamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disponivel</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOrcado - totalRealizado)}</div>
            <p className="text-xs text-muted-foreground">
              Saldo restante para gastar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Orcamento por Categoria</CardTitle>
          <CardDescription>
            Acompanhamento do orcamento vs realizado por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriasComGastos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma categoria cadastrada.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/configuracoes/categorias">Configurar categorias</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {categoriasComGastos.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.cor }}
                      />
                      <span className="font-medium">{cat.nome}</span>
                      {cat.status === 'danger' && (
                        <Badge variant="destructive">Acima do orcamento</Badge>
                      )}
                      {cat.status === 'warning' && (
                        <Badge variant="warning" className="bg-yellow-500">Atencao</Badge>
                      )}
                    </div>
                    <div className="text-sm text-right">
                      <span className="font-medium">{formatCurrency(cat.realizado)}</span>
                      <span className="text-muted-foreground"> / {formatCurrency(Number(cat.orcamento) || 0)}</span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(cat.percentual, 100)} 
                    className="h-2"
                    indicatorClassName={
                      cat.status === 'danger' ? 'bg-red-500' :
                      cat.status === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links rapidos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/financeiro/lancamentos">
            <CardHeader>
              <CardTitle className="text-lg">Lancamentos</CardTitle>
              <CardDescription>Ver todos os lancamentos</CardDescription>
            </CardHeader>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/financeiro/orcamento">
            <CardHeader>
              <CardTitle className="text-lg">Orcamento</CardTitle>
              <CardDescription>Configurar orcamento por categoria</CardDescription>
            </CardHeader>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/financeiro/fluxo-caixa">
            <CardHeader>
              <CardTitle className="text-lg">Fluxo de Caixa</CardTitle>
              <CardDescription>Projecao de gastos futuros</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}

