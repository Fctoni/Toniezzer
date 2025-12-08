"use client";

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
import { MoreHorizontal, Eye, Pencil, Trash2, FileText } from "lucide-react";
import Link from "next/link";

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
  categorias: { nome: string; cor: string } | null;
  fornecedores: { nome: string } | null;
  etapas: { nome: string } | null;
}

interface LancamentosTableProps {
  gastos: Gasto[];
}

export function LancamentosTable({ gastos }: LancamentosTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR");

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

  if (gastos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">Nenhum lançamento encontrado</p>
        <Button asChild>
          <Link href="/financeiro/lancamentos/novo">Criar primeiro lançamento</Link>
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
          <TableHead>Categoria</TableHead>
          <TableHead>Fornecedor</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gastos.map((gasto) => (
          <TableRow key={gasto.id}>
            <TableCell className="font-medium">{formatDate(gasto.data)}</TableCell>
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
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: gasto.categorias?.cor || "#888" }}
                />
                <span className="text-sm">{gasto.categorias?.nome || "-"}</span>
              </div>
            </TableCell>
            <TableCell>{gasto.fornecedores?.nome || "-"}</TableCell>
            <TableCell>{getFormaPagamento(gasto.forma_pagamento)}</TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(Number(gasto.valor))}
            </TableCell>
            <TableCell>{getStatusBadge(gasto.status)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/financeiro/lancamentos/${gasto.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  {gasto.nota_fiscal_url && (
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      Ver NF
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

