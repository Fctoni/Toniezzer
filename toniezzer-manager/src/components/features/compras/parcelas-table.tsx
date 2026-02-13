"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadComprovante } from "@/lib/services/recibos";
import { marcarPago, atualizarComprovante } from "@/lib/services/gastos";
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
import {
  CheckCircle,
  Clock,
  Loader2,
  Upload,
  Receipt,
  Paperclip,
} from "lucide-react";
import { formatDateToString, parseDateString } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ParcelaPagamentoDialog } from "@/components/features/compras/parcela-pagamento-dialog";
import { ParcelaComprovanteDialog } from "@/components/features/compras/parcela-comprovante-dialog";

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

interface ParcelasTableProps {
  parcelas: Parcela[];
  onParcelaPaga?: () => void;
}

export function ParcelasTable({ parcelas, onParcelaPaga }: ParcelasTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comprovanteDialogOpen, setComprovanteDialogOpen] = useState(false);
  const [selectedParcela, setSelectedParcela] = useState<Parcela | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  const handleDateChange = async (parcelaId: string, newDate: Date) => {
    setEditingDateId(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("gastos")
        .update({ data: formatDateToString(newDate) })
        .eq("id", parcelaId);

      if (error) throw error;

      toast.success("Data de vencimento atualizada");
      onParcelaPaga?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar data de vencimento");
    }
  };


  const handleOpenDialog = (parcela: Parcela) => {
    setSelectedParcela(parcela);
    setDialogOpen(true);
  };

  const handleOpenComprovanteDialog = (parcela: Parcela) => {
    setSelectedParcela(parcela);
    setComprovanteDialogOpen(true);
  };

  const handleMarcarPago = async (dataPagamento: Date, arquivoComprovante: File | null) => {
    if (!selectedParcela) return;

    setLoadingId(selectedParcela.id);
    setSalvando(true);

    try {
      const supabase = createClient();
      let comprovanteUrl: string | null = null;

      if (arquivoComprovante) {
        const fileExt = arquivoComprovante.name.split(".").pop();
        const fileName = `comprovantes/${Date.now()}-${selectedParcela.id}.${fileExt}`;

        try {
          comprovanteUrl = await uploadComprovante(supabase, fileName, arquivoComprovante);
        } catch (uploadError) {
          console.error("Erro no upload:", uploadError);
          toast.error("Erro ao fazer upload do comprovante");
          setSalvando(false);
          setLoadingId(null);
          return;
        }
      }

      await marcarPago(supabase, selectedParcela.id, {
        pago: true,
        pago_em: formatDateToString(dataPagamento),
        comprovante_pagamento_url: comprovanteUrl,
      });

      toast.success("Parcela marcada como paga!");
      setDialogOpen(false);
      onParcelaPaga?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao marcar parcela como paga");
    } finally {
      setLoadingId(null);
      setSalvando(false);
    }
  };

  const handleSalvarComprovante = async (arquivoComprovante: File) => {
    if (!selectedParcela) return;

    setLoadingId(selectedParcela.id);
    setSalvando(true);

    try {
      const supabase = createClient();

      const fileExt = arquivoComprovante.name.split(".").pop();
      const fileName = `comprovantes/${Date.now()}-${selectedParcela.id}.${fileExt}`;

      let comprovanteUrl: string;
      try {
        comprovanteUrl = await uploadComprovante(supabase, fileName, arquivoComprovante);
      } catch (uploadError) {
        console.error("Erro no upload:", uploadError);
        toast.error("Erro ao fazer upload do comprovante");
        setSalvando(false);
        setLoadingId(null);
        return;
      }

      await atualizarComprovante(supabase, selectedParcela.id, comprovanteUrl);

      toast.success("Comprovante anexado com sucesso!");
      setComprovanteDialogOpen(false);
      onParcelaPaga?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao anexar comprovante");
    } finally {
      setLoadingId(null);
      setSalvando(false);
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
              <TableHead className="text-center">Comprovante</TableHead>
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
                  {!parcela.pago ? (
                    <Popover
                      open={editingDateId === parcela.id}
                      onOpenChange={(open) => setEditingDateId(open ? parcela.id : null)}
                    >
                      <PopoverTrigger asChild>
                        <span className="cursor-pointer">
                          {format(parseDateString(parcela.data), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDateString(parcela.data)}
                          onSelect={(date) => date && handleDateChange(parcela.id, date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    format(parseDateString(parcela.data), "dd/MM/yyyy", { locale: ptBR })
                  )}
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
                    ? format(parseDateString(parcela.pago_em), "dd/MM/yyyy", {
                        locale: ptBR,
                      })
                    : "-"}
                </TableCell>
                <TableCell className="text-center">
                  {parcela.comprovante_pagamento_url ? (
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 h-8 px-2"
                        asChild
                      >
                        <a
                          href={parcela.comprovante_pagamento_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver comprovante"
                        >
                          <Receipt className="h-4 w-4 mr-1" />
                          Ver
                        </a>
                      </Button>
                      {parcela.pago && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-primary h-8 px-2"
                          onClick={() => handleOpenComprovanteDialog(parcela)}
                          title="Substituir comprovante"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ) : parcela.pago ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary h-8"
                      onClick={() => handleOpenComprovanteDialog(parcela)}
                    >
                      <Paperclip className="h-4 w-4 mr-1" />
                      Anexar
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
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

      <ParcelaPagamentoDialog
        parcela={selectedParcela}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleMarcarPago}
        salvando={salvando}
      />

      <ParcelaComprovanteDialog
        parcela={selectedParcela}
        open={comprovanteDialogOpen}
        onOpenChange={setComprovanteDialogOpen}
        onSave={handleSalvarComprovante}
        salvando={salvando}
      />
    </>
  );
}
