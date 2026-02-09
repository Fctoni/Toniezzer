"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { atualizarTarefa, deletarTarefa } from "@/lib/services/tarefas";
import { uploadAnexo, downloadAnexo as downloadAnexoService, deletarAnexo } from "@/lib/services/tarefas-anexos";
import { criarComentario } from "@/lib/services/tarefas-comentarios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Flag,
  Calendar,
  User,
  Layers,
  FileText,
  Tag,
  Paperclip,
  MessageSquare,
  Trash2,
  Upload,
  Download,
  X,
  Send,
  Loader2,
  Check,
  Circle,
  Play,
  Pause,
  AlertTriangle,
} from "lucide-react";
import { cn, formatDateToString } from "@/lib/utils";
import Link from "next/link";

interface TarefaFull {
  id: string;
  subetapa_id: string;
  nome: string;
  descricao: string | null;
  status: string;
  data_prevista: string | null;
  data_inicio_real: string | null;
  data_conclusao_real: string | null;
  prioridade: string | null;
  responsavel_id: string | null;
  tags: string[] | null;
  notas: string | null;
  ordem: number;
}

interface Dependencia {
  id: string;
  depende_de_tarefa_id: string;
  tarefa_nome: string;
  tarefa_status: string;
}

interface Anexo {
  id: string;
  nome_original: string;
  tipo_arquivo: string | null;
  tamanho_bytes: number | null;
  storage_path: string;
  created_at: string | null;
  created_by_nome: string | null;
}

interface Comentario {
  id: string;
  conteudo: string;
  created_at: string | null;
  created_by_nome: string | null;
}

interface UserOption {
  id: string;
  nome_completo: string;
}

interface TarefaDetalhesProps {
  tarefa: TarefaFull;
  etapaNome: string;
  subetapaNome: string;
  dependencias: Dependencia[];
  anexos: Anexo[];
  comentarios: Comentario[];
  users: UserOption[];
  currentUserId: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  pendente: { label: "Pendente", color: "text-muted-foreground", icon: Circle },
  em_andamento: { label: "Em Andamento", color: "text-blue-500", icon: Play },
  concluida: { label: "Concluída", color: "text-green-500", icon: Check },
  bloqueada: { label: "Bloqueada", color: "text-orange-500", icon: Pause },
  cancelada: { label: "Cancelada", color: "text-red-500", icon: AlertTriangle },
};

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "text-blue-400" },
  media: { label: "Média", color: "text-yellow-500" },
  alta: { label: "Alta", color: "text-orange-500" },
  critica: { label: "Crítica", color: "text-red-500" },
};

