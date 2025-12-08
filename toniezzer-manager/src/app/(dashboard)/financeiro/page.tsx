import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { GastosChart } from "@/components/features/financeiro/gastos-chart";

export default async function FinanceiroPage() {
  const supabase = await createClient();

  const [{ data: categorias }, { data: gastos }] = await Promise.all([
    supabase.from("categorias").select("*").eq("ativo", true).order("ordem"),
    supabase.from("gastos").select("*, categorias(nome, cor)").eq("status", "aprovado"),
  ]);

  const orcamentoTotal =
    categorias?.reduce((acc, cat) => acc + (Number(cat.orcamento) || 0), 0) || 0;
  const gastoTotal = gastos?.reduce((acc, g) => acc + Number(g.valor), 0) || 0;
  const percentualGasto = orcamentoTotal > 0 ? (gastoTotal / orcamentoTotal) * 100 : 0;
  const saldoRestante = orcamentoTotal - gastoTotal;

  // Dados por categoria
  const dadosCategorias = categorias?.map((cat) => {
    const gastoCat =
      gastos
        ?.filter((g) => g.categoria_id === cat.id)
        .reduce((acc, g) => acc + Number(g.valor), 0) || 0;
    const percentual = cat.orcamento ? (gastoCat / Number(cat.orcamento)) * 100 : 0;
    return {
      id: cat.id,
      nome: cat.nome,
      cor: cat.cor,
      orcamento: Number(cat.orcamento) || 0,
      gasto: gastoCat,
      percentual,
      status: percentual >= 100 ? "over" : percentual >= 80 ? "warning" : "ok",
    };
  }) || [];

  // Últimos gastos
  const ultimosGastos = gastos
    ?.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6 animate-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle de orçamento e gastos da obra
          </p>
        </div>
        <Button asChild>
          <Link href="/financeiro/lancamentos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Lançamento
          </Link>
        </Button>
      </div>

      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orçamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(orcamentoTotal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gasto
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(gastoTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {percentualGasto.toFixed(1)}% do orçamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Restante
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                saldoRestante < 0 ? "text-destructive" : "text-green-500"
              }`}
            >
              {formatCurrency(saldoRestante)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorias em Alerta
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dadosCategorias.filter((c) => c.status !== "ok").length}
            </div>
            <p className="text-xs text-muted-foreground">acima de 80%</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico e Tabela */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <GastosChart dados={dadosCategorias} />
          </CardContent>
        </Card>

        {/* Últimos Lançamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Últimos Lançamentos</span>
              <Link
                href="/financeiro/lancamentos"
                className="text-sm font-normal text-primary hover:underline"
              >
                Ver todos →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ultimosGastos?.map((gasto) => (
              <div
                key={gasto.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: (gasto.categorias as { cor: string })?.cor || "#888",
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{gasto.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {(gasto.categorias as { nome: string })?.nome} •{" "}
                      {new Date(gasto.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <span className="font-medium">{formatCurrency(Number(gasto.valor))}</span>
              </div>
            ))}
            {(!ultimosGastos || ultimosGastos.length === 0) && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum lançamento registrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orçamento por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Orçamento por Categoria</span>
            <Link
              href="/financeiro/orcamento"
              className="text-sm font-normal text-primary hover:underline"
            >
              Editar orçamentos →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dadosCategorias.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.cor }}
                    />
                    <span className="text-sm font-medium">{cat.nome}</span>
                    {cat.status === "over" && (
                      <Badge variant="destructive" className="text-[10px]">
                        Estourado
                      </Badge>
                    )}
                    {cat.status === "warning" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-yellow-500 text-yellow-500"
                      >
                        80%+
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">
                      {formatCurrency(cat.gasto)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      / {formatCurrency(cat.orcamento)}
                    </span>
                  </div>
                </div>
                <Progress
                  value={Math.min(cat.percentual, 100)}
                  className={`h-2 ${
                    cat.status === "over"
                      ? "[&>div]:bg-destructive"
                      : cat.status === "warning"
                      ? "[&>div]:bg-yellow-500"
                      : ""
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

