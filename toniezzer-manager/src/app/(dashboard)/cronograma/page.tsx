import { createClient } from "@/lib/supabase/server";
import { CronogramaWrapper } from "@/components/features/cronograma/cronograma-wrapper";
import { NovaEtapaDialog } from "@/components/features/cronograma/nova-etapa-dialog";
import { Badge } from "@/components/ui/badge";
import { buscarEtapas } from "@/lib/services/etapas";
import { buscarSubetapas } from "@/lib/services/subetapas";
import { buscarTarefas } from "@/lib/services/tarefas";
import { buscarGastosPorEtapa } from "@/lib/services/gastos";
import { buscarUsuariosAtivos } from "@/lib/services/users";

interface User {
  id: string;
  nome_completo: string;
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

interface SubetapaDB {
  id: string;
  etapa_id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_inicio_prevista: string | null;
  data_fim_prevista: string | null;
  data_inicio_real: string | null;
  data_fim_real: string | null;
  responsavel_id: string | null;
  ordem: number;
  progresso_percentual: number | null;
}

interface Tarefa extends TarefaDB {
  responsavel?: User | null;
}

interface Subetapa extends SubetapaDB {
  responsavel?: User | null;
  tarefas: Tarefa[];
}

interface Etapa {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_inicio_prevista: string | null;
  data_fim_prevista: string | null;
  data_inicio_real: string | null;
  data_fim_real: string | null;
  progresso_percentual: number;
  ordem: number;
  responsavel_id: string | null;
  responsavel: User | null;
  subetapas: Subetapa[];
  orcamento?: number | null;
  gasto_realizado?: number;
}

export default async function CronogramaPage() {
  const supabase = await createClient();

  const [
    etapasRaw,
    usersData,
    subetapasRaw,
    tarefasRaw,
    gastos,
  ] = await Promise.all([
    buscarEtapas(supabase),
    buscarUsuariosAtivos(supabase),
    buscarSubetapas(supabase),
    buscarTarefas(supabase),
    buscarGastosPorEtapa(supabase),
  ]);

  const users = usersData as User[];

  // Aninhar tarefas dentro de subetapas
  const subetapasComTarefas: Subetapa[] = subetapasRaw.map((s) => ({
    ...s,
    responsavel: s.responsavel_id
      ? users.find((u) => u.id === s.responsavel_id) || null
      : null,
    tarefas: tarefasRaw
      .filter((t) => t.subetapa_id === s.id)
      .map((t) => ({
        ...t,
        responsavel: t.responsavel_id
          ? users.find((u) => u.id === t.responsavel_id) || null
          : null,
      })),
  }));

  // Aninhar subetapas dentro de etapas
  const etapas: Etapa[] = etapasRaw.map((e: Record<string, unknown>) => {
    const gastoEtapa = gastos
      .filter((g) => g.etapa_relacionada_id === e.id)
      .reduce((acc, g) => acc + Number(g.valor), 0);

    const etapaSubetapas = subetapasComTarefas.filter(
      (s) => s.etapa_id === e.id
    );

    return {
      ...e,
      responsavel: e.responsavel_id
        ? users.find((u) => u.id === e.responsavel_id) || null
        : null,
      subetapas: etapaSubetapas,
      gasto_realizado: gastoEtapa,
    };
  }) as Etapa[];

  // Estatísticas
  const etapasConcluidas = etapas.filter(
    (e) => e.status === "concluida"
  ).length;
  const etapasTotal = etapas.length;
  const etapasEmAndamento = etapas.filter(
    (e) => e.status === "em_andamento"
  ).length;
  const totalSubetapas = subetapasComTarefas.length;
  const subetapasConcluidas = subetapasComTarefas.filter(
    (s) => s.status === "concluida"
  ).length;
  const totalTarefas = tarefasRaw.length;
  const tarefasConcluidas = tarefasRaw.filter(
    (t) => t.status === "concluida"
  ).length;

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Cronograma
          </h1>

          {/* Mini Stats - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Badge variant="outline" className="gap-1.5">
              <span className="text-muted-foreground">Etapas:</span>
              <span className="text-green-500 font-medium">
                {etapasConcluidas}
              </span>
              <span className="text-muted-foreground">/</span>
              <span>{etapasTotal}</span>
            </Badge>

            {etapasEmAndamento > 0 && (
              <Badge variant="outline" className="gap-1.5">
                <span className="text-blue-500 font-medium">
                  {etapasEmAndamento}
                </span>
                <span className="text-muted-foreground">em andamento</span>
              </Badge>
            )}

            {totalSubetapas > 0 && (
              <Badge variant="secondary" className="gap-1.5">
                <span className="text-muted-foreground">Subetapas:</span>
                <span className="text-green-500 font-medium">
                  {subetapasConcluidas}
                </span>
                <span className="text-muted-foreground">/</span>
                <span>{totalSubetapas}</span>
              </Badge>
            )}

            {totalTarefas > 0 && (
              <Badge variant="secondary" className="gap-1.5">
                <span className="text-muted-foreground">Tarefas:</span>
                <span className="text-green-500 font-medium">
                  {tarefasConcluidas}
                </span>
                <span className="text-muted-foreground">/</span>
                <span>{totalTarefas}</span>
              </Badge>
            )}
          </div>
        </div>

        <NovaEtapaDialog
          users={users}
          etapas={etapas}
          proximaOrdem={etapas.length + 1}
        />
      </div>

      {/* Cronograma - Desktop: tabela, Mobile: lista */}
      <CronogramaWrapper etapas={etapas} users={users} />
    </div>
  );
}
