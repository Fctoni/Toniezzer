import { createClient } from "@/lib/supabase/server";
import { TarefaDetalhes } from "@/components/features/tarefas/tarefa-detalhes";
import { notFound } from "next/navigation";
import { buscarTarefaPorId, buscarTarefasPorIds } from "@/lib/services/tarefas";
import { buscarSubetapaPorId } from "@/lib/services/subetapas";
import { buscarEtapaNome } from "@/lib/services/etapas";
import { buscarAnexosDaTarefa } from "@/lib/services/tarefas-anexos";
import { buscarComentariosDaTarefa } from "@/lib/services/tarefas-comentarios";
import { buscarDependenciasDaTarefa } from "@/lib/services/tarefas-dependencias";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TarefaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Buscar tarefa
  let tarefa;
  try {
    tarefa = await buscarTarefaPorId(supabase, id);
  } catch {
    notFound();
  }

  if (!tarefa) {
    notFound();
  }

  // Buscar subetapa + etapa
  const subetapa = await buscarSubetapaPorId(supabase, tarefa.subetapa_id);

  let etapaNome = "—";
  if (subetapa?.etapa_id) {
    const etapa = await buscarEtapaNome(supabase, subetapa.etapa_id);
    etapaNome = etapa?.nome || "—";
  }

  // Buscar dados em paralelo
  const [
    depsData,
    anexosData,
    comentariosData,
    { data: usersData },
    {
      data: { user: authUser },
    },
  ] = await Promise.all([
    buscarDependenciasDaTarefa(supabase, id),
    buscarAnexosDaTarefa(supabase, id),
    buscarComentariosDaTarefa(supabase, id),
    supabase.from("users").select("id, nome_completo").eq("ativo", true),
    supabase.auth.getUser(),
  ]);

  const users = (usersData || []) as { id: string; nome_completo: string }[];
  const userMap = new Map(users.map((u) => [u.id, u.nome_completo]));

  // Enriquecer dependências com nome da tarefa
  const deps = depsData;
  const depTarefaIds = deps.map((d) => d.depende_de_tarefa_id);
  let depTarefas: { id: string; nome: string; status: string }[] = [];
  if (depTarefaIds.length > 0) {
    depTarefas = await buscarTarefasPorIds(supabase, depTarefaIds);
  }

  const dependencias = deps.map((d) => {
    const depTarefa = depTarefas.find(
      (t) => t.id === d.depende_de_tarefa_id
    );
    return {
      id: d.id,
      depende_de_tarefa_id: d.depende_de_tarefa_id,
      tarefa_nome: depTarefa?.nome || "Tarefa removida",
      tarefa_status: depTarefa?.status || "pendente",
    };
  });

  // Enriquecer anexos com nome do criador
  const anexos = (anexosData || []).map((a) => ({
    ...a,
    created_by_nome: a.created_by ? userMap.get(a.created_by) || null : null,
  }));

  // Enriquecer comentários com nome do criador
  const comentarios = (comentariosData || []).map((c) => ({
    ...c,
    created_by_nome: c.created_by ? userMap.get(c.created_by) || null : null,
  }));

  // Buscar current user ID na tabela users (mapeado por email)
  let currentUserId: string | null = null;
  if (authUser?.email) {
    const { data: currentUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", authUser.email)
      .single();
    currentUserId = currentUser?.id || null;
  }

  return (
    <TarefaDetalhes
      tarefa={tarefa}
      etapaNome={etapaNome}
      subetapaNome={subetapa?.nome || "—"}
      dependencias={dependencias}
      anexos={anexos}
      comentarios={comentarios}
      users={users}
      currentUserId={currentUserId}
    />
  );
}
