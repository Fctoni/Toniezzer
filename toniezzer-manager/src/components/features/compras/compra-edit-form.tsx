"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
  FormDescription,
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
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2, Upload, FileText, X, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatDateToString } from "@/lib/utils";
import { QuickAddFornecedor } from "../ocr/quick-add-fornecedor";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const formSchema = z.object({
  descricao: z.string().min(3, "Mínimo 3 caracteres"),
  data_compra: z.date({ message: "Data da compra é obrigatória" }),
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
  categoria_id: z.string().min(1, "Categoria é obrigatória"),
  subcategoria_id: z.string().optional(),
  etapa_relacionada_id: z.string().optional(),
  forma_pagamento: z.enum(["dinheiro", "pix", "cartao", "boleto", "cheque"]),
  nota_fiscal_numero: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Compra {
  id: string;
  descricao: string;
  valor_total: number;
  data_compra: string;
  fornecedor_id: string;
  categoria_id: string;
  subcategoria_id: string | null;
  forma_pagamento: string;
  parcelas: number;
  parcelas_pagas: number;
  valor_pago: number;
  data_primeira_parcela: string;
  nota_fiscal_numero: string | null;
  nota_fiscal_url: string | null;
  status: "ativa" | "quitada" | "cancelada";
  observacoes: string | null;
  etapa_relacionada_id: string | null;
}

interface CompraEditFormProps {
  compra: Compra;
  categorias: Array<{ id: string; nome: string; cor: string }>;
  fornecedores: Array<{ id: string; nome: string }>;
  etapas: Array<{ id: string; nome: string }>;
}

export function CompraEditForm({
  compra,
  categorias,
  fornecedores: fornecedoresIniciais,
  etapas,
}: CompraEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arquivoNF, setArquivoNF] = useState<File | null>(null);
  const [uploadingNF, setUploadingNF] = useState(false);
  const [fornecedores, setFornecedores] = useState(fornecedoresIniciais);
  const [subcategorias, setSubcategorias] = useState<Array<{ id: string; nome: string; categoria_id: string }>>([]);
  const [notaFiscalUrlAtual, setNotaFiscalUrlAtual] = useState<string | null>(
    compra.nota_fiscal_url
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse da data do banco (formato YYYY-MM-DD)
  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: compra.descricao,
      data_compra: parseDate(compra.data_compra),
      fornecedor_id: compra.fornecedor_id,
      categoria_id: compra.categoria_id,
      subcategoria_id: compra.subcategoria_id || undefined,
      etapa_relacionada_id: compra.etapa_relacionada_id || "none",
      forma_pagamento: compra.forma_pagamento as
        | "dinheiro"
        | "pix"
        | "cartao"
        | "boleto"
        | "cheque",
      nota_fiscal_numero: compra.nota_fiscal_numero || "",
      observacoes: compra.observacoes || "",
    },
  });

  const categoriaSelecionada = useWatch({ control: form.control, name: "categoria_id" });

  // Buscar subcategorias
  useEffect(() => {
    const fetchSubcategorias = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("subcategorias")
        .select("id, nome, categoria_id")
        .eq("ativo", true)
        .order("nome");

      if (!error && data) {
        setSubcategorias(data);
      }
    };

    fetchSubcategorias();
  }, []);

  // Limpar subcategoria quando categoria mudar
  useEffect(() => {
    // Só limpa se a subcategoria atual não pertence à nova categoria
    const subcategoriaAtual = form.getValues("subcategoria_id");
    if (subcategoriaAtual && subcategoriaAtual !== "") {
      const subcategoriaValida = subcategorias.find(
        sub => sub.id === subcategoriaAtual && sub.categoria_id === categoriaSelecionada
      );
      if (!subcategoriaValida) {
        form.setValue("subcategoria_id", undefined);
      }
    }
  }, [categoriaSelecionada, form, subcategorias]);

  // Filtrar subcategorias pela categoria selecionada
  const subcategoriasDisponiveis = subcategorias.filter(
    sub => sub.categoria_id === categoriaSelecionada
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      // Validar tipo
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ];
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

  const handleRemoveExistingFile = () => {
    setNotaFiscalUrlAtual(null);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Upload do novo arquivo da NF (se houver)
      let notaFiscalUrl: string | null = notaFiscalUrlAtual;

      if (arquivoNF) {
        setUploadingNF(true);
        const fileExt = arquivoNF.name.split(".").pop();
        const fileName = `nf_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `notas-fiscais/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("notas-compras")
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
          .from("notas-compras")
          .getPublicUrl(filePath);

        notaFiscalUrl = urlData.publicUrl;
        setUploadingNF(false);
      }

      // Converter "none" para null
      const etapaId = data.etapa_relacionada_id === "none" ? null : data.etapa_relacionada_id || null;
      const subcategoriaId = data.subcategoria_id && data.subcategoria_id !== "" ? data.subcategoria_id : null;

      // Atualizar a compra
      const { error: compraError } = await supabase
        .from("compras")
        .update({
          descricao: data.descricao,
          data_compra: formatDateToString(data.data_compra),
          fornecedor_id: data.fornecedor_id,
          categoria_id: data.categoria_id,
          subcategoria_id: subcategoriaId,
          etapa_relacionada_id: etapaId,
          forma_pagamento: data.forma_pagamento,
          nota_fiscal_numero: data.nota_fiscal_numero || null,
          nota_fiscal_url: notaFiscalUrl,
          observacoes: data.observacoes || null,
        })
        .eq("id", compra.id);

      if (compraError) throw compraError;

      // Atualizar os gastos (parcelas) com os novos dados
      // Apenas atualiza campos básicos, não altera valores ou datas das parcelas
      const { error: gastosError } = await supabase
        .from("gastos")
        .update({
          descricao: data.descricao,
          categoria_id: data.categoria_id,
          subcategoria_id: subcategoriaId,
          fornecedor_id: data.fornecedor_id,
          forma_pagamento: data.forma_pagamento,
          etapa_relacionada_id: etapaId,
        })
        .eq("compra_id", compra.id);

      if (gastosError) {
        console.error("Erro ao atualizar parcelas:", gastosError);
        // Não falha a operação, apenas loga o erro
      }

      toast.success("Compra atualizada com sucesso!");
      router.push(`/compras/${compra.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const valorParcela = compra.valor_total / compra.parcelas;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Alerta sobre valor e parcelas */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Informação</AlertTitle>
          <AlertDescription>
            O valor total (R${" "}
            {compra.valor_total.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
            ) e o número de parcelas ({compra.parcelas}x de R${" "}
            {valorParcela.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
            não podem ser alterados após a criação. Se precisar alterar esses
            valores, cancele esta compra e crie uma nova.
          </AlertDescription>
        </Alert>

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

            {/* Data da Compra */}
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

            {/* Fornecedor e Categoria */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <QuickAddFornecedor
                          onFornecedorAdded={(novoFornecedor) => {
                            setFornecedores((prev) => [...prev, novoFornecedor]);
                            field.onChange(novoFornecedor.id);
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Subcategoria (condicional) */}
            {categoriaSelecionada && subcategoriasDisponiveis.length > 0 && (
              <FormField
                control={form.control}
                name="subcategoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoria (opcional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a subcategoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {subcategoriasDisponiveis.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Etapa Relacionada */}
            <FormField
              control={form.control}
              name="etapa_relacionada_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa Relacionada (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
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

        {/* Forma de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="forma_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Resumo do pagamento (read-only) */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Total:</span>
                <span className="font-medium">
                  R${" "}
                  {compra.valor_total.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parcelas:</span>
                <span className="font-medium">
                  {compra.parcelas}x de R${" "}
                  {valorParcela.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={compra.parcelas_pagas === compra.parcelas ? "default" : "secondary"}
                >
                  {compra.parcelas_pagas}/{compra.parcelas} pagas
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

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

              {/* Arquivo existente */}
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveExistingFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload de novo arquivo */}
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
                    <p className="text-sm font-medium truncate">
                      {arquivoNF.name}
                    </p>
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

              {/* Botão para substituir arquivo existente */}
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
            {(isSubmitting || uploadingNF) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {uploadingNF
              ? "Enviando NF..."
              : isSubmitting
              ? "Salvando..."
              : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

