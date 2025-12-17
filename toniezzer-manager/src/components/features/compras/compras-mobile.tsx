"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { parseDateString } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Store,
  Tag,
  ChevronRight,
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

interface ComprasMobileProps {
  compras: Compra[];
}

export function ComprasMobile({ compras }: ComprasMobileProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string) =>
    format(parseDateString(date), "dd/MM/yy", { locale: ptBR });

  const getStatusConfig = (status: string, parcelasPagas: number, parcelas: number) => {
    if (status === "cancelada") {
      return {
        label: "Cancelada",
        icon: XCircle,
        variant: "destructive" as const,
        className: "",
      };
    }
    if (status === "quitada" || parcelasPagas >= parcelas) {
      return {
        label: "Quitada",
        icon: CheckCircle,
        variant: "outline" as const,
        className: "text-green-600 border-green-600",
      };
    }
    return {
      label: "Ativa",
      icon: Clock,
      variant: "outline" as const,
      className: "text-amber-600 border-amber-600",
    };
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
    <div className="space-y-3">
      {compras.map((compra) => {
        const percentualPago =
          compra.parcelas > 0 ? (compra.parcelas_pagas / compra.parcelas) * 100 : 0;
        const statusConfig = getStatusConfig(
          compra.status,
          compra.parcelas_pagas,
          compra.parcelas
        );
        const StatusIcon = statusConfig.icon;

        return (
          <Link key={compra.id} href={`/compras/${compra.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                {/* Header: Descricao + Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{compra.descricao}</p>
                    {compra.nota_fiscal_numero && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <FileText className="h-3 w-3" />
                        NF: {compra.nota_fiscal_numero}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={statusConfig.variant}
                    className={`gap-1 shrink-0 ${statusConfig.className}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Info Row: Fornecedor + Categoria */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                  {compra.fornecedor && (
                    <div className="flex items-center gap-1">
                      <Store className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[120px]">{compra.fornecedor.nome}</span>
                    </div>
                  )}
                  {compra.categoria && (
                    <div className="flex items-center gap-1">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: compra.categoria.cor }}
                      />
                      <span className="truncate max-w-[100px]">{compra.categoria.nome}</span>
                    </div>
                  )}
                  {compra.etapa && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[100px]">{compra.etapa.nome}</span>
                    </div>
                  )}
                </div>

                {/* Bottom: Valor + Data + Parcelas */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">
                      {formatCurrency(compra.valor_total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(compra.data_compra)} • {compra.parcelas}x
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          {compra.parcelas_pagas}/{compra.parcelas}
                        </span>
                        <span className="font-medium">{Math.round(percentualPago)}%</span>
                      </div>
                      <Progress value={percentualPago} className="h-1.5" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
