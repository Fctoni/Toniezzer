"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MencoesInput } from "./mencoes-input";
import { Tables, FeedTipo } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, Megaphone, AlertCircle } from "lucide-react";

interface NovoPostFormProps {
  users: Tables<"users">[];
  etapas: Tables<"etapas">[];
  currentUserId: string;
  onSuccess?: () => void;
}

const tipoOptions: { value: FeedTipo; label: string; icon: React.ReactNode }[] = [
  { value: "post", label: "Post", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "decisao", label: "Decisão", icon: <Megaphone className="h-4 w-4" /> },
  { value: "alerta", label: "Alerta", icon: <AlertCircle className="h-4 w-4" /> },
];

export function NovoPostForm({
  users,
  etapas,
  currentUserId,
  onSuccess,
}: NovoPostFormProps) {
  const [conteudo, setConteudo] = useState("");
  const [mencoes, setMencoes] = useState<string[]>([]);
  const [tipo, setTipo] = useState<FeedTipo>("post");
  const [etapaId, setEtapaId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConteudoChange = (value: string, mentions: string[]) => {
    setConteudo(value);
    setMencoes(mentions);
  };

  const handleSubmit = async () => {
    if (!conteudo.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.from("feed_comunicacao").insert({
        tipo,
        conteudo,
        autor_id: currentUserId,
        mencoes: mencoes.length > 0 ? mencoes : null,
        etapa_relacionada_id: etapaId || null,
      });

      if (error) throw error;

      toast.success("Post publicado!");
      setConteudo("");
      setMencoes([]);
      setTipo("post");
      setEtapaId("");
      onSuccess?.();
    } catch {
      toast.error("Erro ao publicar post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="pt-4">
        <div className="space-y-4">
          <MencoesInput
            value={conteudo}
            onChange={handleConteudoChange}
            users={users}
            placeholder="O que está acontecendo na obra? Use @ para mencionar alguém..."
          />

          <div className="flex flex-wrap items-center gap-3">
            <Select value={tipo} onValueChange={(v) => setTipo(v as FeedTipo)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={etapaId || "none"} onValueChange={(v) => setEtapaId(v === "none" ? "" : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Vincular à etapa (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma etapa</SelectItem>
                {etapas.map((etapa) => (
                  <SelectItem key={etapa.id} value={etapa.id}>
                    {etapa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleSubmit}
              disabled={!conteudo.trim() || isSubmitting}
              className="ml-auto gap-2"
            >
              <Send className="h-4 w-4" />
              Publicar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

