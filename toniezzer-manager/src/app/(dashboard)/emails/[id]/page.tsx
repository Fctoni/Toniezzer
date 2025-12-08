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

export default function EmailDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useCurrentUser()
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
    fornecedor_id?: string
    categoria_id: string
    forma_pagamento: 'dinheiro' | 'pix' | 'cartao' | 'boleto' | 'cheque'
    nota_fiscal_numero?: string
    etapa_relacionada_id?: string
    observacoes?: string
  }) => {
    if (!user || !email) return
    
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      // 1. Criar o gasto
      const { data: gasto, error: gastoError } = await supabase
        .from('gastos')
        .insert({
          descricao: data.descricao,
          valor: parseFloat(data.valor),
          data: data.data,
          categoria_id: data.categoria_id,
          fornecedor_id: data.fornecedor_id || null,
          forma_pagamento: data.forma_pagamento,
          nota_fiscal_numero: data.nota_fiscal_numero || null,
          etapa_relacionada_id: data.etapa_relacionada_id || null,
          observacoes: data.observacoes || null,
          criado_por: user.id,
          criado_via: 'email',
          status: 'aprovado',
          pago: true,
          pago_em: data.data,
        })
        .select()
        .single()

      if (gastoError) throw gastoError

      // 2. Atualizar o email
      const { error: emailError } = await supabase
        .from('emails_monitorados')
        .update({
          status: 'processado',
          gasto_sugerido_id: gasto.id,
          processado_em: new Date().toISOString(),
          processado_por: user.id,
        })
        .eq('id', email.id)

      if (emailError) throw emailError

      toast.success('Email aprovado! Lançamento criado.')
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
    if (!user || !email) return
    
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('emails_monitorados')
        .update({
          status: 'ignorado',
          processado_em: new Date().toISOString(),
          processado_por: user.id,
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
        .update({ status: 'processando' })
        .eq('id', email.id)

      // Chamar Edge Function (se disponível)
      const { error } = await supabase.functions.invoke('process-ocr', {
        body: { email_id: email.id }
      })

      if (error) {
        toast.warning('Reprocessamento não disponível', {
          description: 'Edite os campos manualmente.'
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

