import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseString } from 'xml2js'
import { promisify } from 'util'
import { ImapFlow } from 'imapflow'
import type { Json } from '@/lib/types/database'
import { formatDateToString } from '@/lib/utils'

const parseXml = promisify(parseString)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Estrutura de dados extraídos
interface DadosExtraidos {
  fornecedor: string | null
  cnpj: string | null
  valor: number | null
  data: string | null
  numero_nf: string | null
  descricao: string | null
  forma_pagamento: string | null
  categoria_sugerida: string | null
  confianca: number
}

// Baixar anexo do IMAP
async function baixarAnexo(uid: number, part: string): Promise<Buffer | null> {
  if (!process.env.EMAIL_IMAP_HOST || !process.env.EMAIL_IMAP_USER || !process.env.EMAIL_IMAP_PASSWORD) {
    throw new Error('Credenciais IMAP não configuradas')
  }

  console.log('[PROCESS] Conectando ao IMAP para baixar anexo...')
  
  const client = new ImapFlow({
    host: process.env.EMAIL_IMAP_HOST,
    port: parseInt(process.env.EMAIL_IMAP_PORT || '993'),
    secure: true,
    auth: {
      user: process.env.EMAIL_IMAP_USER,
      pass: process.env.EMAIL_IMAP_PASSWORD,
    },
    logger: false,
  })

  await client.connect()
  const lock = await client.getMailboxLock('INBOX')

  try {
    console.log('[PROCESS] Baixando anexo uid:', uid, 'part:', part)
    
    const { content } = await client.download(uid.toString(), part, { uid: true })
    
    if (!content) {
      return null
    }

    const chunks: Buffer[] = []
    for await (const chunk of content) {
      chunks.push(Buffer.from(chunk))
    }
    
    const buffer = Buffer.concat(chunks)
    console.log('[PROCESS] Anexo baixado, tamanho:', buffer.length, 'bytes')
    return buffer

  } finally {
    lock.release()
    await client.logout()
  }
}

// Processar imagem com Gemini Vision (OCR)
async function processarImagem(base64: string): Promise<DadosExtraidos> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada')
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
  
  console.log('[GEMINI] Enviando imagem para processamento...')
  
  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
  "numero_nf": "Número da NF ou null",
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
              data: base64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10240,
      }
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('[GEMINI] Erro HTTP:', response.status, errorBody)
    throw new Error(`Erro na API Gemini (HTTP ${response.status}): ${errorBody.substring(0, 200)}`)
  }

  const result = await response.json()
  console.log('[GEMINI] Resposta recebida:', JSON.stringify(result).substring(0, 500))
  
  const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!textResponse) {
    const finishReason = result.candidates?.[0]?.finishReason
    const safetyRatings = result.candidates?.[0]?.safetyRatings
    console.error('[GEMINI] Resposta vazia. finishReason:', finishReason, 'safetyRatings:', safetyRatings)
    throw new Error(`Resposta vazia do Gemini. Motivo: ${finishReason || 'desconhecido'}`)
  }

  console.log('[GEMINI] Texto extraído:', textResponse.substring(0, 300))
  
  const cleanJson = textResponse.replace(/```json\n?|```\n?/g, '').trim()
  
  try {
    const dados = JSON.parse(cleanJson)
    // Adicionar resposta bruta para debug
    dados._gemini_raw = textResponse
    return dados
  } catch (parseError) {
    console.error('[GEMINI] Erro ao parsear JSON:', cleanJson)
    throw new Error(`Erro ao parsear resposta do Gemini: ${cleanJson.substring(0, 100)}`)
  }
}

