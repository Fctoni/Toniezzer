"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { createClient } from "@/lib/supabase/client";
import { criarFornecedor, atualizarFornecedor } from "@/lib/services/fornecedores";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tables } from "@/lib/types/database";

const fornecedorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  tipo: z.enum(["fornecedor_material", "prestador_servico"]),
  cnpj_cpf: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  especialidade: z.string().optional(),
  tipo_pagamento: z.enum(["pix", "conta_corrente"]).optional().or(z.literal("")),
  chave_pix: z.string().optional(),
  banco_numero: z.string().optional(),
  banco_agencia: z.string().optional(),
  banco_conta: z.string().optional(),
  banco_cpf_cnpj: z.string().optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface FornecedorFormProps {
  fornecedor?: Tables<"fornecedores">;
  onSuccess?: () => void;
}

export function FornecedorForm({ fornecedor, onSuccess }: FornecedorFormProps) {
  const router = useRouter();
  const isEditing = !!fornecedor;

  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: fornecedor?.nome || "",
      tipo: (fornecedor?.tipo as FornecedorFormData["tipo"]) || "fornecedor_material",
      cnpj_cpf: fornecedor?.cnpj_cpf || "",
      email: fornecedor?.email || "",
      telefone: fornecedor?.telefone || "",
      endereco: fornecedor?.endereco || "",
      especialidade: fornecedor?.especialidade || "",
      tipo_pagamento: (fornecedor?.tipo_pagamento as FornecedorFormData["tipo_pagamento"]) || "",
      chave_pix: fornecedor?.chave_pix || "",
      banco_numero: fornecedor?.banco_numero || "",
      banco_agencia: fornecedor?.banco_agencia || "",
      banco_conta: fornecedor?.banco_conta || "",
      banco_cpf_cnpj: fornecedor?.banco_cpf_cnpj || "",
    },
  });

  const tipoPagamento = form.watch("tipo_pagamento");

  useEffect(() => {
    if (tipoPagamento === "pix") {
      form.setValue("banco_numero", "");
      form.setValue("banco_agencia", "");
      form.setValue("banco_conta", "");
      form.setValue("banco_cpf_cnpj", "");
    } else if (tipoPagamento === "conta_corrente") {
      form.setValue("chave_pix", "");
    } else {
      form.setValue("chave_pix", "");
      form.setValue("banco_numero", "");
      form.setValue("banco_agencia", "");
      form.setValue("banco_conta", "");
      form.setValue("banco_cpf_cnpj", "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoPagamento]);

  const onSubmit = async (data: FornecedorFormData) => {
    try {
      const supabase = createClient();

      const payload = {
        ...data,
        email: data.email || null,
        tipo_pagamento: data.tipo_pagamento || null,
        chave_pix: data.chave_pix || null,
        banco_numero: data.banco_numero || null,
        banco_agencia: data.banco_agencia || null,
        banco_conta: data.banco_conta || null,
        banco_cpf_cnpj: data.banco_cpf_cnpj || null,
      };

      if (isEditing) {
        await atualizarFornecedor(supabase, fornecedor.id, {
          ...payload,
          updated_at: new Date().toISOString(),
        });
        toast.success("Fornecedor atualizado!");
      } else {
        await criarFornecedor(supabase, payload);
        toast.success("Fornecedor cadastrado!");
      }

      onSuccess?.();
      router.push("/fornecedores");
      router.refresh();
    } catch {
      toast.error(`Erro ao ${isEditing ? "atualizar" : "cadastrar"} fornecedor`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do fornecedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fornecedor_material">
                      Fornecedor de Material
                    </SelectItem>
                    <SelectItem value="prestador_servico">
                      Prestador de Serviço
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cnpj_cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ / CPF</FormLabel>
                <FormControl>
                  <Input placeholder="00.000.000/0000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="especialidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidade</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Elétrica, Hidráulica, Pintura" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Endereço completo"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dados para Pagamento */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
            Dados para Pagamento
          </h3>

          <FormField
            control={form.control}
            name="tipo_pagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Pagamento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {tipoPagamento === "pix" && (
            <FormField
              control={form.control}
              name="chave_pix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave PIX</FormLabel>
                  <FormControl>
                    <Input placeholder="CPF, email, telefone ou chave aleatória" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {tipoPagamento === "conta_corrente" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="banco_numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Banco</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="banco_agencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agência</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1234-5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="banco_conta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 12345-6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="banco_cpf_cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF / CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="CPF ou CNPJ do titular" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Salvando..."
              : isEditing
              ? "Atualizar"
              : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
