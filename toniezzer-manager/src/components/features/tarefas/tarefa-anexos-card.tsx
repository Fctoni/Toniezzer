import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Paperclip,
  Download,
  Upload,
  X,
  Loader2,
} from "lucide-react";

interface Anexo {
  id: string;
  nome_original: string;
  tipo_arquivo: string | null;
  tamanho_bytes: number | null;
  storage_path: string;
  created_at: string | null;
  created_by_nome: string | null;
}

interface TarefaAnexosCardProps {
  anexos: Anexo[];
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: (anexo: Anexo) => void;
  onDelete: (anexoId: string, storagePath: string) => void;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "\u2014";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TarefaAnexosCard({
  anexos,
  uploading,
  onUpload,
  onDownload,
  onDelete,
}: TarefaAnexosCardProps) {
  return (
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
                    {anexo.created_by_nome && ` \u2022 ${anexo.created_by_nome}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDownload(anexo)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onDelete(anexo.id, anexo.storage_path)}
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
            onChange={onUpload}
            disabled={uploading}
          />
        </label>
      </CardContent>
    </Card>
  );
}
