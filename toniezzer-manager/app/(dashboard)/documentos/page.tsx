import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Plus, FileImage, File, FileText, Upload, Image, FolderOpen } from 'lucide-react'
import Link from 'next/link'

const tipoConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  foto: { label: 'Foto', icon: Image, color: 'bg-blue-500' },
  planta: { label: 'Planta', icon: FileImage, color: 'bg-green-500' },
  contrato: { label: 'Contrato', icon: FileText, color: 'bg-purple-500' },
  nota_fiscal: { label: 'Nota Fiscal', icon: File, color: 'bg-yellow-500' },
  outro: { label: 'Outro', icon: File, color: 'bg-gray-500' },
}

export default async function DocumentosPage() {
  const supabase = createClient()

  // Buscar documentos recentes
  const { data: documentos } = await supabase
    .from('documentos')
    .select(`
      *,
      etapa:etapas(nome),
      criador:users!documentos_created_by_fkey(nome_completo)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  // Contar por tipo
  const { data: countByType } = await supabase
    .from('documentos')
    .select('tipo')

  const tipoCounts = countByType?.reduce((acc, doc) => {
    acc[doc.tipo] = (acc[doc.tipo] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const totalDocumentos = countByType?.length || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">
            Fotos, plantas, contratos e notas fiscais
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/documentos/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de resumo por tipo */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(tipoConfig).map(([tipo, config]) => {
          const Icon = config.icon
          const count = tipoCounts[tipo] || 0
          
          return (
            <Card key={tipo} className="hover:shadow-md transition-shadow">
              <Link href={`/documentos?tipo=${tipo}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>

      {/* Atalhos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/documentos/fotos">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Galeria de Fotos</CardTitle>
              </div>
              <CardDescription>Fotos de progresso da obra</CardDescription>
            </CardHeader>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/documentos/plantas">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Plantas</CardTitle>
              </div>
              <CardDescription>Plantas e projetos tecnicos</CardDescription>
            </CardHeader>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/documentos/contratos">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Contratos</CardTitle>
              </div>
              <CardDescription>Contratos e documentos legais</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Lista de documentos recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Recentes</CardTitle>
          <CardDescription>
            Ultimos {documentos?.length || 0} documentos adicionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!documentos || documentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum documento cadastrado.</p>
              <Button asChild className="mt-4">
                <Link href="/documentos/upload">Fazer primeiro upload</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {documentos.map((doc) => {
                const config = tipoConfig[doc.tipo] || tipoConfig.outro
                const Icon = config.icon

                return (
                  <div 
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.nome}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{config.label}</Badge>
                        {doc.etapa && <span>• {doc.etapa.nome}</span>}
                        <span>• {formatDate(doc.created_at)}</span>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        Ver
                      </a>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

