import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineEtapas } from "@/components/features/cronograma/timeline-etapas";
import { NovaEtapaDialog } from "@/components/features/cronograma/nova-etapa-dialog";

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

interface Dependencia {
  id: string;
  etapa_id: string;
  depende_de_etapa_id: string;
  tipo: string;
}

export default async function CronogramaPage() {
  const supabase = await createClient();

  const [{ data: etapasData }, { data: usersData }, { data: dependenciasData }, { data: tarefasData }] =
    await Promise.all([
      supabase
        .from("etapas")
        .select("*")
        .order("ordem"),
      supabase.from("users").select("*").eq("ativo", true),
      supabase.from("etapas_dependencias").select("*"),
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
  const dependencias = (dependenciasData || []) as Dependencia[];

  const etapasConcluidas = etapas.filter((e) => e.status === "concluida").length;
  const etapasTotal = etapas.length;
  const progressoGeral =
    etapasTotal > 0 ? Math.round((etapasConcluidas / etapasTotal) * 100) : 0;

  return (
    <div className="space-y-6 animate-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cronograma</h1>
          <p className="text-muted-foreground">
            Timeline de etapas e progresso da obra
          </p>
        </div>
        <NovaEtapaDialog
          users={users}
          etapas={etapas}
          proximaOrdem={etapas.length + 1}
        />
      </div>

      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Etapas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{etapasTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{etapasConcluidas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {etapas.filter((e) => e.status === "em_andamento").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progresso Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{progressoGeral}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Etapas</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineEtapas
            etapas={etapas}
            dependencias={dependencias}
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  );
}

