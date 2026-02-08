"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Link2,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateString } from "@/lib/utils";
import { AnexosUpload } from "./anexos-upload";
import { EditarTarefaDialog } from "./editar-tarefa-dialog";

interface User {
  id: string;
  nome_completo: string;
}

interface TarefaDep {
  id: string;
  nome: string;
  status: string;
}

interface Anexo {
  id: string;
  nome_arquivo: string;
  nome_original: string;
  tipo_arquivo: string;
  tamanho_bytes: number;
  storage_path: string;
  created_at: string;
  created_by: string;
}

interface Tarefa {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  data_prevista: string | null;
  data_inicio_real: string | null;
  data_conclusao_real: string | null;
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

interface TarefaDetailProps {
  tarefa: Tarefa;
  dependencias: TarefaDep[];
  anexos: Anexo[];
  users: User[];
  tarefasSubetapa: TarefaDep[];
  onRefresh: () => void;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  pendente: {
    label: "Pendente",
    color: "text-gray-500",
    bgColor: "bg-gray-500/20",
    icon: <Clock className="h-4 w-4" />,
  },
  em_andamento: {
    label: "Em Andamento",
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  concluida: {
    label: "Concluída",
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  cancelada: {
    label: "Cancelada",
    color: "text-red-500",
    bgColor: "bg-red-500/20",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

const prioridadeConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  baixa: { label: "Baixa", color: "text-gray-600", bgColor: "bg-gray-100" },
  media: { label: "Média", color: "text-blue-600", bgColor: "bg-blue-100" },
  alta: { label: "Alta", color: "text-orange-600", bgColor: "bg-orange-100" },
  critica: { label: "Crítica", color: "text-red-600", bgColor: "bg-red-100" },
};

export function TarefaDetail({
  tarefa,
  dependencias,
  anexos,
  users,
  tarefasSubetapa,
  onRefresh,
}: TarefaDetailProps) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [descricaoLocal, setDescricaoLocal] = useState(tarefa.descricao || "");
  const [salvandoDescricao, setSalvandoDescricao] = useState(false);

  const statusInfo = statusConfig[tarefa.status] || statusConfig.pendente;
  const prioridadeInfo =
    prioridadeConfig[tarefa.prioridade] || prioridadeConfig.media;

  const isBloqueada =
    dependencias.length > 0 &&
    dependencias.some((dep) => dep.status !== "concluida");

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

  const handleSaveDescricao = async () => {
    setSalvandoDescricao(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("tarefas")
        .update({ descricao: descricaoLocal || null })
        .eq("id", tarefa.id);

      if (error) throw error;

      toast.success("Descrição atualizada!");
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar descrição");
    } finally {
      setSalvandoDescricao(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/tarefas">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{tarefa.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {tarefa.subetapa.etapa.nome} → {tarefa.subetapa.nome}
              </p>
            </div>
          </div>

          <Button onClick={() => setEditando(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Status e Prioridade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  <Badge
                    variant="outline"
                    className={`${statusInfo.color} ${statusInfo.bgColor} gap-2 px-3 py-1`}
                  >
                    {statusInfo.icon}
                    {statusInfo.label}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Prioridade</p>
                  <Badge
                    className={`${prioridadeInfo.color} ${prioridadeInfo.bgColor}`}
                  >
                    {prioridadeInfo.label}
                  </Badge>
                </div>

                {isBloqueada && (
                  <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <Lock className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-700 dark:text-orange-400">
                        Tarefa bloqueada
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Aguardando conclusão de dependências
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Data Prevista
                  </p>
                  <p className="font-medium">{formatDate(tarefa.data_prevista)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Responsável
                  </p>
                  {tarefa.responsavel ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(tarefa.responsavel.nome_completo)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {tarefa.responsavel.nome_completo}
                      </span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Não atribuído</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dependências */}
        {dependencias.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Dependências ({dependencias.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dependencias.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="font-medium">{dep.nome}</span>
                    <Badge
                      variant="outline"
                      className={
                        dep.status === "concluida"
                          ? "text-green-500"
                          : "text-gray-500"
                      }
                    >
                      {dep.status === "concluida" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Concluída
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Descrição */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📝 Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={descricaoLocal}
              onChange={(e) => setDescricaoLocal(e.target.value)}
              placeholder="Adicione uma descrição detalhada da tarefa..."
              className="min-h-[120px] resize-none"
            />
            {descricaoLocal !== (tarefa.descricao || "") && (
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDescricaoLocal(tarefa.descricao || "")}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveDescricao}
                  disabled={salvandoDescricao}
                >
                  {salvandoDescricao ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        {tarefa.tags && tarefa.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🏷️ Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tarefa.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anexos */}
        <AnexosUpload
          tarefaId={tarefa.id}
          anexos={anexos}
          onUploadSuccess={onRefresh}
        />
      </div>

      {/* Edit Dialog */}
      {editando && (
        <EditarTarefaDialog
          tarefa={tarefa}
          users={users}
          tarefasSubetapa={tarefasSubetapa}
          open={editando}
          onOpenChange={setEditando}
          onSuccess={() => {
            setEditando(false);
            onRefresh();
          }}
          onDelete={() => {
            router.push("/tarefas");
          }}
        />
      )}
    </>
  );
}
