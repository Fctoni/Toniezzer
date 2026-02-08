"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TarefasFilters, type TarefasFilters as TarefasFiltersType } from "@/components/features/tarefas/tarefas-filters";
import { TarefasTable } from "@/components/features/tarefas/tarefas-table";
import { CheckCircle2, Clock, Play, AlertTriangle } from "lucide-react";
import { formatDateToString } from "@/lib/utils";

interface User {
  id: string;
  nome_completo: string;
}

interface Tarefa {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  data_prevista: string | null;
  responsavel_id: string | null;
  responsavel: { nome_completo: string } | null;
  bloqueada_por: string[] | null;
  tags: string[] | null;
  subetapa_id: string;
  subetapa: {
    nome: string;
    etapa: {
      nome: string;
    };
  };
}

export default function TarefasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<TarefasFiltersType>({
    search: "",
    status: "todos",
    prioridade: "todos",
    responsavel_id: "todos",
    tag: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const [{ data: tarefasData }, { data: usersData }] = await Promise.all([
        supabase
          .from("tarefas")
          .select(
            `
            *,
            responsavel:users!responsavel_id(nome_completo),
            subetapa:subetapas(
              nome,
              etapa:etapas(nome)
            )
          `
          )
          .order("data_prevista", { ascending: true, nullsFirst: false }),
        supabase.from("users").select("id, nome_completo").eq("ativo", true),
      ]);

      setTarefas((tarefasData || []) as Tarefa[]);
      setUsers((usersData || []) as User[]);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      toast.error("Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (tarefaId: string, novoStatus: string) => {
    const supabase = createClient();

    try {
      const updates: Record<string, unknown> = { status: novoStatus };

      if (novoStatus === "em_andamento") {
        updates.data_inicio_real = formatDateToString(new Date());
      } else if (novoStatus === "concluida") {
        updates.data_conclusao_real = formatDateToString(new Date());
      }

      const { error } = await supabase
        .from("tarefas")
        .update(updates)
        .eq("id", tarefaId);

      if (error) throw error;

      toast.success("Status atualizado!");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status");
    }
  };

  // Aplicar filtros client-side
  const tarefasFiltradas = tarefas.filter((tarefa) => {
    // Filtro de busca
    if (
      filters.search &&
      !tarefa.nome.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    // Filtro de status
    if (filters.status !== "todos" && tarefa.status !== filters.status) {
      return false;
    }

    // Filtro de prioridade
    if (
      filters.prioridade !== "todos" &&
      tarefa.prioridade !== filters.prioridade
    ) {
      return false;
    }

    // Filtro de responsável
    if (filters.responsavel_id !== "todos") {
      if (filters.responsavel_id === "sem_responsavel") {
        if (tarefa.responsavel_id !== null) return false;
      } else if (tarefa.responsavel_id !== filters.responsavel_id) {
        return false;
      }
    }

    // Filtro de tag
    if (filters.tag && (!tarefa.tags || !tarefa.tags.includes(filters.tag))) {
      return false;
    }

    return true;
  });

  // Estatísticas
  const stats = {
    total: tarefasFiltradas.length,
    pendentes: tarefasFiltradas.filter((t) => t.status === "pendente").length,
    emAndamento: tarefasFiltradas.filter((t) => t.status === "em_andamento")
      .length,
    concluidas: tarefasFiltradas.filter((t) => t.status === "concluida").length,
    atrasadas: tarefasFiltradas.filter(
      (t) =>
        t.data_prevista &&
        new Date(t.data_prevista) < new Date() &&
        t.status !== "concluida"
    ).length,
  };

  // Extrair todas as tags únicas
  const allTags = Array.from(
    new Set(tarefas.flatMap((t) => t.tags || []))
  ).sort();

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tarefas</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as tarefas do projeto
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{stats.emAndamento}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Play className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{stats.concluidas}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atrasadas</p>
                <p className="text-2xl font-bold">{stats.atrasadas}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <TarefasFilters
            filters={filters}
            onFilterChange={setFilters}
            users={users}
            availableTags={allTags}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <TarefasTable
        tarefas={tarefasFiltradas}
        users={users}
        onStatusChange={handleStatusChange}
        onRefresh={loadData}
      />
    </div>
  );
}
