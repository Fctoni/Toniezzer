"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

interface MatrizTabelaProps {
  linhas: LinhaMatriz[];
  colunas: ColunaEtapa[];
  onCellClick: (categoriaId: string, etapaId: string, valor: number) => void;
}

export function MatrizTabela({ linhas, colunas, onCellClick }: MatrizTabelaProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatCurrencyCompact = (value: number) => {
    if (value === 0) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calcular total geral
  const totalGeral = linhas.reduce((acc, linha) => acc + linha.total_categoria, 0);

  if (linhas.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>Nenhum gasto registrado</p>
        <p className="text-sm mt-1">Cadastre gastos para visualizar a matriz</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Wrapper com scroll horizontal */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Header: Categoria (sticky left) */}
              <TableHead
                className="sticky left-0 z-20 bg-background font-semibold min-w-[180px]"
              >
                Categoria
              </TableHead>

              {/* Headers: Etapas */}
              {colunas.map((coluna) => (
                <TableHead
                  key={coluna.etapa_id}
                  className="text-center font-semibold min-w-[120px]"
                >
                  {coluna.etapa_nome}
                </TableHead>
              ))}

              {/* Header: Total */}
              <TableHead className="text-center font-semibold min-w-[120px] bg-muted/50">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Linhas de dados (categorias) */}
            {linhas.map((linha) => (
              <TableRow key={linha.categoria_id}>
                {/* Coluna: Nome da Categoria (sticky left) */}
                <TableCell
                  className="sticky left-0 z-10 bg-background font-medium"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: linha.categoria_cor }}
                    />
                    <span>{linha.categoria_nome}</span>
                  </div>
                </TableCell>

                {/* Células: Valores por etapa */}
                {colunas.map((coluna) => {
                  const valor = linha.gastos_por_etapa[coluna.etapa_id] || 0;
                  const temValor = valor > 0;

                  return (
                    <TableCell
                      key={`${linha.categoria_id}-${coluna.etapa_id}`}
                      className={cn(
                        "text-center tabular-nums",
                        temValor
                          ? "cursor-pointer hover:bg-muted/50 transition-colors"
                          : "text-muted-foreground bg-muted/20"
                      )}
                      onClick={() => {
                        if (temValor) {
                          onCellClick(linha.categoria_id, coluna.etapa_id, valor);
                        }
                      }}
                    >
                      {formatCurrencyCompact(valor)}
                    </TableCell>
                  );
                })}

                {/* Célula: Total da Categoria */}
                <TableCell className="text-center font-bold tabular-nums bg-muted/50">
                  {formatCurrencyCompact(linha.total_categoria)}
                </TableCell>
              </TableRow>
            ))}

            {/* Linha de Totais */}
            <TableRow className="font-bold bg-muted">
              <TableCell className="sticky left-0 z-10 bg-muted">
                TOTAL
              </TableCell>

              {colunas.map((coluna) => (
                <TableCell
                  key={`total-${coluna.etapa_id}`}
                  className="text-center tabular-nums"
                >
                  {formatCurrencyCompact(coluna.total_etapa)}
                </TableCell>
              ))}

              <TableCell className="text-center tabular-nums">
                {formatCurrencyCompact(totalGeral)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Indicador de scroll */}
      <div className="mt-2 text-xs text-center text-muted-foreground">
        💡 Clique em qualquer célula com valor para ver os gastos detalhados
      </div>
    </div>
  );
}