// Processar PDF - enviar diretamente para Gemini (suporta PDF nativo)
async function processarPDF(buffer: Buffer): Promise<DadosExtraidos> {
  console.log('[PDF] Iniciando processamento, tamanho do buffer:', buffer.length)
  
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada')
  }

  // Converter PDF para base64 e enviar diretamente ao Gemini
  const base64 = buffer.toString('base64')
  console.log('[PDF] PDF convertido para base64, tamanho:', base64.length)

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
  
  console.log('[GEMINI] Enviando PDF diretamente para análise...')
  
  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: `Analise este documento PDF (nota fiscal/recibo) e extraia as informações.
Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) no formato:
{
  "fornecedor": "Nome do estabelecimento ou null",
  "cnpj": "CNPJ se encontrado ou null",
  "valor": 123.45,
  "data": "2024-12-08",
  "numero_nf": "Número da NF ou null",
  "descricao": "Descrição dos itens/serviço",
  "forma_pagamento": "pix",
  "categoria_sugerida": "Categoria provável (Material, Mão de Obra, Elétrica, Hidráulica, etc)",
  "confianca": 0.85
}

Regras:
- valor deve ser número decimal (ex: 150.00) - soma total da NF
- data deve ser formato ISO (YYYY-MM-DD)
- forma_pagamento deve ser: pix, dinheiro, cartao, boleto ou cheque (ou null se não souber)
- confianca de 0 a 1 indicando quão certo você está dos dados
- Se não conseguir extrair algum campo, use null
- Retorne APENAS o JSON, nada mais`
          },
          {
            inline_data: {
              mime_type: 'application/pdf',
              data: base64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10240,
      }
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('[GEMINI] Erro HTTP:', response.status, errorBody)
    throw new Error(`Erro na API Gemini (HTTP ${response.status}): ${errorBody.substring(0, 200)}`)
  }

  const result = await response.json()
  console.log('[GEMINI] Resposta recebida:', JSON.stringify(result).substring(0, 500))
  
  const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!textResponse) {
    const finishReason = result.candidates?.[0]?.finishReason
    const safetyRatings = result.candidates?.[0]?.safetyRatings
    console.error('[GEMINI] Resposta vazia. finishReason:', finishReason, 'safetyRatings:', safetyRatings)
    throw new Error(`Resposta vazia do Gemini. Motivo: ${finishReason || 'desconhecido'}`)
  }

  console.log('[GEMINI] Texto extraído:', textResponse.substring(0, 300))
  
  const cleanJson = textResponse.replace(/```json\n?|```\n?/g, '').trim()
  
  try {
    const dados = JSON.parse(cleanJson)
    // Adicionar resposta bruta para debug
    dados._gemini_raw = textResponse
    return dados
  } catch (parseError) {
    console.error('[GEMINI] Erro ao parsear JSON:', cleanJson)
    throw new Error(`Erro ao parsear resposta do Gemini: ${cleanJson.substring(0, 100)}`)
  }
}

