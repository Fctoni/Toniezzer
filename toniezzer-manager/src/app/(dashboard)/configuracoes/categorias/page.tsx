'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Tags,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  List,
} from 'lucide-react'
import { Tables } from '@/lib/types/database'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Categoria = Tables<'categorias'>
type Subcategoria = Tables<'subcategorias'>

interface CategoriaComSubcategorias extends Categoria {
  subcategorias?: Subcategoria[]
}

const CORES_DISPONIVEIS = [
  { valor: '#ef4444', nome: 'Vermelho' },
  { valor: '#f97316', nome: 'Laranja' },
  { valor: '#f59e0b', nome: 'Amarelo' },
  { valor: '#84cc16', nome: 'Verde Limao' },
  { valor: '#22c55e', nome: 'Verde' },
  { valor: '#14b8a6', nome: 'Teal' },
  { valor: '#06b6d4', nome: 'Ciano' },
  { valor: '#3b82f6', nome: 'Azul' },
  { valor: '#6366f1', nome: 'Indigo' },
  { valor: '#8b5cf6', nome: 'Roxo' },
  { valor: '#a855f7', nome: 'Purpura' },
  { valor: '#ec4899', nome: 'Rosa' },
  { valor: '#64748b', nome: 'Cinza' },
]

const ICONES_DISPONIVEIS = [
  { icone: '🏗️', nome: 'Construcao' },
  { icone: '🔨', nome: 'Ferramentas' },
  { icone: '🧱', nome: 'Material' },
  { icone: '⚡', nome: 'Eletrica' },
  { icone: '💧', nome: 'Hidraulica' },
  { icone: '🎨', nome: 'Pintura' },
  { icone: '🪟', nome: 'Esquadrias' },
  { icone: '🚪', nome: 'Portas' },
  { icone: '🔧', nome: 'Manutencao' },
  { icone: '📦', nome: 'Geral' },
  { icone: '💰', nome: 'Financeiro' },
  { icone: '📄', nome: 'Documentacao' },
]

