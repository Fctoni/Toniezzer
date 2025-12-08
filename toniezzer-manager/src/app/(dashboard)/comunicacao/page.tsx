"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables, TopicoStatus } from "@/lib/types/database";
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

    let query = supabase
      .from("topicos_comunicacao")
      .select(
        `
        *,
        autor:users(*),
        etapa:etapas(*)
      `
      )
      .order("fixado", { ascending: false })
      .order("updated_at", { ascending: false });

    if (statusFilter !== "todos") {
      query = query.eq("status", statusFilter);
    }

    if (search) {
      query = query.ilike("titulo", `%${search}%`);
    }

    const { data: topicosData, error } = await query;

    if (error) {
      console.error("Erro ao buscar tópicos:", error);
      return;
    }

    if (topicosData) {
      const topicosWithCount = await Promise.all(
        topicosData.map(async (topico) => {
          const { count } = await supabase
            .from("feed_comunicacao")
            .select("*", { count: "exact", head: true })
            .eq("topico_id", topico.id);

          return {
            ...topico,
            _count: { mensagens: count || 0 },
          };
        })
      );

      setTopicos(topicosWithCount);
    }

    setLoading(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Comunicação
          </h1>
          <p className="text-muted-foreground">
            {totalTopicos} tópicos • {abertos} em aberto
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
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tópico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TopicoStatus | "todos")}
        >
          <TabsList className="h-9">
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
