import { createClient } from "@/lib/supabase/server";
import { TaskDetails } from "@/components/features/tarefas/task-details";
import { notFound } from "next/navigation";
import { fetchTaskById, fetchTasksByIds } from "@/lib/services/tarefas";
import { fetchSubstageById } from "@/lib/services/subetapas";
import { fetchStageName } from "@/lib/services/etapas";
import { fetchTaskAttachments } from "@/lib/services/tarefas-anexos";
import { fetchTaskComments } from "@/lib/services/tarefas-comentarios";
import { fetchTaskDependencies } from "@/lib/services/tarefas-dependencias";
import { fetchUsersForDropdown, fetchUserByEmail } from "@/lib/services/users";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TarefaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Buscar tarefa
  let tarefa;
  try {
    tarefa = await fetchTaskById(supabase, id);
  } catch {
    notFound();
  }

  if (!tarefa) {
    notFound();
  }

  // Buscar subetapa + etapa
  const subetapa = await fetchSubstageById(supabase, tarefa.subetapa_id);

  let etapaNome = "—";
  if (subetapa?.etapa_id) {
    const etapa = await fetchStageName(supabase, subetapa.etapa_id);
    etapaNome = etapa?.nome || "—";
  }

  // Buscar dados em paralelo
  const [
    depsData,
    anexosData,
    comentariosData,
    usersData,
    {
      data: { user: authUser },
    },
  ] = await Promise.all([
    fetchTaskDependencies(supabase, id),
    fetchTaskAttachments(supabase, id),
    fetchTaskComments(supabase, id),
    fetchUsersForDropdown(supabase),
    supabase.auth.getUser(),
  ]);

  const users = usersData;
  const userMap = new Map(users.map((u) => [u.id, u.nome_completo]));

  // Enriquecer dependências com nome da tarefa
  const deps = depsData;
  const depTarefaIds = deps.map((d) => d.depende_de_tarefa_id);
  let depTarefas: { id: string; nome: string; status: string }[] = [];
  if (depTarefaIds.length > 0) {
    depTarefas = await fetchTasksByIds(supabase, depTarefaIds);
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
    try {
      const currentUser = await fetchUserByEmail(supabase, authUser.email);
      currentUserId = currentUser.id;
    } catch {
      currentUserId = null;
    }
  }

  return (
    <TaskDetails
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