// Processar XML de NF-e - parser direto
async function processarXML(buffer: Buffer): Promise<DadosExtraidos> {
  const xmlString = buffer.toString('utf-8')
  
  console.log('[PROCESS] XML recebido:', xmlString.substring(0, 500))
  
  try {
    const result = await parseXml(xmlString) as Record<string, any>
    
    // Estrutura padrão de NF-e
    const nfe = result?.nfeProc?.NFe?.infNFe || result?.NFe?.infNFe || result?.infNFe
    
    if (nfe) {
      const emit = nfe.emit || {}
      const fornecedor = emit.xNome || emit.xFant || null
      const cnpj = emit.CNPJ || emit.CPF || null
      
      const ide = nfe.ide || {}
      const numero_nf = ide.nNF || null
      const dataEmissao = ide.dhEmi || ide.dEmi || null
      
      const total = nfe.total?.ICMSTot || {}
      const valor = parseFloat(total.vNF) || parseFloat(total.vProd) || null
      
      interface NFeDetalhe { prod?: { xProd?: string } }

      const det = nfe.det
      let descricao = ''
      if (Array.isArray(det)) {
        descricao = det.map((d: NFeDetalhe) => d.prod?.xProd).filter(Boolean).join(', ')
      } else if (det?.prod?.xProd) {
        descricao = det.prod.xProd
      }
      
      const pag = nfe.pag?.detPag || nfe.pag
      let forma_pagamento: string | null = null
      if (pag) {
        const tPag = Array.isArray(pag) ? pag[0]?.tPag : pag.tPag
        const formas: Record<string, string> = {
          '01': 'dinheiro', '02': 'cheque', '03': 'cartao', '04': 'cartao',
          '05': 'cartao', '10': 'boleto', '11': 'boleto', '17': 'pix',
        }
        forma_pagamento = formas[tPag] || null
      }
      
      let dataFormatada: string | null = null
      if (dataEmissao) {
        const date = new Date(dataEmissao)
        if (!isNaN(date.getTime())) {
          dataFormatada = formatDateToString(date)
        }
      }
      
      return {
        fornecedor, cnpj, valor,
        data: dataFormatada,
        numero_nf,
        descricao: descricao.substring(0, 500) || 'Nota Fiscal Eletrônica',
        forma_pagamento,
        categoria_sugerida: 'Material',
        confianca: 0.95
      }
    }
    
    return {
      fornecedor: null, cnpj: null, valor: null, data: null, numero_nf: null,
      descricao: 'XML não reconhecido como NF-e',
      forma_pagamento: null, categoria_sugerida: null, confianca: 0.3
    }
    
  } catch (parseError) {
    console.error('[PROCESS] Erro ao parsear XML:', parseError)
    return {
      fornecedor: null, cnpj: null, valor: null, data: null, numero_nf: null,
      descricao: 'Erro ao processar XML',
      forma_pagamento: null, categoria_sugerida: null, confianca: 0
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada no .env.local' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Buscar emails pendentes
    const { data: emails, error: fetchError } = await supabase
      .from('emails_monitorados')
      .select('*')
      .in('status', ['nao_processado', 'erro'])
      .limit(5)

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (!emails || emails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: 'Nenhum email pendente para processar' 
      })
    }

    console.log('[EMAIL PROCESS] Emails pendentes:', emails.length)

    let processed = 0

    for (const email of emails) {
      try {
        console.log('[EMAIL PROCESS] Processando:', email.id, email.assunto)

        await supabase
          .from('emails_monitorados')
          .update({ status: 'processando' })
          .eq('id', email.id)

        const anexos = email.anexos as Array<{
          nome: string
          tipo: string
          tamanho: number
          part: string
          uid: number
        }> | null

        if (!anexos || anexos.length === 0) {
          console.log('[EMAIL PROCESS] Sem anexos')
          await supabase
            .from('emails_monitorados')
            .update({
              status: 'aguardando_revisao',
              dados_extraidos: { confianca: 0 },
              erro_mensagem: 'Email sem anexos processáveis',
              processado_em: new Date().toISOString(),
            })
            .eq('id', email.id)
          processed++
          continue
        }

        let dadosExtraidos: DadosExtraidos | null = null
        const errosAnexos: string[] = []
        let anexosProcessados = 0
        let anexosNaoSuportados: string[] = []

        for (const anexo of anexos) {
          console.log('[EMAIL PROCESS] Processando anexo:', anexo.nome, anexo.tipo)

          try {
            // Baixar anexo do IMAP
            const buffer = await baixarAnexo(anexo.uid, anexo.part)
            
            if (!buffer) {
              const msg = `Anexo "${anexo.nome}": falha ao baixar do servidor IMAP`
              console.log('[EMAIL PROCESS]', msg)
              errosAnexos.push(msg)
              continue
            }

            // Processar baseado no tipo
            if (anexo.tipo.includes('image')) {
              console.log('[EMAIL PROCESS] Processando como IMAGEM (OCR)...')
              const base64 = buffer.toString('base64')
              dadosExtraidos = await processarImagem(base64)
              anexosProcessados++
            } else if (anexo.tipo.includes('pdf')) {
              console.log('[EMAIL PROCESS] Processando como PDF...')
              dadosExtraidos = await processarPDF(buffer)
              anexosProcessados++
            } else if (anexo.tipo.includes('xml')) {
              console.log('[EMAIL PROCESS] Processando como XML (NF-e)...')
              dadosExtraidos = await processarXML(buffer)
              anexosProcessados++
            } else {
              anexosNaoSuportados.push(`${anexo.nome} (${anexo.tipo})`)
              console.log('[EMAIL PROCESS] Tipo de anexo não suportado:', anexo.tipo)
              continue
            }

            if (dadosExtraidos && dadosExtraidos.confianca >= 0.5) {
              console.log('[EMAIL PROCESS] Dados extraídos! Confiança:', dadosExtraidos.confianca)
              break
            } else if (dadosExtraidos) {
              errosAnexos.push(`Anexo "${anexo.nome}": confiança baixa (${(dadosExtraidos.confianca * 100).toFixed(0)}%)`)
            }
          } catch (processError) {
            const errorMsg = processError instanceof Error ? processError.message : 'Erro desconhecido'
            console.error('[EMAIL PROCESS] Erro ao processar anexo:', processError)
            errosAnexos.push(`Anexo "${anexo.nome}": ${errorMsg}`)
          }
        }

        // Montar mensagem de erro detalhada
        let erroDetalhado = ''
        if (anexosNaoSuportados.length > 0) {
          erroDetalhado += `Tipos não suportados: ${anexosNaoSuportados.join(', ')}. `
        }
        if (errosAnexos.length > 0) {
          erroDetalhado += `Erros: ${errosAnexos.join('; ')}. `
        }
        if (anexosProcessados === 0 && anexos.length > 0) {
          erroDetalhado += `Nenhum dos ${anexos.length} anexos pôde ser processado. `
        }

        // Salvar resultados
        if (dadosExtraidos && dadosExtraidos.confianca > 0) {
          await supabase
            .from('emails_monitorados')
            .update({
              status: 'aguardando_revisao',
              dados_extraidos: dadosExtraidos as unknown as Json,
              erro_mensagem: erroDetalhado || null,
              processado_em: new Date().toISOString(),
            })
            .eq('id', email.id)
          
          console.log('[EMAIL PROCESS] Email processado com sucesso!')
        } else {
          const mensagemFinal = erroDetalhado || 
            'Não foi possível extrair dados dos anexos (nenhum dado com confiança suficiente)'
          
          await supabase
            .from('emails_monitorados')
            .update({
              status: 'aguardando_revisao',
              dados_extraidos: (dadosExtraidos || { confianca: 0 }) as unknown as Json,
              erro_mensagem: mensagemFinal,
              processado_em: new Date().toISOString(),
            })
            .eq('id', email.id)
          
          console.log('[EMAIL PROCESS] Falha ao extrair dados:', mensagemFinal)
        }

        processed++

      } catch (emailError) {
        console.error('[EMAIL PROCESS] Erro:', email.id, emailError)
        
        await supabase
          .from('emails_monitorados')
          .update({
            status: 'erro',
            erro_mensagem: emailError instanceof Error ? emailError.message : 'Erro desconhecido',
          })
          .eq('id', email.id)
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total: emails.length,
      message: `${processed} de ${emails.length} emails processados`,
    })

  } catch (error) {
    console.error('[EMAIL PROCESS] Erro geral:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar emails' },
      { status: 500 }
    )
  }
}
