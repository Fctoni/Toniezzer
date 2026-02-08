"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Clock,
  Play,
  CheckCircle2,
  ArrowRight,
  ListTodo,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateString } from "@/lib/utils";

interface Tarefa {
  id: string;
  nome: string;
  status: string;
  prioridade: string;
  data_prevista: string | null;
  subetapa: {
    nome: string;
    etapa: {
      nome: string;
    };
  };
}

interface Subetapa {
  id: string;
  nome: string;
  progresso_percentual: number;
  tarefas_total: number;
  tarefas_concluidas: number;
  etapa: {
    nome: string;
  };
}

interface MinhasTarefasWidgetProps {
  tarefas: Tarefa[];
  subetapas: Subetapa[];
}

export function MinhasTarefasWidget({
  tarefas,
  subetapas,
}: MinhasTarefasWidgetProps) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Classificar tarefas
  const atrasadas = tarefas.filter(
    (t) =>
      t.data_prevista &&
      parseDateString(t.data_prevista) < hoje &&
      t.status !== "concluida" &&
      t.status !== "cancelada"
  );

  const emAndamento = tarefas.filter((t) => t.status === "em_andamento");

  const proximas = tarefas.filter((t) => {
    if (!t.data_prevista || t.status !== "pendente") return false;
    const dataPrevista = parseDateString(t.data_prevista);
    const diffDias = differenceInDays(dataPrevista, hoje);
    return diffDias >= 0 && diffDias <= 7;
  });

  const getPrioridadeColor = (prioridade: string) => {
    const cores: Record<string, string> = {
      baixa: "text-gray-500",
      media: "text-blue-500",
      alta: "text-orange-500",
      critica: "text-red-500",
    };
    return cores[prioridade] || "text-gray-500";
  };

  const formatDiasAtraso = (dataPrevista: string) => {
    const diff = differenceInDays(hoje, parseDateString(dataPrevista));
    if (diff === 0) return "Hoje";
    if (diff === 1) return "1 dia de atraso";
    return `${diff} dias de atraso`;
  };

  const formatDataProxima = (dataPrevista: string) => {
    const data = parseDateString(dataPrevista);
    const diff = differenceInDays(data, hoje);
    if (diff === 0) return "Hoje";
    if (diff === 1) return "Amanhã";
    return format(data, "dd/MM", { locale: ptBR });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Minhas Tarefas
          </CardTitle>
          <Link href="/tarefas">
            <Button variant="ghost" size="sm">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Atrasadas */}
        {atrasadas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="font-semibold text-red-500">
                Atrasadas ({atrasadas.length})
              </h3>
            </div>
            <div className="space-y-2">
              {atrasadas.slice(0, 3).map((tarefa) => (
                <Link
                  key={tarefa.id}
                  href={`/tarefas/${tarefa.id}`}
                  className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${getPrioridadeColor(
                          tarefa.prioridade
                        )}`}
                      >
                        {tarefa.nome}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tarefa.subetapa.etapa.nome} → {tarefa.subetapa.nome}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs shrink-0">
                      {tarefa.data_prevista &&
                        formatDiasAtraso(tarefa.data_prevista)}
                    </Badge>
                  </div>
                </Link>
              ))}
              {atrasadas.length > 3 && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  +{atrasadas.length - 3} tarefa(s) atrasada(s)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Em Andamento */}
        {emAndamento.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Play className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-blue-500">
                Em Andamento ({emAndamento.length})
              </h3>
            </div>
            <div className="space-y-2">
              {emAndamento.slice(0, 3).map((tarefa) => (
                <Link
                  key={tarefa.id}
                  href={`/tarefas/${tarefa.id}`}
                  className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${getPrioridadeColor(
                          tarefa.prioridade
                        )}`}
                      >
                        {tarefa.nome}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tarefa.subetapa.etapa.nome} → {tarefa.subetapa.nome}
                      </p>
                    </div>
                    {tarefa.data_prevista && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {formatDataProxima(tarefa.data_prevista)}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
              {emAndamento.length > 3 && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  +{emAndamento.length - 3} tarefa(s) em andamento
                </p>
              )}
            </div>
          </div>
        )}

        {/* Próximas (próximos 7 dias) */}
        {proximas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">
                Próximas ({proximas.length}) - próximos 7 dias
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {proximas.slice(0, 4).map((tarefa) => (
                <Link key={tarefa.id} href={`/tarefas/${tarefa.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    {tarefa.nome.length > 20
                      ? `${tarefa.nome.substring(0, 20)}...`
                      : tarefa.nome}
                    {tarefa.data_prevista && (
                      <span className="ml-1 text-xs">
                        ({formatDataProxima(tarefa.data_prevista)})
                      </span>
                    )}
                  </Badge>
                </Link>
              ))}
              {proximas.length > 4 && (
                <Badge variant="outline">+{proximas.length - 4} mais</Badge>
              )}
            </div>
          </div>
        )}

        {/* Minhas Subetapas */}
        {subetapas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Minhas Subetapas ({subetapas.length})</h3>
            </div>
            <div className="space-y-3">
              {subetapas.slice(0, 3).map((subetapa) => (
                <div
                  key={subetapa.id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{subetapa.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {subetapa.etapa.nome}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {subetapa.tarefas_concluidas}/{subetapa.tarefas_total}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={subetapa.progresso_percentual}
                      className="h-1.5"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {subetapa.progresso_percentual}%
                    </span>
                  </div>
                </div>
              ))}
              {subetapas.length > 3 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{subetapas.length - 3} subetapa(s)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tarefas.length === 0 && subetapas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Você não tem tarefas atribuídas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
