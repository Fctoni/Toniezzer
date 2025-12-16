'use client'

import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Mail, Phone, Briefcase, Shield, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PerfilPage() {
  const { authUser, currentUser, loading } = useCurrentUser()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadge = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Administrador</Badge>
      case 'editor':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Editor</Badge>
      case 'viewer':
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">Visualizador</Badge>
      default:
        return <Badge variant="outline">Sem role</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Visualize suas informacoes de conta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card Principal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informacoes Pessoais</CardTitle>
            <CardDescription>
              Dados do seu perfil no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {currentUser?.nome_completo ? getInitials(currentUser.nome_completo) : '??'}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-4 flex-1">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {currentUser?.nome_completo || 'Usuario'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(currentUser?.role)}
                    {currentUser?.ativo ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{currentUser?.email || authUser?.email || 'Sem email'}</span>
                  </div>
                  
                  {currentUser?.telefone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{currentUser.telefone}</span>
                    </div>
                  )}
                  
                  {currentUser?.especialidade && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{currentUser.especialidade}</span>
                    </div>
                  )}
                  
                  {currentUser?.created_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Membro ha {formatDistanceToNow(new Date(currentUser.created_at), { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Autenticacao */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Autenticacao
            </CardTitle>
            <CardDescription>
              Informacoes da sua conta de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email de login</span>
              <span className="text-sm font-medium">{authUser?.email || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ultimo acesso</span>
              <span className="text-sm font-medium">
                {authUser?.last_sign_in_at 
                  ? formatDistanceToNow(new Date(authUser.last_sign_in_at), { addSuffix: true, locale: ptBR })
                  : '-'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Provedor</span>
              <span className="text-sm font-medium">
                {authUser?.app_metadata?.provider || 'email'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card de Permissoes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Permissoes
            </CardTitle>
            <CardDescription>
              Nivel de acesso no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Role</span>
              {getRoleBadge(currentUser?.role)}
            </div>
            <div className="pt-2 text-xs text-muted-foreground">
              {currentUser?.role === 'admin' && (
                <p>Voce tem acesso total ao sistema, incluindo gerenciamento de usuarios e configuracoes.</p>
              )}
              {currentUser?.role === 'editor' && (
                <p>Voce pode criar e editar dados no sistema, mas nao pode gerenciar usuarios.</p>
              )}
              {currentUser?.role === 'viewer' && (
                <p>Voce tem acesso somente leitura ao sistema.</p>
              )}
              {!currentUser?.role && (
                <p>Seu perfil ainda nao foi configurado com um nivel de acesso.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
