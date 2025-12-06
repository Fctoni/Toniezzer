import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, FolderTree, Users, Database, Bell } from 'lucide-react'
import Link from 'next/link'

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Verificar se e admin
  const { data: profile } = await supabase
    .from('users')
    .select('perfil')
    .eq('id', user?.id)
    .single()
    
  if (profile?.perfil !== 'admin_sistema') {
    redirect('/dashboard')
  }

  const menuItems = [
    {
      title: 'Categorias de Gastos',
      description: 'Gerenciar categorias e subcategorias',
      href: '/configuracoes/categorias',
      icon: FolderTree,
    },
    {
      title: 'Usuarios',
      description: 'Gerenciar usuarios e permissoes',
      href: '/configuracoes/usuarios',
      icon: Users,
    },
    {
      title: 'Dados Iniciais',
      description: 'Configurar orcamento total e datas da obra',
      href: '/configuracoes/dados',
      icon: Database,
    },
    {
      title: 'Notificacoes',
      description: 'Configurar alertas e notificacoes',
      href: '/configuracoes/notificacoes',
      icon: Bell,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracoes</h1>
        <p className="text-muted-foreground">
          Gerencie as configuracoes do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.href} className="hover:shadow-md transition-shadow">
              <Link href={item.href}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Link>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

