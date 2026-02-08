"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TarefaDetail } from "@/components/features/tarefas/tarefa-detail";

interface User {
  id: string;
  nome_completo: string;
}

interface TarefaDep {
  id: string;
  nome: string;
  status: string;
}

interface Anexo {
  id: string;
  nome_arquivo: string;
  nome_original: string;
  tipo_arquivo: string;
  tamanho_bytes: number;
  storage_path: string;
  created_at: string;
  created_by: string;
}

interface Tarefa {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  data_prevista: string | null;
  data_inicio_real: string | null;
  data_conclusao_real: string | null;
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

export default function TarefaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tarefaId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [dependencias, setDependencias] = useState<TarefaDep[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tarefasSubetapa, setTarefasSubetapa] = useState<TarefaDep[]>([]);

  useEffect(() => {
    if (tarefaId) {
      loadData();
    }
  }, [tarefaId]);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Carregar tarefa com relacionamentos
      const { data: tarefaData, error: tarefaError } = await supabase
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
        .eq("id", tarefaId)
        .single();

      if (tarefaError) {
        if (tarefaError.code === "PGRST116") {
          toast.error("Tarefa não encontrada");
          router.push("/tarefas");
          return;
        }
        throw tarefaError;
      }

      const tarefaCompleta = tarefaData as Tarefa;
      setTarefa(tarefaCompleta);

      // Carregar dependências (tarefas bloqueadoras)
      if (tarefaCompleta.bloqueada_por && tarefaCompleta.bloqueada_por.length > 0) {
        const { data: depsData } = await supabase
          .from("tarefas")
          .select("id, nome, status")
          .in("id", tarefaCompleta.bloqueada_por);

        setDependencias((depsData || []) as TarefaDep[]);
      } else {
        setDependencias([]);
      }

      // Carregar anexos
      const { data: anexosData } = await supabase
        .from("tarefas_anexos")
        .select("*")
        .eq("tarefa_id", tarefaId)
        .order("created_at", { ascending: false });

      setAnexos((anexosData || []) as Anexo[]);

      // Carregar usuários ativos
      const { data: usersData } = await supabase
        .from("users")
        .select("id, nome_completo")
        .eq("ativo", true);

      setUsers((usersData || []) as User[]);

      // Carregar todas as tarefas da mesma subetapa (para DependenciasSelector)
      const { data: tarefasSubData } = await supabase
        .from("tarefas")
        .select("id, nome, status")
        .eq("subetapa_id", tarefaCompleta.subetapa_id);

      setTarefasSubetapa((tarefasSubData || []) as TarefaDep[]);
    } catch (error) {
      console.error("Erro ao carregar tarefa:", error);
      toast.error("Erro ao carregar tarefa");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-96 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>

        <Skeleton className="h-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!tarefa) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Tarefa não encontrada</p>
      </div>
    );
  }

  return (
    <TarefaDetail
      tarefa={tarefa}
      dependencias={dependencias}
      anexos={anexos}
      users={users}
      tarefasSubetapa={tarefasSubetapa}
      onRefresh={loadData}
    />
  );
}
