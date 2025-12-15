import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadForm } from "@/components/features/documentos/upload-form";

export default async function UploadPage() {
  const supabase = await createClient();

  const { data: etapas } = await supabase
    .from("etapas")
    .select("id, nome")
    .order("ordem");

  return (
    <div className="space-y-6 animate-in-up max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload de Documento</h1>
        <p className="text-muted-foreground">
          Envie fotos, plantas, contratos ou outros documentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione os arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadForm etapas={etapas || []} />
        </CardContent>
      </Card>
    </div>
  );
}

