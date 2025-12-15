"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CheckCircle, Clock, Loader2, CalendarIcon } from "lucide-react";
import { cn, formatDateToString } from "@/lib/utils";

interface Parcela {
  id: string;
  valor: number;
  data: string;
  parcela_atual: number;
  parcelas: number;
  pago: boolean;
  pago_em: string | null;
}

interface ParcelasTableProps {
  parcelas: Parcela[];
  onParcelaPaga?: () => void;
}

export function ParcelasTable({ parcelas, onParcelaPaga }: ParcelasTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedParcela, setSelectedParcela] = useState<Parcela | null>(null);
  const [dataPagamento, setDataPagamento] = useState<Date>(new Date());

  const handleOpenDialog = (parcela: Parcela) => {
    setSelectedParcela(parcela);
    setDataPagamento(new Date()); // Sugerir data de hoje
    setDialogOpen(true);
  };

  const handleMarcarPago = async () => {
    if (!selectedParcela) return;

    setLoadingId(selectedParcela.id);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("gastos")
        .update({
          pago: true,
          pago_em: formatDateToString(dataPagamento),
        })
        .eq("id", selectedParcela.id);

      if (error) throw error;

      toast.success("Parcela marcada como paga!");
      setDialogOpen(false);
      onParcelaPaga?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao marcar parcela como paga");
    } finally {
      setLoadingId(null);
    }
  };

  const parcelasOrdenadas = [...parcelas].sort(
    (a, b) => (a.parcela_atual || 0) - (b.parcela_atual || 0)
  );

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">#</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Pago em</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcelasOrdenadas.map((parcela) => (
              <TableRow key={parcela.id}>
                <TableCell className="font-medium">
                  {parcela.parcela_atual}/{parcela.parcelas}
                </TableCell>
                <TableCell>
                  {format(new Date(parcela.data), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  R${" "}
                  {parcela.valor.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-center">
                  {parcela.pago ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Pago
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendente
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {parcela.pago_em
                    ? format(new Date(parcela.pago_em), "dd/MM/yyyy", {
                        locale: ptBR,
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  {!parcela.pago && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === parcela.id}
                      onClick={() => handleOpenDialog(parcela)}
                    >
                      {loadingId === parcela.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Pagar"
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Pagamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Informe a data em que o pagamento foi realizado.
            </DialogDescription>
          </DialogHeader>

          {selectedParcela && (
            <div className="space-y-4 py-4">
              {/* Resumo da Parcela */}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parcela</span>
                  <span className="font-medium">
                    {selectedParcela.parcela_atual}/{selectedParcela.parcelas}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vencimento</span>
                  <span className="font-medium">
                    {format(new Date(selectedParcela.data), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-medium text-primary">
                    R${" "}
                    {selectedParcela.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Seletor de Data */}
              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataPagamento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataPagamento ? (
                        format(dataPagamento, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataPagamento}
                      onSelect={(date) => date && setDataPagamento(date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Selecione a data em que o pagamento foi realizado
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMarcarPago}
              disabled={loadingId !== null}
            >
              {loadingId !== null && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
