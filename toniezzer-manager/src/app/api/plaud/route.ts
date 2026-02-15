import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { fetchActiveCategories } from '@/lib/services/categorias'
import { fetchUsersForDropdown } from '@/lib/services/users'
import { createActions } from '@/lib/services/reunioes-acoes'
import { createDecisionPost } from '@/lib/services/feed-comunicacao'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// ===== Zod Schema =====

const processPlaudSchema = z.object({
  markdown: z.string().min(1, 'Markdown nao fornecido'),
  reuniao_id: z.string().uuid('ID da reuniao invalido'),
  autor_id: z.string().uuid().optional(),
})

// Tipo para as ações extraídas
interface ExtractedAction {
  tipo: 'decisao' | 'tarefa' | 'gasto' | 'problema' | 'mudanca_escopo'
  descricao: string
  responsavel?: string
  prazo?: string
  valor?: number
  categoria_sugerida?: string
}

interface ExtractedData {
  decisoes: ExtractedAction[]
  tarefas: ExtractedAction[]
  gastos: ExtractedAction[]
  problemas: ExtractedAction[]
  mudancas_escopo: ExtractedAction[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = processPlaudSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { markdown, reuniao_id, autor_id } = result.data

    console.log('[PLAUD] Recebida requisição para processar reunião:', reuniao_id)

    if (!GEMINI_API_KEY) {
      console.error('[PLAUD] GEMINI_API_KEY não encontrada!')
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 })
    }

    const supabase = await createClient()

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

    const geminiResult = await response.json()
    const textResponse = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text

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

    let dados: ExtractedData
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
    const usuarios = await fetchUsersForDropdown(supabase)

    // Buscar categorias para matching
    const categorias = await fetchActiveCategories(supabase)

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
    const actionsToInsert: Array<{
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
      actionsToInsert.push({
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
      actionsToInsert.push({
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
      actionsToInsert.push({
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
      actionsToInsert.push({
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
      actionsToInsert.push({
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
    let actionsCreated = 0
    if (actionsToInsert.length > 0) {
      try {
        const insertedActions = await createActions(supabase, actionsToInsert)
        actionsCreated = insertedActions.length
        console.log('[PLAUD] Ações criadas:', actionsCreated)
      } catch (insertError) {
        console.error('[PLAUD] Erro ao inserir ações:', insertError)
      }
    }

    // Criar post no feed de comunicação para decisões importantes
    if ((dados.decisoes?.length || 0) > 0 && autor_id) {
      const decisionsText = dados.decisoes
        .map((d, i) => `${i + 1}. ${d.descricao}`)
        .join('\n')

      await createDecisionPost(supabase, {
        tipo: 'decisao',
        conteudo: `📋 **Decisões da Reunião**\n\n${decisionsText}`,
        autor_id,
        reuniao_relacionada_id: reuniao_id
      })
    }

    return NextResponse.json({
      success: true,
      acoes_criadas: actionsCreated,
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
