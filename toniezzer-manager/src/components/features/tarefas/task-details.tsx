"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateTask, deleteTask } from "@/lib/services/tarefas";
import { uploadAttachment, downloadAttachment as downloadAttachmentService, deleteAttachment } from "@/lib/services/tarefas-anexos";
import { createComment } from "@/lib/services/tarefas-comentarios";
import { Button } from "@/components/ui/button";
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
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { TarefaInfoCard } from "@/components/features/tarefas/tarefa-info-card";
import { TarefaDependenciasCard } from "@/components/features/tarefas/tarefa-dependencias-card";
import { TarefaAnexosCard } from "@/components/features/tarefas/tarefa-anexos-card";
import { TarefaComentariosCard } from "@/components/features/tarefas/tarefa-comentarios-card";
import { TarefaDescricaoCard } from "@/components/features/tarefas/tarefa-descricao-card";
import { TarefaTagsCard } from "@/components/features/tarefas/tarefa-tags-card";

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

interface TaskDetailsProps {
  tarefa: TarefaFull;
  etapaNome: string;
  subetapaNome: string;
  dependencias: Dependencia[];
  anexos: Anexo[];
  comentarios: Comentario[];
  users: UserOption[];
  currentUserId: string | null;
}

export function TaskDetails({
  tarefa: initialTarefa,
  etapaNome,
  subetapaNome,
  dependencias,
  anexos: initialAnexos,
  comentarios: initialComentarios,
  users,
  currentUserId,
}: TaskDetailsProps) {
  const router = useRouter();
  const [tarefa, setTarefa] = useState(initialTarefa);
  const [anexos, setAnexos] = useState(initialAnexos);
  const [comentarios, setComentarios] = useState(initialComentarios);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updateField = async (field: string, value: unknown) => {
    setSaving(true);
    try {
      const supabase = createClient();
      await updateTask(supabase, tarefa.id, { [field]: value });

      setTarefa((prev) => ({ ...prev, [field]: value }));
      toast.success("Salvo!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tag: string) => {
    const updatedTags = [...(tarefa.tags || []), tag];
    updateField("tags", updatedTags);
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
      await uploadAttachment(supabase, tarefa.id, file, currentUserId);

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
      const data = await downloadAttachmentService(supabase, anexo.storage_path);

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

  const handleDeleteAnexo = async (anexoId: string, storagePath: string) => {
    try {
      const supabase = createClient();
      await deleteAttachment(supabase, anexoId, storagePath);

      setAnexos((prev) => prev.filter((a) => a.id !== anexoId));
      toast.success("Anexo removido!");
    } catch {
      toast.error("Erro ao remover anexo");
    }
  };

  const handleSubmitComentario = async (conteudo: string) => {
    if (!currentUserId) return;

    setSubmittingComment(true);
    try {
      const supabase = createClient();
      await createComment(supabase, tarefa.id, conteudo, currentUserId);

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
      await deleteTask(supabase, tarefa.id);

      toast.success("Tarefa excluída!");
      router.push("/tarefas");
    } catch {
      toast.error("Erro ao excluir tarefa");
    } finally {
      setDeleting(false);
    }
  };

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
        <TarefaInfoCard
          tarefa={tarefa}
          users={users}
          saving={saving}
          updateField={updateField}
        />

        <TarefaDependenciasCard dependencias={dependencias} />
      </div>

      <TarefaDescricaoCard
        descricao={tarefa.descricao}
        onUpdate={(value) => updateField("descricao", value)}
      />

      <TarefaTagsCard
        tags={tarefa.tags || []}
        onAddTag={addTag}
        onRemoveTag={removeTag}
      />

      <TarefaAnexosCard
        anexos={anexos}
        uploading={uploading}
        onUpload={handleUpload}
        onDownload={handleDownloadAnexo}
        onDelete={handleDeleteAnexo}
      />

      <TarefaComentariosCard
        comentarios={comentarios}
        submittingComment={submittingComment}
        onSubmitComentario={handleSubmitComentario}
      />

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
