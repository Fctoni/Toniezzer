"use client";

import { ComprasTable } from "./compras-table";
import { ComprasMobile } from "./compras-mobile";
import { useMobile } from "@/lib/hooks/use-media-query";

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
  fornecedor?: { nome: string } | null;
  categoria?: { nome: string; cor: string } | null;
  subcategoria?: { nome: string } | null;
  etapa?: { nome: string } | null;
}

interface ComprasWrapperProps {
  compras: Compra[];
}

export function ComprasWrapper({ compras }: ComprasWrapperProps) {
  const isMobile = useMobile();

  if (isMobile) {
    return <ComprasMobile compras={compras} />;
  }

  return <ComprasTable compras={compras} />;
}
