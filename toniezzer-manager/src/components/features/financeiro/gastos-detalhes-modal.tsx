"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { parseDateString } from "@/lib/utils";

interface GastoDetalhado {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  forma_pagamento: string;
  nota_fiscal_numero: string | null;
  parcela_atual: number | null;
  parcelas: number | null;
  fornecedor_nome: string | null;
  criado_por_nome: string | null;
}

interface GastosDetalhesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaId: string;
  categoriaNome: string;
  etapaId: string;
  etapaNome: string;
  valorTotal: number;
}

export function GastosDetalhesModal({
  open,
  onOpenChange,
  categoriaId,
  categoriaNome,
  etapaId,
  etapaNome,
  valorTotal,
}: GastosDetalhesModalProps) {
  const [gastos, setGastos] = useState<GastoDetalhado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && categoriaId && etapaId) {
      fetchGastos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoriaId, etapaId]);

  const fetchGastos = async () => {
    setLoading(true);
    setError(null);
    setGastos([]); // Limpar gastos anteriores

    try {
      const params = new URLSearchParams({
        categoria_id: categoriaId,
        etapa_id: etapaId,
      });

      const response = await fetch(`/api/financeiro/gastos-detalhes?${params}`);

      if (!response.ok) {
        throw new Error("Erro ao buscar gastos");
      }

      const data = await response.json();
      setGastos(data.gastos || []);
    } catch (err) {
      console.error("Erro ao buscar gastos:", err);
      setError("Erro ao carregar gastos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatFormaPagamento = (forma: string) => {
    const formas: Record<string, string> = {
      dinheiro: "Dinheiro",
      pix: "PIX",
      cartao: "Cartão",
      boleto: "Boleto",
      cheque: "Cheque",
    };
    return formas[forma] || forma;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Gastos: {categoriaNome} → {etapaNome}
          </DialogTitle>
          <DialogDescription>
            Total: {formatCurrency(valorTotal)} ({gastos.length} {gastos.length === 1 ? 'gasto' : 'gastos'})
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-destructive">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && gastos.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <p>Nenhum gasto encontrado</p>
          </div>
        )}

        {!loading && !error && gastos.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Forma Pgto</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell className="whitespace-nowrap">
                      {parseDateString(gasto.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{gasto.descricao}</p>
                        {gasto.nota_fiscal_numero && (
                          <p className="text-xs text-muted-foreground">
                            NF: {gasto.nota_fiscal_numero}
                          </p>
                        )}
                        {gasto.parcelas && gasto.parcelas > 1 && (
                          <Badge variant="outline" className="text-[10px] mt-1">
                            {gasto.parcela_atual}/{gasto.parcelas}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {gasto.fornecedor_nome || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {formatFormaPagamento(gasto.forma_pagamento)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(gasto.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

