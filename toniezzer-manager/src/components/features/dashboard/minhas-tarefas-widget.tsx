"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Play,
  Calendar,
  ListTodo,
  ExternalLink,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TarefaResumo {
  id: string;
  nome: string;
  status: string;
  data_prevista: string | null;
  prioridade: string | null;
  subetapa_nome: string;
}

interface SubetapaResumo {
  id: string;
  nome: string;
  total_tarefas: number;
  tarefas_concluidas: number;
}

interface MinhasTarefasWidgetProps {
  atrasadas: TarefaResumo[];
  emAndamento: TarefaResumo[];
  proximas: TarefaResumo[];
  minhasSubetapas: SubetapaResumo[];
}

const prioridadeConfig: Record<string, { color: string }> = {
  baixa: { color: "text-blue-400" },
  media: { color: "text-yellow-500" },
  alta: { color: "text-orange-500" },
  critica: { color: "text-red-500" },
};

export function MinhasTarefasWidget({
  atrasadas,
  emAndamento,
  proximas,
  minhasSubetapas,
}: MinhasTarefasWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Minhas Tarefas
          </span>
          <Link
            href="/tarefas"
            className="text-sm font-normal text-primary hover:underline"
          >
            Ver todas →
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Atrasadas */}
        {atrasadas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">
                Atrasadas ({atrasadas.length})
              </span>
            </div>
            <div className="space-y-1">
              {atrasadas.slice(0, 3).map((t) => {
                const diasAtraso = t.data_prevista
                  ? Math.ceil(
                      (Date.now() -
                        new Date(t.data_prevista + "T12:00:00").getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;
                const prio = t.prioridade
                  ? prioridadeConfig[t.prioridade]
                  : null;

                return (
                  <Link
                    key={t.id}
                    href={`/tarefas/${t.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    {prio && (
                      <Flag className={cn("h-3 w-3 shrink-0", prio.color)} />
                    )}
                    <span className="text-sm flex-1 truncate">{t.nome}</span>
                    <span className="text-xs text-red-500">
                      {diasAtraso}d atraso
                    </span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Em Andamento */}
        {emAndamento.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">
                Em Andamento ({emAndamento.length})
              </span>
            </div>
            <div className="space-y-1">
              {emAndamento.slice(0, 3).map((t) => {
                const prio = t.prioridade
                  ? prioridadeConfig[t.prioridade]
                  : null;

                return (
                  <Link
                    key={t.id}
                    href={`/tarefas/${t.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    {prio && (
                      <Flag className={cn("h-3 w-3 shrink-0", prio.color)} />
                    )}
                    <span className="text-sm flex-1 truncate">{t.nome}</span>
                    {t.data_prevista && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          t.data_prevista + "T12:00:00"
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    )}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Próximas */}
        {proximas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Próximas 7 dias ({proximas.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {proximas.slice(0, 4).map((t) => (
                <Link key={t.id} href={`/tarefas/${t.id}`}>
                  <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-muted">
                    {t.nome}
                    {t.data_prevista && (
                      <span className="ml-1 text-muted-foreground">
                        (
                        {new Date(
                          t.data_prevista + "T12:00:00"
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                        )
                      </span>
                    )}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Minhas Subetapas */}
        {minhasSubetapas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Minhas Subetapas ({minhasSubetapas.length})
              </span>
            </div>
            <div className="space-y-2">
              {minhasSubetapas.slice(0, 3).map((s) => {
                const progresso =
                  s.total_tarefas > 0
                    ? Math.round(
                        (s.tarefas_concluidas / s.total_tarefas) * 100
                      )
                    : 0;

                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-sm truncate flex-1">{s.nome}:</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {s.tarefas_concluidas}/{s.total_tarefas}
                    </span>
                    <Progress value={progresso} className="h-1.5 w-20" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {atrasadas.length === 0 &&
          emAndamento.length === 0 &&
          proximas.length === 0 &&
          minhasSubetapas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tarefa atribuída a você
            </p>
          )}
      </CardContent>
    </Card>
  );
}
