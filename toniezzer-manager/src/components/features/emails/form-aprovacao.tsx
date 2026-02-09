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
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, X, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/lib/types/database'
import { formatDateToString } from '@/lib/utils'
import { QuickAddFornecedor } from '@/components/features/ocr/quick-add-fornecedor'
import { buscarCategoriasAtivas } from '@/lib/services/categorias'
import { buscarFornecedoresAtivos } from '@/lib/services/fornecedores'

const formSchema = z.object({
  descricao: z.string().min(3, 'Mínimo 3 caracteres'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  fornecedor_id: z.string().min(1, 'Fornecedor é obrigatório'),
  categoria_id: z.string().min(1, 'Categoria é obrigatória'),
  forma_pagamento: z.enum(['dinheiro', 'pix', 'cartao', 'boleto', 'cheque']),
  parcelas: z.string().min(1, 'Parcelas é obrigatório'),
  nota_fiscal_numero: z.string().optional(),
  etapa_relacionada_id: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface FormAprovacaoProps {
  email: Tables<'emails_monitorados'>
  onAprovar: (data: FormData) => Promise<void>
  onRejeitar: () => Promise<void>
  onReprocessar?: () => Promise<void>
  isSubmitting?: boolean
}

export function FormAprovacao({
  email,
  onAprovar,
  onRejeitar,
  onReprocessar,
  isSubmitting
}: FormAprovacaoProps) {
  const [categorias, setCategorias] = useState<Tables<'categorias'>[]>([])
  const [fornecedores, setFornecedores] = useState<Tables<'fornecedores'>[]>([])
  const [etapas, setEtapas] = useState<Tables<'etapas'>[]>([])
  const [loading, setLoading] = useState(true)

  const dadosExtraidos = email.dados_extraidos as {
    fornecedor?: string
    cnpj?: string
    valor?: number
    data?: string
    numero_nf?: string
    descricao?: string
    forma_pagamento?: string
    categoria_sugerida?: string
    confianca?: number
  } | null

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: dadosExtraidos?.descricao || dadosExtraidos?.fornecedor || email.assunto || '',
      valor: dadosExtraidos?.valor?.toString() || '',
      data: dadosExtraidos?.data || formatDateToString(new Date()),
      fornecedor_id: '',
      categoria_id: '',
      forma_pagamento: (dadosExtraidos?.forma_pagamento as FormData['forma_pagamento']) || 'pix',
      parcelas: '1',
      nota_fiscal_numero: dadosExtraidos?.numero_nf || '',
      etapa_relacionada_id: '',
      observacoes: `Importado do email de ${email.remetente}\nConfiança IA: ${dadosExtraidos?.confianca ? Math.round(dadosExtraidos.confianca * 100) + '%' : 'N/A'}`,
    },
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const [categoriasData, fornecedoresData, etapasRes] = await Promise.all([
        buscarCategoriasAtivas(supabase),
        buscarFornecedoresAtivos(supabase),
        supabase.from('etapas').select('*').order('ordem'),
      ])

      setCategorias(categoriasData)
      // Tentar encontrar categoria sugerida
      if (dadosExtraidos?.categoria_sugerida) {
        const match = categoriasData.find(c =>
          c.nome.toLowerCase().includes(dadosExtraidos.categoria_sugerida!.toLowerCase())
        )
        if (match) form.setValue('categoria_id', match.id)
      }

      setFornecedores(fornecedoresData)
      // Tentar encontrar fornecedor
      if (dadosExtraidos?.fornecedor || dadosExtraidos?.cnpj) {
        const match = fornecedoresData.find(f => {
          if (dadosExtraidos.cnpj && f.cnpj_cpf) {
            return f.cnpj_cpf.replace(/\D/g, '') === dadosExtraidos.cnpj.replace(/\D/g, '')
          }
          if (dadosExtraidos.fornecedor && f.nome) {
            return f.nome.toLowerCase().includes(dadosExtraidos.fornecedor.toLowerCase())
          }
          return false
        })
        if (match) form.setValue('fornecedor_id', match.id)
      }

      if (etapasRes.data) setEtapas(etapasRes.data)
      
      setLoading(false)
    }
    loadData()
  }, [dadosExtraidos, form])

  const confianca = dadosExtraidos?.confianca || 0

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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Dados Extraídos</CardTitle>
          <Badge className={
            confianca >= 0.8 ? 'bg-green-100 text-green-800' :
            confianca >= 0.6 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
          }>
            {confianca ? `${Math.round(confianca * 100)}% confiança` : 'Sem IA'}
          </Badge>
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onAprovar)}>
          <CardContent className="space-y-4">
            {confianca === 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Preencha manualmente</p>
                  <p>Os dados da NF podem estar em um anexo (PDF/imagem). Por favor, verifique o anexo e preencha os campos abaixo.</p>
                </div>
              </div>
            )}
            {confianca > 0 && confianca < 0.7 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-800">
                  A confiança da extração está baixa. Verifique todos os campos antes de aprovar.
                </p>
              </div>
            )}

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
                      <Input type="number" step="0.01" placeholder="0,00" {...field} />
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
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} />
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
                  <FormLabel>Fornecedor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <QuickAddFornecedor 
                        onFornecedorAdded={(novoFornecedor) => {
                          setFornecedores(prev => [...prev, novoFornecedor as Tables<'fornecedores'>])
                          field.onChange(novoFornecedor.id)
                        }}
                      />
                      {fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
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

              <FormField
                control={form.control}
                name="nota_fiscal_numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Nota Fiscal</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="etapa_relacionada_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa Relacionada</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(val === '_none' ? '' : val)} 
                    value={field.value || '_none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_none">Nenhuma</SelectItem>
                      {etapas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
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
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={onRejeitar}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Aprovar
              </Button>
            </div>
            {onReprocessar && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onReprocessar}
                disabled={isSubmitting}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reprocessar com IA
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

