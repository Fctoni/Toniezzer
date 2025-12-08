'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CameraCapture, PreviewOcr, FormOcr, type DadosExtraidos } from '@/components/features/ocr'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Camera } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useCurrentUser } from '@/lib/hooks/use-current-user'

type Step = 'capture' | 'processing' | 'review'

interface OcrResult {
  success: boolean
  dados: DadosExtraidos
  categoria_id: string | null
  fornecedor_id: string | null
  image_url: string
}

export default function FotoReciboPage() {
  const router = useRouter()
  const { currentUser } = useCurrentUser()
  const [step, setStep] = useState<Step>('capture')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCapture = async (file: File) => {
    setImageFile(file)
    setIsProcessing(true)
    setStep('processing')

    try {
      // 1. Converter imagem para base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Remover o prefixo "data:image/...;base64,"
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // 2. Chamar API Route local (Next.js) para OCR com Gemini
      const ocrResponse = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64 })
      })

      const ocrResult = await ocrResponse.json()

      // 3. Upload da imagem para o Storage (para manter referência)
      const supabase = createClient()
      const fileName = `ocr/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('fotos-temp')
        .upload(fileName, file)

      let publicUrl = ''
      if (!uploadError) {
        const { data } = supabase.storage.from('fotos-temp').getPublicUrl(fileName)
        publicUrl = data.publicUrl
      }

      setImageUrl(publicUrl)

      // 4. Processar resultado do OCR
      if (!ocrResponse.ok || !ocrResult.success) {
        console.error('Erro no OCR:', ocrResult.error)
        // Fallback para dados vazios
        setOcrResult({
          success: false,
          dados: {
            fornecedor: null,
            cnpj: null,
            valor: null,
            data: new Date().toISOString().split('T')[0],
            descricao: '',
            forma_pagamento: 'pix',
            categoria_sugerida: null,
            confianca: 0
          },
          categoria_id: null,
          fornecedor_id: null,
          image_url: publicUrl
        })
        setStep('review')
        toast.warning('OCR não conseguiu extrair dados', {
          description: ocrResult.error || 'Preencha os dados manualmente.'
        })
        return
      }

      // Sucesso! Dados extraídos
      setOcrResult({
        success: true,
        dados: ocrResult.dados,
        categoria_id: null,
        fornecedor_id: null,
        image_url: publicUrl
      })
      setStep('review')
      
      const confianca = ocrResult.dados?.confianca || 0
      if (confianca >= 0.7) {
        toast.success('Dados extraídos com sucesso!', {
          description: `Confiança: ${Math.round(confianca * 100)}%`
        })
      } else {
        toast.info('Dados extraídos - verifique antes de confirmar', {
          description: `Confiança: ${Math.round(confianca * 100)}%`
        })
      }

    } catch (error) {
      console.error('Erro no processamento:', error)
      toast.error('Erro ao processar imagem', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      })
      setStep('capture')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = async (data: {
    descricao: string
    valor: string
    data: string
    fornecedor_id: string
    categoria_id: string
    etapa_relacionada_id?: string
    forma_pagamento: 'dinheiro' | 'pix' | 'cartao' | 'boleto' | 'cheque'
    parcelas?: string
    nota_fiscal_numero?: string
    observacoes?: string
    nota_fiscal_url: string
  }) => {
    if (!currentUser) {
      toast.error('Usuário não encontrado')
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const valorTotal = parseFloat(data.valor)
      const numParcelas = parseInt(data.parcelas || '1')
      
      const { error } = await supabase.from('compras').insert({
        descricao: data.descricao,
        valor_total: valorTotal,
        data_compra: data.data,
        categoria_id: data.categoria_id,
        fornecedor_id: data.fornecedor_id,
        etapa_relacionada_id: data.etapa_relacionada_id || null,
        forma_pagamento: data.forma_pagamento,
        parcelas: numParcelas,
        data_primeira_parcela: data.data,
        nota_fiscal_url: data.nota_fiscal_url,
        nota_fiscal_numero: data.nota_fiscal_numero || null,
        observacoes: data.observacoes || null,
        criado_por: currentUser.id,
        criado_via: 'ocr',
        status: 'ativa',
        valor_pago: valorTotal, // Marcando como já pago
        parcelas_pagas: numParcelas,
      })

      if (error) throw error

      toast.success('Compra registrada com sucesso!')
      router.push('/compras')
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar compra', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setStep('capture')
    setImageUrl('')
    setImageFile(null)
    setOcrResult(null)
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/compras">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Compra via Foto
          </h1>
          <p className="text-muted-foreground">
            Tire uma foto do recibo e os dados serão extraídos automaticamente
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      {step === 'capture' && (
        <CameraCapture
          onCapture={handleCapture}
          onCancel={() => router.back()}
          isLoading={isProcessing}
        />
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin text-6xl mb-4">🔄</div>
          <h2 className="text-xl font-semibold mb-2">Processando imagem...</h2>
          <p className="text-muted-foreground">
            Estamos extraindo os dados do recibo com IA
          </p>
        </div>
      )}

      {step === 'review' && ocrResult && (
        <div className="space-y-6">
          <PreviewOcr
            imageUrl={imageUrl}
            dados={ocrResult.dados}
          />
          
          <FormOcr
            dados={ocrResult.dados}
            categoriaId={ocrResult.categoria_id}
            fornecedorId={ocrResult.fornecedor_id}
            imageUrl={imageUrl}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  )
}

