"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { parseDateString } from "@/lib/utils";
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
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

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

interface ComprasTableProps {
  compras: Compra[];
}

export function ComprasTable({ compras }: ComprasTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string) =>
    format(parseDateString(date), "dd/MM/yyyy", { locale: ptBR });

  const getStatusBadge = (status: string, parcelasPagas: number, parcelas: number) => {
    if (status === "cancelada") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Cancelada
        </Badge>
      );
    }
    if (status === "quitada" || parcelasPagas >= parcelas) {
      return (
        <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
          <CheckCircle className="h-3 w-3" />
          Quitada
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
        <Clock className="h-3 w-3" />
        Ativa
      </Badge>
    );
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

  if (compras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">Nenhuma compra encontrada</p>
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
          <TableHead>Fornecedor</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Etapa</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-center">Parcelas</TableHead>
          <TableHead>Progresso</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {compras.map((compra) => {
          const percentualPago =
            compra.parcelas > 0
              ? (compra.parcelas_pagas / compra.parcelas) * 100
              : 0;

          return (
            <TableRow key={compra.id}>
              <TableCell className="font-medium whitespace-nowrap">
                {formatDate(compra.data_compra)}
              </TableCell>
              <TableCell>
                <div className="max-w-[200px]">
                  <p className="font-medium truncate">{compra.descricao}</p>
                  {compra.nota_fiscal_numero && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      NF: {compra.nota_fiscal_numero}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{compra.fornecedor?.nome || "-"}</span>
              </TableCell>
              <TableCell>
                {compra.categoria && (
                  <div className="flex items-start gap-2">
                    <div
                      className="h-2 w-2 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: compra.categoria.cor }}
                    />
                    <div>
                      <span className="text-sm">{compra.categoria.nome}</span>
                      {compra.subcategoria && (
                        <p className="text-xs text-muted-foreground">
                          {compra.subcategoria.nome}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm">{compra.etapa?.nome || "-"}</span>
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                {formatCurrency(compra.valor_total)}
                <p className="text-xs text-muted-foreground font-normal">
                  {compra.parcelas}x {formatCurrency(compra.valor_total / compra.parcelas)}
                </p>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-sm font-medium">
                  {compra.parcelas_pagas}/{compra.parcelas}
                </span>
              </TableCell>
              <TableCell>
                <div className="w-24 space-y-1">
                  <Progress value={percentualPago} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {Math.round(percentualPago)}%
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(compra.status, compra.parcelas_pagas, compra.parcelas)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/compras/${compra.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

