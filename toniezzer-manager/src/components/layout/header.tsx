"use client";

import { Bell, Search } from "lucide-react";
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
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  created_at: string;
  link: string | null;
}

export function Header() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const fetchNotificacoes = async () => {
      const { data } = await supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setNotificacoes(data);
        setNaoLidas(data.filter((n) => !n.lida).length);
      }
    };

    fetchNotificacoes();

    // Realtime subscription
    const channel = supabase
      .channel("notificacoes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes" },
        () => {
          fetchNotificacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
                    {notificacao.mensagem}
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
                  UP
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">
                Usuário Principal
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

