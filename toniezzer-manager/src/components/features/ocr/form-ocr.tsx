'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Check, X } from 'lucide-react'

const formSchema = z.object({
  descricao: z.string().min(3, 'Mínimo 3 caracteres'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  fornecedor_id: z.string().optional(),
  categoria_id: z.string().min(1, 'Categoria é obrigatória'),
  forma_pagamento: z.enum(['dinheiro', 'pix', 'cartao', 'boleto', 'cheque']),
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
  const [loading, setLoading] = useState(true)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: dados.descricao || '',
      valor: dados.valor?.toString() || '',
      data: dados.data || new Date().toISOString().split('T')[0],
      fornecedor_id: fornecedorId || '',
      categoria_id: categoriaId || '',
      forma_pagamento: (dados.forma_pagamento as FormData['forma_pagamento']) || 'pix',
      nota_fiscal_numero: '',
      observacoes: `Confiança OCR: ${Math.round(dados.confianca * 100)}%`,
    },
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const [categoriasRes, fornecedoresRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('ativo', true).order('ordem'),
        supabase.from('fornecedores').select('*').eq('ativo', true).order('nome'),
      ])

      if (categoriasRes.data) setCategorias(categoriasRes.data)
      if (fornecedoresRes.data) setFornecedores(fornecedoresRes.data)
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

  const formatCurrencyInput = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    // Converte para decimal
    const decimal = (parseInt(numbers) / 100).toFixed(2)
    return decimal
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
        <CardTitle className="text-lg">Confirmar Lançamento</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do gasto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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

            <FormField
              control={form.control}
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
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
              name="fornecedor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor (opcional)</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(val === '_none' ? '' : val)} 
                    value={field.value || '_none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_none">Nenhum</SelectItem>
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
                      <SelectItem value="cartao">Cartão</SelectItem>
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
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais" 
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
                  Confirmar Lançamento
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

