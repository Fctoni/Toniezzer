"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { criarDocumento } from "@/lib/services/documentos";
import { buscarPrimeiroUsuario } from "@/lib/services/users";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, X, File, Image, Loader2, Plus, Tag, Camera } from "lucide-react";
import { CameraCapture } from "@/components/features/ocr/camera-capture";

interface Etapa {
  id: string;
  nome: string;
}

interface UploadFormProps {
  etapas: Etapa[];
}

interface FileWithPreview {
  file: File;
  preview?: string;
  progress: number;
  uploaded: boolean;
}

export function UploadForm({ etapas }: UploadFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [tipo, setTipo] = useState<string>("foto");
  const [etapaId, setEtapaId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [showCamera, setShowCamera] = useState(false);

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleCameraCapture = (file: File) => {
    const fileWithPreview: FileWithPreview = {
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
    };
    setFiles((prev) => [...prev, fileWithPreview]);
    setShowCamera(false);
    toast.success("Foto capturada com sucesso!");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const filesWithPreview: FileWithPreview[] = newFiles.map((file) => ({
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
      progress: 0,
      uploaded: false,
    }));
    setFiles((prev) => [...prev, ...filesWithPreview]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();

    // Buscar usuário padrão
    let userId: string | undefined;
    try {
      const user = await buscarPrimeiroUsuario(supabase);
      userId = user.id;
    } catch {
      // ignora erro se não encontrar usuário
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        const file = fileData.file;
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const bucket = tipo === "foto" ? "fotos-obra" : "documentos-privados";

        // Upload para o Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        // Salvar no banco
        await criarDocumento(supabase, {
          nome: file.name,
          tipo: tipo,
          url: urlData.publicUrl,
          tamanho_bytes: file.size,
          mime_type: file.type,
          etapa_relacionada_id: etapaId || null,
          created_by: userId,
          tags: tags.length > 0 ? tags : null,
        });

        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i].uploaded = true;
          return newFiles;
        });
      }

      toast.success(
        `${files.length} arquivo(s) enviado(s) com sucesso!`
      );
      router.push("/documentos");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      {/* Tipo e Etapa */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de Documento</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="foto">Foto</SelectItem>
              <SelectItem value="planta">Planta</SelectItem>
              <SelectItem value="contrato">Contrato</SelectItem>
              <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Etapa Relacionada</Label>
          <Select value={etapaId} onValueChange={setEtapaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {etapas.map((etapa) => (
                <SelectItem key={etapa.id} value={etapa.id}>
                  {etapa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags (opcional)
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Digite uma tag e pressione Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={addTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Ex: fachada, fundacao, acabamento, antes, depois
        </p>
      </div>

      {/* Camera Capture */}
      {showCamera ? (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
        />
      ) : (
        <>
          {/* Botoes de captura */}
          {tipo === "foto" && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="h-6 w-6" />
                <span>Tirar Foto</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload className="h-6 w-6" />
                <span>Selecionar Arquivo</span>
              </Button>
            </div>
          )}

          {/* Dropzone */}
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Suporta imagens, PDFs e outros documentos
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept={
                tipo === "foto"
                  ? "image/*"
                  : ".pdf,.doc,.docx,.xls,.xlsx,.dwg,.png,.jpg,.jpeg"
              }
            />
          </div>
        </>
      )}

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Arquivos selecionados ({files.length})</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((fileData, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                {fileData.preview ? (
                  <img
                    src={fileData.preview}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  getFileIcon(fileData.file)
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(fileData.file.size)}
                  </p>
                  {isUploading && !fileData.uploaded && (
                    <Progress value={fileData.progress} className="h-1 mt-1" />
                  )}
                </div>
                {fileData.uploaded ? (
                  <span className="text-xs text-green-500">✓ Enviado</span>
                ) : (
                  !isUploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isUploading}
        >
          Cancelar
        </Button>
        <Button onClick={handleUpload} disabled={isUploading || files.length === 0}>
          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploading ? "Enviando..." : `Enviar ${files.length} arquivo(s)`}
        </Button>
      </div>
    </div>
  );
}

