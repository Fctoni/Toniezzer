'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Categoria, Fornecedor, Etapa } from '@/lib/types/database'

export default function NovoLancamentoPage() {
  const router = useRouter()
  const { user } = useUser()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [etapas, setEtapas] = useState<Etapa[]>([])

  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    categoria_id: '',
    fornecedor_id: '',
    forma_pagamento: 'pix',
    parcelas: '1',
    etapa_relacionada_id: '',
    observacoes: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, fornRes, etaRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('ativo', true).order('nome'),
        supabase.from('fornecedores').select('*').eq('ativo', true).order('nome'),
        supabase.from('etapas').select('*').order('ordem'),
      ])
      
      setCategorias(catRes.data || [])
      setFornecedores(fornRes.data || [])
      setEtapas(etaRes.data || [])
    }
    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const valor = parseFloat(formData.valor.replace(',', '.'))
      const parcelas = parseInt(formData.parcelas)

      if (isNaN(valor) || valor <= 0) {
        throw new Error('Valor invalido')
      }

      if (!formData.categoria_id) {
        throw new Error('Selecione uma categoria')
      }

      // Se parcelado, criar multiplos lancamentos
      if (parcelas > 1) {
        const valorParcela = valor / parcelas
        const dataBase = new Date(formData.data)

        for (let i = 0; i < parcelas; i++) {
          const dataParcela = new Date(dataBase)
          dataParcela.setMonth(dataParcela.getMonth() + i)

          await supabase.from('gastos').insert({
            descricao: `${formData.descricao} (${i + 1}/${parcelas})`,
            valor: valorParcela,
            data: dataParcela.toISOString().split('T')[0],
            categoria_id: formData.categoria_id,
            fornecedor_id: formData.fornecedor_id || null,
            forma_pagamento: formData.forma_pagamento,
            parcelas: parcelas,
            parcela_atual: i + 1,
            etapa_relacionada_id: formData.etapa_relacionada_id || null,
            status: 'aprovado',
            criado_por: user?.id,
            criado_via: 'manual',
            observacoes: formData.observacoes || null,
          })
        }
      } else {
        // Lancamento unico
        const { error: insertError } = await supabase.from('gastos').insert({
          descricao: formData.descricao,
          valor: valor,
          data: formData.data,
          categoria_id: formData.categoria_id,
          fornecedor_id: formData.fornecedor_id || null,
          forma_pagamento: formData.forma_pagamento,
          parcelas: 1,
          parcela_atual: 1,
          etapa_relacionada_id: formData.etapa_relacionada_id || null,
          status: 'aprovado',
          criado_por: user?.id,
          criado_via: 'manual',
          observacoes: formData.observacoes || null,
        })

        if (insertError) throw insertError
      }

      router.push('/financeiro')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/financeiro">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Lancamento</CardTitle>
          <CardDescription>Registre um novo gasto da obra</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descricao">Descricao *</Label>
              <Input
                id="descricao"
                name="descricao"
                placeholder="Ex: Cimento para fundacao"
                value={formData.descricao}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="text"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  name="data"
                  type="date"
                  value={formData.data}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria_id">Categoria *</Label>
              <select
                id="categoria_id"
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                required
              >
                <option value="">Selecione...</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor_id">Fornecedor</Label>
              <select
                id="fornecedor_id"
                name="fornecedor_id"
                value={formData.fornecedor_id}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Nenhum</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <select
                  id="forma_pagamento"
                  name="forma_pagamento"
                  value={formData.forma_pagamento}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartao</option>
                  <option value="boleto">Boleto</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcelas">Parcelas</Label>
                <Input
                  id="parcelas"
                  name="parcelas"
                  type="number"
                  min="1"
                  max="48"
                  value={formData.parcelas}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="etapa_relacionada_id">Etapa Relacionada</Label>
              <select
                id="etapa_relacionada_id"
                name="etapa_relacionada_id"
                value={formData.etapa_relacionada_id}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Nenhuma</option>
                {etapas.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observacoes</Label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                placeholder="Observacoes adicionais..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Lancamento'
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/financeiro">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

