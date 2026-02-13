'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/types/database'
import { buscarFornecedores, desativarFornecedor } from '@/lib/services/fornecedores'
import { FornecedorForm } from '@/components/features/fornecedores/fornecedor-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Users,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Wrench,
  Package,
} from 'lucide-react'

const gridCols =
  'grid-cols-[minmax(180px,1fr)_130px_150px_140px_180px_100px]'

interface FornecedoresPageClientProps {
  initialFornecedores: Tables<'fornecedores'>[]
}

export function FornecedoresPageClient({ initialFornecedores }: FornecedoresPageClientProps) {
  const [fornecedores, setFornecedores] = useState(initialFornecedores)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [editingFornecedor, setEditingFornecedor] = useState<Tables<'fornecedores'> | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const refetch = useCallback(async () => {
    try {
      const supabase = createClient()
      const filtros: { tipo?: string; search?: string } = {}

      if (tipoFilter !== 'all') {
        filtros.tipo = tipoFilter
      }
      if (search) {
        filtros.search = search
      }

      const data = await buscarFornecedores(supabase, filtros)
      setFornecedores(data)
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error)
    }
  }, [search, tipoFilter])

  useEffect(() => {
    refetch()
  }, [refetch])

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient()
      await desativarFornecedor(supabase, id)
      toast.success('Fornecedor excluído!')
      refetch()
    } catch {
      toast.error('Erro ao excluir fornecedor')
    }
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setEditingFornecedor(null)
    refetch()
  }

  const totalFornecedores = fornecedores.length
  const prestadores = fornecedores.filter(
    (f) => f.tipo === 'prestador_servico'
  ).length
  const materiais = fornecedores.filter(
    (f) => f.tipo === 'fornecedor_material'
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Fornecedores
          </h1>
          <p className="text-muted-foreground">
            Gerencie fornecedores e prestadores de serviço
          </p>
        </div>
        <Button asChild>
          <Link href="/fornecedores/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-2xl font-bold">{totalFornecedores}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-600">{prestadores}</p>
          <p className="text-sm text-amber-600/70">Prestadores</p>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-600">{materiais}</p>
          <p className="text-sm text-blue-600/70">Fornecedores</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="fornecedor_material">
              Fornecedor de Material
            </SelectItem>
            <SelectItem value="prestador_servico">
              Prestador de Serviço
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {fornecedores.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Nenhum fornecedor encontrado</p>
          <p className="text-sm mb-4">
            {search || tipoFilter !== 'all'
              ? 'Tente ajustar os filtros'
              : 'Cadastre seu primeiro fornecedor'}
          </p>
          {!search && tipoFilter === 'all' && (
            <Button asChild>
              <Link href="/fornecedores/novo">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Fornecedor
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div
            className={cn(
              'grid items-center bg-muted/50 border-b text-sm font-medium text-muted-foreground',
              gridCols
            )}
          >
            <div className="p-2 pl-3">Nome</div>
            <div className="p-2">Tipo</div>
            <div className="p-2">Especialidade</div>
            <div className="p-2">Telefone</div>
            <div className="p-2">Email</div>
            <div className="p-2 text-center">Ações</div>
          </div>

          {/* Rows */}
          {fornecedores.map((fornecedor) => {
            const isPrestador = fornecedor.tipo === 'prestador_servico'

            return (
              <div
                key={fornecedor.id}
                className={cn(
                  'grid items-center border-b last:border-b-0 text-sm hover:bg-muted/30 transition-colors',
                  gridCols
                )}
              >
                {/* Nome */}
                <div className="p-2 pl-3 flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      'h-7 w-7 rounded flex items-center justify-center shrink-0',
                      isPrestador
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-blue-500/10 text-blue-600'
                    )}
                  >
                    {isPrestador ? (
                      <Wrench className="h-3.5 w-3.5" />
                    ) : (
                      <Package className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="font-medium truncate">{fornecedor.nome}</span>
                </div>

                {/* Tipo */}
                <div className="p-2">
                  <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                    {isPrestador ? 'Prestador' : 'Fornecedor'}
                  </Badge>
                </div>

                {/* Especialidade */}
                <div className="p-2 text-muted-foreground truncate">
                  {fornecedor.especialidade || '—'}
                </div>

                {/* Telefone */}
                <div className="p-2 text-muted-foreground truncate">
                  {fornecedor.telefone || '—'}
                </div>

                {/* Email */}
                <div className="p-2 text-muted-foreground truncate">
                  {fornecedor.email || '—'}
                </div>

                {/* Ações */}
                <div className="p-2 flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    asChild
                  >
                    <Link href={`/fornecedores/${fornecedor.id}`}>
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingFornecedor(fornecedor)
                      setEditDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o fornecedor &quot;{fornecedor.nome}&quot;?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(fornecedor.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) setEditingFornecedor(null)
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
          </DialogHeader>
          {editingFornecedor && (
            <FornecedorForm
              fornecedor={editingFornecedor}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
