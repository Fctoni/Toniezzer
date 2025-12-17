import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Tags, Grid3x3 } from "lucide-react";
import { MatrizTabelaWrapper } from "@/components/features/financeiro/matriz-tabela-wrapper";
import { MatrizGrafico } from "@/components/features/financeiro/matriz-grafico";

// Tipos
interface CelulaMatriz {
  categoria_id: string;
  categoria_nome: string;
  categoria_cor: string;
  etapa_id: string | 'sem_etapa';
  etapa_nome: string;
  etapa_ordem: number;
  total_gasto: number;
  quantidade_gastos: number;
}

interface LinhaMatriz {
  categoria_id: string;
  categoria_nome: string;
  categoria_cor: string;
  gastos_por_etapa: Record<string, number>; // etapa_id -> valor
  total_categoria: number;
}

interface ColunaEtapa {
  etapa_id: string | 'sem_etapa';
  etapa_nome: string;
  etapa_ordem: number;
  total_etapa: number;
}

export default async function MatrizGastosPage() {
  const supabase = await createClient();

  // Buscar dados
  const [{ data: categorias }, { data: etapas }, { data: gastos }] = await Promise.all([
    supabase
      .from("categorias")
      .select("*")
      .eq("ativo", true)
      .order("ordem"),
    supabase
      .from("etapas")
      .select("*")
      .order("ordem"),
    supabase
      .from("gastos")
      .select("categoria_id, etapa_relacionada_id, valor")
      .eq("status", "aprovado"),
  ]);

  // Processar dados em estrutura de matriz
  const categoriasMap = new Map<string, { nome: string; cor: string; ordem: number }>();
  categorias?.forEach((cat) => {
    categoriasMap.set(cat.id, {
      nome: cat.nome,
      cor: cat.cor,
      ordem: cat.ordem,
    });
  });

  const etapasMap = new Map<string, { nome: string; ordem: number }>();
  etapas?.forEach((etapa) => {
    etapasMap.set(etapa.id, {
      nome: etapa.nome,
      ordem: etapa.ordem,
    });
  });

  // Adicionar "coluna" Geral para gastos sem etapa
  etapasMap.set('sem_etapa', { nome: 'Geral', ordem: 9999 });

  // Agrupar gastos por categoria × etapa
  const matrizData = new Map<string, Map<string, number>>();
  
  gastos?.forEach((gasto) => {
    const catId = gasto.categoria_id;
    const etapaId = gasto.etapa_relacionada_id || 'sem_etapa';
    const valor = Number(gasto.valor);

    if (!matrizData.has(catId)) {
      matrizData.set(catId, new Map());
    }

    const etapasGastos = matrizData.get(catId)!;
    etapasGastos.set(etapaId, (etapasGastos.get(etapaId) || 0) + valor);
  });

  // Processar em estrutura de linhas (categorias)
  const linhasMatriz: LinhaMatriz[] = [];

  categorias?.forEach((cat) => {
    const gastosPorEtapa: Record<string, number> = {};
    let totalCategoria = 0;

    // Para cada etapa, buscar o valor
    Array.from(etapasMap.keys()).forEach((etapaId) => {
      const valor = matrizData.get(cat.id)?.get(etapaId) || 0;
      gastosPorEtapa[etapaId] = valor;
      totalCategoria += valor;
    });

    linhasMatriz.push({
      categoria_id: cat.id,
      categoria_nome: cat.nome,
      categoria_cor: cat.cor,
      gastos_por_etapa: gastosPorEtapa,
      total_categoria: totalCategoria,
    });
  });

  // Ordenar categorias por total DESC (maior primeiro)
  linhasMatriz.sort((a, b) => b.total_categoria - a.total_categoria);

  // Processar colunas (etapas) com totais
  const colunasEtapas: ColunaEtapa[] = Array.from(etapasMap.entries()).map(([id, info]) => {
    let totalEtapa = 0;
    linhasMatriz.forEach((linha) => {
      totalEtapa += linha.gastos_por_etapa[id] || 0;
    });

    return {
      etapa_id: id,
      etapa_nome: info.nome,
      etapa_ordem: info.ordem,
      total_etapa: totalEtapa,
    };
  });

  // Ordenar etapas por ordem ASC (cronológica)
  colunasEtapas.sort((a, b) => a.etapa_ordem - b.etapa_ordem);

  // Calcular totais gerais
  const gastoTotal = linhasMatriz.reduce((acc, linha) => acc + linha.total_categoria, 0);
  const numCategorias = linhasMatriz.length;
  const numEtapas = colunasEtapas.length;

  // Mensagem se não houver dados
  const semDados = linhasMatriz.length === 0 || colunasEtapas.length === 0;

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Grid3x3 className="h-8 w-8" />
          Gastos por Etapa
        </h1>
        <p className="text-muted-foreground">
          Visualize gastos cruzando categorias e etapas da obra
        </p>
      </div>

      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gasto
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(gastoTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todos os gastos aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorias
            </CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numCategorias}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Categorias ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Etapas
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numEtapas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Etapas da obra
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média por Etapa
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(numEtapas > 0 ? gastoTotal / numEtapas : 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Distribuição média
            </p>
          </CardContent>
        </Card>
      </div>

      {semDados ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Grid3x3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum dado para exibir</p>
              <p className="text-sm mt-2">
                Cadastre categorias, etapas e gastos aprovados para visualizar a matriz
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Gráfico de Barras Empilhadas */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <MatrizGrafico linhas={linhasMatriz} colunas={colunasEtapas} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matriz Detalhada</CardTitle>
            </CardHeader>
            <CardContent>
              <MatrizTabelaWrapper linhas={linhasMatriz} colunas={colunasEtapas} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

