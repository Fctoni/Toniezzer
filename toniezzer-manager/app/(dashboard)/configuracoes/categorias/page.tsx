'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import type { Categoria } from '@/lib/types/database'

const coresDisponiveis = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
]

export default function CategoriasPage() {
  const supabase = createClient()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#3b82f6',
    orcamento: '',
  })

  const fetchCategorias = async () => {
    const { data } = await supabase
      .from('categorias')
      .select('*')
      .eq('ativo', true)
      .order('ordem')
    setCategorias(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  const handleSave = async () => {
    if (!formData.nome.trim()) return
    
    setIsSaving(true)
    try {
      const orcamento = formData.orcamento ? parseFloat(formData.orcamento.replace(',', '.')) : null
      
      if (editingId) {
        await supabase
          .from('categorias')
          .update({
            nome: formData.nome,
            cor: formData.cor,
            orcamento: orcamento,
          })
          .eq('id', editingId)
      } else {
        const maxOrdem = Math.max(...categorias.map(c => c.ordem), 0)
        await supabase.from('categorias').insert({
          nome: formData.nome,
          cor: formData.cor,
          orcamento: orcamento,
          ordem: maxOrdem + 1,
        })
      }
      
      setFormData({ nome: '', cor: '#3b82f6', orcamento: '' })
      setEditingId(null)
      setShowForm(false)
      fetchCategorias()
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (cat: Categoria) => {
    setFormData({
      nome: cat.nome,
      cor: cat.cor,
      orcamento: cat.orcamento?.toString() || '',
    })
    setEditingId(cat.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar esta categoria?')) return
    
    await supabase
      .from('categorias')
      .update({ ativo: false })
      .eq('id', id)
    
    fetchCategorias()
  }

  const handleCancel = () => {
    setFormData({ nome: '', cor: '#3b82f6', orcamento: '' })
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/configuracoes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorias de Gastos</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias e defina orcamentos
          </p>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Fundacao"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orcamento">Orcamento (R$)</Label>
                <Input
                  id="orcamento"
                  value={formData.orcamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, orcamento: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-1 flex-wrap">
                  {coresDisponiveis.map(cor => (
                    <button
                      key={cor}
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 ${formData.cor === cor ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: cor }}
                      onClick={() => setFormData(prev => ({ ...prev, cor }))}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Categorias Cadastradas</CardTitle>
            <CardDescription>{categorias.length} categorias ativas</CardDescription>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma categoria cadastrada
            </div>
          ) : (
            <div className="space-y-2">
              {categorias.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cat.cor }}
                    />
                    <span className="font-medium">{cat.nome}</span>
                    {cat.orcamento && (
                      <Badge variant="outline">
                        {formatCurrency(Number(cat.orcamento))}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

