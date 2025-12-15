"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface DadoCategoria {
  id: string;
  nome: string;
  cor: string;
  gasto: number;
}

interface GastosChartProps {
  dados: DadoCategoria[];
}

export function GastosChart({ dados }: GastosChartProps) {
  const dadosFiltrados = dados.filter((d) => d.gasto > 0);

  if (dadosFiltrados.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Nenhum gasto registrado
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={dadosFiltrados}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="gasto"
          nameKey="nome"
        >
          {dadosFiltrados.map((entry) => (
            <Cell key={entry.id} fill={entry.cor} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="rounded-lg bg-popover p-3 shadow-lg border">
                  <p className="font-medium">{data.nome}</p>
                  <p className="text-primary">{formatCurrency(data.gasto)}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

