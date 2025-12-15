import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image_base64 } = body

    console.log('[OCR] Recebida requisição, tamanho base64:', image_base64?.length || 0)

    if (!image_base64) {
      return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      console.error('[OCR] GEMINI_API_KEY não encontrada!')
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada no .env.local' }, { status: 500 })
    }

    console.log('[OCR] API Key encontrada, chamando Gemini...')

    // Chamar Gemini Vision diretamente
    // Usando Gemini 2.5 Flash (rápido, inteligente e estável)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    
    const geminiBody = {
      contents: [{
        parts: [
          {
            text: `Analise esta imagem de um recibo/nota fiscal e extraia as informações.
Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) no formato:
{
  "fornecedor": "Nome do estabelecimento ou null",
  "cnpj": "CNPJ se visível ou null",
  "valor": 123.45,
  "data": "2024-12-08",
  "descricao": "Descrição dos itens/serviço",
  "forma_pagamento": "pix",
  "categoria_sugerida": "Categoria provável (Material, Mão de Obra, Elétrica, Hidráulica, etc)",
  "confianca": 0.85
}

Regras:
- valor deve ser número decimal (ex: 150.00)
- data deve ser formato ISO (YYYY-MM-DD)
- forma_pagamento deve ser: pix, dinheiro, cartao, boleto ou cheque
- confianca de 0 a 1 indicando quão certo você está dos dados
- Se não conseguir extrair algum campo, use null
- Retorne APENAS o JSON, nada mais`
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: image_base64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      }
    }

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    })

    console.log('[OCR] Resposta Gemini status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[OCR] Erro Gemini:', response.status, errorText)
      return NextResponse.json({ 
        error: 'Erro ao processar imagem com Gemini',
        details: errorText,
        status: response.status
      }, { status: 500 })
    }

    const result = await response.json()
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textResponse) {
      return NextResponse.json({ error: 'Resposta vazia do Gemini' }, { status: 500 })
    }

    // Extrair JSON da resposta (remover possíveis marcações markdown)
    let cleanJson = textResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Tentar fazer parse do JSON
    let dados
    try {
      dados = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Erro ao fazer parse:', cleanJson)
      return NextResponse.json({ 
        error: 'Resposta do Gemini não é JSON válido',
        raw: textResponse 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      dados
    })

  } catch (error) {
    console.error('Erro no OCR:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

