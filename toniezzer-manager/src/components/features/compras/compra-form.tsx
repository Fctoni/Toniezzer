"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { addMonths } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Loader2, Upload, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ParcelasPreview } from "./parcelas-preview";
import { QuickAddFornecedor } from "../ocr/quick-add-fornecedor";
import { formatDateToString } from "@/lib/utils";

const formSchema = z.object({
  descricao: z.string().min(3, "Mínimo 3 caracteres"),
  valor_total: z.string().min(1, "Valor é obrigatório"),
  data_compra: z.date({ message: "Data da compra é obrigatória" }),
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
  categoria_id: z.string().min(1, "Categoria é obrigatória"),
  etapa_relacionada_id: z.string().optional(),
  forma_pagamento: z.enum(["dinheiro", "pix", "cartao", "boleto", "cheque"]),
  parcelas: z.string().min(1, "Parcelas é obrigatório"),
  data_primeira_parcela: z.date({
    message: "Data da 1ª parcela é obrigatória",
  }),
  nota_fiscal_numero: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CompraFormProps {
  categorias: Array<{ id: string; nome: string; cor: string }>;
  fornecedores: Array<{ id: string; nome: string }>;
  etapas: Array<{ id: string; nome: string }>;
}

export function CompraForm({
  categorias,
  fornecedores: fornecedoresIniciais,
  etapas,
}: CompraFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arquivoNF, setArquivoNF] = useState<File | null>(null);
  const [uploadingNF, setUploadingNF] = useState(false);
  const [fornecedores, setFornecedores] = useState(fornecedoresIniciais);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valor_total: "",
      parcelas: "1",
      forma_pagamento: "pix",
      nota_fiscal_numero: "",
      observacoes: "",
    },
  });

  // Watch para atualizar o preview
  const valorTotal = useWatch({ control: form.control, name: "valor_total" });
  const parcelas = useWatch({ control: form.control, name: "parcelas" });
  const dataPrimeiraParcela = useWatch({
    control: form.control,
    name: "data_primeira_parcela",
  });

  const valorNumerico = valorTotal
    ? parseFloat(valorTotal.replace(/\./g, "").replace(",", ".")) || 0
    : 0;
  const numeroParcelas = parseInt(parcelas) || 1;

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
      setArquivoNF(file);
    }
  };

  const handleRemoveFile = () => {
    setArquivoNF(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const valorNumerico = parseFloat(
        data.valor_total.replace(/\./g, "").replace(",", ".")
      );
      const numParcelas = parseInt(data.parcelas);

      // Buscar usuário padrão
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .limit(1);
      const userId = users?.[0]?.id;

      // Upload do arquivo da NF (se houver)
      let notaFiscalUrl: string | null = null;
      if (arquivoNF) {
        setUploadingNF(true);
        const fileExt = arquivoNF.name.split(".").pop();
        const fileName = `nf_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `notas-fiscais/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documentos")
          .upload(filePath, arquivoNF);

        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          toast.error("Erro ao fazer upload da nota fiscal");
          setUploadingNF(false);
          setIsSubmitting(false);
          return;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from("documentos")
          .getPublicUrl(filePath);

        notaFiscalUrl = urlData.publicUrl;
        setUploadingNF(false);
      }

      // 1. Criar a compra
      const { data: compra, error: compraError } = await supabase
        .from("compras")
        .insert({
          descricao: data.descricao,
          valor_total: valorNumerico,
          data_compra: formatDateToString(data.data_compra),
          fornecedor_id: data.fornecedor_id,
          categoria_id: data.categoria_id,
          etapa_relacionada_id: data.etapa_relacionada_id || null,
          forma_pagamento: data.forma_pagamento,
          parcelas: numParcelas,
          data_primeira_parcela: data.data_primeira_parcela
            .toISOString()
            .split("T")[0],
          nota_fiscal_numero: data.nota_fiscal_numero || null,
          nota_fiscal_url: notaFiscalUrl,
          observacoes: data.observacoes || null,
          criado_por: userId,
          criado_via: "manual",
        })
        .select()
        .single();

      if (compraError) throw compraError;

      // 2. Criar os lançamentos (parcelas)
      const valorParcela = valorNumerico / numParcelas;
      const valorArredondado = Math.floor(valorParcela * 100) / 100;
      const diferencaArredondamento =
        valorNumerico - valorArredondado * numParcelas;

      const lancamentos = [];

      for (let i = 0; i < numParcelas; i++) {
        const dataParcela = addMonths(data.data_primeira_parcela, i);
        const valor =
          i === numParcelas - 1
            ? valorArredondado + diferencaArredondamento
            : valorArredondado;

        lancamentos.push({
          compra_id: compra.id,
          descricao: data.descricao,
          valor: valor,
          data: formatDateToString(dataParcela),
          categoria_id: data.categoria_id,
          fornecedor_id: data.fornecedor_id,
          forma_pagamento: data.forma_pagamento,
          parcelas: numParcelas,
          parcela_atual: i + 1,
          etapa_relacionada_id: data.etapa_relacionada_id || null,
          status: "aprovado",
          pago: false,
          criado_por: userId,
          criado_via: "manual",
        });
      }

      const { error: lancamentosError } = await supabase
        .from("gastos")
        .insert(lancamentos);

      if (lancamentosError) throw lancamentosError;

      toast.success(
        `Compra criada com ${numParcelas} parcela${numParcelas > 1 ? "s" : ""}!`
      );

      router.push("/compras");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const formatted = (parseInt(numbers || "0") / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatted;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações da Compra */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações da Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Porcelanato Portinari 60x60 (50 caixas)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor e Data da Compra */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="valor_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_compra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Compra *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fornecedor e Categoria */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <QuickAddFornecedor
                          onFornecedorAdded={(novoFornecedor) => {
                            setFornecedores(prev => [...prev, novoFornecedor])
                            field.onChange(novoFornecedor.id)
                          }}
                        />
                        {fornecedores.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: cat.cor }}
                              />
                              {cat.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Etapa Relacionada */}
            <FormField
              control={form.control}
              name="etapa_relacionada_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa Relacionada (opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {etapas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="forma_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parcelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelas *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n}x {n > 1 ? "(sem juros)" : "(à vista)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="data_primeira_parcela"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da 1ª Parcela *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Preview das Parcelas */}
        {valorNumerico > 0 && numeroParcelas > 0 && dataPrimeiraParcela && (
          <ParcelasPreview
            valorTotal={valorNumerico}
            numeroParcelas={numeroParcelas}
            dataPrimeiraParcela={dataPrimeiraParcela}
          />
        )}

        {/* Nota Fiscal */}
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
              
              {!arquivoNF ? (
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
              ) : (
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
            </div>

            <FormField
              control={form.control}
              name="nota_fiscal_numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da NF</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações (opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || uploadingNF}>
            {(isSubmitting || uploadingNF) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploadingNF ? "Enviando NF..." : isSubmitting ? "Criando..." : "Criar Compra e Parcelas"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

