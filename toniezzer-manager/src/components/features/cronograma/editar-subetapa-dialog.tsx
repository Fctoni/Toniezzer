"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres"),
  descricao: z.string().optional(),
  responsavel_id: z.string().optional(),
  orcamento_previsto: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  nome_completo: string;
}

interface Subetapa {
  id: string;
  etapa_id: string;
  nome: string;
  descricao: string | null;
  responsavel_id: string | null;
  orcamento_previsto: number | null;
}

interface EditarSubetapaDialogProps {
  subetapa: Subetapa;
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedSubetapa: Partial<Subetapa> & { id: string }) => void;
  onDelete?: (subetapaId: string) => void;
}

export function EditarSubetapaDialog({
  subetapa,
  users,
  open,
  onOpenChange,
  onSuccess,
  onDelete,
}: EditarSubetapaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: subetapa.nome,
      descricao: subetapa.descricao || "",
      responsavel_id: subetapa.responsavel_id || undefined,
      orcamento_previsto: subetapa.orcamento_previsto?.toString() || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Parse orçamento previsto se fornecido
      const orcamentoPrevisto = data.orcamento_previsto
        ? parseFloat(data.orcamento_previsto.replace(/[^\d,.-]/g, '').replace(',', '.'))
        : null;

      const updatedData = {
        nome: data.nome,
        descricao: data.descricao || null,
        responsavel_id: data.responsavel_id || null,
        orcamento_previsto: orcamentoPrevisto,
      };

      const { error } = await supabase
        .from("subetapas")
        .update(updatedData)
        .eq("id", subetapa.id);

      if (error) throw error;

      toast.success("Subetapa atualizada!");

      // Notificar o parent com os dados atualizados
      if (onSuccess) {
        onSuccess({ id: subetapa.id, ...updatedData });
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar subetapa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const supabase = createClient();

      // O CASCADE do banco já deleta as tarefas automaticamente
      const { error } = await supabase
        .from("subetapas")
        .delete()
        .eq("id", subetapa.id);

      if (error) throw error;

      toast.success("Subetapa excluída!");
      setShowDeleteAlert(false);

      // Notificar o parent sobre a exclusão
      if (onDelete) {
        onDelete(subetapa.id);
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir subetapa");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Subetapa</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Subetapa *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Base da caixa de entrada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes da subetapa..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.nome_completo}
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
                name="orcamento_previsto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento Previsto (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Ex: 5000.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                <p className="font-medium mb-1">Progresso da Subetapa</p>
                <p className="text-xs">
                  O progresso é calculado automaticamente com base nas tarefas concluídas.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteAlert(true)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir subetapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A subetapa <strong>{subetapa.nome}</strong> e
              todas as suas tarefas serão excluídas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
