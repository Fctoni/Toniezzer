import { createClient } from "@/lib/supabase/server";
import { TarefaDetalhes } from "@/components/features/tarefas/tarefa-detalhes";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TarefaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Buscar tarefa
  const { data: tarefa, error: tarefaError } = await supabase
    .from("tarefas")
    .select("*")
    .eq("id", id)
    .single();

  if (tarefaError || !tarefa) {
    notFound();
  }

  // Buscar subetapa + etapa
  const { data: subetapa } = await supabase
    .from("subetapas")
    .select("id, nome, etapa_id")
    .eq("id", tarefa.subetapa_id)
    .single();

  let etapaNome = "—";
  if (subetapa?.etapa_id) {
    const { data: etapa } = await supabase
      .from("etapas")
      .select("nome")
      .eq("id", subetapa.etapa_id)
      .single();
    etapaNome = etapa?.nome || "—";
  }

  // Buscar dados em paralelo
  const [
    { data: depsData },
    { data: anexosData },
    { data: comentariosData },
    { data: usersData },
    {
      data: { user: authUser },
    },
  ] = await Promise.all([
    supabase
      .from("tarefas_dependencias")
      .select("id, depende_de_tarefa_id")
      .eq("tarefa_id", id),
    supabase
      .from("tarefas_anexos")
      .select("id, nome_original, tipo_arquivo, tamanho_bytes, storage_path, created_at, created_by")
      .eq("tarefa_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tarefas_comentarios")
      .select("id, conteudo, created_at, created_by")
      .eq("tarefa_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("users").select("id, nome_completo").eq("ativo", true),
    supabase.auth.getUser(),
  ]);

  const users = (usersData || []) as { id: string; nome_completo: string }[];
  const userMap = new Map(users.map((u) => [u.id, u.nome_completo]));

  // Enriquecer dependências com nome da tarefa
  const deps = depsData || [];
  const depTarefaIds = deps.map((d) => d.depende_de_tarefa_id);
  let depTarefas: { id: string; nome: string; status: string }[] = [];
  if (depTarefaIds.length > 0) {
    const { data } = await supabase
      .from("tarefas")
      .select("id, nome, status")
      .in("id", depTarefaIds);
    depTarefas = data || [];
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
