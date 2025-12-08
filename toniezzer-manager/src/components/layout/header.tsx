"use client";

import { Bell, Search, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  created_at: string;
  link: string | null;
}

// Formata mensagem removendo tags de menção @[Nome](id) para @Nome
const formatarMensagem = (mensagem: string | null): string => {
  if (!mensagem) return "";
  return mensagem.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");
};

export function Header() {
  const { currentUser, users, setCurrentUserId } = useCurrentUser();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  const fetchNotificacoes = useCallback(async () => {
    if (!currentUser) return;
    
    const supabase = createClient();
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotificacoes(data);
      setNaoLidas(data.filter((n) => !n.lida).length);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  useEffect(() => {
    if (!currentUser) return;

    const supabase = createClient();

    const channel = supabase
      .channel("notificacoes")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "notificacoes",
          filter: `usuario_id=eq.${currentUser.id}`
        },
        () => {
          fetchNotificacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchNotificacoes]);

  const marcarComoLida = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("notificacoes")
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq("id", id);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "orcamento_80":
        return "bg-yellow-500/20 text-yellow-500";
      case "orcamento_100":
        return "bg-red-500/20 text-red-500";
      case "etapa_atrasada":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-primary/20 text-primary";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {naoLidas > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                >
                  {naoLidas}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notificações
              {naoLidas > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {naoLidas} novas
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificacoes.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              notificacoes.map((notificacao) => (
                <DropdownMenuItem
                  key={notificacao.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => marcarComoLida(notificacao.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        notificacao.lida ? "bg-muted" : "bg-primary"
                      }`}
                    />
                    <span className="font-medium text-sm flex-1">
                      {notificacao.titulo}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${getTipoColor(notificacao.tipo)}`}
                    >
                      {notificacao.tipo.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-4">
                    {formatarMensagem(notificacao.mensagem)}
                  </p>
                  <span className="text-[10px] text-muted-foreground pl-4">
                    {formatDistanceToNow(new Date(notificacao.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {currentUser ? getInitials(currentUser.nome_completo) : "??"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium">
                  {currentUser?.nome_completo || "Selecione"}
                </span>
                {currentUser?.especialidade && (
                  <span className="text-[10px] text-muted-foreground -mt-0.5">
                    {currentUser.especialidade}
                  </span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Simular Usuário</span>
              <Badge variant="outline" className="text-[10px]">MVP</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {users.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => setCurrentUserId(user.id)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-muted">
                    {getInitials(user.nome_completo)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.nome_completo}
                  </p>
                  {user.especialidade && (
                    <p className="text-xs text-muted-foreground truncate">
                      {user.especialidade}
                    </p>
                  )}
                </div>
                {currentUser?.id === user.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

