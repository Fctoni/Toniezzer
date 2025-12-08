"use client";

import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ParcelasPreviewProps {
  valorTotal: number;
  numeroParcelas: number;
  dataPrimeiraParcela: Date;
}

export function ParcelasPreview({
  valorTotal,
  numeroParcelas,
  dataPrimeiraParcela,
}: ParcelasPreviewProps) {
  if (!valorTotal || !numeroParcelas || !dataPrimeiraParcela) {
    return null;
  }

  const parcelas = [];
  const valorParcela = valorTotal / numeroParcelas;

  // Arredondar para 2 casas decimais
  const valorArredondado = Math.floor(valorParcela * 100) / 100;
  const diferencaArredondamento =
    valorTotal - valorArredondado * numeroParcelas;

  for (let i = 0; i < numeroParcelas; i++) {
    const dataParcela = addMonths(dataPrimeiraParcela, i);

    parcelas.push({
      numero: i + 1,
      data: dataParcela,
      valor:
        i === numeroParcelas - 1
          ? valorArredondado + diferencaArredondamento
          : valorArredondado,
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Preview das Parcelas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Parcela</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcelas.map((parcela) => (
                <TableRow key={parcela.numero}>
                  <TableCell className="font-medium">
                    {parcela.numero}/{numeroParcelas}
                  </TableCell>
                  <TableCell>
                    {format(parcela.data, "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    R${" "}
                    {parcela.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold">
            R${" "}
            {valorTotal.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

