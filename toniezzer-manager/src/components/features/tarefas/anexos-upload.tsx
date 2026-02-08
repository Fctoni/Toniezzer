"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Upload, FileIcon, Download, Trash2, Loader2 } from "lucide-react";

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

interface AnexosUploadProps {
  tarefaId: string;
  anexos: Anexo[];
  onUploadSuccess: () => void;
}

export function AnexosUpload({
  tarefaId,
  anexos,
  onUploadSuccess,
}: AnexosUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [anexoToDelete, setAnexoToDelete] = useState<Anexo | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 10MB");
      return;
    }

    setUploading(true);
    const supabase = createClient();

    try {
      // Obter ID do usuário atual
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Gerar nome único para o arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${tarefaId}/${fileName}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("tarefas-anexos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Inserir registro na tabela
      const { error: dbError } = await supabase.from("tarefas_anexos").insert({
        tarefa_id: tarefaId,
        nome_arquivo: fileName,
        nome_original: file.name,
        tipo_arquivo: file.type || "application/octet-stream",
        tamanho_bytes: file.size,
        storage_path: filePath,
        created_by: user.id,
      });

      if (dbError) {
        // Se falhar no DB, remover do storage
        await supabase.storage.from("tarefas-anexos").remove([filePath]);
        throw dbError;
      }

      toast.success("Anexo enviado!");
      onUploadSuccess();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar anexo");
    } finally {
      setUploading(false);
      // Limpar input
      event.target.value = "";
    }
  };

  const handleDownload = async (anexo: Anexo) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.storage
        .from("tarefas-anexos")
        .download(anexo.storage_path);

      if (error) throw error;

      // Criar URL temporária e fazer download
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = anexo.nome_original;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      toast.error("Erro ao baixar anexo");
    }
  };

  const confirmDelete = async () => {
    if (!anexoToDelete) return;

    setDeleting(anexoToDelete.id);
    const supabase = createClient();

    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from("tarefas-anexos")
        .remove([anexoToDelete.storage_path]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error: dbError } = await supabase
        .from("tarefas_anexos")
        .delete()
        .eq("id", anexoToDelete.id);

      if (dbError) throw dbError;

      toast.success("Anexo excluído!");
      setAnexoToDelete(null);
      onUploadSuccess();
    } catch (error) {
      console.error("Erro ao excluir anexo:", error);
      toast.error("Erro ao excluir anexo");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              📎 Anexos ({anexos.length})
            </CardTitle>
            <label htmlFor="file-upload">
              <Button size="sm" disabled={uploading} asChild>
                <span className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? "Enviando..." : "Upload"}
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>
        </CardHeader>

        <CardContent>
          {anexos.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum anexo enviado</p>
              <p className="text-sm mt-1">
                Limite de 10MB por arquivo
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {anexos.map((anexo) => (
                <div
                  key={anexo.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{anexo.nome_original}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(anexo.tamanho_bytes)} •{" "}
                        {new Date(anexo.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(anexo)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setAnexoToDelete(anexo)}
                      disabled={deleting === anexo.id}
                    >
                      {deleting === anexo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!anexoToDelete}
        onOpenChange={(open) => !open && setAnexoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anexo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O arquivo{" "}
              <strong>{anexoToDelete?.nome_original}</strong> será excluído
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={!!deleting}
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
    </>
  );
}
