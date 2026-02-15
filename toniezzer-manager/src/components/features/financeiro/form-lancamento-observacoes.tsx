"use client";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import type { formSchema } from "./expense-form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

type FormData = z.infer<typeof formSchema>;

interface FormLancamentoObservacoesProps {
  form: UseFormReturn<FormData>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function FormLancamentoObservacoes({
  form,
  isSubmitting,
  onCancel,
}: FormLancamentoObservacoesProps) {
  return (
    <>
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
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </div>
    </>
  );
}
