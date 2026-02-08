"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Eye,
  Pencil,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateString } from "@/lib/utils";
import { EditarTarefaDialog } from "./editar-tarefa-dialog";

interface User {
  id: string;
  nome_completo: string;
}

interface Tarefa {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  data_prevista: string | null;
  responsavel_id: string | null;
  responsavel: { nome_completo: string } | null;
  bloqueada_por: string[] | null;
  tags: string[] | null;
  subetapa_id: string;
  subetapa: {
    nome: string;
    etapa: {
      nome: string;
    };
  };
}

interface TarefaSimples {
  id: string;
  nome: string;
  status: string;
}

interface TarefasTableProps {
  tarefas: Tarefa[];
  users: User[];
  onStatusChange: (tarefaId: string, novoStatus: string) => Promise<void>;
  onRefresh?: () => void;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pendente: {
    label: "Pendente",
    color: "text-gray-500 border-gray-300",
    icon: <Clock className="h-3 w-3" />,
  },
  em_andamento: {
    label: "Em Andamento",
    color: "text-blue-500 border-blue-300",
    icon: <Play className="h-3 w-3" />,
  },
  concluida: {
    label: "Concluída",
    color: "text-green-500 border-green-300",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelada: {
    label: "Cancelada",
    color: "text-red-500 border-red-300",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "text-gray-500" },
  media: { label: "Média", color: "text-blue-500" },
  alta: { label: "Alta", color: "text-orange-500" },
  critica: { label: "Crítica", color: "text-red-500" },
};

export function TarefasTable({
  tarefas,
  users,
  onStatusChange,
  onRefresh,
}: TarefasTableProps) {
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(parseDateString(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const isTarefaBloqueada = (tarefa: Tarefa): boolean => {
    if (!tarefa.bloqueada_por || tarefa.bloqueada_por.length === 0) {
      return false;
    }

    // Verificar se alguma tarefa bloqueadora não está concluída
    const tarefasBloqueadoras = tarefas.filter((t) =>
      tarefa.bloqueada_por?.includes(t.id)
    );

    return tarefasBloqueadoras.some((t) => t.status !== "concluida");
  };

  const handleStatusChange = async (tarefaId: string, novoStatus: string) => {
    setUpdatingId(tarefaId);
    await onStatusChange(tarefaId, novoStatus);
    setUpdatingId(null);
  };

  const getTarefasSubetapa = (subetapaId: string): TarefaSimples[] => {
    return tarefas
      .filter((t) => t.subetapa_id === subetapaId)
      .map((t) => ({ id: t.id, nome: t.nome, status: t.status }));
  };

  if (tarefas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-muted-foreground mb-2">Nenhuma tarefa encontrada</p>
        <p className="text-sm text-muted-foreground">
          Ajuste os filtros ou crie novas tarefas no cronograma
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Tarefa</TableHead>
              <TableHead className="w-[200px]">Etapa / Subetapa</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px]">Prioridade</TableHead>
              <TableHead className="w-[120px]">Prazo</TableHead>
              <TableHead className="w-[150px]">Responsável</TableHead>
              <TableHead className="w-[120px]">Tags</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tarefas.map((tarefa) => {
              const statusInfo = statusConfig[tarefa.status] || statusConfig.pendente;
              const prioridadeInfo =
                prioridadeConfig[tarefa.prioridade] || prioridadeConfig.media;
              const isBloqueada = isTarefaBloqueada(tarefa);

              return (
                <TableRow key={tarefa.id}>
                  {/* Nome da Tarefa */}
                  <TableCell>
                    <div className="flex items-start gap-2">
                      {isBloqueada && (
                        <Lock className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/tarefas/${tarefa.id}`}
                          className="font-medium hover:underline line-clamp-2"
                        >
                          {tarefa.nome}
                        </Link>
                        {tarefa.descricao && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {tarefa.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Etapa / Subetapa */}
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium truncate">{tarefa.subetapa.etapa.nome}</p>
                      <p className="text-muted-foreground truncate">
                        {tarefa.subetapa.nome}
                      </p>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant="outline" className={`gap-1 ${statusInfo.color}`}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </Badge>
                  </TableCell>

                  {/* Prioridade */}
                  <TableCell>
                    <span className={`text-sm font-medium ${prioridadeInfo.color}`}>
                      {prioridadeInfo.label}
                    </span>
                  </TableCell>

                  {/* Prazo */}
                  <TableCell className="text-sm">
                    {tarefa.data_prevista ? (
                      <div className="flex items-center gap-1">
                        {new Date(tarefa.data_prevista) < new Date() &&
                          tarefa.status !== "concluida" && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        <span>{formatDate(tarefa.data_prevista)}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  {/* Responsável */}
                  <TableCell>
                    {tarefa.responsavel ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(tarefa.responsavel.nome_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">
                          {tarefa.responsavel.nome_completo}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Tags */}
                  <TableCell>
                    {tarefa.tags && tarefa.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tarefa.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {tarefa.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tarefa.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/tarefas/${tarefa.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingTarefa(tarefa)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={updatingId === tarefa.id}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {tarefa.status === "pendente" && !isBloqueada && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(tarefa.id, "em_andamento")
                              }
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Iniciar
                            </DropdownMenuItem>
                          )}
                          {tarefa.status === "em_andamento" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(tarefa.id, "concluida")
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Concluir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(tarefa.id, "pendente")
                                }
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                Pausar
                              </DropdownMenuItem>
                            </>
                          )}
                          {tarefa.status === "concluida" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(tarefa.id, "em_andamento")
                              }
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Reabrir
                            </DropdownMenuItem>
                          )}
                          {tarefa.status !== "cancelada" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(tarefa.id, "cancelada")
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingTarefa && (
        <EditarTarefaDialog
          tarefa={editingTarefa}
          users={users}
          tarefasSubetapa={getTarefasSubetapa(editingTarefa.subetapa_id)}
          open={!!editingTarefa}
          onOpenChange={(open) => !open && setEditingTarefa(null)}
          onSuccess={() => {
            setEditingTarefa(null);
            onRefresh?.();
          }}
          onDelete={() => {
            setEditingTarefa(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
