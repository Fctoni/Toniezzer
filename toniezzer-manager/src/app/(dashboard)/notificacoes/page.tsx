"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buscarNotificacoes, marcarComoLida as marcarComoLidaService, marcarTodasComoLidas as marcarTodasComoLidasService, excluirNotificacao as excluirNotificacaoService } from "@/lib/services/notificacoes";
import type { Tables, NotificacaoTipo } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  DollarSign,
  Calendar,
  AtSign,
  AlertTriangle,
  Mail,
  ClipboardList,
  Settings,
} from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

// Formata mensagem removendo tags de menção @[Nome](id) para @Nome
const formatarMensagem = (mensagem: string | null): string => {
  if (!mensagem) return "";
  return mensagem.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");
};

const tipoConfig: Record<
  NotificacaoTipo,
  { label: string; icon: React.ReactNode; color: string }
> = {
  orcamento_80: {
    label: "Orçamento 80%",
    icon: <DollarSign className="h-4 w-4" />,
    color: "text-amber-500 bg-amber-500/10",
  },
  orcamento_100: {
    label: "Orçamento 100%",
    icon: <DollarSign className="h-4 w-4" />,
    color: "text-red-500 bg-red-500/10",
  },
  etapa_atrasada: {
    label: "Etapa Atrasada",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-red-500 bg-red-500/10",
  },
  etapa_aguardando: {
    label: "Etapa Aguardando",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-blue-500 bg-blue-500/10",
  },
  mencao: {
    label: "Menção",
    icon: <AtSign className="h-4 w-4" />,
    color: "text-primary bg-primary/10",
  },
  gasto_aprovacao: {
    label: "Gasto p/ Aprovar",
    icon: <DollarSign className="h-4 w-4" />,
    color: "text-amber-500 bg-amber-500/10",
  },
  mudanca_escopo: {
    label: "Mudança de Escopo",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-purple-500 bg-purple-500/10",
  },
  email_novo: {
    label: "Email",
    icon: <Mail className="h-4 w-4" />,
    color: "text-blue-500 bg-blue-500/10",
  },
  tarefa_atribuida: {
    label: "Tarefa",
    icon: <ClipboardList className="h-4 w-4" />,
    color: "text-green-500 bg-green-500/10",
  },
  sistema: {
    label: "Sistema",
    icon: <Settings className="h-4 w-4" />,
    color: "text-gray-500 bg-gray-500/10",
  },
};

export default function NotificacoesPage() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [notificacoes, setNotificacoes] = useState<Tables<"notificacoes">[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState<NotificacaoTipo | "todas">("todas");
  const [lidaFilter, setLidaFilter] = useState<"todas" | "nao_lidas" | "lidas">("todas");

  const fetchNotificacoes = useCallback(async () => {
    if (!currentUser) return;

    try {
      const supabase = createClient();
      const filtros: { tipo?: string; lida?: boolean } = {};

      if (tipoFilter !== "todas") {
        filtros.tipo = tipoFilter;
      }
      if (lidaFilter === "nao_lidas") {
        filtros.lida = false;
      } else if (lidaFilter === "lidas") {
        filtros.lida = true;
      }

      const data = await buscarNotificacoes(supabase, currentUser.id, filtros);
      setNotificacoes(data);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setLoading(false);
    }
  }, [tipoFilter, lidaFilter, currentUser]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("notificacoes_page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes" },
        () => fetchNotificacoes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotificacoes]);

  const marcarComoLida = async (id: string) => {
    try {
      const supabase = createClient();
      await marcarComoLidaService(supabase, id);
      fetchNotificacoes();
    } catch (error) {
      toast.error("Erro ao marcar como lida");
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!currentUser) return;

    try {
      const supabase = createClient();
      await marcarTodasComoLidasService(supabase, currentUser.id);
      toast.success("Todas as notificações foram marcadas como lidas");
      fetchNotificacoes();
    } catch (error) {
      toast.error("Erro ao marcar todas como lidas");
    }
  };

  const excluirNotificacao = async (id: string) => {
    try {
      const supabase = createClient();
      await excluirNotificacaoService(supabase, id);
      toast.success("Notificação excluída");
      fetchNotificacoes();
    } catch (error) {
      toast.error("Erro ao excluir notificação");
    }
  };

  const handleNotificacaoClick = (notificacao: Tables<"notificacoes">) => {
    if (!notificacao.lida) {
      marcarComoLida(notificacao.id);
    }
    if (notificacao.link) {
      router.push(notificacao.link);
    }
  };

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notificações
          </h1>
          <p className="text-muted-foreground">
            {notificacoes.length} notificações • {naoLidas} não lidas
          </p>
        </div>
        {naoLidas > 0 && (
          <Button variant="outline" onClick={marcarTodasComoLidas}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={lidaFilter}
          onValueChange={(v) => setLidaFilter(v as typeof lidaFilter)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="nao_lidas">Não lidas</SelectItem>
            <SelectItem value="lidas">Lidas</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={tipoFilter}
          onValueChange={(v) => setTipoFilter(v as NotificacaoTipo | "todas")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os tipos</SelectItem>
            {Object.entries(tipoConfig).map(([tipo, config]) => (
              <SelectItem key={tipo} value={tipo}>
                <div className="flex items-center gap-2">
                  {config.icon}
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : notificacoes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhuma notificação</p>
            <p className="text-sm">
              {tipoFilter !== "todas" || lidaFilter !== "todas"
                ? "Tente ajustar os filtros"
                : "Você está em dia!"}
            </p>
          </div>
        ) : (
          notificacoes.map((notificacao) => {
            const config = tipoConfig[notificacao.tipo as NotificacaoTipo];

            return (
              <Card
                key={notificacao.id}
                className={`bg-card/50 backdrop-blur-sm border-border/50 transition-colors ${
                  !notificacao.lida
                    ? "border-l-4 border-l-primary"
                    : "opacity-70"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Ícone */}
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${config.color}`}
                    >
                      {config.icon}
                    </div>

                    {/* Conteúdo */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificacaoClick(notificacao)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {notificacao.titulo}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {config.label}
                        </Badge>
                        {!notificacao.lida && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {formatarMensagem(notificacao.mensagem)}
                      </p>
                      <span className="text-xs text-muted-foreground mt-2 block">
                        {notificacao.created_at && formatDistanceToNow(new Date(notificacao.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => marcarComoLida(notificacao.id)}
                          title="Marcar como lida"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => excluirNotificacao(notificacao.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

