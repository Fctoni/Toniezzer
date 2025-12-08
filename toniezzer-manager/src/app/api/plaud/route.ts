import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Tipo para as ações extraídas
interface AcaoExtraida {
  tipo: 'decisao' | 'tarefa' | 'gasto' | 'problema' | 'mudanca_escopo'
  descricao: string
  responsavel?: string
  prazo?: string
  valor?: number
  categoria_sugerida?: string
}

interface DadosExtraidos {
  decisoes: AcaoExtraida[]
  tarefas: AcaoExtraida[]
  gastos: AcaoExtraida[]
  problemas: AcaoExtraida[]
  mudancas_escopo: AcaoExtraida[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { markdown, reuniao_id, autor_id } = body

    console.log('[PLAUD] Recebida requisição para processar reunião:', reuniao_id)

    if (!markdown) {
      return NextResponse.json({ error: 'Markdown não fornecido' }, { status: 400 })
    }

    if (!reuniao_id) {
      return NextResponse.json({ error: 'ID da reunião não fornecido' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      console.error('[PLAUD] GEMINI_API_KEY não encontrada!')
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 })
    }

    // Criar cliente Supabase (RLS desabilitado no MVP)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Chamar Gemini para extrair ações do markdown
    console.log('[PLAUD] Chamando Gemini para extrair ações...')
    
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    
    const geminiBody = {
      contents: [{
        parts: [{
          text: `Analise este resumo de reunião em Markdown e extraia as informações estruturadas.

MARKDOWN DA REUNIÃO:
${markdown}

---

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) no formato:
{
  "decisoes": [
    {"tipo": "decisao", "descricao": "texto da decisão"}
  ],
  "tarefas": [
    {"tipo": "tarefa", "descricao": "descrição da tarefa", "responsavel": "nome ou null", "prazo": "YYYY-MM-DD ou null"}
  ],
  "gastos": [
    {"tipo": "gasto", "descricao": "descrição do gasto", "valor": 1234.56, "categoria_sugerida": "Material|Mão de Obra|Elétrica|Hidráulica|etc"}
  ],
  "problemas": [
    {"tipo": "problema", "descricao": "descrição do problema identificado"}
  ],
  "mudancas_escopo": [
    {"tipo": "mudanca_escopo", "descricao": "descrição da mudança", "valor": 1000.00}
  ]
}

Regras:
- Extraia TODAS as decisões mencionadas no documento
- Extraia TODAS as tarefas/action items, incluindo responsável e prazo se disponíveis
- Extraia TODOS os gastos mencionados com valores em número decimal
- Identifique problemas ou riscos mencionados
- Identifique mudanças de escopo com impacto financeiro se houver
- Se um campo não estiver disponível, use null
- Valores monetários devem ser números decimais (ex: 1500.00)
- Datas devem estar no formato YYYY-MM-DD
- Se não houver itens de alguma categoria, retorne array vazio []
- Retorne APENAS o JSON, nada mais`
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 204800,
      }
    }

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    })

    console.log('[PLAUD] Resposta Gemini status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[PLAUD] Erro Gemini:', response.status, errorText)
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao processar com Gemini',
        details: errorText
      }, { status: 500 })
    }

    const result = await response.json()
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textResponse) {
      return NextResponse.json({ 
        success: false,
        error: 'Resposta vazia do Gemini' 
      }, { status: 500 })
    }

    // Extrair JSON da resposta
    let cleanJson = textResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let dados: DadosExtraidos
    try {
      dados = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('[PLAUD] Erro ao fazer parse:', cleanJson)
      return NextResponse.json({ 
        success: false,
        error: 'Resposta do Gemini não é JSON válido',
        raw: textResponse 
      }, { status: 500 })
    }

    console.log('[PLAUD] Dados extraídos:', JSON.stringify(dados, null, 2))

    // Buscar usuários para matching de responsáveis
    const { data: usuarios } = await supabase
      .from('users')
      .select('id, nome_completo')
      .eq('ativo', true)

    // Buscar categorias para matching
    const { data: categorias } = await supabase
      .from('categorias')
      .select('id, nome')
      .eq('ativo', true)

    // Função para encontrar usuário por nome (matching aproximado)
    const findUsuario = (nome: string | undefined | null) => {
      if (!nome || !usuarios) return null
      const nomeNorm = nome.toLowerCase().trim()
      const usuario = usuarios.find(u => 
        u.nome_completo.toLowerCase().includes(nomeNorm) ||
        nomeNorm.includes(u.nome_completo.toLowerCase().split(' ')[0])
      )
      return usuario?.id || null
    }

    // Função para encontrar categoria por nome (matching aproximado)
    const findCategoria = (nome: string | undefined | null) => {
      if (!nome || !categorias) return null
      const nomeNorm = nome.toLowerCase().trim()
      const categoria = categorias.find(c => 
        c.nome.toLowerCase().includes(nomeNorm) ||
        nomeNorm.includes(c.nome.toLowerCase())
      )
      return categoria?.id || null
    }

    // Consolidar todas as ações em uma lista para inserir
    const acoesParaInserir: Array<{
      reuniao_id: string
      tipo: 'decisao' | 'tarefa' | 'gasto' | 'problema' | 'mudanca_escopo'
      descricao: string
      responsavel_id: string | null
      prazo: string | null
      valor: number | null
      categoria_id: string | null
      status: 'pendente'
    }> = []

    // Processar decisões
    for (const item of dados.decisoes || []) {
      acoesParaInserir.push({
        reuniao_id,
        tipo: 'decisao',
        descricao: item.descricao,
        responsavel_id: null,
        prazo: null,
        valor: null,
        categoria_id: null,
        status: 'pendente'
      })
    }

    // Processar tarefas
    for (const item of dados.tarefas || []) {
      acoesParaInserir.push({
        reuniao_id,
        tipo: 'tarefa',
        descricao: item.descricao,
        responsavel_id: findUsuario(item.responsavel),
        prazo: item.prazo || null,
        valor: null,
        categoria_id: null,
        status: 'pendente'
      })
    }

    // Processar gastos
    for (const item of dados.gastos || []) {
      acoesParaInserir.push({
        reuniao_id,
        tipo: 'gasto',
        descricao: item.descricao,
        responsavel_id: null,
        prazo: null,
        valor: item.valor || null,
        categoria_id: findCategoria(item.categoria_sugerida),
        status: 'pendente'
      })
    }

    // Processar problemas
    for (const item of dados.problemas || []) {
      acoesParaInserir.push({
        reuniao_id,
        tipo: 'problema',
        descricao: item.descricao,
        responsavel_id: null,
        prazo: null,
        valor: null,
        categoria_id: null,
        status: 'pendente'
      })
    }

    // Processar mudanças de escopo
    for (const item of dados.mudancas_escopo || []) {
      acoesParaInserir.push({
        reuniao_id,
        tipo: 'mudanca_escopo',
        descricao: item.descricao,
        responsavel_id: null,
        prazo: null,
        valor: item.valor || null,
        categoria_id: null,
        status: 'pendente'
      })
    }

    // Inserir todas as ações no banco
    let acoesCriadas = 0
    if (acoesParaInserir.length > 0) {
      const { data: acoesInseridas, error: insertError } = await supabase
        .from('reunioes_acoes')
        .insert(acoesParaInserir)
        .select()

      if (insertError) {
        console.error('[PLAUD] Erro ao inserir ações:', insertError)
        // Não falhar completamente, apenas logar
      } else {
        acoesCriadas = acoesInseridas?.length || 0
        console.log('[PLAUD] Ações criadas:', acoesCriadas)
      }
    }

    // Criar post no feed de comunicação para decisões importantes
    if ((dados.decisoes?.length || 0) > 0) {
      const decisoesTexto = dados.decisoes
        .map((d, i) => `${i + 1}. ${d.descricao}`)
        .join('\n')

      await supabase.from('feed_comunicacao').insert({
        tipo: 'decisao',
        conteudo: `📋 **Decisões da Reunião**\n\n${decisoesTexto}`,
        autor_id: autor_id,
        reuniao_relacionada_id: reuniao_id
      })
    }

    return NextResponse.json({
      success: true,
      acoes_criadas: acoesCriadas,
      resumo: {
        decisoes: dados.decisoes?.length || 0,
        tarefas: dados.tarefas?.length || 0,
        gastos: dados.gastos?.length || 0,
        problemas: dados.problemas?.length || 0,
        mudancas_escopo: dados.mudancas_escopo?.length || 0
      }
    })

  } catch (error) {
    console.error('[PLAUD] Erro no processamento:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  }
}

