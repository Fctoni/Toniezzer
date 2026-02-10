"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables, TopicoStatus } from "@/lib/types/database";
import { buscarTopicos } from "@/lib/services/topicos-comunicacao";
import { contarMensagensPorTopico } from "@/lib/services/feed-comunicacao";
import { TopicoLinha } from "@/components/features/comunicacao/topico-linha";
import { NovoTopicoDialog } from "@/components/features/comunicacao/novo-topico-dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Search,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

type TopicoWithRelations = Tables<"topicos_comunicacao"> & {
  autor?: Tables<"users"> | null;
  etapa?: Tables<"etapas"> | null;
  _count?: { mensagens: number };
};

interface EtapaComTopicos {
  etapa: Tables<"etapas"> | null;
  topicos: TopicoWithRelations[];
  isExpanded: boolean;
}

export default function ComunicacaoPage() {
  const { currentUser } = useCurrentUser();
  const [topicos, setTopicos] = useState<TopicoWithRelations[]>([]);
  const [etapas, setEtapas] = useState<Tables<"etapas">[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TopicoStatus | "todos">("todos");
  const [search, setSearch] = useState("");
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set(["geral"]));

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const { data: etapasResult } = await supabase
      .from("etapas")
      .select("*")
      .order("ordem");

    if (etapasResult) {
      setEtapas(etapasResult);
      const allIds = new Set(["geral", ...etapasResult.map((e) => e.id)]);
      setExpandedEtapas(allIds);
    }
  }, []);

  const fetchTopicos = useCallback(async () => {
    const supabase = createClient();

    try {
      const filtros: { status?: string; search?: string } = {};
      if (statusFilter !== "todos") filtros.status = statusFilter;
      if (search) filtros.search = search;

      const topicosData = await buscarTopicos(supabase, filtros);

      const topicosWithCount = await Promise.all(
        topicosData.map(async (topico) => {
          const count = await contarMensagensPorTopico(supabase, topico.id);
          return {
            ...topico,
            _count: { mensagens: count },
          };
        })
      );

      setTopicos(topicosWithCount);
    } catch (error) {
      console.error("Erro ao buscar tópicos:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTopicos();
  }, [fetchTopicos]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("topicos_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topicos_comunicacao" },
        () => fetchTopicos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTopicos]);

  // Agrupar tópicos por etapa
  const topicosPorEtapa = useMemo(() => {
    const grupos: EtapaComTopicos[] = [];

    // Tópicos sem etapa (Geral)
    const topicosGeral = topicos.filter((t) => !t.etapa_relacionada_id);
    if (topicosGeral.length > 0 || etapas.length === 0) {
      grupos.push({
        etapa: null,
        topicos: topicosGeral,
        isExpanded: expandedEtapas.has("geral"),
      });
    }

    // Tópicos por etapa
    etapas.forEach((etapa) => {
      const topicosEtapa = topicos.filter(
        (t) => t.etapa_relacionada_id === etapa.id
      );
      grupos.push({
        etapa,
        topicos: topicosEtapa,
        isExpanded: expandedEtapas.has(etapa.id),
      });
    });

    return grupos;
  }, [topicos, etapas, expandedEtapas]);

  const toggleEtapa = (id: string) => {
    setExpandedEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalTopicos = topicos.length;
  const abertos = topicos.filter((t) => t.status === "aberto").length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
            <span className="truncate">Comunicacao</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalTopicos} topicos • {abertos} em aberto
          </p>
        </div>
        {currentUser && (
          <NovoTopicoDialog
            etapas={etapas}
            currentUserId={currentUser.id}
            onSuccess={fetchTopicos}
          />
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar topico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 w-full"
          />
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TopicoStatus | "todos")}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-9 w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="aberto" className="text-xs">Abertos</TabsTrigger>
            <TabsTrigger value="resolvido" className="text-xs">Resolvidos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista agrupada por etapa */}
      <div className="space-y-3">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/50">
                <CardHeader className="py-3">
                  <Skeleton className="h-5 w-48" />
                </CardHeader>
                <CardContent className="py-2">
                  <Skeleton className="h-8 w-full mb-2" />
                  <Skeleton className="h-8 w-full mb-2" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : topicos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhum tópico encontrado</p>
            <p className="text-sm mb-4">
              {search || statusFilter !== "todos"
                ? "Tente ajustar os filtros"
                : "Crie o primeiro tópico de discussão"}
            </p>
          </div>
        ) : (
          topicosPorEtapa.map((grupo) => {
            const etapaId = grupo.etapa?.id || "geral";
            const etapaNome = grupo.etapa?.nome || "Geral";
            const count = grupo.topicos.length;
            const isExpanded = expandedEtapas.has(etapaId);

            return (
              <Card
                key={etapaId}
                className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden"
              >
                <button
                  onClick={() => toggleEtapa(etapaId)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <FolderOpen
                      className={cn(
                        "h-4 w-4",
                        grupo.etapa ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="font-medium text-sm">{etapaNome}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {count}
                    </Badge>
                  </div>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 pb-2 px-2">
                    {count === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum tópico nesta etapa
                      </p>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {grupo.topicos.map((topico) => (
                          <TopicoLinha key={topico.id} topico={topico} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
