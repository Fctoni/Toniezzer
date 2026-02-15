"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateDueDate } from "@/lib/services/gastos";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MoreHorizontal, Eye, Package, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { formatDateToString, parseDateString } from "@/lib/utils";

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
  categorias: { nome: string; cor: string } | null;
  fornecedores: { nome: string } | null;
  etapas: { nome: string } | null;
  compras: { id: string; descricao: string } | null;
}

interface LancamentosTableProps {
  gastos: Gasto[];
  onDataAlterada?: () => void;
}

export function LancamentosTable({ gastos, onDataAlterada }: LancamentosTableProps) {
  const [editandoDataId, setEditandoDataId] = useState<string | null>(null);

  const handleAlterarData = async (gasto: Gasto, novaData: Date) => {
    try {
      const supabase = createClient();
      await updateDueDate(supabase, gasto.id, formatDateToString(novaData));
      toast.success("Data de vencimento atualizada");
      setEditandoDataId(null);
      onDataAlterada?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar data de vencimento");
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string) =>
    parseDateString(date).toLocaleDateString("pt-BR");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovado":
        return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Aprovado</Badge>;
      case "pendente_aprovacao":
        return <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">Pendente</Badge>;
      case "rejeitado":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFormaPagamento = (forma: string) => {
    const formas: Record<string, string> = {
      dinheiro: "Dinheiro",
      pix: "PIX",
      cartao: "Cartão",
      boleto: "Boleto",
      cheque: "Cheque",
    };
    return formas[forma] || forma;
  };

  const getPagoBadge = (pago: boolean) => {
    if (pago) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Pago
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-600">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  if (gastos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">Nenhum lançamento encontrado</p>
        <Button asChild>
          <Link href="/compras/nova">Criar primeira compra</Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Origem</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gastos.map((gasto) => (
          <TableRow key={gasto.id}>
            <TableCell className="font-medium">
              {!gasto.pago ? (
                <Popover
                  open={editandoDataId === gasto.id}
                  onOpenChange={(open) => setEditandoDataId(open ? gasto.id : null)}
                >
                  <PopoverTrigger asChild>
                    <span className="cursor-default">
                      {formatDate(gasto.data)}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDateString(gasto.data)}
                      onSelect={(date) => date && handleAlterarData(gasto, date)}
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                formatDate(gasto.data)
              )}
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{gasto.descricao}</p>
                {gasto.parcelas > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Parcela {gasto.parcela_atual}/{gasto.parcelas}
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell>
              {gasto.compra_id && gasto.compras ? (
                <Link
                  href={`/compras/${gasto.compra_id}`}
                  className="flex items-center gap-1 text-primary hover:underline text-sm"
                >
                  <Package className="h-3 w-3" />
                  Ver Compra
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">Avulso</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: gasto.categorias?.cor || "#888" }}
                />
                <span className="text-sm">{gasto.categorias?.nome || "-"}</span>
              </div>
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(Number(gasto.valor))}
            </TableCell>
            <TableCell>{getPagoBadge(gasto.pago)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {gasto.compra_id ? (
                    <DropdownMenuItem asChild>
                      <Link href={`/compras/${gasto.compra_id}`}>
                        <Package className="mr-2 h-4 w-4" />
                        Ver compra
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href={`/financeiro/lancamentos/${gasto.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

