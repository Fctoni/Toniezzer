import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, DollarSign, Calendar, FileText } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Ola, {profile?.nome_completo || 'Usuario'}!
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Toniezzer Manager. Acompanhe sua obra em tempo real.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Orcamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 5.000.000</div>
            <p className="text-xs text-muted-foreground">
              Configurar em Financeiro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gasto Realizado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0</div>
            <p className="text-xs text-muted-foreground">
              0% do orcamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Etapas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 / 0</div>
            <p className="text-xs text-muted-foreground">
              Nenhuma etapa cadastrada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Documentos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Fotos e documentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Bem-vindo ao Sistema</CardTitle>
              <CardDescription>
                Sistema em fase de implementacao
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            O Toniezzer Manager esta sendo construido. Os modulos abaixo serao liberados conforme a implementacao:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Autenticacao e Login (Implementado)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>Gestao Financeira (Em desenvolvimento)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>Cronograma de Etapas (Em desenvolvimento)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
              <span>Documentacao Visual (Pendente)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
              <span>Comunicacao e Feed (Pendente)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

