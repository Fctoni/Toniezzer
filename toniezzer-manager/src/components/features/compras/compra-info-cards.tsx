import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateString } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Calendar,
  FileText,
  CreditCard,
  Tag,
} from "lucide-react";

interface CompraInfoCardsProps {
  compra: {
    valor_total: number;
    parcelas: number;
    parcelas_pagas: number;
    data_compra: string;
    data_primeira_parcela: string;
    forma_pagamento: string;
    status: "ativa" | "quitada" | "cancelada";
    nota_fiscal_numero: string | null;
    nota_fiscal_url: string | null;
    observacoes: string | null;
    fornecedor?: { nome: string; cnpj_cpf?: string } | null;
    categoria?: { nome: string; cor: string } | null;
    subcategoria?: { nome: string } | null;
    etapa?: { nome: string } | null;
  };
}

const formaPagamentoLabel: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao: "Cartão",
  boleto: "Boleto",
  cheque: "Cheque",
};

export function CompraInfoCards({ compra }: CompraInfoCardsProps) {
  const percentualPago =
    compra.parcelas > 0 ? (compra.parcelas_pagas / compra.parcelas) * 100 : 0;
  const valorParcela = compra.valor_total / compra.parcelas;

  return (
    <>
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
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

      {/* Cards de Detalhes */}
      <div className="grid gap-4 md:grid-cols-2">
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
                  <div>
                    <p className="font-medium">
                      {compra.categoria?.nome || "-"}
                    </p>
                    {compra.subcategoria && (
                      <p className="text-xs text-muted-foreground">
                        {compra.subcategoria.nome}
                      </p>
                    )}
                  </div>
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
    </>
  );
}
