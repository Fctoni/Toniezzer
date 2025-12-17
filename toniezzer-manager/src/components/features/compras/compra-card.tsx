"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { parseDateString } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package, FileText, Building2 } from "lucide-react";

interface CompraCardProps {
  compra: {
    id: string;
    descricao: string;
    valor_total: number;
    data_compra: string;
    parcelas: number;
    parcelas_pagas: number;
    valor_pago: number;
    status: "ativa" | "quitada" | "cancelada";
    nota_fiscal_numero: string | null;
    fornecedor?: { nome: string } | null;
    categoria?: { nome: string; cor: string } | null;
    subcategoria?: { nome: string } | null;
  };
}

export function CompraCard({ compra }: CompraCardProps) {
  const percentualPago =
    compra.parcelas > 0 ? (compra.parcelas_pagas / compra.parcelas) * 100 : 0;

  const valorParcela = compra.valor_total / compra.parcelas;

  const statusConfig = {
    ativa: { label: "Ativa", variant: "default" as const },
    quitada: { label: "Quitada", variant: "success" as const },
    cancelada: { label: "Cancelada", variant: "destructive" as const },
  };

  const statusInfo = statusConfig[compra.status] || statusConfig.ativa;

  return (
    <Link href={`/compras/${compra.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{compra.descricao}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {compra.fornecedor && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {compra.fornecedor.nome}
                    </span>
                  )}
                  {compra.categoria && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                      style={{
                        borderColor: compra.categoria.cor,
                        color: compra.categoria.cor,
                      }}
                    >
                      {compra.categoria.nome}
                      {compra.subcategoria && ` › ${compra.subcategoria.nome}`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">
                {format(parseDateString(compra.data_compra), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
              {compra.status === "quitada" && (
                <Badge variant="outline" className="mt-1 text-[10px] text-green-600 border-green-600">
                  ✓ Quitada
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                R${" "}
                {compra.valor_total.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-muted-foreground text-xs">
                {compra.parcelas}x de R${" "}
                {valorParcela.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="space-y-1">
              <Progress value={percentualPago} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {compra.parcelas_pagas}/{compra.parcelas} parcelas pagas
                </span>
                <span>{Math.round(percentualPago)}%</span>
              </div>
            </div>

            {compra.nota_fiscal_numero && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                <FileText className="h-3 w-3" />
                <span>NF: {compra.nota_fiscal_numero}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

