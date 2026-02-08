import { createClient } from "@/lib/supabase/server";
import { CronogramaWrapper } from "@/components/features/cronograma/cronograma-wrapper";
import { NovaEtapaDialog } from "@/components/features/cronograma/nova-etapa-dialog";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  nome_completo: string;
}

interface Tarefa {
  id: string;
  subetapa_id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_prevista: string | null;
  data_inicio_real: string | null;
  data_conclusao_real: string | null;
  responsavel_id: string | null;
  prioridade: string;
  ordem: number;
}

interface Subetapa {
  id: string;
  etapa_id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_inicio_prevista: string | null;
  data_fim_prevista: string | null;
  responsavel_id: string | null;
  progresso_percentual: number;
  ordem: number;
  orcamento_previsto: number | null;
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
    { data: etapasData },
    { data: usersData },
    { data: subetapasData },
    { data: tarefasData },
    { data: gastosData },
  ] = await Promise.all([
    supabase.from("etapas").select("*").order("ordem"),
    supabase.from("users").select("*").eq("ativo", true),
    supabase.from("subetapas").select("*").order("ordem"),
    supabase.from("tarefas").select("*").order("ordem"),
    supabase.from("gastos").select("etapa_relacionada_id, valor").eq("status", "aprovado"),
  ]);

  // Mapear dados hierárquicos: Etapa → Subetapa → Tarefas
  const users = (usersData || []) as User[];
  const tarefas = (tarefasData || []) as Tarefa[];
  const subetapas = (subetapasData || []) as Omit<Subetapa, 'tarefas'>[];
  const gastos = gastosData || [];
  const etapasRaw = etapasData || [];

  // Agrupar tarefas por subetapa
  const subetapasComTarefas: Subetapa[] = subetapas.map((s) => ({
    ...s,
    tarefas: tarefas.filter((t) => t.subetapa_id === s.id),
  }));

  // Agrupar subetapas por etapa + calcular gastos
  const etapas: Etapa[] = etapasRaw.map((e: Record<string, unknown>) => {
    // Calcular gasto total da etapa
    const gastoEtapa = gastos
      .filter((g) => g.etapa_relacionada_id === e.id)
      .reduce((acc, g) => acc + Number(g.valor), 0);

    return {
      ...e,
      responsavel: e.responsavel_id
        ? users.find((u) => u.id === e.responsavel_id) || null
        : null,
      subetapas: subetapasComTarefas.filter((s) => s.etapa_id === e.id),
      gasto_realizado: gastoEtapa,
    };
  }) as Etapa[];

  // Estatísticas
  const etapasConcluidas = etapas.filter((e) => e.status === "concluida").length;
  const etapasTotal = etapas.length;
  const etapasEmAndamento = etapas.filter((e) => e.status === "em_andamento").length;

  // Contar subetapas e tarefas totais
  const totalSubetapas = subetapasComTarefas.length;
  const subetapasConcluidas = subetapasComTarefas.filter((s) => s.status === "concluida").length;
  const totalTarefas = tarefas.length;
  const tarefasConcluidas = tarefas.filter((t) => t.status === "concluida").length;

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Cronograma</h1>
          
          {/* Mini Stats - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Badge variant="outline" className="gap-1.5">
              <span className="text-muted-foreground">Etapas:</span>
              <span className="text-green-500 font-medium">{etapasConcluidas}</span>
              <span className="text-muted-foreground">/</span>
              <span>{etapasTotal}</span>
            </Badge>

            {totalSubetapas > 0 && (
              <Badge variant="outline" className="gap-1.5">
                <span className="text-muted-foreground">Subetapas:</span>
                <span className="text-green-500 font-medium">{subetapasConcluidas}</span>
                <span className="text-muted-foreground">/</span>
                <span>{totalSubetapas}</span>
              </Badge>
            )}

            {etapasEmAndamento > 0 && (
              <Badge variant="outline" className="gap-1.5">
                <span className="text-blue-500 font-medium">{etapasEmAndamento}</span>
                <span className="text-muted-foreground">em andamento</span>
              </Badge>
            )}

            {totalTarefas > 0 && (
              <Badge variant="secondary" className="gap-1.5">
                <span className="text-muted-foreground">Tarefas:</span>
                <span className="text-green-500 font-medium">{tarefasConcluidas}</span>
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
