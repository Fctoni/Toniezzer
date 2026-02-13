'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { AlertCircle, Check, X, RotateCcw, AlertTriangle } from 'lucide-react'
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

export interface ParcelaEditavel {
  parcela: number
  data: string
  valor: number
}

interface FormAprovacaoProps {
  email: Tables<'emails_monitorados'>
  onAprovar: (data: FormData, parcelas: ParcelaEditavel[]) => Promise<void>
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

  // Estado local de parcelas editáveis
  const [parcelasEditaveis, setParcelasEditaveis] = useState<ParcelaEditavel[]>([])

  const watchedParcelas = form.watch('parcelas')
  const watchedValor = form.watch('valor')
  const watchedData = form.watch('data')

  // Regenera parcelas quando número, valor ou data mudam
  useEffect(() => {
    const numParcelas = parseInt(watchedParcelas || '1') || 1
    const valorTotal = parseFloat(watchedValor || '0') || 0
    const dataBase = watchedData || formatDateToString(new Date())

    const valorParcela = Math.floor((valorTotal / numParcelas) * 100) / 100
    const diferenca = Math.round((valorTotal - valorParcela * numParcelas) * 100) / 100

    const novasParcelas: ParcelaEditavel[] = []
    const dataPrimeira = new Date(dataBase + 'T12:00:00')

    for (let i = 0; i < numParcelas; i++) {
      const dataParcela = new Date(dataPrimeira)
      dataParcela.setMonth(dataParcela.getMonth() + i)

      novasParcelas.push({
        parcela: i + 1,
        data: formatDateToString(dataParcela),
        valor: i === numParcelas - 1 ? valorParcela + diferenca : valorParcela,
      })
    }

    setParcelasEditaveis(novasParcelas)
  }, [watchedParcelas, watchedValor, watchedData])

  const updateParcela = useCallback((index: number, field: 'data' | 'valor', value: string) => {
    setParcelasEditaveis(prev => prev.map((p, i) => {
      if (i !== index) return p
      if (field === 'valor') return { ...p, valor: parseFloat(value) || 0 }
      return { ...p, data: value }
    }))
  }, [])

  const somaParcelas = useMemo(
    () => parcelasEditaveis.reduce((acc, p) => acc + p.valor, 0),
    [parcelasEditaveis]
  )

  const valorTotal = parseFloat(watchedValor || '0') || 0
  const diferencaSoma = Math.round((somaParcelas - valorTotal) * 100) / 100

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
        <form onSubmit={form.handleSubmit((data) => onAprovar(data, parcelasEditaveis))}>
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

            {/* Tabela de parcelas editáveis */}
            {parcelasEditaveis.length > 0 && (
              <div className="border rounded-lg">
                <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
                  <span className="text-sm font-medium">Parcelas</span>
                  <span className="text-sm text-muted-foreground">
                    R$ Total {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground w-16">Parcela</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Data</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcelasEditaveis.map((p, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="px-3 py-1.5 text-muted-foreground">
                            {p.parcela}/{parcelasEditaveis.length}
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              type="date"
                              className="h-8 text-sm"
                              defaultValue={p.data}
                              onBlur={(e) => updateParcela(index, 'data', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8 text-sm"
                              defaultValue={p.valor.toFixed(2)}
                              onBlur={(e) => updateParcela(index, 'valor', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30">
                        <td colSpan={2} className="px-3 py-2 text-right text-sm font-medium">
                          Soma:
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
                          R$ {somaParcelas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Aviso quando soma das parcelas diverge do valor total */}
            {diferencaSoma !== 0 && parcelasEditaveis.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-800">
                  A soma das parcelas (R$ {somaParcelas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) difere do valor total (R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) em R$ {Math.abs(diferencaSoma).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
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

