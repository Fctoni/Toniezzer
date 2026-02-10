"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { addMonths } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { buscarSubcategoriasAtivas } from "@/lib/services/subcategorias";
import { criarCompra } from "@/lib/services/compras";
import { criarGastos } from "@/lib/services/gastos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatDateToString } from "@/lib/utils";
import { CompraInfoSection } from "@/components/features/compras/compra-info-section";
import { CompraPagamentoSection } from "@/components/features/compras/compra-pagamento-section";
import { CompraNotaFiscalSection } from "@/components/features/compras/compra-notafiscal-section";

const formSchema = z.object({
  descricao: z.string().min(3, "Mínimo 3 caracteres"),
  valor_total: z.string().min(1, "Valor é obrigatório"),
  data_compra: z.date({ message: "Data da compra é obrigatória" }),
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
  categoria_id: z.string().min(1, "Categoria é obrigatória"),
  subcategoria_id: z.string().optional(),
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
  const [subcategorias, setSubcategorias] = useState<Array<{ id: string; nome: string; categoria_id: string }>>([]);
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

  const valorTotal = useWatch({ control: form.control, name: "valor_total" });
  const parcelas = useWatch({ control: form.control, name: "parcelas" });
  const dataPrimeiraParcela = useWatch({
    control: form.control,
    name: "data_primeira_parcela",
  });
  const categoriaSelecionada = useWatch({ control: form.control, name: "categoria_id" });

  const valorNumerico = valorTotal
    ? parseFloat(valorTotal.replace(/\./g, "").replace(",", ".")) || 0
    : 0;
  const numeroParcelas = parseInt(parcelas) || 1;

  useEffect(() => {
    const fetchSubcategorias = async () => {
      try {
        const supabase = createClient();
        const data = await buscarSubcategoriasAtivas(supabase);
        setSubcategorias(data);
      } catch (error) {
        console.error("Erro ao buscar subcategorias:", error);
      }
    };

    fetchSubcategorias();
  }, []);

  useEffect(() => {
    form.setValue("subcategoria_id", undefined);
  }, [categoriaSelecionada, form]);

  const subcategoriasDisponiveis = subcategorias.filter(
    sub => sub.categoria_id === categoriaSelecionada
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
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

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const formatted = (parseInt(numbers || "0") / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatted;
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const valorNumerico = parseFloat(
        data.valor_total.replace(/\./g, "").replace(",", ".")
      );
      const numParcelas = parseInt(data.parcelas);

      const { data: users } = await supabase
        .from("users")
        .select("id")
        .limit(1);
      const userId = users?.[0]?.id;

      let notaFiscalUrl: string | null = null;
      if (arquivoNF) {
        setUploadingNF(true);
        const fileExt = arquivoNF.name.split(".").pop();
        const fileName = `nf_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
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

        const { data: urlData } = supabase.storage
          .from("notas-compras")
          .getPublicUrl(filePath);

        notaFiscalUrl = urlData.publicUrl;
        setUploadingNF(false);
      }

      const subcategoriaId = data.subcategoria_id && data.subcategoria_id !== "" ? data.subcategoria_id : null;

      const compra = await criarCompra(supabase, {
        descricao: data.descricao,
        valor_total: valorNumerico,
        data_compra: formatDateToString(data.data_compra),
        fornecedor_id: data.fornecedor_id,
        categoria_id: data.categoria_id,
        subcategoria_id: subcategoriaId,
        etapa_relacionada_id: data.etapa_relacionada_id || null,
        forma_pagamento: data.forma_pagamento,
        parcelas: numParcelas,
        data_primeira_parcela: formatDateToString(data.data_primeira_parcela),
        nota_fiscal_numero: data.nota_fiscal_numero || null,
        nota_fiscal_url: notaFiscalUrl,
        observacoes: data.observacoes || null,
        criado_por: userId,
        criado_via: "manual",
      });

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
          subcategoria_id: subcategoriaId,
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

      await criarGastos(supabase, lancamentos);

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CompraInfoSection
          form={form}
          fornecedores={fornecedores}
          categorias={categorias}
          subcategoriasDisponiveis={subcategoriasDisponiveis}
          etapas={etapas}
          categoriaSelecionada={categoriaSelecionada}
          onFornecedorAdded={(novoFornecedor) => {
            setFornecedores(prev => [...prev, novoFornecedor]);
          }}
          formatCurrencyInput={formatCurrencyInput}
        />

        <CompraPagamentoSection
          form={form}
          valorNumerico={valorNumerico}
          numeroParcelas={numeroParcelas}
          dataPrimeiraParcela={dataPrimeiraParcela}
        />

        <CompraNotaFiscalSection
          form={form}
          arquivoNF={arquivoNF}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          handleRemoveFile={handleRemoveFile}
        />

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
