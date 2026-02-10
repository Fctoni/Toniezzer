"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Flag, ArrowUpDown, Eye, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TarefasFilters,
  TarefasFiltersState,
} from "@/components/features/tarefas/tarefas-filters";
import { EditarTarefaDialog } from "@/components/features/tarefas/editar-tarefa-dialog";
import { TarefasMetricas } from "@/components/features/tarefas/tarefas-metricas";
import {
  statusConfig,
  prioridadeConfig,
  prioridadeOrder,
  getInitials,
  type TarefaComContexto,
} from "@/components/features/tarefas/tarefas-config";

interface EtapaOption {
  id: string;
  nome: string;
}

interface SubetapaOption {
  id: string;
  nome: string;
  etapa_id: string;
  etapa_nome: string;
}

interface User {
  id: string;
  nome_completo: string;
}

interface TarefasTableProps {
  tarefas: TarefaComContexto[];
  etapas: EtapaOption[];
  subetapas: SubetapaOption[];
  users: User[];
}

type SortKey = "nome" | "data_prevista" | "prioridade" | "status" | "etapa_nome";
type SortDir = "asc" | "desc";

export function TarefasTable({
  tarefas,
  etapas,
  subetapas,
  users,
}: TarefasTableProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<TarefasFiltersState>({
    busca: "",
    etapa_id: "todas",
    subetapa_id: "todas",
    responsavel_id: "todos",
    status: "todos",
    prioridade: "todas",
  });
  const [sortKey, setSortKey] = useState<SortKey>("data_prevista");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingTarefa, setEditingTarefa] = useState<TarefaComContexto | null>(
    null
  );

  const updateFilter = (key: keyof TarefasFiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...tarefas];

    // Filtros
    if (filters.busca) {
      const busca = filters.busca.toLowerCase();
      result = result.filter(
        (t) =>
          t.nome.toLowerCase().includes(busca) ||
          t.descricao?.toLowerCase().includes(busca) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(busca))
      );
    }
    if (filters.etapa_id !== "todas") {
      result = result.filter((t) => t.etapa_id === filters.etapa_id);
    }
    if (filters.subetapa_id !== "todas") {
      result = result.filter((t) => t.subetapa_id === filters.subetapa_id);
    }
    if (filters.responsavel_id !== "todos") {
      result = result.filter(
        (t) => t.responsavel_id === filters.responsavel_id
      );
    }
    if (filters.status !== "todos") {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.prioridade !== "todas") {
      result = result.filter((t) => t.prioridade === filters.prioridade);
    }

    // Ordenacao
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "nome":
          cmp = a.nome.localeCompare(b.nome);
          break;
        case "data_prevista":
          cmp =
            (a.data_prevista || "9999").localeCompare(
              b.data_prevista || "9999"
            );
          break;
        case "prioridade":
          cmp =
            (prioridadeOrder[a.prioridade || "media"] || 2) -
            (prioridadeOrder[b.prioridade || "media"] || 2);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "etapa_nome":
          cmp = a.etapa_nome.localeCompare(b.etapa_nome);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [tarefas, filters, sortKey, sortDir]);

  const SortHeader = ({
    label,
    sortKeyValue,
  }: {
    label: string;
    sortKeyValue: SortKey;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 -ml-3 font-medium"
      onClick={() => toggleSort(sortKeyValue)}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* Metricas */}
      <TarefasMetricas tarefas={tarefas} />

      {/* Filtros */}
      <TarefasFilters
        filters={filters}
        onFilterChange={updateFilter}
        etapas={etapas}
        subetapas={subetapas}
        users={users}
      />

      {/* Tabela */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filteredAndSorted.length} tarefa
            {filteredAndSorted.length !== 1 ? "s" : ""} encontrada
            {filteredAndSorted.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <SortHeader label="Nome" sortKeyValue="nome" />
                </TableHead>
                <TableHead>
                  <SortHeader label="Etapa / Subetapa" sortKeyValue="etapa_nome" />
                </TableHead>
                <TableHead>Responsavel</TableHead>
                <TableHead>
                  <SortHeader label="Prazo" sortKeyValue="data_prevista" />
                </TableHead>
                <TableHead>
                  <SortHeader label="Status" sortKeyValue="status" />
                </TableHead>
                <TableHead>
                  <SortHeader label="Prioridade" sortKeyValue="prioridade" />
                </TableHead>
                <TableHead className="w-[60px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhuma tarefa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSorted.map((tarefa) => {
                  const sConfig =
                    statusConfig[tarefa.status] || statusConfig.pendente;
                  const StatusIcon = sConfig.icon;
                  const pConfig = tarefa.prioridade
                    ? prioridadeConfig[tarefa.prioridade]
                    : null;
                  const hoje = new Date().toISOString().split("T")[0];
                  const atrasada =
                    tarefa.data_prevista &&
                    tarefa.data_prevista < hoje &&
                    tarefa.status !== "concluida" &&
                    tarefa.status !== "cancelada";

                  return (
                    <TableRow
                      key={tarefa.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/tarefas/${tarefa.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon
                            className={cn("h-4 w-4 shrink-0", sConfig.color)}
                          />
                          <span
                            className={cn(
                              "font-medium truncate",
                              tarefa.status === "concluida" &&
                                "line-through text-muted-foreground"
                            )}
                          >
                            {tarefa.nome}
                          </span>
                        </div>
                        {tarefa.tags && tarefa.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 ml-6">
                            {tarefa.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] px-1 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            {tarefa.etapa_nome}
                          </span>
                          <span className="text-muted-foreground/50"> / </span>
                          <span>{tarefa.subetapa_nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tarefa.responsavel_nome ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">
                                {getInitials(tarefa.responsavel_nome)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[100px]">
                              {tarefa.responsavel_nome}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tarefa.data_prevista ? (
                          <span
                            className={cn(
                              "text-sm",
                              atrasada && "text-red-500 font-medium"
                            )}
                          >
                            {new Date(
                              tarefa.data_prevista + "T12:00:00"
                            ).toLocaleDateString("pt-BR")}
                            {atrasada && (
                              <AlertTriangle className="inline ml-1 h-3 w-3" />
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-[11px]", sConfig.color)}
                        >
                          {sConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pConfig && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[11px]",
                              pConfig.color,
                              pConfig.bgColor
                            )}
                          >
                            <Flag className="mr-1 h-3 w-3" />
                            {pConfig.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTarefa(tarefa);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de edicao */}
      {editingTarefa && (
        <EditarTarefaDialog
          tarefa={editingTarefa}
          users={users}
          open={!!editingTarefa}
          onOpenChange={(open) => {
            if (!open) setEditingTarefa(null);
          }}
          onSuccess={() => {
            setEditingTarefa(null);
            router.refresh();
          }}
          onDelete={() => {
            setEditingTarefa(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
