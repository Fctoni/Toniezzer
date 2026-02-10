"use client";

import { RefObject } from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X } from "lucide-react";

/** Campos mínimos que o form precisa ter para usar esta seção */
interface CompraNotaFiscalFormFields {
  nota_fiscal_numero?: string;
}

interface CompraNotaFiscalSectionProps<T extends FieldValues & CompraNotaFiscalFormFields> {
  form: UseFormReturn<T>;
  arquivoNF: File | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
  /** URL do arquivo de NF já existente (modo edição) */
  notaFiscalUrlAtual?: string | null;
  /** Handler para remover o arquivo existente (modo edição) */
  handleRemoveExistingFile?: () => void;
}

export function CompraNotaFiscalSection<T extends FieldValues & CompraNotaFiscalFormFields>({
  form,
  arquivoNF,
  fileInputRef,
  handleFileSelect,
  handleRemoveFile,
  notaFiscalUrlAtual,
  handleRemoveExistingFile,
}: CompraNotaFiscalSectionProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nota Fiscal (opcional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload de Arquivo */}
        <div className="space-y-2">
          <FormLabel>Arquivo da NF</FormLabel>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
          />

          {/* Arquivo existente (modo edição) */}
          {notaFiscalUrlAtual && !arquivoNF && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <FileText className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Arquivo anexado</p>
                <p className="text-xs text-muted-foreground truncate">
                  {notaFiscalUrlAtual.split("/").pop()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={notaFiscalUrlAtual}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver
                  </a>
                </Button>
                {handleRemoveExistingFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveExistingFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Área de upload (quando não há arquivo existente nem novo selecionado) */}
          {!notaFiscalUrlAtual && !arquivoNF && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Clique para selecionar ou arraste o arquivo
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG ou WebP (máx. 10MB)
              </p>
            </div>
          )}

          {/* Novo arquivo selecionado */}
          {arquivoNF && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <FileText className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{arquivoNF.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(arquivoNF.size / 1024 / 1024).toFixed(2)} MB
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

          {/* Botão para substituir arquivo existente (modo edição) */}
          {notaFiscalUrlAtual && !arquivoNF && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Substituir arquivo
            </Button>
          )}
        </div>

        <FormField
          control={form.control}
          name={"nota_fiscal_numero" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero da NF</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 12345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
