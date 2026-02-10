"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
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
import { Loader2, CalendarIcon, Upload, FileText, X } from "lucide-react";
import { cn, parseDateString } from "@/lib/utils";

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

interface ParcelaPagamentoDialogProps {
  parcela: Parcela | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (dataPagamento: Date, arquivoComprovante: File | null) => void;
  salvando: boolean;
}

export function ParcelaPagamentoDialog({
  parcela,
  open,
  onOpenChange,
  onSave,
  salvando,
}: ParcelaPagamentoDialogProps) {
  const [dataPagamento, setDataPagamento] = useState<Date>(new Date());
  const [arquivoComprovante, setArquivoComprovante] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        return;
      }
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return;
      }
      setArquivoComprovante(file);
    }
  };

  const handleRemoveFile = () => {
    setArquivoComprovante(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setArquivoComprovante(null);
      setDataPagamento(new Date());
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Informe a data do pagamento e anexe o comprovante (opcional).
          </DialogDescription>
        </DialogHeader>

        {parcela && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parcela</span>
                <span className="font-medium">
                  {parcela.parcela_atual}/{parcela.parcelas}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vencimento</span>
                <span className="font-medium">
                  {format(parseDateString(parcela.data), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-medium text-primary">
                  R${" "}
                  {parcela.valor.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

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
            </div>

            <div className="space-y-2">
              <Label>Comprovante de Pagamento (opcional)</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
              />

              {!arquivoComprovante ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Clique para anexar comprovante
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG ou WebP (max. 10MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <FileText className="h-6 w-6 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{arquivoComprovante.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(arquivoComprovante.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(dataPagamento, arquivoComprovante)}
            disabled={salvando}
          >
            {salvando && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {salvando ? "Enviando..." : "Confirmar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
