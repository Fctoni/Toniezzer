import { createClient } from "@/lib/supabase/server";
import { TarefasTable } from "@/components/features/tarefas/tarefas-table";
import { NovaTarefaDialog } from "@/components/features/tarefas/nova-tarefa-dialog";
import { buscarTarefas } from "@/lib/services/tarefas";
import { buscarSubetapasResumidas } from "@/lib/services/subetapas";
import { buscarUsuariosParaDropdown } from "@/lib/services/users";
import { buscarEtapasParaDropdown } from "@/lib/services/etapas";

interface User {
  id: string;
  nome_completo: string;
}

interface SubetapaDB {
  id: string;
  etapa_id: string;
  nome: string;
}

interface TarefaDB {
  id: string;
  subetapa_id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_prevista: string | null;
  data_inicio_real: string | null;
  data_conclusao_real: string | null;
  prioridade: string | null;
  responsavel_id: string | null;
  tags: string[] | null;
  notas: string | null;
  ordem: number;
}

export default async function TarefasPage() {
  const supabase = await createClient();

  const [
    tarefasRaw,
    subetapasRaw,
    etapas,
    usersData,
  ] = await Promise.all([
    buscarTarefas(supabase),
    buscarSubetapasResumidas(supabase),
    buscarEtapasParaDropdown(supabase),
    buscarUsuariosParaDropdown(supabase),
  ]);

  const users = usersData as User[];

  // Montar mapa etapa_id -> nome
  const etapaMap = new Map(etapas.map((e) => [e.id, e.nome]));

  // Montar mapa subetapa_id -> { nome, etapa_id }
  const subetapaMap = new Map(
    subetapasRaw.map((s) => [s.id, { nome: s.nome, etapa_id: s.etapa_id }])
  );

  // Enriquecer tarefas com contexto
  const tarefasComContexto = tarefasRaw.map((t) => {
    const sub = subetapaMap.get(t.subetapa_id);
    const etapaId = sub?.etapa_id || "";
    const user = t.responsavel_id
      ? users.find((u) => u.id === t.responsavel_id)
      : null;

    return {
      ...t,
      subetapa_nome: sub?.nome || "—",
      etapa_id: etapaId,
      etapa_nome: etapaMap.get(etapaId) || "—",
      responsavel_nome: user?.nome_completo || null,
    };
  });

  // Subetapas para o dialog e filtros
  const subetapasOptions = subetapasRaw.map((s) => ({
    id: s.id,
    nome: s.nome,
    etapa_id: s.etapa_id,
    etapa_nome: etapaMap.get(s.etapa_id) || "",
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Tarefas
        </h1>
        <NovaTarefaDialog users={users} subetapas={subetapasOptions} />
      </div>

      <TarefasTable
        tarefas={tarefasComContexto}
        etapas={etapas}
        subetapas={subetapasOptions}
        users={users}
      />
    </div>
  );
}
