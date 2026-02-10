import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Check,
  Circle,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Dependencia {
  id: string;
  depende_de_tarefa_id: string;
  tarefa_nome: string;
  tarefa_status: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  pendente: { label: "Pendente", color: "text-muted-foreground", icon: Circle },
  em_andamento: { label: "Em Andamento", color: "text-blue-500", icon: Play },
  concluida: { label: "Concluída", color: "text-green-500", icon: Check },
  bloqueada: { label: "Bloqueada", color: "text-orange-500", icon: Pause },
  cancelada: { label: "Cancelada", color: "text-red-500", icon: AlertTriangle },
};

interface TarefaDependenciasCardProps {
  dependencias: Dependencia[];
}

export function TarefaDependenciasCard({
  dependencias,
}: TarefaDependenciasCardProps) {
  const depsPendentes = dependencias.filter(
    (d) => d.tarefa_status !== "concluida"
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Dependências ({dependencias.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dependencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma dependência cadastrada
          </p>
        ) : (
          <div className="space-y-2">
            {depsPendentes.length > 0 && (
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-3">
                <p className="text-xs text-orange-500 font-medium">
                  Tarefa bloqueada - aguardando {depsPendentes.length}{" "}
                  tarefa{depsPendentes.length > 1 ? "s" : ""}
                </p>
              </div>
            )}
            {dependencias.map((dep) => {
              const depConfig =
                statusConfig[dep.tarefa_status] || statusConfig.pendente;
              const DepIcon = depConfig.icon;
              return (
                <div
                  key={dep.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <DepIcon
                    className={cn("h-4 w-4", depConfig.color)}
                  />
                  <span
                    className={cn(
                      dep.tarefa_status === "concluida" &&
                        "line-through text-muted-foreground"
                    )}
                  >
                    {dep.tarefa_nome}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] ml-auto", depConfig.color)}
                  >
                    {depConfig.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
