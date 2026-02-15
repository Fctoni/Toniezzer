"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cancelPurchase } from "@/lib/services/compras";
import { fetchExpensesByPurchase } from "@/lib/services/gastos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ParcelasTable } from "@/components/features/compras/parcelas-table";
import { CompraInfoCards } from "@/components/features/compras/compra-info-cards";
import {
  ArrowLeft,
  Package,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";

interface Compra {
  id: string;
  descricao: string;
  valor_total: number;
  data_compra: string;
  fornecedor_id: string;
  categoria_id: string;
  subcategoria_id: string | null;
  forma_pagamento: string;
  parcelas: number;
  parcelas_pagas: number;
  valor_pago: number;
  data_primeira_parcela: string;
  nota_fiscal_numero: string | null;
  nota_fiscal_url: string | null;
  status: "ativa" | "quitada" | "cancelada";
  observacoes: string | null;
  fornecedor?: { nome: string; cnpj_cpf?: string } | null;
  categoria?: { nome: string; cor: string } | null;
  subcategoria?: { nome: string } | null;
  etapa?: { nome: string } | null;
}

interface Parcela {
  id: string;
  valor: number;
  data: string;
  parcela_atual: number;
  parcelas: number;
  pago: boolean;
  pago_em: string | null;
  comprovante_pagamento_url: string | null;
}

interface CompraDetalhesClientProps {
  compra: Compra;
  parcelas: Parcela[];
}

export function CompraDetalhesClient({
  compra,
  parcelas: initialParcelas,
}: CompraDetalhesClientProps) {
  const router = useRouter();
  const [canceling, setCanceling] = useState(false);
  const [parcelas, setParcelas] = useState(initialParcelas);

  const carregarParcelas = async () => {
    try {
      const supabase = createClient();
      const parcelasData = await fetchExpensesByPurchase(supabase, compra.id);
      setParcelas(
        parcelasData.map((p) => ({
          id: p.id,
          valor: Number(p.valor),
          data: p.data,
          parcela_atual: p.parcela_atual ?? 1,
          parcelas: p.parcelas ?? 1,
          pago: p.pago ?? false,
          pago_em: p.pago_em,
          comprovante_pagamento_url: p.comprovante_pagamento_url,
        }))
      );
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar parcelas:", error);
    }
  };

  const handleCancelar = async () => {
    setCanceling(true);

    try {
      const supabase = createClient();
      await cancelPurchase(supabase, compra.id);

      toast.success("Compra cancelada com sucesso");
      router.push("/compras");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cancelar compra");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/compras">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                {compra.descricao}
              </h1>
            </div>
            {compra.status === "cancelada" && (
              <Badge variant="destructive" className="mt-1">
                Cancelada
              </Badge>
            )}
          </div>
        </div>

        {compra.status !== "cancelada" && (
          <div className="flex gap-2">
            <Link href={`/compras/${compra.id}/editar`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancelar Compra
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar Compra?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A compra será marcada como
                    cancelada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelar}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {canceling ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Confirmar Cancelamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <CompraInfoCards compra={compra} />

      {/* Parcelas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Parcelas ({compra.parcelas_pagas}/{compra.parcelas} pagas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ParcelasTable parcelas={parcelas} onParcelaPaga={carregarParcelas} />
        </CardContent>
      </Card>
    </div>
  );
}
