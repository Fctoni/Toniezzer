'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { useUser } from '@/lib/hooks/use-user'
import { AvaliacaoStars } from '@/components/features/fornecedores/avaliacao-stars'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Loader2, 
  Building2,
  Phone,
  Mail,
  MapPin,
  Wrench,
  DollarSign,
  Star,
  Edit,
  Trash2,
  Save,
  Calendar
} from 'lucide-react'
import { formatCurrency, formatDate, getInitials, cn } from '@/lib/utils'
import type { Fornecedor, Gasto, FornecedorAvaliacao, User } from '@/lib/types/database'

export default function FornecedorDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { can, isLoading: permissionsLoading } = usePermissions()
  const { user } = useUser()
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [pagamentos, setPagamentos] = useState<(Gasto & { categoria?: { nome: string } })[]>([])
  const [avaliacoes, setAvaliacoes] = useState<(FornecedorAvaliacao & { avaliador?: User })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Fornecedor>>({})
  const [showAvaliarDialog, setShowAvaliarDialog] = useState(false)
  const [novaAvaliacao, setNovaAvaliacao] = useState({ nota: 5, comentario: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()
  const fornecedorId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Buscar fornecedor
        const { data: fornecedorData, error: fornecedorError } = await supabase
          .from('fornecedores')
          .select('*')
          .eq('id', fornecedorId)
          .single()

        if (fornecedorError) throw fornecedorError
        setFornecedor(fornecedorData)
        setEditForm(fornecedorData)

        // Buscar pagamentos (gastos aprovados deste fornecedor)
        const { data: pagamentosData } = await supabase
          .from('gastos')
          .select(`
            *,
            categoria:categorias(nome)
          `)
          .eq('fornecedor_id', fornecedorId)
          .eq('status', 'aprovado')
          .order('data', { ascending: false })

        setPagamentos(pagamentosData || [])

        // Buscar avaliações
        const { data: avaliacoesData } = await supabase
          .from('fornecedores_avaliacoes')
          .select(`
            *,
            avaliador:users(*)
          `)
          .eq('fornecedor_id', fornecedorId)
          .order('created_at', { ascending: false })

        setAvaliacoes(avaliacoesData || [])
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        router.push('/fornecedores')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [fornecedorId])

  const handleSaveEdit = async () => {
    if (!fornecedor) return
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('fornecedores')
        .update({
          nome: editForm.nome,
          tipo: editForm.tipo,
          especialidade: editForm.especialidade,
          cnpj_cpf: editForm.cnpj_cpf,
          telefone: editForm.telefone,
          email: editForm.email,
          endereco: editForm.endereco,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fornecedor.id)

      if (error) throw error

      setFornecedor({ ...fornecedor, ...editForm })
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao atualizar:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvaliar = async () => {
    if (!fornecedor || !user) return
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('fornecedores_avaliacoes')
        .insert({
          fornecedor_id: fornecedor.id,
          avaliador_id: user.id,
          nota: novaAvaliacao.nota,
          comentario: novaAvaliacao.comentario || null,
        })
        .select(`
          *,
          avaliador:users(*)
        `)
        .single()

      if (error) throw error

      setAvaliacoes(prev => [data as (FornecedorAvaliacao & { avaliador?: User }), ...prev])
      setShowAvaliarDialog(false)
      setNovaAvaliacao({ nota: 5, comentario: '' })

      // Atualizar média de avaliação do fornecedor localmente
      const novaMedia = [...avaliacoes, data].reduce((acc, a) => acc + a.nota, 0) / (avaliacoes.length + 1)
      setFornecedor(prev => prev ? { ...prev, avaliacao: Math.round(novaMedia) } : null)
    } catch (error) {
      console.error('Erro ao avaliar:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!fornecedor || !confirm('Tem certeza que deseja excluir este fornecedor?')) return

    try {
      const { error } = await supabase
        .from('fornecedores')
        .update({ ativo: false })
        .eq('id', fornecedor.id)

      if (error) throw error

      router.push('/fornecedores')
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }

  const totalPagamentos = pagamentos.reduce((acc, p) => acc + Number(p.valor), 0)

  if (permissionsLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!fornecedor) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Fornecedor não encontrado</h2>
          <Link href="/fornecedores">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/fornecedores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {getInitials(fornecedor.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{fornecedor.nome}</h1>
              {fornecedor.tipo && (
                <Badge variant="outline" className="mt-1">
                  <Building2 className="h-3 w-3 mr-1" />
                  {fornecedor.tipo}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {can.editarFornecedor() && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={editForm.nome || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Input
                        value={editForm.tipo || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, tipo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Especialidade</Label>
                      <Input
                        value={editForm.especialidade || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, especialidade: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF/CNPJ</Label>
                      <Input
                        value={editForm.cnpj_cpf || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, cnpj_cpf: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={editForm.telefone || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, telefone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Textarea
                      value={editForm.endereco || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, endereco: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fornecedor.especialidade && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span>{fornecedor.especialidade}</span>
                    </div>
                  )}
                  {fornecedor.cnpj_cpf && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{fornecedor.cnpj_cpf}</span>
                    </div>
                  )}
                  {fornecedor.telefone && (
                    <a href={`tel:${fornecedor.telefone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{fornecedor.telefone}</span>
                    </a>
                  )}
                  {fornecedor.email && (
                    <a href={`mailto:${fornecedor.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{fornecedor.email}</span>
                    </a>
                  )}
                  {fornecedor.endereco && (
                    <div className="flex items-start gap-2 text-sm md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span>{fornecedor.endereco}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Histórico de Pagamentos
                </div>
                <span className="text-primary font-bold">
                  {formatCurrency(totalPagamentos)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pagamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pagamento registrado
                </p>
              ) : (
                <div className="space-y-3">
                  {pagamentos.map((pagamento) => (
                    <div
                      key={pagamento.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium text-sm">{pagamento.descricao}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(pagamento.data)}</span>
                          {pagamento.categoria && (
                            <Badge variant="outline" className="text-xs">
                              {pagamento.categoria.nome}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-primary">
                        {formatCurrency(Number(pagamento.valor))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Avaliação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5" />
                Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <AvaliacaoStars 
                  value={fornecedor.avaliacao || 0} 
                  readonly 
                  size="lg" 
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {avaliacoes.length} avaliação{avaliacoes.length !== 1 ? 'ões' : ''}
                </p>
              </div>

              {can.editarFornecedor() && (
                <Dialog open={showAvaliarDialog} onOpenChange={setShowAvaliarDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <Star className="h-4 w-4" />
                      Avaliar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Avaliar Fornecedor</DialogTitle>
                      <DialogDescription>
                        Avalie a qualidade do serviço prestado por {fornecedor.nome}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex justify-center">
                        <AvaliacaoStars
                          value={novaAvaliacao.nota}
                          onChange={(nota) => setNovaAvaliacao(prev => ({ ...prev, nota }))}
                          size="lg"
                          showLabel
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Comentário (opcional)</Label>
                        <Textarea
                          value={novaAvaliacao.comentario}
                          onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, comentario: e.target.value }))}
                          placeholder="Descreva sua experiência..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setShowAvaliarDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAvaliar} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Enviar Avaliação
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Lista de avaliações */}
              {avaliacoes.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  {avaliacoes.map((avaliacao) => (
                    <div key={avaliacao.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {avaliacao.avaliador?.nome_completo || 'Usuário'}
                        </span>
                        <AvaliacaoStars value={avaliacao.nota} readonly size="sm" />
                      </div>
                      {avaliacao.comentario && (
                        <p className="text-sm text-muted-foreground">
                          {avaliacao.comentario}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(avaliacao.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