// Componente de linha sortable
function SortableRow({ 
  categoria, 
  isExpanded, 
  onToggleExpand, 
  onEdit, 
  onToggleActive, 
  onDelete,
  onAddSubcategoria,
  onEditSubcategoria,
  onToggleSubcategoriaActive,
  onDeleteSubcategoria,
  canEdit,
  isAdmin,
}: {
  categoria: CategoriaComSubcategorias
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
  onAddSubcategoria: () => void
  onEditSubcategoria: (sub: Subcategoria) => void
  onToggleSubcategoriaActive: (sub: Subcategoria) => void
  onDeleteSubcategoria: (sub: Subcategoria) => void
  canEdit: boolean
  isAdmin: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoria.id, disabled: !canEdit })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <>
      <TableRow
        ref={setNodeRef}
        style={style}
        className={!categoria.ativo ? 'opacity-50' : ''}
      >
        <TableCell className="w-[30px]">
          {canEdit && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </TableCell>
        <TableCell>
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg text-lg"
              style={{ backgroundColor: `${categoria.cor}20` }}
            >
              {categoria.icone}
            </div>
            <div>
              <p className="font-medium">{categoria.nome}</p>
              {categoria.subcategorias && categoria.subcategorias.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {categoria.subcategorias.length} subcategoria{categoria.subcategorias.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </button>
        </TableCell>
        <TableCell>
          {categoria.ativo ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              Ativo
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
              Inativo
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <>
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddSubcategoria}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Subcategoria
                  </DropdownMenuItem>
                </>
              )}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onToggleActive}>
                    {categoria.ativo ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      
      {isExpanded && categoria.subcategorias && categoria.subcategorias.length > 0 && (
        <TableRow>
          <TableCell colSpan={4} className="bg-muted/30 p-0">
            <div className="py-2 px-12">
              <div className="space-y-1">
                {categoria.subcategorias.map((sub) => (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between py-2 px-4 rounded-md border ${
                      !sub.ativo ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{sub.nome}</span>
                      {!sub.ativo && (
                        <Badge variant="outline" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem onClick={() => onEditSubcategoria(sub)}>
                            <Pencil className="h-3 w-3 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggleSubcategoriaActive(sub)}>
                              {sub.ativo ? (
                                <>
                                  <EyeOff className="h-3 w-3 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500"
                              onClick={() => onDeleteSubcategoria(sub)}
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={onAddSubcategoria}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Adicionar Subcategoria
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default function CategoriasPage() {
  const { currentUser } = useCurrentUser()
  const [categorias, setCategorias] = useState<CategoriaComSubcategorias[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [subcategoriaDialogOpen, setSubcategoriaDialogOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [editingSubcategoria, setEditingSubcategoria] = useState<Subcategoria | null>(null)
  const [parentCategoriaId, setParentCategoriaId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ 
    open: boolean
    item: Categoria | Subcategoria | null
    type: 'categoria' | 'subcategoria'
    usageInfo?: string
  }>({
    open: false,
    item: null,
    type: 'categoria',
  })
  const [submitting, setSubmitting] = useState(false)
  const [expandedCategorias, setExpandedCategorias] = useState<Set<string>>(new Set())

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    cor: CORES_DISPONIVEIS[0].valor,
    icone: ICONES_DISPONIVEIS[0].icone,
  })

  const [subcategoriaFormData, setSubcategoriaFormData] = useState({
    nome: '',
  })

  const isAdmin = currentUser?.role === 'admin'
  const canEdit = isAdmin || currentUser?.role === 'editor'

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchCategorias = async () => {
    const supabase = createClient()
    
    // Buscar categorias
    const { data: categoriasData, error: categoriasError } = await supabase
      .from('categorias')
      .select('*')
      .order('ordem')

    if (categoriasError) {
      console.error('Erro ao buscar categorias:', categoriasError)
      toast.error('Erro ao carregar categorias')
      setLoading(false)
      return
    }

    // Buscar subcategorias
    const { data: subcategoriasData, error: subcategoriasError } = await supabase
      .from('subcategorias')
      .select('*')
      .order('nome')

    if (subcategoriasError) {
      console.error('Erro ao buscar subcategorias:', subcategoriasError)
    }

    // Associar subcategorias às categorias
    const categoriasComSubs = categoriasData.map(cat => ({
      ...cat,
      subcategorias: subcategoriasData?.filter(sub => sub.categoria_id === cat.id) || []
    }))

    setCategorias(categoriasComSubs)
    setLoading(false)
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  const toggleExpanded = (categoriaId: string) => {
    setExpandedCategorias(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoriaId)) {
        newSet.delete(categoriaId)
      } else {
        newSet.add(categoriaId)
      }
      return newSet
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = categorias.findIndex(c => c.id === active.id)
    const newIndex = categorias.findIndex(c => c.id === over.id)
    
    // Update local state (optimistic)
    const reordered = arrayMove(categorias, oldIndex, newIndex)
    setCategorias(reordered)

    // Update all orders in database
    const supabase = createClient()
    try {
      const updates = reordered.map((cat, index) => 
        supabase
          .from('categorias')
          .update({ ordem: index + 1 })
          .eq('id', cat.id)
      )
      await Promise.all(updates)
      toast.success('Ordem atualizada!')
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error)
      toast.error('Erro ao atualizar ordem')
      fetchCategorias() // Rollback
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      cor: CORES_DISPONIVEIS[0].valor,
      icone: ICONES_DISPONIVEIS[0].icone,
    })
    setEditingCategoria(null)
  }

  const resetSubcategoriaForm = () => {
    setSubcategoriaFormData({ nome: '' })
    setEditingSubcategoria(null)
    setParentCategoriaId(null)
  }

  const openNewCategoriaDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (categoria: Categoria) => {
    setEditingCategoria(categoria)
    setFormData({
      nome: categoria.nome,
      cor: categoria.cor,
      icone: categoria.icone || ICONES_DISPONIVEIS[0].icone,
    })
    setDialogOpen(true)
  }

  const openNewSubcategoriaDialog = (categoriaId: string) => {
    resetSubcategoriaForm()
    setParentCategoriaId(categoriaId)
    setSubcategoriaDialogOpen(true)
  }

  const openEditSubcategoriaDialog = (subcategoria: Subcategoria) => {
    setEditingSubcategoria(subcategoria)
    setParentCategoriaId(subcategoria.categoria_id)
    setSubcategoriaFormData({
      nome: subcategoria.nome,
    })
    setSubcategoriaDialogOpen(true)
  }

  const handleSubmitCategoria = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome da categoria e obrigatorio')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      // Validar nome duplicado
      const { count } = await supabase
        .from('categorias')
        .select('id', { count: 'exact', head: true })
        .ilike('nome', formData.nome.trim())
        .neq('id', editingCategoria?.id || '00000000-0000-0000-0000-000000000000')

      if (count && count > 0) {
        toast.error('Ja existe uma categoria com este nome')
        setSubmitting(false)
        return
      }

      if (editingCategoria) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('categorias')
          .update({
            nome: formData.nome.trim(),
            cor: formData.cor,
            icone: formData.icone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategoria.id)

        if (error) throw error
        toast.success('Categoria atualizada com sucesso!')
      } else {
        // Criar nova categoria
        // Buscar a maior ordem atual
        const { data: maxOrdemData } = await supabase
          .from('categorias')
          .select('ordem')
          .order('ordem', { ascending: false })
          .limit(1)

        const novaOrdem = (maxOrdemData?.[0]?.ordem || 0) + 1

        const { error } = await supabase
          .from('categorias')
          .insert({
            nome: formData.nome.trim(),
            cor: formData.cor,
            icone: formData.icone,
            ordem: novaOrdem,
            ativo: true,
            created_by: currentUser?.id,
          })

        if (error) throw error
        toast.success('Categoria criada com sucesso!')
      }

      setDialogOpen(false)
      resetForm()
      fetchCategorias()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar categoria')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitSubcategoria = async () => {
    if (!subcategoriaFormData.nome.trim()) {
      toast.error('Nome da subcategoria e obrigatorio')
      return
    }

    if (!parentCategoriaId) {
      toast.error('Categoria pai nao identificada')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      // Validar nome duplicado dentro da mesma categoria
      const { count } = await supabase
        .from('subcategorias')
        .select('id', { count: 'exact', head: true })
        .eq('categoria_id', parentCategoriaId)
        .ilike('nome', subcategoriaFormData.nome.trim())
        .neq('id', editingSubcategoria?.id || '00000000-0000-0000-0000-000000000000')

      if (count && count > 0) {
        toast.error('Ja existe uma subcategoria com este nome nesta categoria')
        setSubmitting(false)
        return
      }

      if (editingSubcategoria) {
        // Atualizar subcategoria existente
        const { error } = await supabase
          .from('subcategorias')
          .update({
            nome: subcategoriaFormData.nome.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSubcategoria.id)

        if (error) throw error
        toast.success('Subcategoria atualizada com sucesso!')
      } else {
        // Criar nova subcategoria
        const { error } = await supabase
          .from('subcategorias')
          .insert({
            nome: subcategoriaFormData.nome.trim(),
            categoria_id: parentCategoriaId,
            ativo: true,
          })

        if (error) throw error
        toast.success('Subcategoria criada com sucesso!')
      }

      setSubcategoriaDialogOpen(false)
      resetSubcategoriaForm()
      fetchCategorias()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar subcategoria')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (categoria: Categoria) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('categorias')
        .update({ ativo: !categoria.ativo })
        .eq('id', categoria.id)

      if (error) throw error

      toast.success(
        categoria.ativo ? 'Categoria desativada com sucesso!' : 'Categoria ativada com sucesso!'
      )
      fetchCategorias()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao alterar status')
    }
  }

  const handleToggleSubcategoriaActive = async (subcategoria: Subcategoria) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('subcategorias')
        .update({ ativo: !subcategoria.ativo })
        .eq('id', subcategoria.id)

      if (error) throw error

      toast.success(
        subcategoria.ativo ? 'Subcategoria desativada!' : 'Subcategoria ativada!'
      )
      fetchCategorias()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao alterar status')
    }
  }

  const checkCategoriaUsage = async (categoriaId: string) => {
    const supabase = createClient()
    
    const { count: comprasCount } = await supabase
      .from('compras')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', categoriaId)

    const { count: gastosCount } = await supabase
      .from('gastos')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', categoriaId)

    const { count: orcamentoCount } = await supabase
      .from('orcamento_detalhado')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', categoriaId)

    const total = (comprasCount || 0) + (gastosCount || 0) + (orcamentoCount || 0)
    
    return {
      total,
      comprasCount: comprasCount || 0,
      gastosCount: gastosCount || 0,
      orcamentoCount: orcamentoCount || 0,
    }
  }

  const checkSubcategoriaUsage = async (subcategoriaId: string) => {
    const supabase = createClient()
    
    const { count: comprasCount } = await supabase
      .from('compras')
      .select('id', { count: 'exact', head: true })
      .eq('subcategoria_id', subcategoriaId)

    const { count: gastosCount } = await supabase
      .from('gastos')
      .select('id', { count: 'exact', head: true })
      .eq('subcategoria_id', subcategoriaId)

    const total = (comprasCount || 0) + (gastosCount || 0)
    
    return {
      total,
      comprasCount: comprasCount || 0,
      gastosCount: gastosCount || 0,
    }
  }

  const openDeleteCategoriaDialog = async (categoria: Categoria) => {
    const usage = await checkCategoriaUsage(categoria.id)
    
    let usageInfo = ''
    if (usage.total > 0) {
      const parts = []
      if (usage.comprasCount > 0) parts.push(`${usage.comprasCount} compra${usage.comprasCount !== 1 ? 's' : ''}`)
      if (usage.gastosCount > 0) parts.push(`${usage.gastosCount} gasto${usage.gastosCount !== 1 ? 's' : ''}`)
      if (usage.orcamentoCount > 0) parts.push(`${usage.orcamentoCount} orcamento${usage.orcamentoCount !== 1 ? 's' : ''}`)
      usageInfo = parts.join(', ')
    }

    setDeleteDialog({
      open: true,
      item: categoria,
      type: 'categoria',
      usageInfo,
    })
  }

  const openDeleteSubcategoriaDialog = async (subcategoria: Subcategoria) => {
    const usage = await checkSubcategoriaUsage(subcategoria.id)
    
    let usageInfo = ''
    if (usage.total > 0) {
      const parts = []
      if (usage.comprasCount > 0) parts.push(`${usage.comprasCount} compra${usage.comprasCount !== 1 ? 's' : ''}`)
      if (usage.gastosCount > 0) parts.push(`${usage.gastosCount} gasto${usage.gastosCount !== 1 ? 's' : ''}`)
      usageInfo = parts.join(', ')
    }

    setDeleteDialog({
      open: true,
      item: subcategoria,
      type: 'subcategoria',
      usageInfo,
    })
  }

  const handleDelete = async () => {
    if (!deleteDialog.item) return

    // Bloquear se houver uso
    if (deleteDialog.usageInfo) {
      toast.error(`Nao e possivel deletar. Esta ${deleteDialog.type} e usada em: ${deleteDialog.usageInfo}. Desative-a ao inves de deletar.`)
      setDeleteDialog({ open: false, item: null, type: 'categoria' })
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      if (deleteDialog.type === 'categoria') {
        const { error } = await supabase
          .from('categorias')
          .delete()
          .eq('id', deleteDialog.item.id)

        if (error) throw error
        toast.success('Categoria deletada com sucesso!')
      } else {
        const { error } = await supabase
          .from('subcategorias')
          .delete()
          .eq('id', deleteDialog.item.id)

        if (error) throw error
        toast.success('Subcategoria deletada com sucesso!')
      }

      setDeleteDialog({ open: false, item: null, type: 'categoria' })
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao deletar:', error)
      toast.error('Erro ao deletar')
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
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Categorias
            </CardTitle>
            <CardDescription>
              Gerencie as categorias de gastos e compras do sistema
            </CardDescription>
          </div>
          {canEdit && (
            <Button onClick={openNewCategoriaDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {categorias.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Tags className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma categoria cadastrada</p>
              {canEdit && (
                <Button className="mt-4" onClick={openNewCategoriaDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px] text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={categorias.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categorias.map((categoria) => (
                      <SortableRow
                        key={categoria.id}
                        categoria={categoria}
                        isExpanded={expandedCategorias.has(categoria.id)}
                        onToggleExpand={() => toggleExpanded(categoria.id)}
                        onEdit={() => openEditDialog(categoria)}
                        onToggleActive={() => handleToggleActive(categoria)}
                        onDelete={() => openDeleteCategoriaDialog(categoria)}
                        onAddSubcategoria={() => openNewSubcategoriaDialog(categoria.id)}
                        onEditSubcategoria={openEditSubcategoriaDialog}
                        onToggleSubcategoriaActive={handleToggleSubcategoriaActive}
                        onDeleteSubcategoria={openDeleteSubcategoriaDialog}
                        canEdit={canEdit}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criar/Editar Categoria */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {editingCategoria
                ? 'Atualize as informacoes da categoria'
                : 'Preencha os dados para criar uma nova categoria'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Nome da categoria"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cor *</Label>
              <div className="grid grid-cols-7 gap-2">
                {CORES_DISPONIVEIS.map((cor) => (
                  <button
                    key={cor.valor}
                    type="button"
                    className={`w-10 h-10 rounded-md border-2 transition-all ${
                      formData.cor === cor.valor
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: cor.valor }}
                    onClick={() => setFormData({ ...formData, cor: cor.valor })}
                    title={cor.nome}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Icone *</Label>
              <div className="grid grid-cols-6 gap-2">
                {ICONES_DISPONIVEIS.map((iconeItem) => (
                  <button
                    key={iconeItem.icone}
                    type="button"
                    className={`w-12 h-12 rounded-md border-2 text-2xl transition-all ${
                      formData.icone === iconeItem.icone
                        ? 'border-primary scale-110 bg-primary/10'
                        : 'border-border hover:scale-105 hover:bg-muted'
                    }`}
                    onClick={() => setFormData({ ...formData, icone: iconeItem.icone })}
                    title={iconeItem.nome}
                  >
                    {iconeItem.icone}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitCategoria} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCategoria ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criar/Editar Subcategoria */}
      <Dialog open={subcategoriaDialogOpen} onOpenChange={setSubcategoriaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}
            </DialogTitle>
            <DialogDescription>
              {editingSubcategoria
                ? 'Atualize o nome da subcategoria'
                : `Criar subcategoria em "${categorias.find(c => c.id === parentCategoriaId)?.nome}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subcategoria-nome">Nome *</Label>
              <Input
                id="subcategoria-nome"
                placeholder="Nome da subcategoria"
                value={subcategoriaFormData.nome}
                onChange={(e) =>
                  setSubcategoriaFormData({ nome: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubcategoriaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitSubcategoria} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSubcategoria ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmacao de Delecao */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, item: open ? deleteDialog.item : null, type: deleteDialog.type })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deletar {deleteDialog.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.usageInfo ? (
                <div className="space-y-2">
                  <p className="text-red-500 font-medium">
                    Nao e possivel deletar!
                  </p>
                  <p>
                    Esta {deleteDialog.type} e usada em: <strong>{deleteDialog.usageInfo}</strong>.
                  </p>
                  <p>
                    Para remover do sistema, desative-a ao inves de deletar.
                  </p>
                </div>
              ) : (
                <div>
                  <p>
                    Tem certeza que deseja deletar {deleteDialog.type === 'categoria' ? 'esta categoria' : 'esta subcategoria'}?
                  </p>
                  <p className="text-red-500 mt-2">
                    Esta acao nao pode ser desfeita.
                  </p>
                  {deleteDialog.type === 'categoria' && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Todas as subcategorias tambem serao deletadas.
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {deleteDialog.usageInfo ? 'Fechar' : 'Cancelar'}
            </AlertDialogCancel>
            {!deleteDialog.usageInfo && (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Deletar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
