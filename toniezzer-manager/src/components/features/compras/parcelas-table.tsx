"use client";

import { useState, useRef } from "react";
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
import { 
  CheckCircle, 
  Clock, 
  Loader2, 
  CalendarIcon, 
  Upload, 
  FileText, 
  X, 
  Receipt,
  Paperclip
} from "lucide-react";
import { cn, formatDateToString } from "@/lib/utils";

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
  const [dataPagamento, setDataPagamento] = useState<Date>(new Date());
  const [arquivoComprovante, setArquivoComprovante] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comprovanteFileInputRef = useRef<HTMLInputElement>(null);

  // Dialog de Pagamento (parcela não paga)
  const handleOpenDialog = (parcela: Parcela) => {
    setSelectedParcela(parcela);
    setDataPagamento(new Date());
    setArquivoComprovante(null);
    setDialogOpen(true);
  };

  // Dialog de Comprovante (parcela já paga)
  const handleOpenComprovanteDialog = (parcela: Parcela) => {
    setSelectedParcela(parcela);
    setArquivoComprovante(null);
    setComprovanteDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      // Validar tipo
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WebP.");
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
    if (comprovanteFileInputRef.current) {
      comprovanteFileInputRef.current.value = "";
    }
  };

  const handleMarcarPago = async () => {
    if (!selectedParcela) return;

    setLoadingId(selectedParcela.id);
    setUploading(true);

    try {
      const supabase = createClient();
      let comprovanteUrl: string | null = null;

      // Upload do comprovante (se houver)
      if (arquivoComprovante) {
        const fileExt = arquivoComprovante.name.split(".").pop();
        const fileName = `comprovantes/${Date.now()}-${selectedParcela.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("recibos")
          .upload(fileName, arquivoComprovante);

        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          toast.error("Erro ao fazer upload do comprovante");
          setUploading(false);
          setLoadingId(null);
          return;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from("recibos")
          .getPublicUrl(fileName);

        comprovanteUrl = urlData.publicUrl;
      }

      // Atualizar parcela
      const { error } = await supabase
        .from("gastos")
        .update({
          pago: true,
          pago_em: formatDateToString(dataPagamento),
          comprovante_pagamento_url: comprovanteUrl,
        })
        .eq("id", selectedParcela.id);

      if (error) throw error;

      toast.success("Parcela marcada como paga!");
      setDialogOpen(false);
      setArquivoComprovante(null);
      onParcelaPaga?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao marcar parcela como paga");
    } finally {
      setLoadingId(null);
      setUploading(false);
    }
  };

  const handleSalvarComprovante = async () => {
    if (!selectedParcela || !arquivoComprovante) return;

    setLoadingId(selectedParcela.id);
    setUploading(true);

    try {
      const supabase = createClient();

      // Upload do comprovante
      const fileExt = arquivoComprovante.name.split(".").pop();
      const fileName = `comprovantes/${Date.now()}-${selectedParcela.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("recibos")
        .upload(fileName, arquivoComprovante);

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        toast.error("Erro ao fazer upload do comprovante");
        setUploading(false);
        setLoadingId(null);
        return;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("recibos")
        .getPublicUrl(fileName);

      // Atualizar parcela apenas com o comprovante
      const { error } = await supabase
        .from("gastos")
        .update({
          comprovante_pagamento_url: urlData.publicUrl,
        })
        .eq("id", selectedParcela.id);

      if (error) throw error;

      toast.success("Comprovante anexado com sucesso!");
      setComprovanteDialogOpen(false);
      setArquivoComprovante(null);
      onParcelaPaga?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao anexar comprovante");
    } finally {
      setLoadingId(null);
      setUploading(false);
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

      {/* Dialog de Pagamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Informe a data do pagamento e anexe o comprovante (opcional).
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
              </div>

              {/* Upload de Comprovante */}
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
                      PDF, JPG, PNG ou WebP (máx. 10MB)
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMarcarPago}
              disabled={loadingId !== null || uploading}
            >
              {(loadingId !== null || uploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {uploading ? "Enviando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Comprovante (para parcelas já pagas) */}
      <Dialog open={comprovanteDialogOpen} onOpenChange={setComprovanteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedParcela?.comprovante_pagamento_url 
                ? "Substituir Comprovante" 
                : "Anexar Comprovante"}
            </DialogTitle>
            <DialogDescription>
              {selectedParcela?.comprovante_pagamento_url 
                ? "Envie um novo arquivo para substituir o comprovante atual."
                : "Anexe o comprovante de pagamento desta parcela."}
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
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-medium text-primary">
                    R${" "}
                    {selectedParcela.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pago em</span>
                  <span className="font-medium">
                    {selectedParcela.pago_em 
                      ? format(new Date(selectedParcela.pago_em), "dd/MM/yyyy", { locale: ptBR })
                      : "-"}
                  </span>
                </div>
              </div>

              {/* Comprovante atual */}
              {selectedParcela.comprovante_pagamento_url && (
                <div className="rounded-lg border p-3 bg-blue-50/50">
                  <p className="text-xs text-muted-foreground mb-2">Comprovante atual:</p>
                  <a
                    href={selectedParcela.comprovante_pagamento_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Receipt className="h-4 w-4" />
                    Ver comprovante atual
                  </a>
                </div>
              )}

              {/* Upload de Comprovante */}
              <div className="space-y-2">
                <Label>
                  {selectedParcela.comprovante_pagamento_url 
                    ? "Novo Comprovante" 
                    : "Comprovante de Pagamento"}
                </Label>
                <input
                  type="file"
                  ref={comprovanteFileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                />
                
                {!arquivoComprovante ? (
                  <div
                    onClick={() => comprovanteFileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar arquivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG ou WebP (máx. 10MB)
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
            <Button variant="outline" onClick={() => setComprovanteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarComprovante}
              disabled={loadingId !== null || uploading || !arquivoComprovante}
            >
              {(loadingId !== null || uploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {uploading ? "Enviando..." : "Salvar Comprovante"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
