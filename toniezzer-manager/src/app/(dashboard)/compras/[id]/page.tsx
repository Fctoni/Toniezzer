"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { parseDateString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  ArrowLeft,
  Package,
  Building2,
  Calendar,
  FileText,
  CreditCard,
  Tag,
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

export default function CompraDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [compra, setCompra] = useState<Compra | null>(null);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  const id = params.id as string;

  const carregarDados = useCallback(async () => {
    if (!id) return;
    
    const supabase = createClient();

    // Buscar compra
    const { data: compraData, error: compraError } = await supabase
      .from("compras")
      .select(
        `
        *,
        fornecedor:fornecedores(nome, cnpj_cpf),
        categoria:categorias(nome, cor),
        etapa:etapas(nome)
      `
      )
      .eq("id", id)
      .single();

    if (compraError) {
      console.error("Erro ao buscar compra:", compraError);
      toast.error("Erro ao carregar compra");
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
      fornecedor: compraData.fornecedor as { nome: string; cnpj_cpf?: string } | null,
      categoria: compraData.categoria as { nome: string; cor: string } | null,
      etapa: compraData.etapa as { nome: string } | null,
    });

    // Buscar parcelas (gastos vinculados)
    const { data: parcelasData, error: parcelasError } = await supabase
      .from("gastos")
      .select("id, valor, data, parcela_atual, parcelas, pago, pago_em, comprovante_pagamento_url")
      .eq("compra_id", id)
      .order("parcela_atual");

    if (parcelasError) {
      console.error("Erro ao buscar parcelas:", parcelasError);
    } else {
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
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleCancelar = async () => {
    setCanceling(true);

    try {
      const supabase = createClient();

      // Atualizar status da compra
      const { error } = await supabase
        .from("compras")
        .update({ status: "cancelada" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Compra cancelada com sucesso");
      router.push("/compras");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cancelar compra");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
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

  const percentualPago =
    compra.parcelas > 0 ? (compra.parcelas_pagas / compra.parcelas) * 100 : 0;
  const valorParcela = compra.valor_total / compra.parcelas;

  const formaPagamentoLabel: Record<string, string> = {
    dinheiro: "Dinheiro",
    pix: "PIX",
    cartao: "Cartão",
    boleto: "Boleto",
    cheque: "Cheque",
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
            <Link href={`/compras/${id}/editar`}>
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

      {/* Cards de Informação */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Valor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R${" "}
              {compra.valor_total.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {compra.parcelas}x de R${" "}
              {valorParcela.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={percentualPago} className="h-3" />
              <div className="flex justify-between text-sm">
                <span>
                  {compra.parcelas_pagas}/{compra.parcelas} pagas
                </span>
                <span className="font-medium">{Math.round(percentualPago)}%</span>
              </div>
              {compra.status === "quitada" && (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  ✓ Quitada
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Data da Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {format(parseDateString(compra.data_compra), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              1ª parcela:{" "}
              {format(parseDateString(compra.data_primeira_parcela), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Informações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fornecedor</p>
                <p className="font-medium">{compra.fornecedor?.nome || "-"}</p>
                {compra.fornecedor?.cnpj_cpf && (
                  <p className="text-xs text-muted-foreground">
                    {compra.fornecedor.cnpj_cpf}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <div className="flex items-center gap-2">
                  {compra.categoria && (
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: compra.categoria.cor }}
                    />
                  )}
                  <p className="font-medium">
                    {compra.categoria?.nome || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Forma de Pagamento
                </p>
                <p className="font-medium">
                  {formaPagamentoLabel[compra.forma_pagamento] ||
                    compra.forma_pagamento}
                </p>
              </div>
            </div>

            {compra.etapa && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Etapa Relacionada
                  </p>
                  <p className="font-medium">{compra.etapa.nome}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nota Fiscal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nota Fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            {compra.nota_fiscal_numero || compra.nota_fiscal_url ? (
              <div className="space-y-3">
                {compra.nota_fiscal_numero && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Número</p>
                      <p className="font-medium">{compra.nota_fiscal_numero}</p>
                    </div>
                  </div>
                )}
                
                {compra.nota_fiscal_url && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <FileText className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Arquivo anexado</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {compra.nota_fiscal_url.split("/").pop()}
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <a
                        href={compra.nota_fiscal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma nota fiscal anexada
                </p>
              </div>
            )}

            {compra.observacoes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{compra.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Parcelas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Parcelas ({compra.parcelas_pagas}/{compra.parcelas} pagas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ParcelasTable parcelas={parcelas} onParcelaPaga={carregarDados} />
        </CardContent>
      </Card>
    </div>
  );
}

