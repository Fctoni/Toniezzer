"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tables, TopicoPrioridade } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { criarTopico } from "@/lib/services/topicos-comunicacao";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface NovoTopicoDialogProps {
  etapas: Tables<"etapas">[];
  currentUserId: string;
  onSuccess?: () => void;
}

export function NovoTopicoDialog({
  etapas,
  currentUserId,
  onSuccess,
}: NovoTopicoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<TopicoPrioridade>("normal");
  const [etapaId, setEtapaId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error("Digite um título para o tópico");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const data = await criarTopico(supabase, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        prioridade,
        etapa_relacionada_id: etapaId || null,
        autor_id: currentUserId,
      });

      toast.success("Tópico criado!");
      setOpen(false);
      resetForm();
      onSuccess?.();

      // Redirecionar para o novo tópico
      router.push(`/comunicacao/${data.id}`);
    } catch {
      toast.error("Erro ao criar tópico");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setPrioridade("normal");
    setEtapaId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Tópico
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Tópico</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Ex: Problema com infiltração no banheiro"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o assunto em detalhes..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="resize-none min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={prioridade}
                onValueChange={(v) => setPrioridade(v as TopicoPrioridade)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  <SelectItem value="normal">🔵 Normal</SelectItem>
                  <SelectItem value="alta">🟠 Alta</SelectItem>
                  <SelectItem value="urgente">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Etapa relacionada</Label>
              <Select
                value={etapaId || "none"}
                onValueChange={(v) => setEtapaId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!titulo.trim() || isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Tópico"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