export function TarefaDetalhes({
  tarefa: initialTarefa,
  etapaNome,
  subetapaNome,
  dependencias,
  anexos: initialAnexos,
  comentarios: initialComentarios,
  users,
  currentUserId,
}: TarefaDetalhesProps) {
  const router = useRouter();
  const [tarefa, setTarefa] = useState(initialTarefa);
  const [anexos, setAnexos] = useState(initialAnexos);
  const [comentarios, setComentarios] = useState(initialComentarios);
  const [novoComentario, setNovoComentario] = useState("");
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sConfig = statusConfig[tarefa.status] || statusConfig.pendente;
  const pConfig = tarefa.prioridade ? prioridadeConfig[tarefa.prioridade] : null;

  const updateField = async (field: string, value: unknown) => {
    setSaving(true);
    try {
      const supabase = createClient();
      await atualizarTarefa(supabase, tarefa.id, { [field]: value });

      setTarefa((prev) => ({ ...prev, [field]: value }));
      toast.success("Salvo!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    const updatedTags = [...(tarefa.tags || []), newTag.trim()];
    updateField("tags", updatedTags);
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    const updatedTags = (tarefa.tags || []).filter((t) => t !== tag);
    updateField("tags", updatedTags);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    setUploading(true);
    try {
      const supabase = createClient();
      await uploadAnexo(supabase, tarefa.id, file, currentUserId);

      toast.success("Arquivo enviado!");
      router.refresh();
    } catch {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadAnexo = async (anexo: Anexo) => {
    try {
      const supabase = createClient();
      const data = await downloadAnexoService(supabase, anexo.storage_path);

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = anexo.nome_original;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar arquivo");
    }
  };

  const deleteAnexo = async (anexoId: string, storagePath: string) => {
    try {
      const supabase = createClient();
      await deletarAnexo(supabase, anexoId, storagePath);

      setAnexos((prev) => prev.filter((a) => a.id !== anexoId));
      toast.success("Anexo removido!");
    } catch {
      toast.error("Erro ao remover anexo");
    }
  };

  const submitComentario = async () => {
    if (!novoComentario.trim() || !currentUserId) return;

    setSubmittingComment(true);
    try {
      const supabase = createClient();
      await criarComentario(supabase, tarefa.id, novoComentario.trim(), currentUserId);

      setNovoComentario("");
      toast.success("Comentário adicionado!");
      router.refresh();
    } catch {
      toast.error("Erro ao adicionar comentário");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      await deletarTarefa(supabase, tarefa.id);

      toast.success("Tarefa excluída!");
      router.push("/tarefas");
    } catch {
      toast.error("Erro ao excluir tarefa");
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getInitials = (nome: string) =>
    nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const depsPendentes = dependencias.filter(
    (d) => d.tarefa_status !== "concluida"
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tarefas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{tarefa.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {etapaNome} / {subetapaNome}
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteAlert(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Info Básica + Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Select
                value={tarefa.status}
                onValueChange={(v) => updateField("status", v)}
                disabled={saving}
              >
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="bloqueada">Bloqueada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prioridade</span>
              <Select
                value={tarefa.prioridade || "media"}
                onValueChange={(v) => updateField("prioridade", v)}
                disabled={saving}
              >
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Responsável */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Responsável</span>
              <Select
                value={tarefa.responsavel_id || "nenhum"}
                onValueChange={(v) =>
                  updateField("responsavel_id", v === "nenhum" ? null : v)
                }
                disabled={saving}
              >
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prazo</span>
              <span className="text-sm font-medium">
                {tarefa.data_prevista
                  ? new Date(
                      tarefa.data_prevista + "T12:00:00"
                    ).toLocaleDateString("pt-BR")
                  : "Não definido"}
              </span>
            </div>

            {/* Data Início Real */}
            {tarefa.data_inicio_real && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Início Real
                </span>
                <span className="text-sm">
                  {new Date(tarefa.data_inicio_real).toLocaleDateString(
                    "pt-BR"
                  )}
                </span>
              </div>
            )}

            {/* Data Conclusão Real */}
            {tarefa.data_conclusao_real && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Concluída em
                </span>
                <span className="text-sm text-green-500">
                  {new Date(tarefa.data_conclusao_real).toLocaleDateString(
                    "pt-BR"
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dependências */}
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
      </div>

      {/* Descrição */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Descrição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={tarefa.descricao || ""}
            onChange={(e) =>
              setTarefa((prev) => ({ ...prev, descricao: e.target.value }))
            }
            onBlur={() => updateField("descricao", tarefa.descricao || null)}
            placeholder="Adicione uma descrição..."
            className="resize-none min-h-[80px]"
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {(tarefa.tags || []).map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nova tag..."
              className="h-8"
              onKeyDown={(e) => e.key === "Enter" && addTag()}
            />
            <Button size="sm" variant="outline" onClick={addTag}>
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Anexos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Anexos ({anexos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {anexos.length > 0 && (
            <div className="space-y-2 mb-3">
              {anexos.map((anexo) => (
                <div
                  key={anexo.id}
                  className="flex items-center gap-3 p-2 rounded-lg border"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {anexo.nome_original}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(anexo.tamanho_bytes)}
                      {anexo.created_by_nome && ` • ${anexo.created_by_nome}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDownloadAnexo(anexo)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteAnexo(anexo.id, anexo.storage_path)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <label className="inline-flex">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              asChild
            >
              <span>
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Enviando..." : "Upload"}
              </span>
            </Button>
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </CardContent>
      </Card>

      {/* Comentários */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comentários ({comentarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comentarios.length > 0 && (
            <div className="space-y-3 mb-4">
              {comentarios.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {c.created_by_nome
                        ? getInitials(c.created_by_nome)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {c.created_by_nome || "Usuário"}
                      </span>
                      {c.created_at && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("pt-BR")}{" "}
                          {new Date(c.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5">{c.conteudo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Adicionar comentário..."
              className="resize-none h-20"
            />
            <Button
              size="icon"
              className="shrink-0 self-end"
              onClick={submitComentario}
              disabled={submittingComment || !novoComentario.trim()}
            >
              {submittingComment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tarefa{" "}
              <strong>{tarefa.nome}</strong> e todos os seus anexos e
              comentários serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
