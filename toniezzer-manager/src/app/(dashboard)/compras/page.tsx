import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ComprasList } from "@/components/features/compras/compras-list";
import { Package, Plus } from "lucide-react";
import { fetchPurchasesWithDetails } from "@/lib/services/compras";
import { fetchAllSuppliersForDropdown } from "@/lib/services/fornecedores";
import { fetchAllCategoriesForDropdown } from "@/lib/services/categorias";

type CompraComRelacoes = {
  id: string;
  descricao: string;
  data_compra: string;
  valor_total: number | string;
  valor_pago: number | string | null;
  parcelas: number;
  parcelas_pagas: number | null;
  status: string;
  nota_fiscal_numero: string | null;
  forma_pagamento: string;
  fornecedor_id: string;
  categoria_id: string;
  subcategoria_id: string | null;
  etapa_relacionada_id: string | null;
  fornecedor: { nome: string } | null;
  categoria: { nome: string; cor: string } | null;
  subcategoria: { nome: string } | null;
  etapa: { nome: string } | null;
  [key: string]: unknown;
};

export default async function ComprasPage() {
  const supabase = await createClient();

  // Buscar compras
  let compras: CompraComRelacoes[] | null = null;
  try {
    const comprasRaw = await fetchPurchasesWithDetails(supabase);
    compras = comprasRaw as CompraComRelacoes[];
  } catch (error) {
    console.error("Erro ao buscar compras:", error);
  }

  // Buscar fornecedores para o filtro
  const fornecedores = await fetchAllSuppliersForDropdown(supabase);

  // Buscar categorias para o filtro
  const categorias = await fetchAllCategoriesForDropdown(supabase);

  // Buscar etapas para o filtro
  const { data: etapas } = await supabase
    .from("etapas")
    .select("id, nome")
    .order("ordem");

  const comprasFormatadas =
    compras?.map((compra) => ({
      ...compra,
      valor_total: Number(compra.valor_total),
      valor_pago: Number(compra.valor_pago || 0),
      parcelas_pagas: compra.parcelas_pagas || 0,
      status: compra.status as "ativa" | "quitada" | "cancelada",
      fornecedor: compra.fornecedor,
      categoria: compra.categoria,
      subcategoria: compra.subcategoria,
      etapa: compra.etapa,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground">
            Gerencie todas as compras e aquisições da obra
          </p>
        </div>
        <Link href="/compras/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Compra
          </Button>
        </Link>
      </div>

      {/* Lista de Compras com Filtros e Resumo */}
      {!compras || compras.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhuma compra cadastrada</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Comece adicionando sua primeira compra
          </p>
          <Link href="/compras/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Compra
            </Button>
          </Link>
        </div>
      ) : (
        <ComprasList
          compras={comprasFormatadas}
          fornecedores={fornecedores || []}
          categorias={categorias || []}
          etapas={etapas || []}
        />
      )}
    </div>
  );
}
