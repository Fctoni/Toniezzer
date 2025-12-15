"use client";

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
    },
  });

  const onSubmit = async (data: FornecedorFormData) => {
    try {
      const supabase = createClient();

      if (isEditing) {
        const { error } = await supabase
          .from("fornecedores")
          .update({
            ...data,
            email: data.email || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", fornecedor.id);

        if (error) throw error;
        toast.success("Fornecedor atualizado!");
      } else {
        const { error } = await supabase.from("fornecedores").insert({
          ...data,
          email: data.email || null,
        });

        if (error) throw error;
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

