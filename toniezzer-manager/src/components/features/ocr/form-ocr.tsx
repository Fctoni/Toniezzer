'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/lib/types/database'
import type { DadosExtraidos } from './preview-ocr'
import { QuickAddFornecedor } from './quick-add-fornecedor'
import { Check, X } from 'lucide-react'

const formSchema = z.object({
  descricao: z.string().min(3, 'Mínimo 3 caracteres'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  fornecedor_id: z.string().min(1, 'Fornecedor é obrigatório'),
  categoria_id: z.string().min(1, 'Categoria é obrigatória'),
  etapa_relacionada_id: z.string().optional(),
  forma_pagamento: z.enum(['dinheiro', 'pix', 'cartao', 'boleto', 'cheque']),
  parcelas: z.string().default('1'),
  nota_fiscal_numero: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface FormOcrProps {
  dados: DadosExtraidos
  categoriaId?: string | null
  fornecedorId?: string | null
  imageUrl: string
  onSubmit: (data: FormData & { nota_fiscal_url: string }) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function FormOcr({
  dados,
  categoriaId,
  fornecedorId,
  imageUrl,
  onSubmit,
  onCancel,
  isSubmitting
}: FormOcrProps) {
  const [categorias, setCategorias] = useState<Tables<'categorias'>[]>([])
  const [fornecedores, setFornecedores] = useState<Tables<'fornecedores'>[]>([])
  const [etapas, setEtapas] = useState<Tables<'etapas'>[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: dados.descricao || '',
      valor: dados.valor?.toString() || '',
      data: dados.data || new Date().toISOString().split('T')[0],
      fornecedor_id: fornecedorId || '',
      categoria_id: categoriaId || '',
      etapa_relacionada_id: '',
      forma_pagamento: (dados.forma_pagamento as FormData['forma_pagamento']) || 'pix',
      parcelas: '1',
      nota_fiscal_numero: '',
      observacoes: `Confiança OCR: ${Math.round(dados.confianca * 100)}%`,
    },
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const [categoriasRes, fornecedoresRes, etapasRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('ativo', true).order('ordem'),
        supabase.from('fornecedores').select('*').eq('ativo', true).order('nome'),
        supabase.from('etapas').select('*').order('ordem'),
      ])

      if (categoriasRes.data) setCategorias(categoriasRes.data)
      if (fornecedoresRes.data) setFornecedores(fornecedoresRes.data)
      if (etapasRes.data) setEtapas(etapasRes.data)
      setLoading(false)
    }
    loadData()
  }, [])

  // Atualizar valores quando dados externos mudam
  useEffect(() => {
    if (categoriaId) form.setValue('categoria_id', categoriaId)
    if (fornecedorId) form.setValue('fornecedor_id', fornecedorId)
  }, [categoriaId, fornecedorId, form])

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      nota_fiscal_url: imageUrl,
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin text-2xl mb-2">⏳</div>
          <p>Carregando formulário...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Confirmar Compra</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {/* Linha 1: NF | Valor | Data (33% | 33% | 33%) */}
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="nota_fiscal_numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº NF</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0,00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 2: Fornecedor | Categoria | Etapa (33% | 33% | 33%) */}
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <QuickAddFornecedor 
                          onFornecedorAdded={(novoFornecedor) => {
                            setFornecedores(prev => [...prev, novoFornecedor as Tables<'fornecedores'>])
                            field.onChange(novoFornecedor.id)
                          }}
                        />
                        {fornecedores.map((forn) => (
                          <SelectItem key={forn.id} value={forn.id}>
                            {forn.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: cat.cor }}
                              />
                              {cat.nome}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="etapa_relacionada_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === '_none' ? '' : val)} 
                      value={field.value || '_none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Nenhuma</SelectItem>
                        {etapas.map((etapa) => (
                          <SelectItem key={etapa.id} value={etapa.id}>
                            {etapa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 3: Descricao (100%) */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descricao</FormLabel>
                  <FormControl>
                    <Input placeholder="Descricao da compra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linha 4: Forma Pgto | Parcelas (50% | 50%) */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="forma_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartao</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parcelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="48" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 5: Observacoes (100%) */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observacoes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observacoes adicionais" 
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Compra
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

