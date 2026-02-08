'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  UserX,
  UserCheck,
  Key,
  Loader2,
  Shield,
  ShieldCheck,
  Eye,
} from 'lucide-react'
import { Tables, UserRole } from '@/lib/types/database'

type UserWithRole = Tables<'users'>

export default function UsuariosPage() {
  const { currentUser } = useCurrentUser()
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; user: UserWithRole | null; action: 'deactivate' | 'activate' }>({
    open: false,
    user: null,
    action: 'deactivate'
  })
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; user: UserWithRole | null }>({
    open: false,
    user: null
  })
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome_completo: '',
    role: 'viewer' as UserRole,
    especialidade: '',
    telefone: '',
  })
  const [newPassword, setNewPassword] = useState('')

  const isAdmin = currentUser?.role === 'admin'

  const fetchUsers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('nome_completo')

    if (error) {
      console.error('Erro ao buscar usuarios:', error)
      toast.error('Erro ao carregar usuarios')
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadge = (role: UserRole | undefined) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
      case 'editor':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            <Shield className="h-3 w-3 mr-1" />
            Editor
          </Badge>
        )
      case 'viewer':
        return (
          <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">
            <Eye className="h-3 w-3 mr-1" />
            Viewer
          </Badge>
        )
      default:
        return <Badge variant="outline">Sem role</Badge>
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      nome_completo: '',
      role: 'viewer',
      especialidade: '',
      telefone: '',
    })
    setEditingUser(null)
  }

  const openNewUserDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (user: UserWithRole) => {
    setEditingUser(user)
    setFormData({
      email: user.email || '',
      password: '', // Nao preencher senha ao editar
      nome_completo: user.nome_completo,
      role: (user.role || 'viewer') as UserRole,
      especialidade: user.especialidade || '',
      telefone: user.telefone || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.nome_completo || !formData.role) {
      toast.error('Preencha todos os campos obrigatorios')
      return
    }

    if (!editingUser && (!formData.email || !formData.password)) {
      toast.error('Email e senha sao obrigatorios para novo usuario')
      return
    }

    setSubmitting(true)

    try {
      if (editingUser) {
        // Atualizar usuario existente
        const response = await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            nome_completo: formData.nome_completo,
            role: formData.role,
            especialidade: formData.especialidade || null,
            telefone: formData.telefone || null,
          }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error)

        toast.success('Usuario atualizado com sucesso!')
      } else {
        // Criar novo usuario
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error)

        toast.success('Usuario criado com sucesso!')
      }

      setDialogOpen(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async () => {
    if (!confirmDialog.user) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: confirmDialog.user.id,
          ativo: confirmDialog.action === 'activate',
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success(
        confirmDialog.action === 'activate'
          ? 'Usuario ativado com sucesso!'
          : 'Usuario desativado com sucesso!'
      )
      fetchUsers()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao alterar status do usuario')
    } finally {
      setSubmitting(false)
      setConfirmDialog({ open: false, user: null, action: 'deactivate' })
    }
  }

  const handleChangePassword = async () => {
    if (!passwordDialog.user || !newPassword) {
      toast.error('Digite a nova senha')
      return
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: passwordDialog.user.id,
          nova_senha: newPassword,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Senha alterada com sucesso!')
      setPasswordDialog({ open: false, user: null })
      setNewPassword('')
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao alterar senha')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Acesso Restrito</h3>
          <p className="text-muted-foreground mt-1">
            Apenas administradores podem gerenciar usuarios.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuarios do Sistema</CardTitle>
            <CardDescription>
              Gerencie os usuarios que tem acesso ao sistema
            </CardDescription>
          </div>
          <Button onClick={openNewUserDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={!user.ativo ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.nome_completo)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.nome_completo}</p>
                        {user.especialidade && (
                          <p className="text-xs text-muted-foreground">
                            {user.especialidade}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email || '-'}
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role as UserRole)}</TableCell>
                  <TableCell>
                    {user.ativo ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setPasswordDialog({ open: true, user })}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Alterar Senha
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.ativo ? (
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={() =>
                              setConfirmDialog({ open: true, user, action: 'deactivate' })
                            }
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Desativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-green-500 focus:text-green-500"
                            onClick={() =>
                              setConfirmDialog({ open: true, user, action: 'activate' })
                            }
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Ativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum usuario encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Criar/Editar Usuario */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Novo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Atualize as informacoes do usuario'
                : 'Preencha os dados para criar um novo usuario'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                placeholder="Nome do usuario"
                value={formData.nome_completo}
                onChange={(e) =>
                  setFormData({ ...formData, nome_completo: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Nivel de Acesso *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-red-500" />
                      Administrador - Acesso total
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Editor - Criar e editar
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      Visualizador - Apenas leitura
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input
                id="especialidade"
                placeholder="Ex: Arquiteto, Engenheiro..."
                value={formData.especialidade}
                onChange={(e) =>
                  setFormData({ ...formData, especialidade: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingUser ? 'Salvar' : 'Criar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Alterar Senha */}
      <Dialog
        open={passwordDialog.open}
        onOpenChange={(open) => {
          setPasswordDialog({ open, user: open ? passwordDialog.user : null })
          if (!open) setNewPassword('')
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha para {passwordDialog.user?.nome_completo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialog({ open: false, user: null })}
            >
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmacao de Ativar/Desativar */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ open, user: open ? confirmDialog.user : null, action: confirmDialog.action })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'deactivate'
                ? 'Desativar Usuario'
                : 'Ativar Usuario'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'deactivate'
                ? `Tem certeza que deseja desativar ${confirmDialog.user?.nome_completo}? O usuario nao podera mais acessar o sistema.`
                : `Tem certeza que deseja ativar ${confirmDialog.user?.nome_completo}? O usuario podera acessar o sistema novamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              className={
                confirmDialog.action === 'deactivate'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {confirmDialog.action === 'deactivate' ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
