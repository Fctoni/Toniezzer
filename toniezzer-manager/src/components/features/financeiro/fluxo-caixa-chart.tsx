"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";

interface DadoMes {
  mesLabel: string;
  realizado: number;
  projetado: number;
  acumulado: number;
}

interface FluxoCaixaChartProps {
  dados: DadoMes[];
  orcamentoTotal: number;
}

export function FluxoCaixaChart({ dados, orcamentoTotal }: FluxoCaixaChartProps) {
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

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="mesLabel"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg bg-popover p-3 shadow-lg border">
                  <p className="font-medium mb-2 capitalize">{label}</p>
                  {payload.map((entry, index) => (
                    <p
                      key={index}
                      className="text-sm"
                      style={{ color: entry.color }}
                    >
                      {entry.name}: {formatCurrencyFull(entry.value as number)}
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          }}
        />
        <ReferenceLine
          y={orcamentoTotal}
          stroke="hsl(var(--destructive))"
          strokeDasharray="5 5"
          label={{
            value: "Orçamento",
            position: "right",
            fill: "hsl(var(--destructive))",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="acumulado"
          stroke="hsl(var(--primary))"
          fillOpacity={1}
          fill="url(#colorAcumulado)"
          name="Acumulado"
        />
        <Line
          type="monotone"
          dataKey="projetado"
          stroke="hsl(var(--chart-4))"
          strokeWidth={2}
          dot={false}
          name="Mensal"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

