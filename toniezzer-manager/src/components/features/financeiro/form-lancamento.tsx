"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { criarGastos, criarGastoAvulso } from "@/lib/services/gastos";
import { buscarPrimeiroUsuario } from "@/lib/services/users";
import { Form } from "@/components/ui/form";
import { formatDateToString } from "@/lib/utils";
import { FormLancamentoCampos } from "./form-lancamento-campos";
import { FormLancamentoObservacoes } from "./form-lancamento-observacoes";

export const formSchema = z.object({
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

      let userId: string | undefined;
      try {
        const user = await buscarPrimeiroUsuario(supabase);
        userId = user.id;
      } catch {
        // ignora erro se não encontrar usuário
      }

      if (parcelas > 1) {
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
        <FormLancamentoCampos
          form={form}
          categorias={categorias}
          fornecedores={fornecedores}
          etapas={etapas}
          formatCurrencyInput={formatCurrencyInput}
        />
        <FormLancamentoObservacoes
          form={form}
          isSubmitting={isSubmitting}
          onCancel={() => router.back()}
        />
      </form>
    </Form>
  );
}
