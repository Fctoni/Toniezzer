"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { criarGastos, criarGastoAvulso } from "@/lib/services/gastos";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatDateToString } from "@/lib/utils";

const formSchema = z.object({
  descricao: z.string().min(3, "Mínimo 3 caracteres"),
  valor: z.string().min(1, "Valor é obrigatório"),
  data: z.date({ message: "Data é obrigatória" }),
  categoria_id: z.string().min(1, "Categoria é obrigatória"),
  fornecedor_id: z.string().optional(),
  forma_pagamento: z.enum(["dinheiro", "pix", "cartao", "boleto", "cheque"]),
  parcelas: z.string().min(1, "Parcelas é obrigatório"),
  etapa_relacionada_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface FormLancamentoProps {
  categorias: Array<{ id: string; nome: string; cor: string }>;
  fornecedores: Array<{ id: string; nome: string }>;
  etapas: Array<{ id: string; nome: string }>;
}

export function FormLancamento({
  categorias,
  fornecedores,
  etapas,
}: FormLancamentoProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valor: "",
      forma_pagamento: "pix",
      parcelas: "1",
      observacoes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const valorNumerico = parseFloat(
        data.valor.replace(/\./g, "").replace(",", ".")
      );
      const parcelas = parseInt(data.parcelas);

      // Buscar usuário padrão
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .limit(1);
      const userId = users?.[0]?.id;

      if (parcelas > 1) {
        // Criar múltiplos lançamentos para parcelas
        const lancamentos = [];
        const valorParcela = valorNumerico / parcelas;

        for (let i = 0; i < parcelas; i++) {
          const dataParcela = new Date(data.data);
          dataParcela.setMonth(dataParcela.getMonth() + i);

          lancamentos.push({
            descricao: data.descricao,
            valor: valorParcela,
            data: formatDateToString(dataParcela),
            categoria_id: data.categoria_id,
            fornecedor_id: data.fornecedor_id || null,
            forma_pagamento: data.forma_pagamento,
            parcelas: parcelas,
            parcela_atual: i + 1,
            etapa_relacionada_id: data.etapa_relacionada_id || null,
            observacoes: data.observacoes || null,
            status: "aprovado",
            criado_por: userId,
            criado_via: "manual",
          });
        }

        await criarGastos(supabase, lancamentos);

        toast.success(`${parcelas} parcelas criadas com sucesso!`);
      } else {
        // Lançamento único
        await criarGastoAvulso(supabase, {
          descricao: data.descricao,
          valor: valorNumerico,
          data: formatDateToString(data.data),
          categoria_id: data.categoria_id,
          fornecedor_id: data.fornecedor_id || null,
          forma_pagamento: data.forma_pagamento,
          parcelas: 1,
          parcela_atual: 1,
          etapa_relacionada_id: data.etapa_relacionada_id || null,
          observacoes: data.observacoes || null,
          status: "aprovado",
          criado_por: userId,
          criado_via: "manual",
        });

        toast.success("Lançamento criado com sucesso!");
      }

      router.push("/financeiro/lancamentos");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar lançamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrencyInput = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    // Converte para número e formata
    const formatted = (parseInt(numbers || "0") / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatted;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Descrição */}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Cimento Portland 50kg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Valor e Data */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$) *</FormLabel>
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
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data *</FormLabel>
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

        {/* Categoria e Forma de Pagamento */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="categoria_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          <FormField
            control={form.control}
            name="forma_pagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Pagamento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        </div>

        {/* Parcelas e Fornecedor */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="parcelas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcelas</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          <FormField
            control={form.control}
            name="fornecedor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
        </div>

        {/* Etapa Relacionada */}
        <FormField
          control={form.control}
          name="etapa_relacionada_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Etapa Relacionada</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
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

        {/* Observações */}
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Salvando..." : "Salvar Lançamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

