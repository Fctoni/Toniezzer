"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ComprasTable } from "./compras-table";
import {
  ComprasFiltersComponent,
  ComprasFilters,
  defaultFilters,
} from "./compras-filters";

interface Compra {
  id: string;
  descricao: string;
  valor_total: number;
  data_compra: string;
  parcelas: number;
  parcelas_pagas: number;
  valor_pago: number;
  status: "ativa" | "quitada" | "cancelada";
  nota_fiscal_numero: string | null;
  forma_pagamento: string;
  fornecedor_id: string;
  categoria_id: string;
  etapa_relacionada_id: string | null;
  fornecedor?: { nome: string } | null;
  categoria?: { nome: string; cor: string } | null;
  etapa?: { nome: string } | null;
}

interface ComprasListProps {
  compras: Compra[];
  fornecedores: Array<{ id: string; nome: string }>;
  categorias: Array<{ id: string; nome: string; cor: string }>;
  etapas: Array<{ id: string; nome: string }>;
}

export function ComprasList({
  compras,
  fornecedores,
  categorias,
  etapas,
}: ComprasListProps) {
  const [filters, setFilters] = useState<ComprasFilters>(defaultFilters);

  // Calcular resumo (sempre sobre todos os dados)
  const resumo = useMemo(
    () => ({
      total: compras.length,
      valorTotal: compras.reduce((acc, c) => acc + c.valor_total, 0),
      valorPago: compras.reduce((acc, c) => acc + c.valor_pago, 0),
      ativas: compras.filter((c) => c.status === "ativa").length,
      quitadas: compras.filter((c) => c.status === "quitada").length,
    }),
    [compras]
  );

  const comprasFiltradas = useMemo(() => {
    return compras.filter((compra) => {
      // Filtro de busca (descrição, NF, fornecedor, categoria)
      if (filters.busca) {
        const termo = filters.busca.toLowerCase();
        const matchDescricao = compra.descricao.toLowerCase().includes(termo);
        const matchNF = compra.nota_fiscal_numero?.toLowerCase().includes(termo);
        const matchFornecedor = compra.fornecedor?.nome
          .toLowerCase()
          .includes(termo);
        const matchCategoria = compra.categoria?.nome
          .toLowerCase()
          .includes(termo);

        if (!matchDescricao && !matchNF && !matchFornecedor && !matchCategoria) {
          return false;
        }
      }

      // Filtro de status
      if (filters.status !== "todos" && compra.status !== filters.status) {
        return false;
      }

      // Filtro de fornecedor
      if (
        filters.fornecedor_id !== "todos" &&
        compra.fornecedor_id !== filters.fornecedor_id
      ) {
        return false;
      }

      // Filtro de categoria
      if (
        filters.categoria_id !== "todos" &&
        compra.categoria_id !== filters.categoria_id
      ) {
        return false;
      }

      // Filtro de etapa
      if (filters.etapa_id !== "todos") {
        if (filters.etapa_id === "sem_etapa") {
          if (compra.etapa_relacionada_id !== null) {
            return false;
          }
        } else if (compra.etapa_relacionada_id !== filters.etapa_id) {
          return false;
        }
      }

      // Filtro de data início
      if (filters.data_inicio) {
        const dataCompra = new Date(compra.data_compra);
        if (dataCompra < filters.data_inicio) {
          return false;
        }
      }

      // Filtro de data fim
      if (filters.data_fim) {
        const dataCompra = new Date(compra.data_compra);
        const dataFim = new Date(filters.data_fim);
        dataFim.setHours(23, 59, 59, 999);
        if (dataCompra > dataFim) {
          return false;
        }
      }

      // Filtro de valor mínimo
      if (filters.valor_min) {
        const valorMin = parseFloat(filters.valor_min);
        if (!isNaN(valorMin) && compra.valor_total < valorMin) {
          return false;
        }
      }

      // Filtro de valor máximo
      if (filters.valor_max) {
        const valorMax = parseFloat(filters.valor_max);
        if (!isNaN(valorMax) && compra.valor_total > valorMax) {
          return false;
        }
      }

      return true;
    });
  }, [compras, filters]);

  return (
    <div className="space-y-4">
      {/* Filtros com Resumo */}
      <ComprasFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        fornecedores={fornecedores}
        categorias={categorias}
        etapas={etapas}
        resumo={resumo}
        resultadosFiltrados={comprasFiltradas.length}
      />

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <ComprasTable compras={comprasFiltradas} />
        </CardContent>
      </Card>
    </div>
  );
}
