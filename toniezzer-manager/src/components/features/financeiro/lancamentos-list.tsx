"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LancamentosTable } from "./lancamentos-table";
import {
  LancamentosFiltersComponent,
  LancamentosFilters,
  defaultLancamentosFilters,
} from "./lancamentos-filters";

interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  forma_pagamento: string;
  parcelas: number;
  parcela_atual: number | null;
  status: string;
  nota_fiscal_url: string | null;
  criado_via: string;
  pago: boolean;
  pago_em: string | null;
  compra_id: string | null;
  fornecedor_id: string | null;
  categoria_id: string | null;
  categorias: { nome: string; cor: string } | null;
  fornecedores: { nome: string } | null;
  etapas: { nome: string } | null;
  compras: { id: string; descricao: string } | null;
}

interface LancamentosListProps {
  gastos: Gasto[];
  fornecedores: Array<{ id: string; nome: string }>;
  categorias: Array<{ id: string; nome: string; cor: string }>;
}

export function LancamentosList({
  gastos,
  fornecedores,
  categorias,
}: LancamentosListProps) {
  const [filters, setFilters] = useState<LancamentosFilters>(
    defaultLancamentosFilters
  );

  // Calcular resumo (sempre sobre todos os dados)
  const resumo = useMemo(() => {
    const pagos = gastos.filter((g) => g.pago);
    const pendentes = gastos.filter((g) => !g.pago);
    return {
      total: gastos.length,
      valorTotal: gastos.reduce((acc, g) => acc + Number(g.valor), 0),
      valorPago: pagos.reduce((acc, g) => acc + Number(g.valor), 0),
      valorPendente: pendentes.reduce((acc, g) => acc + Number(g.valor), 0),
      qtdPago: pagos.length,
      qtdPendente: pendentes.length,
    };
  }, [gastos]);

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((gasto) => {
      // Filtro de busca (descrição, fornecedor, categoria)
      if (filters.busca) {
        const termo = filters.busca.toLowerCase();
        const matchDescricao = gasto.descricao.toLowerCase().includes(termo);
        const matchFornecedor = gasto.fornecedores?.nome
          .toLowerCase()
          .includes(termo);
        const matchCategoria = gasto.categorias?.nome
          .toLowerCase()
          .includes(termo);

        if (!matchDescricao && !matchFornecedor && !matchCategoria) {
          return false;
        }
      }

      // Filtro de status de pagamento
      if (filters.status_pagamento !== "todos") {
        if (filters.status_pagamento === "pago" && !gasto.pago) return false;
        if (filters.status_pagamento === "pendente" && gasto.pago) return false;
      }

      // Filtro de fornecedor
      if (
        filters.fornecedor_id !== "todos" &&
        gasto.fornecedor_id !== filters.fornecedor_id
      ) {
        return false;
      }

      // Filtro de categoria
      if (
        filters.categoria_id !== "todos" &&
        gasto.categoria_id !== filters.categoria_id
      ) {
        return false;
      }

      // Filtro de vencimento início
      if (filters.vencimento_inicio) {
        const dataVencimento = new Date(gasto.data);
        if (dataVencimento < filters.vencimento_inicio) {
          return false;
        }
      }

      // Filtro de vencimento fim
      if (filters.vencimento_fim) {
        const dataVencimento = new Date(gasto.data);
        const dataFim = new Date(filters.vencimento_fim);
        dataFim.setHours(23, 59, 59, 999);
        if (dataVencimento > dataFim) {
          return false;
        }
      }

      // Filtro de pagamento início
      if (filters.pagamento_inicio && gasto.pago_em) {
        const dataPagamento = new Date(gasto.pago_em);
        if (dataPagamento < filters.pagamento_inicio) {
          return false;
        }
      } else if (filters.pagamento_inicio && !gasto.pago_em) {
        return false;
      }

      // Filtro de pagamento fim
      if (filters.pagamento_fim && gasto.pago_em) {
        const dataPagamento = new Date(gasto.pago_em);
        const dataFim = new Date(filters.pagamento_fim);
        dataFim.setHours(23, 59, 59, 999);
        if (dataPagamento > dataFim) {
          return false;
        }
      } else if (filters.pagamento_fim && !gasto.pago_em) {
        return false;
      }

      // Filtro de valor mínimo
      if (filters.valor_min) {
        const valorMin = parseFloat(filters.valor_min);
        if (!isNaN(valorMin) && Number(gasto.valor) < valorMin) {
          return false;
        }
      }

      // Filtro de valor máximo
      if (filters.valor_max) {
        const valorMax = parseFloat(filters.valor_max);
        if (!isNaN(valorMax) && Number(gasto.valor) > valorMax) {
          return false;
        }
      }

      // Filtro de vínculo com compra
      if (filters.vinculo_compra !== "todos") {
        if (filters.vinculo_compra === "com_compra" && !gasto.compra_id) {
          return false;
        }
        if (filters.vinculo_compra === "sem_compra" && gasto.compra_id) {
          return false;
        }
      }

      return true;
    });
  }, [gastos, filters]);

  return (
    <div className="space-y-4">
      {/* Filtros com Resumo */}
      <LancamentosFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        fornecedores={fornecedores}
        categorias={categorias}
        resumo={resumo}
        resultadosFiltrados={gastosFiltrados.length}
      />

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <LancamentosTable gastos={gastosFiltrados} />
        </CardContent>
      </Card>
    </div>
  );
}
