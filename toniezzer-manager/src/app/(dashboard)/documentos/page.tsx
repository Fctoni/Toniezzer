import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { GaleriaFotos } from "@/components/features/documentos/galeria-fotos";

export default async function DocumentosPage() {
  const supabase = await createClient();

  const [{ data: documentos }, { data: etapas }] = await Promise.all([
    supabase
      .from("documentos")
      .select("*, etapas(nome)")
      .order("created_at", { ascending: false }),
    supabase.from("etapas").select("id, nome").order("ordem"),
  ]);

  const fotos = documentos?.filter((d) => d.tipo === "foto") || [];
  const plantas = documentos?.filter((d) => d.tipo === "planta") || [];
  const contratos = documentos?.filter((d) => d.tipo === "contrato") || [];
  const notasFiscais = documentos?.filter((d) => d.tipo === "nota_fiscal") || [];
  const outros = documentos?.filter((d) => d.tipo === "outro") || [];

  return (
    <div className="space-y-6 animate-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">
            Galeria de fotos, plantas e documentos da obra
          </p>
        </div>
        <Button asChild>
          <Link href="/documentos/upload">
            <Upload className="mr-2 h-4 w-4" />
            Fazer Upload
          </Link>
        </Button>
      </div>

      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fotos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fotos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plantas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plantas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contratos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notas Fiscais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notasFiscais.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="fotos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fotos" className="gap-2">
            <Image className="h-4 w-4" />
            Fotos
          </TabsTrigger>
          <TabsTrigger value="plantas" className="gap-2">
            <FileText className="h-4 w-4" />
            Plantas
          </TabsTrigger>
          <TabsTrigger value="contratos" className="gap-2">
            <FileText className="h-4 w-4" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="nf" className="gap-2">
            <FileText className="h-4 w-4" />
            Notas Fiscais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fotos">
          <Card>
            <CardHeader>
              <CardTitle>Galeria de Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <GaleriaFotos fotos={fotos} etapas={etapas || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plantas">
          <Card>
            <CardHeader>
              <CardTitle>Plantas e Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <ListaDocumentos documentos={plantas} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contratos">
          <Card>
            <CardHeader>
              <CardTitle>Contratos</CardTitle>
            </CardHeader>
            <CardContent>
              <ListaDocumentos documentos={contratos} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nf">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais</CardTitle>
            </CardHeader>
            <CardContent>
              <ListaDocumentos documentos={notasFiscais} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ListaDocumentos({
  documentos,
}: {
  documentos: Array<{
    id: string;
    nome: string;
    url: string;
    created_at: string;
    etapas: { nome: string } | null;
  }>;
}) {
  if (documentos.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhum documento encontrado
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documentos.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{doc.nome}</p>
              <p className="text-xs text-muted-foreground">
                {doc.etapas?.nome || "Sem etapa"} •{" "}
                {new Date(doc.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              Abrir
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}

