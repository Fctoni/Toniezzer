import { createClient } from "@/lib/supabase/server";
import { CronogramaTable } from "@/components/features/cronograma/cronograma-table";
import { NovaEtapaDialog } from "@/components/features/cronograma/nova-etapa-dialog";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  nome_completo: string;
}

interface Tarefa {
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
  tarefas: Tarefa[];
}

export default async function CronogramaPage() {
  const supabase = await createClient();

  const [{ data: etapasData }, { data: usersData }, { data: tarefasData }] =
    await Promise.all([
      supabase
        .from("etapas")
        .select("*")
        .order("ordem"),
      supabase.from("users").select("*").eq("ativo", true),
      supabase.from("tarefas").select("*").order("ordem"),
    ]);

  // Mapear etapas com responsável e tarefas
  const users = (usersData || []) as User[];
  const tarefas = (tarefasData || []) as Tarefa[];
  const etapasRaw = etapasData || [];
  const etapas: Etapa[] = etapasRaw.map((e: Record<string, unknown>) => ({
    ...e,
    responsavel: e.responsavel_id 
      ? users.find(u => u.id === e.responsavel_id) || null 
      : null,
    tarefas: tarefas.filter(t => t.etapa_id === e.id)
  })) as Etapa[];

  // Estatísticas
  const etapasConcluidas = etapas.filter((e) => e.status === "concluida").length;
  const etapasTotal = etapas.length;
  const etapasEmAndamento = etapas.filter((e) => e.status === "em_andamento").length;
  const totalTarefas = tarefas.length;
  const tarefasConcluidas = tarefas.filter((t) => t.status === "concluida").length;

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cronograma</h1>
          </div>
          
          {/* Mini Stats */}
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="gap-1.5">
              <span className="text-muted-foreground">Etapas:</span>
              <span className="text-green-500 font-medium">{etapasConcluidas}</span>
              <span className="text-muted-foreground">/</span>
              <span>{etapasTotal}</span>
            </Badge>
            
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

      {/* Tabela do Cronograma */}
      <CronogramaTable etapas={etapas} users={users} />
    </div>
  );
}
