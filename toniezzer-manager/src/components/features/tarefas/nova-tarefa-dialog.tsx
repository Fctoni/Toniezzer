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
  DialogTrigger,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatDateToString } from "@/lib/utils";
import { DependenciasSelector } from "./dependencias-selector";

const formSchema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres"),
  descricao: z.string().optional(),
  responsavel_id: z.string().optional(),
  prioridade: z.enum(["baixa", "media", "alta", "critica"]),
  data_prevista: z.date().optional(),
  bloqueada_por: z.array(z.string()).optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  nome_completo: string;
}

interface Tarefa {
  id: string;
  nome: string;
  status: string;
}

interface NovaTarefaDialogProps {
  subetapaId: string;
  subetapaNome: string;
  users: User[];
  tarefasSubetapa: Tarefa[];
  proximaOrdem: number;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const prioridadeConfig = {
  baixa: { label: "Baixa", color: "text-gray-500" },
  media: { label: "Média", color: "text-blue-500" },
  alta: { label: "Alta", color: "text-orange-500" },
  critica: { label: "Crítica", color: "text-red-500" },
};

export function NovaTarefaDialog({
  subetapaId,
  subetapaNome,
  users,
  tarefasSubetapa,
  proximaOrdem,
  trigger,
  onSuccess,
}: NovaTarefaDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      prioridade: "media",
      bloqueada_por: [],
      tags: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Converter tags de string para array
      const tagsArray = data.tags
        ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const novaTarefa = {
        subetapa_id: subetapaId,
        nome: data.nome,
        descricao: data.descricao || null,
        responsavel_id: data.responsavel_id || null,
        prioridade: data.prioridade,
        data_prevista: data.data_prevista
          ? formatDateToString(data.data_prevista)
          : null,
        bloqueada_por: data.bloqueada_por && data.bloqueada_por.length > 0 ? data.bloqueada_por : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        status: "pendente",
        ordem: proximaOrdem,
      };

      const { error } = await supabase.from("tarefas").insert(novaTarefa);

      if (error) throw error;

      toast.success("Tarefa criada!");
      form.reset();
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar tarefa");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="ghost" className="gap-1">
            <Plus className="h-3 w-3" />
            Nova Tarefa
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa - {subetapaNome}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Tarefa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Adquirir concreto" {...field} />
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
                      placeholder="Detalhes da tarefa..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsavel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
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
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(prioridadeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <span className={config.color}>{config.label}</span>
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
              name="data_prevista"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Prevista</FormLabel>
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
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
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
                        locale={ptBR}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloqueada_por"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dependências</FormLabel>
                  <FormControl>
                    <DependenciasSelector
                      tarefas={tarefasSubetapa}
                      selectedIds={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta tarefa só poderá ser iniciada quando as dependências forem concluídas
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: elétrica, urgente, externa (separadas por vírgula)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Criando..." : "Criar Tarefa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
