"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LinhaMatriz {
  categoria_id: string;
  categoria_nome: string;
  categoria_cor: string;
  gastos_por_etapa: Record<string, number>;
  total_categoria: number;
}

interface ColunaEtapa {
  etapa_id: string | 'sem_etapa';
  etapa_nome: string;
  etapa_ordem: number;
  total_etapa: number;
}

interface MatrizGraficoProps {
  linhas: LinhaMatriz[];
  colunas: ColunaEtapa[];
}

export function MatrizGrafico({ linhas, colunas }: MatrizGraficoProps) {
  // Transformar dados para formato do Recharts
  // Cada etapa vira um item com valores por categoria
  const dadosGrafico = colunas.map((coluna) => {
    const item: Record<string, string | number> = {
      etapa: coluna.etapa_nome,
    };

    linhas.forEach((linha) => {
      item[linha.categoria_nome] = linha.gastos_por_etapa[coluna.etapa_id] || 0;
    });

    return item;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

  const formatCurrencyFull = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  if (linhas.length === 0 || colunas.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        <p>Nenhum dado para exibir no gráfico</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        layout="vertical"
        data={dadosGrafico}
        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          type="number"
          tickFormatter={formatCurrency}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          type="category"
          dataKey="etapa"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          width={90}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg bg-popover p-3 shadow-lg border">
                  <p className="font-medium mb-2">{label}</p>
                  {payload
                    .filter((entry) => (entry.value as number) > 0)
                    .map((entry, index) => (
                      <p
                        key={index}
                        className="text-sm flex items-center gap-2"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.name}:</span>
                        <span className="font-medium">
                          {formatCurrencyFull(entry.value as number)}
                        </span>
                      </p>
                    ))}
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
        {linhas.map((linha) => (
          <Bar
            key={linha.categoria_id}
            dataKey={linha.categoria_nome}
            stackId="a"
            fill={linha.categoria_cor}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

