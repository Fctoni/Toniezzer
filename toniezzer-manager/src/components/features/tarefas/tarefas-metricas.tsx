"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Circle,
  Play,
  CheckSquare,
  Pause,
  AlertCircle,
  ListTodo,
} from "lucide-react";
import type { TarefaComContexto } from "@/components/features/tarefas/tarefas-config";

interface TarefasMetricasProps {
  tarefas: TarefaComContexto[];
}

export function TarefasMetricas({ tarefas }: TarefasMetricasProps) {
  const metricas = useMemo(() => {
    const total = tarefas.length;
    const pendentes = tarefas.filter((t) => t.status === "pendente").length;
    const emAndamento = tarefas.filter(
      (t) => t.status === "em_andamento"
    ).length;
    const concluidas = tarefas.filter((t) => t.status === "concluida").length;
    const bloqueadas = tarefas.filter((t) => t.status === "bloqueada").length;
    const hoje = new Date().toISOString().split("T")[0];
    const atrasadas = tarefas.filter(
      (t) =>
        t.data_prevista &&
        t.data_prevista < hoje &&
        t.status !== "concluida" &&
        t.status !== "cancelada"
    ).length;

    return { total, pendentes, emAndamento, concluidas, bloqueadas, atrasadas };
  }, [tarefas]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">
              Total
            </p>
            <p className="text-lg font-bold">{metricas.total}</p>
          </div>
        </div>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">
              Pendentes
            </p>
            <p className="text-lg font-bold">{metricas.pendentes}</p>
          </div>
        </div>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">
              Em And.
            </p>
            <p className="text-lg font-bold">{metricas.emAndamento}</p>
          </div>
        </div>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">
              Concluidas
            </p>
            <p className="text-lg font-bold">{metricas.concluidas}</p>
          </div>
        </div>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Pause className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">
              Bloqueadas
            </p>
            <p className="text-lg font-bold">{metricas.bloqueadas}</p>
          </div>
        </div>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">
              Atrasadas
            </p>
            <p className="text-lg font-bold text-red-500">
              {metricas.atrasadas}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
