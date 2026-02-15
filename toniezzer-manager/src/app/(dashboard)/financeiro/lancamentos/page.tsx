import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Download, Package } from "lucide-react";
import Link from "next/link";
import { LancamentosList } from "@/components/features/financeiro/lancamentos-list";
import { fetchExpensesWithDetails } from "@/lib/services/gastos";
import { fetchAllSuppliersForDropdown } from "@/lib/services/fornecedores";
import { fetchAllCategoriesForDropdown } from "@/lib/services/categorias";

export default async function LancamentosPage() {
  const supabase = await createClient();

  // Buscar gastos
  const gastos = await fetchExpensesWithDetails(supabase);

  // Buscar fornecedores para o filtro
  const fornecedores = await fetchAllSuppliersForDropdown(supabase);

  // Buscar categorias para o filtro
  const categorias = await fetchAllCategoriesForDropdown(supabase);

  // Garantir que campos nullable estejam preenchidos
  const gastosFormatados = gastos?.map(gasto => ({
    ...gasto,
    parcelas: gasto.parcelas || 1,
    pago: gasto.pago ?? false
  })) || [];

  return (
    <div className="space-y-6 animate-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
          <p className="text-muted-foreground">
            Parcelas e pagamentos das compras
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button asChild>
            <Link href="/compras/nova">
              <Package className="mr-2 h-4 w-4" />
              Nova Compra
            </Link>
          </Button>
        </div>
      </div>

      {/* Lista com Filtros e Resumo */}
      <LancamentosList
        gastos={gastosFormatados}
        fornecedores={fornecedores || []}
        categorias={categorias || []}
      />
    </div>
  );
}
