"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, X, Receipt } from "lucide-react";
import { parseDateString } from "@/lib/utils";

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

interface ParcelaComprovanteDialogProps {
  parcela: Parcela | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (arquivoComprovante: File) => void;
  salvando: boolean;
}

export function ParcelaComprovanteDialog({
  parcela,
  open,
  onOpenChange,
  onSave,
  salvando,
}: ParcelaComprovanteDialogProps) {
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
          <DialogTitle>
            {parcela?.comprovante_pagamento_url
              ? "Substituir Comprovante"
              : "Anexar Comprovante"}
          </DialogTitle>
          <DialogDescription>
            {parcela?.comprovante_pagamento_url
              ? "Envie um novo arquivo para substituir o comprovante atual."
              : "Anexe o comprovante de pagamento desta parcela."}
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
                <span className="text-muted-foreground">Valor</span>
                <span className="font-medium text-primary">
                  R${" "}
                  {parcela.valor.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pago em</span>
                <span className="font-medium">
                  {parcela.pago_em
                    ? format(parseDateString(parcela.pago_em), "dd/MM/yyyy", { locale: ptBR })
                    : "-"}
                </span>
              </div>
            </div>

            {parcela.comprovante_pagamento_url && (
              <div className="rounded-lg border p-3 bg-blue-50/50">
                <p className="text-xs text-muted-foreground mb-2">Comprovante atual:</p>
                <a
                  href={parcela.comprovante_pagamento_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Receipt className="h-4 w-4" />
                  Ver comprovante atual
                </a>
              </div>
            )}

            <div className="space-y-2">
              <Label>
                {parcela.comprovante_pagamento_url
                  ? "Novo Comprovante"
                  : "Comprovante de Pagamento"}
              </Label>
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
                    Clique para selecionar arquivo
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
            onClick={() => arquivoComprovante && onSave(arquivoComprovante)}
            disabled={salvando || !arquivoComprovante}
          >
            {salvando && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {salvando ? "Enviando..." : "Salvar Comprovante"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
