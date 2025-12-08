import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FluxoCaixaChart } from "@/components/features/financeiro/fluxo-caixa-chart";
import { addMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function FluxoCaixaPage() {
  const supabase = await createClient();

  const [{ data: gastos }, { data: categorias }] = await Promise.all([
    supabase
      .from("gastos")
      .select("valor, data, parcelas, parcela_atual")
      .eq("status", "aprovado")
      .order("data"),
    supabase.from("categorias").select("orcamento").eq("ativo", true),
  ]);

  const orcamentoTotal =
    categorias?.reduce((acc, cat) => acc + (Number(cat.orcamento) || 0), 0) || 0;

  // Calcular dados por mês (últimos 6 meses + próximos 6 meses)
  const hoje = new Date();
  const meses: {
    mes: string;
    mesLabel: string;
    realizado: number;
    projetado: number;
    acumulado: number;
  }[] = [];

  let acumulado = 0;

  for (let i = -6; i <= 6; i++) {
    const mesData = addMonths(hoje, i);
    const mesKey = format(mesData, "yyyy-MM");
    const mesLabel = format(mesData, "MMM/yy", { locale: ptBR });

    // Gastos realizados no mês
    const gastosDoMes =
      gastos
        ?.filter((g) => g.data.startsWith(mesKey))
        .reduce((acc, g) => acc + Number(g.valor), 0) || 0;

    // Projeção de parcelas futuras
    const parcelasFuturas =
      i >= 0
        ? gastos
            ?.filter((g) => {
              if (g.parcelas <= 1) return false;
              const dataOriginal = new Date(g.data);
              const parcelasRestantes = g.parcelas - (g.parcela_atual || 1);
              // Verificar se este mês tem parcela deste gasto
              for (let p = 1; p <= parcelasRestantes; p++) {
                const dataParcela = addMonths(dataOriginal, p);
                if (format(dataParcela, "yyyy-MM") === mesKey) {
                  return true;
                }
              }
              return false;
            })
            .reduce((acc, g) => acc + Number(g.valor), 0) || 0
        : 0;

    const totalMes = gastosDoMes + parcelasFuturas;
    acumulado += totalMes;

    meses.push({
      mes: mesKey,
      mesLabel,
      realizado: i <= 0 ? gastosDoMes : 0,
      projetado: totalMes,
      acumulado,
    });
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const gastoTotal = gastos?.reduce((acc, g) => acc + Number(g.valor), 0) || 0;
  const projecaoFinal = meses[meses.length - 1]?.acumulado || 0;

  return (
    <div className="space-y-6 animate-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
        <p className="text-muted-foreground">
          Projeção de gastos ao longo do tempo
        </p>
      </div>

      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orçamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(orcamentoTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Realizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(gastoTotal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projeção Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {formatCurrency(projecaoFinal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Economia Projetada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                orcamentoTotal - projecaoFinal >= 0
                  ? "text-green-500"
                  : "text-destructive"
              }`}
            >
              {formatCurrency(orcamentoTotal - projecaoFinal)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <FluxoCaixaChart dados={meses} orcamentoTotal={orcamentoTotal} />
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Mês
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Realizado
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Projetado
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Acumulado
                  </th>
                </tr>
              </thead>
              <tbody>
                {meses.map((mes) => (
                  <tr key={mes.mes} className="border-b last:border-0">
                    <td className="py-3 px-2 font-medium capitalize">
                      {mes.mesLabel}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {mes.realizado > 0 ? formatCurrency(mes.realizado) : "-"}
                    </td>
                    <td className="py-3 px-2 text-right text-blue-500">
                      {formatCurrency(mes.projetado)}
                    </td>
                    <td className="py-3 px-2 text-right font-medium">
                      {formatCurrency(mes.acumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

