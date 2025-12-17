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
  orcamento_previsto?: number | null;
}

interface MatrizTabelaProps {
  linhas: LinhaMatriz[];
  colunas: ColunaEtapa[];
  detalhamentoMap: Map<string, number>;
  onCellClick: (categoriaId: string, etapaId: string, valor: number) => void;
}

export function MatrizTabela({ linhas, colunas, detalhamentoMap, onCellClick }: MatrizTabelaProps) {
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

                  // Buscar orçamento previsto desta célula (se houver detalhamento)
                  const key = `${linha.categoria_id}-${coluna.etapa_id}`;
                  const orcamentoPrevisto = detalhamentoMap.get(key);
                  
                  // Calcular status da célula
                  let cellStatus: 'ok' | 'warning' | 'over' | 'empty' = 'empty';
                  if (orcamentoPrevisto && valor > 0) {
                    const percentual = (valor / orcamentoPrevisto) * 100;
                    if (percentual >= 100) cellStatus = 'over';
                    else if (percentual >= 80) cellStatus = 'warning';
                    else cellStatus = 'ok';
                  } else if (valor > 0) {
                    cellStatus = 'ok';
                  }

                  return (
                    <TableCell
                      key={`${linha.categoria_id}-${coluna.etapa_id}`}
                      className={cn(
                        "text-center tabular-nums relative",
                        temValor
                          ? "cursor-pointer hover:bg-muted/50 transition-colors"
                          : "text-muted-foreground bg-muted/20",
                        // Cores baseadas em orçamento
                        cellStatus === 'over' && "bg-red-50 hover:bg-red-100",
                        cellStatus === 'warning' && "bg-yellow-50 hover:bg-yellow-100",
                        cellStatus === 'ok' && orcamentoPrevisto && "bg-green-50 hover:bg-green-100"
                      )}
                      onClick={() => {
                        if (temValor) {
                          onCellClick(linha.categoria_id, coluna.etapa_id, valor);
                        }
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          cellStatus === 'over' && "text-red-700 font-semibold",
                          cellStatus === 'warning' && "text-yellow-700 font-semibold"
                        )}>
                          {formatCurrencyCompact(valor)}
                        </span>
                        {orcamentoPrevisto && valor > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {((valor / orcamentoPrevisto) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                  );
                })}

                {/* Célula: Total da Categoria */}
                <TableCell className="text-center font-bold tabular-nums bg-muted/50">
                  {formatCurrencyCompact(linha.total_categoria)}
                </TableCell>
              </TableRow>
            ))}

            {/* Linha de Totais Realizados */}
            <TableRow className="font-bold bg-muted">
              <TableCell className="sticky left-0 z-10 bg-muted">
                TOTAL REALIZADO
              </TableCell>

              {colunas.map((coluna) => {
                const orcamentoPrevisto = coluna.orcamento_previsto;
                const totalRealizado = coluna.total_etapa;
                const percentual = orcamentoPrevisto && orcamentoPrevisto > 0
                  ? (totalRealizado / orcamentoPrevisto) * 100
                  : 0;

                return (
                  <TableCell
                    key={`total-${coluna.etapa_id}`}
                    className={cn(
                      "text-center tabular-nums",
                      orcamentoPrevisto && percentual >= 100 && "bg-red-100",
                      orcamentoPrevisto && percentual >= 80 && percentual < 100 && "bg-yellow-100",
                      orcamentoPrevisto && percentual < 80 && totalRealizado > 0 && "bg-green-100"
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <span>{formatCurrencyCompact(totalRealizado)}</span>
                      {orcamentoPrevisto && orcamentoPrevisto > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {percentual.toFixed(0)}% do previsto
                        </span>
                      )}
                    </div>
                  </TableCell>
                );
              })}

              <TableCell className="text-center tabular-nums">
                {formatCurrencyCompact(totalGeral)}
              </TableCell>
            </TableRow>

            {/* Linha de Orçamentos Previstos */}
            <TableRow className="font-semibold bg-muted/50 text-muted-foreground">
              <TableCell className="sticky left-0 z-10 bg-muted/50">
                ORÇAMENTO PREVISTO
              </TableCell>

              {colunas.map((coluna) => (
                <TableCell
                  key={`orcamento-${coluna.etapa_id}`}
                  className="text-center tabular-nums"
                >
                  {coluna.orcamento_previsto && coluna.orcamento_previsto > 0
                    ? formatCurrencyCompact(coluna.orcamento_previsto)
                    : "-"}
                </TableCell>
              ))}

              <TableCell className="text-center tabular-nums">
                {formatCurrencyCompact(
                  colunas.reduce((acc, col) => acc + (col.orcamento_previsto || 0), 0)
                )}
              </TableCell>
            </TableRow>

            {/* Linha de Delta (Realizado - Previsto) */}
            <TableRow className="font-semibold bg-muted/30">
              <TableCell className="sticky left-0 z-10 bg-muted/30">
                DELTA
              </TableCell>

              {colunas.map((coluna) => {
                const orcamentoPrevisto = coluna.orcamento_previsto || 0;
                const totalRealizado = coluna.total_etapa;
                const delta = totalRealizado - orcamentoPrevisto;

                return (
                  <TableCell
                    key={`delta-${coluna.etapa_id}`}
                    className="text-center tabular-nums"
                  >
                    {orcamentoPrevisto > 0 ? (
                      <span
                        className={cn(
                          "font-semibold",
                          delta > 0 && "text-destructive",
                          delta < 0 && "text-green-600",
                          delta === 0 && "text-muted-foreground"
                        )}
                      >
                        {delta > 0 && "+"}
                        {formatCurrencyCompact(delta)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                );
              })}

              <TableCell className="text-center tabular-nums">
                {(() => {
                  const orcamentoTotalPrevisto = colunas.reduce(
                    (acc, col) => acc + (col.orcamento_previsto || 0),
                    0
                  );
                  const deltaGeral = totalGeral - orcamentoTotalPrevisto;
                  return orcamentoTotalPrevisto > 0 ? (
                    <span
                      className={cn(
                        "font-semibold",
                        deltaGeral > 0 && "text-destructive",
                        deltaGeral < 0 && "text-green-600",
                        deltaGeral === 0 && "text-muted-foreground"
                      )}
                    >
                      {deltaGeral > 0 && "+"}
                      {formatCurrencyCompact(deltaGeral)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  );
                })()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Legenda e Indicadores */}
      <div className="mt-4 space-y-2">
        <div className="text-xs text-center text-muted-foreground">
          💡 Clique em qualquer célula com valor para ver os gastos detalhados
        </div>
        
        {/* Legenda de cores (se houver detalhamento) */}
        {detalhamentoMap.size > 0 && (
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 border" />
              <span className="text-muted-foreground">Dentro do orçamento (&lt;80%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-100 border" />
              <span className="text-muted-foreground">Alerta (80-100%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-100 border" />
              <span className="text-muted-foreground">Estourado (&gt;100%)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

