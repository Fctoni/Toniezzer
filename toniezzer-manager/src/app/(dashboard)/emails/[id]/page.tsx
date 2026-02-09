'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmailPreview, FormAprovacao } from '@/components/features/emails'
import { ArrowLeft, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import type { Tables } from '@/lib/types/database'
import { formatDateToString } from '@/lib/utils'
import { criarCompra } from '@/lib/services/compras'
import { criarGastos } from '@/lib/services/gastos'

export default function EmailDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { currentUser } = useCurrentUser()
  const [email, setEmail] = useState<Tables<'emails_monitorados'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadEmail() {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('emails_monitorados')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error || !data) {
        console.error('Erro ao carregar email:', error)
        toast.error('Email não encontrado')
        router.push('/emails')
        return
      }

      setEmail(data)
      setLoading(false)
    }
    loadEmail()
  }, [resolvedParams.id, router])

  const handleAprovar = async (data: {
    descricao: string
    valor: string
    data: string
    fornecedor_id: string
    categoria_id: string
    forma_pagamento: 'dinheiro' | 'pix' | 'cartao' | 'boleto' | 'cheque'
    parcelas: string
    nota_fiscal_numero?: string
    etapa_relacionada_id?: string
    observacoes?: string
  }) => {
    if (!currentUser || !email) return
    
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const numParcelas = parseInt(data.parcelas || '1')
      
      // 1. Verificar se há anexos e salvar no Storage
      let notaFiscalUrl: string | null = null
      
      const anexos = email.anexos as Array<{
        nome: string
        tipo: string
        tamanho?: number
        part: string
        uid: number
      }> | null
      
      if (anexos && anexos.length > 0) {
        // Encontrar o primeiro anexo que seja imagem ou PDF
        const anexoParaSalvar = anexos.find(a => 
          a.tipo?.includes('image') || a.tipo?.includes('pdf')
        )
        
        if (anexoParaSalvar) {
          try {
            // Baixar o anexo via API
            const anexoUrl = `/api/emails/attachment?uid=${anexoParaSalvar.uid}&part=${anexoParaSalvar.part}&tipo=${encodeURIComponent(anexoParaSalvar.tipo)}&nome=${encodeURIComponent(anexoParaSalvar.nome)}`
            const response = await fetch(anexoUrl)
            
            if (response.ok) {
              const blob = await response.blob()
              
              // Determinar extensão do arquivo
              let extensao = 'bin'
              if (anexoParaSalvar.tipo?.includes('jpeg') || anexoParaSalvar.tipo?.includes('jpg')) {
                extensao = 'jpg'
              } else if (anexoParaSalvar.tipo?.includes('png')) {
                extensao = 'png'
              } else if (anexoParaSalvar.tipo?.includes('pdf')) {
                extensao = 'pdf'
              }
              
              // Upload para o Storage
              const fileName = `email/${Date.now()}-${email.id}.${extensao}`
              const { error: uploadError } = await supabase.storage
                .from('notas-compras')
                .upload(fileName, blob, {
                  contentType: anexoParaSalvar.tipo,
                  upsert: false
                })
              
              if (!uploadError) {
                const { data: urlData } = supabase.storage
                  .from('notas-compras')
                  .getPublicUrl(fileName)
                notaFiscalUrl = urlData.publicUrl
                console.log('[EMAIL] Anexo salvo no Storage:', notaFiscalUrl)
              } else {
                console.error('[EMAIL] Erro ao fazer upload do anexo:', uploadError)
              }
            }
          } catch (anexoError) {
            console.error('[EMAIL] Erro ao processar anexo:', anexoError)
            // Continua mesmo se falhar o upload do anexo
          }
        }
      }
      
      // 2. Criar a compra
      const compra = await criarCompra(supabase, {
        descricao: data.descricao,
        valor_total: parseFloat(data.valor),
        data_compra: data.data,
        data_primeira_parcela: data.data,
        categoria_id: data.categoria_id,
        fornecedor_id: data.fornecedor_id,
        forma_pagamento: data.forma_pagamento,
        parcelas: numParcelas,
        nota_fiscal_numero: data.nota_fiscal_numero || null,
        nota_fiscal_url: notaFiscalUrl,
        etapa_relacionada_id: data.etapa_relacionada_id || null,
        observacoes: data.observacoes || null,
        criado_por: currentUser.id,
        criado_via: 'email',
        status: 'ativa',
        valor_pago: 0,
        parcelas_pagas: 0,
      })

      // 3. Criar as parcelas (lançamentos na tabela gastos)
      const valorTotal = parseFloat(data.valor)
      const valorParcela = valorTotal / numParcelas
      const valorArredondado = Math.floor(valorParcela * 100) / 100
      const diferencaArredondamento = valorTotal - (valorArredondado * numParcelas)

      const lancamentos = []
      const dataPrimeiraParcela = new Date(data.data + 'T12:00:00')

      for (let i = 0; i < numParcelas; i++) {
        const dataParcela = new Date(dataPrimeiraParcela)
        dataParcela.setMonth(dataParcela.getMonth() + i)
        
        const valor = i === numParcelas - 1
          ? valorArredondado + diferencaArredondamento
          : valorArredondado

        lancamentos.push({
          compra_id: compra.id,
          descricao: data.descricao,
          valor: valor,
          data: formatDateToString(dataParcela),
          categoria_id: data.categoria_id,
          fornecedor_id: data.fornecedor_id,
          forma_pagamento: data.forma_pagamento,
          parcelas: numParcelas,
          parcela_atual: i + 1,
          etapa_relacionada_id: data.etapa_relacionada_id || null,
          status: 'aprovado',
          pago: false,
          criado_por: currentUser.id,
          criado_via: 'email',
        })
      }

      try {
        await criarGastos(supabase, lancamentos)
      } catch (lancamentosError) {
        console.error('Erro ao criar parcelas:', lancamentosError)
        // Não lança erro para não impedir o fluxo, mas loga
      }

      // 4. Atualizar o email
      const { error: emailError } = await supabase
        .from('emails_monitorados')
        .update({
          status: 'processado',
          compra_sugerida_id: compra.id,
          processado_em: new Date().toISOString(),
          processado_por: currentUser.id,
        })
        .eq('id', email.id)

      if (emailError) throw emailError

      toast.success('Email aprovado! Compra criada.')
      router.push('/emails')
      
    } catch (error) {
      console.error('Erro ao aprovar:', error)
      toast.error('Erro ao aprovar email', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejeitar = async () => {
    if (!currentUser || !email) return
    
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('emails_monitorados')
        .update({
          status: 'ignorado',
          processado_em: new Date().toISOString(),
          processado_por: currentUser.id,
        })
        .eq('id', email.id)

      if (error) throw error

      toast.success('Email rejeitado')
      router.push('/emails')
      
    } catch (error) {
      console.error('Erro ao rejeitar:', error)
      toast.error('Erro ao rejeitar email')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReprocessar = async () => {
    if (!email) return
    
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      // Atualizar status para reprocessamento
      await supabase
        .from('emails_monitorados')
        .update({ status: 'nao_processado' })
        .eq('id', email.id)

      // Chamar API Route de processamento
      const response = await fetch('/api/emails/process', { method: 'POST' })
      const result = await response.json()

      if (!response.ok) {
        toast.warning('Reprocessamento falhou', {
          description: result.error || 'Edite os campos manualmente.'
        })
        await supabase
          .from('emails_monitorados')
          .update({ status: 'aguardando_revisao' })
          .eq('id', email.id)
      } else {
        toast.success('Email reprocessado!')
        // Recarregar dados
        const { data } = await supabase
          .from('emails_monitorados')
          .select('*')
          .eq('id', email.id)
          .single()
        if (data) setEmail(data)
      }
      
    } catch (error) {
      console.error('Erro ao reprocessar:', error)
      toast.error('Erro ao reprocessar email')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!email) return null

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/emails">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Revisar Email
          </h1>
          <p className="text-muted-foreground truncate max-w-lg">
            {email.assunto}
          </p>
        </div>
      </div>

      {/* Conteúdo - 2 colunas */}
      <div className="grid md:grid-cols-2 gap-6">
        <EmailPreview email={email} />
        <FormAprovacao
          email={email}
          onAprovar={handleAprovar}
          onRejeitar={handleRejeitar}
          onReprocessar={email.status === 'aguardando_revisao' ? handleReprocessar : undefined}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}

