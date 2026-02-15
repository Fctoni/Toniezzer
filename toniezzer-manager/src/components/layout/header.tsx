"use client";

import { useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, LogOut, User as UserIcon, Menu } from "lucide-react";
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
import { fetchRecentNotifications, markAsRead as markAsReadService } from "@/lib/services/notificacoes";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { cn } from "@/lib/utils";

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

interface HeaderProps {
  isMobile?: boolean;
  onMenuClick?: () => void;
}

export function Header({ isMobile = false, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { authUser, currentUser, signOut } = useCurrentUser();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  const fetchNotificacoes = useCallback(async () => {
    if (!currentUser) return;

    try {
      const supabase = createClient();
      const data = await fetchRecentNotifications(supabase, currentUser.id, 10);

      const notificacoesFormatadas = data.map(n => ({
        ...n,
        lida: n.lida ?? false,
        created_at: n.created_at || new Date().toISOString()
      }));
      setNotificacoes(notificacoesFormatadas);
      setNaoLidas(notificacoesFormatadas.filter((n) => !n.lida).length);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
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
    try {
      const supabase = createClient();
      await markAsReadService(supabase, id);
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
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

  // Nome para exibir: do perfil ou do auth
  const displayName = currentUser?.nome_completo || authUser?.email || "Usuario";
  const displayEmail = authUser?.email || "";

  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-14 lg:h-16 items-center gap-2 lg:gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      isMobile ? "px-4" : "px-6"
    )}>
      {/* Mobile: Menu button */}
      {isMobile && onMenuClick && (
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Search - hidden on mobile */}
      <div className={cn("flex-1 max-w-md", isMobile && "hidden")}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Mobile: Logo/Title */}
      {isMobile && (
        <div className="flex-1">
          <span className="font-semibold text-sm">Toniezzer Manager</span>
        </div>
      )}

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
              Notificacoes
              {naoLidas > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {naoLidas} novas
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificacoes.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma notificacao
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

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium">
                  {currentUser?.nome_completo || "Usuario"}
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
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {displayEmail}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => router.push('/perfil')}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-500 focus:text-red-500"
              onSelect={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
