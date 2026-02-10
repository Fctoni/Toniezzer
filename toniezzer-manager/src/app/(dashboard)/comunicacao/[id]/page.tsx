"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Tables, TopicoStatus } from "@/lib/types/database";
import { buscarTopicoPorId, atualizarStatusTopico, toggleFixadoTopico, deletarTopico } from "@/lib/services/topicos-comunicacao";
import { buscarMensagensPorTopico, criarMensagem } from "@/lib/services/feed-comunicacao";
import { MensagemTopico } from "@/components/features/comunicacao/mensagem-topico";
import { MencoesInput } from "@/components/features/comunicacao/mencoes-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  MoreHorizontal,
  CheckCircle2,
  Archive,
  Pin,
  PinOff,
  Trash2,
  Calendar,
  AlertTriangle,
  ArrowUp,
} from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

type TopicoWithRelations = Tables<"topicos_comunicacao"> & {
  autor?: Tables<"users"> | null;
  etapa?: Tables<"etapas"> | null;
};

type MensagemWithAutor = Tables<"feed_comunicacao"> & {
  autor?: Tables<"users"> | null;
};

export default function TopicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser, users } = useCurrentUser();
  const [topico, setTopico] = useState<TopicoWithRelations | null>(null);
  const [mensagens, setMensagens] = useState<MensagemWithAutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [mencoes, setMencoes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    try {
      const [topicoData, mensagensData] = await Promise.all([
        buscarTopicoPorId(supabase, id),
        buscarMensagensPorTopico(supabase, id),
      ]);

      setTopico(topicoData as TopicoWithRelations);
      setMensagens(mensagensData as MensagemWithAutor[]);
    } catch (error) {
      console.error("Erro ao buscar dados do tópico:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`topico_${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feed_comunicacao",
          filter: `topico_id=eq.${id}`,
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchData]);

  const handleMensagemChange = (value: string, mentions: string[]) => {
    setNovaMensagem(value);
    setMencoes(mentions);
  };

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim() || !currentUser?.id) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      await criarMensagem(supabase, {
        tipo: "post",
        conteudo: novaMensagem,
        autor_id: currentUser.id,
        topico_id: id,
        mencoes: mencoes.length > 0 ? mencoes : null,
      });

      setNovaMensagem("");
      setMencoes([]);
      toast.success("Mensagem enviada!");
    } catch {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: TopicoStatus) => {
    try {
      const supabase = createClient();
      await atualizarStatusTopico(supabase, id, status);

      toast.success(
        status === "resolvido"
          ? "Tópico marcado como resolvido!"
          : status === "arquivado"
          ? "Tópico arquivado!"
          : "Tópico reaberto!"
      );
      fetchData();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleToggleFixado = async () => {
    try {
      const supabase = createClient();
      await toggleFixadoTopico(supabase, id, !topico?.fixado);

      toast.success(topico?.fixado ? "Tópico desafixado!" : "Tópico fixado!");
      fetchData();
    } catch {
      toast.error("Erro ao atualizar tópico");
    }
  };

  const handleDelete = async () => {
    try {
      const supabase = createClient();
      await deletarTopico(supabase, id);

      toast.success("Tópico excluído!");
      router.push("/comunicacao");
    } catch {
      toast.error("Erro ao excluir tópico");
    }
  };

  const getPrioridadeBadge = () => {
    if (!topico) return null;

    switch (topico.prioridade) {
      case "alta":
        return (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30">
            <ArrowUp className="h-3 w-3" />
            Alta
          </Badge>
        );
      case "urgente":
        return (
          <Badge variant="outline" className="gap-1 text-red-600 border-red-500/30">
            <AlertTriangle className="h-3 w-3" />
            Urgente
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!topico) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tópico não encontrado</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/comunicacao">Voltar para lista</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
          <Link href="/comunicacao">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {topico.fixado && <Pin className="h-4 w-4 text-primary shrink-0" />}
            <h1 className="text-2xl font-bold tracking-tight">{topico.titulo}</h1>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge
              variant="outline"
              className={
                topico.status === "aberto"
                  ? "bg-green-500/20 text-green-600 border-green-500/30"
                  : topico.status === "resolvido"
                  ? "bg-blue-500/20 text-blue-600 border-blue-500/30"
                  : "bg-gray-500/20 text-gray-500 border-gray-500/30"
              }
            >
              {topico.status === "aberto"
                ? "🟢 Aberto"
                : topico.status === "resolvido"
                ? "✅ Resolvido"
                : "📦 Arquivado"}
            </Badge>

            {getPrioridadeBadge()}

            {topico.etapa && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                {topico.etapa.nome}
              </Badge>
            )}

            <span className="text-sm text-muted-foreground">
              • {mensagens.length} {mensagens.length === 1 ? "mensagem" : "mensagens"}
            </span>
          </div>

          {topico.descricao && (
            <p className="text-muted-foreground mt-2">{topico.descricao}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleToggleFixado}>
              {topico.fixado ? (
                <>
                  <PinOff className="h-4 w-4 mr-2" />
                  Desafixar
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4 mr-2" />
                  Fixar tópico
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {topico.status !== "resolvido" && (
              <DropdownMenuItem onClick={() => handleUpdateStatus("resolvido")}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como resolvido
              </DropdownMenuItem>
            )}
            {topico.status !== "aberto" && (
              <DropdownMenuItem onClick={() => handleUpdateStatus("aberto")}>
                Reabrir tópico
              </DropdownMenuItem>
            )}
            {topico.status !== "arquivado" && (
              <DropdownMenuItem onClick={() => handleUpdateStatus("arquivado")}>
                <Archive className="h-4 w-4 mr-2" />
                Arquivar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir tópico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mensagens */}
      <div className="space-y-4">
        {mensagens.map((mensagem, index) => (
          <MensagemTopico
            key={mensagem.id}
            mensagem={mensagem}
            currentUserId={currentUser?.id}
            isFirstMessage={index === 0}
            onDelete={fetchData}
          />
        ))}
      </div>

      {/* Formulário de resposta */}
      {topico.status === "aberto" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <MencoesInput
                value={novaMensagem}
                onChange={handleMensagemChange}
                users={users}
                placeholder="Escreva sua resposta... Use @ para mencionar alguém"
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleEnviarMensagem}
                  disabled={!novaMensagem.trim() || isSubmitting}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Enviar resposta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {topico.status !== "aberto" && (
        <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
          <p>Este tópico está {topico.status === "resolvido" ? "resolvido" : "arquivado"}.</p>
          <Button
            variant="link"
            onClick={() => handleUpdateStatus("aberto")}
            className="mt-2"
          >
            Reabrir para permitir novas respostas
          </Button>
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tópico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tópico? Todas as mensagens
              serão perdidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

