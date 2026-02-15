import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchPurchaseByIdWithDetails } from "@/lib/services/compras";
import { fetchExpensesByPurchase } from "@/lib/services/gastos";
import { CompraDetalhesClient } from "@/components/features/compras/compra-detalhes-client";

export default async function CompraDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  let compraData;
  try {
    compraData = await fetchPurchaseByIdWithDetails(supabase, id);
  } catch {
    notFound();
  }

  const compra = {
    id: compraData.id,
    descricao: compraData.descricao,
    valor_total: Number(compraData.valor_total),
    data_compra: compraData.data_compra,
    fornecedor_id: compraData.fornecedor_id,
    categoria_id: compraData.categoria_id,
    subcategoria_id: compraData.subcategoria_id,
    forma_pagamento: compraData.forma_pagamento,
    parcelas: compraData.parcelas ?? 1,
    parcelas_pagas: compraData.parcelas_pagas ?? 0,
    valor_pago: Number(compraData.valor_pago || 0),
    data_primeira_parcela: compraData.data_primeira_parcela,
    nota_fiscal_numero: compraData.nota_fiscal_numero,
    nota_fiscal_url: compraData.nota_fiscal_url,
    status: compraData.status as "ativa" | "quitada" | "cancelada",
    observacoes: compraData.observacoes,
    fornecedor: compraData.fornecedor as { nome: string; cnpj_cpf?: string } | null,
    categoria: compraData.categoria as { nome: string; cor: string } | null,
    subcategoria: compraData.subcategoria as { nome: string } | null,
    etapa: compraData.etapa as { nome: string } | null,
  };

  let parcelas: {
    id: string;
    valor: number;
    data: string;
    parcela_atual: number;
    parcelas: number;
    pago: boolean;
    pago_em: string | null;
    comprovante_pagamento_url: string | null;
  }[];
  try {
    const parcelasData = await fetchExpensesByPurchase(supabase, id);
    parcelas = parcelasData.map((p) => ({
      id: p.id,
      valor: Number(p.valor),
      data: p.data,
      parcela_atual: p.parcela_atual ?? 1,
      parcelas: p.parcelas ?? 1,
      pago: p.pago ?? false,
      pago_em: p.pago_em,
      comprovante_pagamento_url: p.comprovante_pagamento_url,
    }));
  } catch {
    parcelas = [];
  }

  return <CompraDetalhesClient compra={compra} parcelas={parcelas} />;
}
