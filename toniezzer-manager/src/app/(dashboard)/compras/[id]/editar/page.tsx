"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package } from "lucide-react";
import { CompraEditForm } from "@/components/features/compras/compra-edit-form";

interface Compra {
  id: string;
  descricao: string;
  valor_total: number;
  data_compra: string;
  fornecedor_id: string;
  categoria_id: string;
  forma_pagamento: string;
  parcelas: number;
  parcelas_pagas: number;
  valor_pago: number;
  data_primeira_parcela: string;
  nota_fiscal_numero: string | null;
  nota_fiscal_url: string | null;
  status: "ativa" | "quitada" | "cancelada";
  observacoes: string | null;
  etapa_relacionada_id: string | null;
}

interface Categoria {
  id: string;
  nome: string;
  cor: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

interface Etapa {
  id: string;
  nome: string;
}

export default function EditarCompraPage() {
  const params = useParams();
  const router = useRouter();
  const [compra, setCompra] = useState<Compra | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  const carregarDados = useCallback(async () => {
    if (!id) return;

    const supabase = createClient();

    // Buscar compra
    const { data: compraData, error: compraError } = await supabase
      .from("compras")
      .select("*")
      .eq("id", id)
      .single();

    if (compraError) {
      console.error("Erro ao buscar compra:", compraError);
      toast.error("Erro ao carregar compra");
      router.push("/compras");
      return;
    }

    if (compraData.status === "cancelada") {
      toast.error("Não é possível editar uma compra cancelada");
      router.push(`/compras/${id}`);
      return;
    }

    setCompra({
      id: compraData.id,
      descricao: compraData.descricao,
      valor_total: Number(compraData.valor_total),
      data_compra: compraData.data_compra,
      fornecedor_id: compraData.fornecedor_id,
      categoria_id: compraData.categoria_id,
      forma_pagamento: compraData.forma_pagamento,
      parcelas: compraData.parcelas ?? 1,
      parcelas_pagas: compraData.parcelas_pagas ?? 0,
      valor_pago: Number(compraData.valor_pago || 0),
      data_primeira_parcela: compraData.data_primeira_parcela,
      nota_fiscal_numero: compraData.nota_fiscal_numero,
      nota_fiscal_url: compraData.nota_fiscal_url,
      status: compraData.status as "ativa" | "quitada" | "cancelada",
      observacoes: compraData.observacoes,
      etapa_relacionada_id: compraData.etapa_relacionada_id,
    });

    // Buscar categorias, fornecedores e etapas
    const [categoriasRes, fornecedoresRes, etapasRes] = await Promise.all([
      supabase.from("categorias").select("id, nome, cor").order("nome"),
      supabase.from("fornecedores").select("id, nome").order("nome"),
      supabase.from("etapas").select("id, nome").order("ordem"),
    ]);

    if (categoriasRes.data) setCategorias(categoriasRes.data);
    if (fornecedoresRes.data) setFornecedores(fornecedoresRes.data);
    if (etapasRes.data) setEtapas(etapasRes.data);

    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!compra) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Compra não encontrada</p>
        <Link href="/compras">
          <Button variant="link">Voltar para Compras</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/compras/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Editar Compra</h1>
          </div>
          <p className="text-sm text-muted-foreground">{compra.descricao}</p>
        </div>
      </div>

      <CompraEditForm
        compra={compra}
        categorias={categorias}
        fornecedores={fornecedores}
        etapas={etapas}
      />
    </div>
  );
}

