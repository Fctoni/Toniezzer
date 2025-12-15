import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { parseDateString } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Buscar dados
  const [
    { data: categorias },
    { data: gastos },
    { data: etapas },
    { data: notificacoes },
  ] = await Promise.all([
    supabase.from("categorias").select("*").eq("ativo", true),
    supabase.from("gastos").select("*").eq("status", "aprovado"),
    supabase.from("etapas").select("*").order("ordem"),
    supabase
      .from("notificacoes")
      .select("*")
      .eq("lida", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Cálculos financeiros
  const orcamentoTotal =
    categorias?.reduce((acc, cat) => acc + (Number(cat.orcamento) || 0), 0) || 0;
  const gastoTotal =
    gastos?.reduce((acc, g) => acc + Number(g.valor), 0) || 0;
  const percentualGasto = orcamentoTotal > 0 ? (gastoTotal / orcamentoTotal) * 100 : 0;
  const saldoRestante = orcamentoTotal - gastoTotal;

  // Cálculos de etapas
  const etapasTotal = etapas?.length || 0;
  const etapasConcluidas = etapas?.filter((e) => e.status === "concluida").length || 0;
  const etapasEmAndamento =
    etapas?.filter((e) => e.status === "em_andamento").length || 0;
  const etapasAtrasadas =
    etapas?.filter((e) => e.status === "atrasada").length || 0;
  const progressoObra = etapasTotal > 0 ? (etapasConcluidas / etapasTotal) * 100 : 0;

  // Categorias com mais gastos
  const gastosPorCategoria = categorias?.map((cat) => {
    const gastoCat =
      gastos
        ?.filter((g) => g.categoria_id === cat.id)
        .reduce((acc, g) => acc + Number(g.valor), 0) || 0;
    const percentual = cat.orcamento ? (gastoCat / Number(cat.orcamento)) * 100 : 0;
    return {
      ...cat,
      gasto: gastoCat,
      percentual,
    };
  }) || [];

  const categoriasOrdenadas = [...gastosPorCategoria]
    .sort((a, b) => b.gasto - a.gasto)
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
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua obra residencial
        </p>
      </div>

      {/* Cards Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Orçamento Total */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orçamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(orcamentoTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo: {formatCurrency(saldoRestante)}
            </p>
          </CardContent>
        </Card>

        {/* Gasto Total */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gasto Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(gastoTotal)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={percentualGasto} className="h-1.5" />
              <span className="text-xs text-muted-foreground">
                {percentualGasto.toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Progresso da Obra */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progresso da Obra
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressoObra.toFixed(0)}%</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progressoObra} className="h-1.5" />
              <span className="text-xs text-muted-foreground">
                {etapasConcluidas}/{etapasTotal} etapas
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificacoes?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              notificações não lidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de conteúdo */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gastos por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Top 5 Categorias</span>
              <Link
                href="/financeiro"
                className="text-sm font-normal text-primary hover:underline"
              >
                Ver todas →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoriasOrdenadas.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.cor }}
                    />
                    <span className="text-sm font-medium">{cat.nome}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">
                      {formatCurrency(cat.gasto)}
                    </span>
                    {cat.orcamento && (
                      <span className="text-xs text-muted-foreground ml-2">
                        / {formatCurrency(Number(cat.orcamento))}
                      </span>
                    )}
                  </div>
                </div>
                <Progress
                  value={Math.min(cat.percentual, 100)}
                  className="h-1.5"
                  style={
                    {
                      "--progress-foreground": cat.percentual > 100 ? "var(--destructive)" : cat.cor,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status das Etapas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status das Etapas</span>
              <Link
                href="/cronograma"
                className="text-sm font-normal text-primary hover:underline"
              >
                Ver cronograma →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{etapasConcluidas}</p>
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{etapasEmAndamento}</p>
                  <p className="text-xs text-muted-foreground">Em andamento</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{etapasAtrasadas}</p>
                  <p className="text-xs text-muted-foreground">Atrasadas</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted-foreground/20">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {etapasTotal - etapasConcluidas - etapasEmAndamento - etapasAtrasadas}
                  </p>
                  <p className="text-xs text-muted-foreground">Não iniciadas</p>
                </div>
              </div>
            </div>

            {/* Lista das próximas etapas */}
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Próximas etapas
              </h4>
              {etapas
                ?.filter((e) => e.status !== "concluida")
                .slice(0, 3)
                .map((etapa) => (
                  <div
                    key={etapa.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          etapa.status === "em_andamento"
                            ? "border-blue-500 text-blue-500"
                            : etapa.status === "atrasada"
                            ? "border-red-500 text-red-500"
                            : "border-muted-foreground"
                        }
                      >
                        {etapa.status.replace("_", " ")}
                      </Badge>
                      <span className="text-sm">{etapa.nome}</span>
                    </div>
                    {etapa.data_fim_prevista && (
                      <span className="text-xs text-muted-foreground">
                        {parseDateString(etapa.data_fim_prevista).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

