# PLANO: Relatório Matriz Categoria × Etapa

**Data de Criação:** 17/12/2024  
**Objetivo:** Visualizar gastos cruzando categorias e etapas em uma matriz interativa

---

## 📋 1. RESUMO EXECUTIVO

### Problema
Atualmente o app mostra:
- ✅ Gastos por categoria (dimensão funcional)
- ✅ Gastos por mês (dimensão temporal)
- ❌ **Gastos por etapa (dimensão de cronograma)** → FALTANDO
- ❌ **Gastos cruzados categoria × etapa** → FALTANDO

### Solução
Criar página `/financeiro/matriz-gastos` com:
- Tabela matriz mostrando interseção Categoria × Etapa
- Gráfico visual (barras empilhadas) para visualização rápida
- Clique em célula para ver lista detalhada de gastos

### Valor para o Usuário
Responder perguntas como:
- "Quanto gastei em Materiais na Fundação?"
- "Qual etapa consumiu mais orçamento de Mão de obra?"
- "Quais categorias ainda não foram usadas na Instalação Elétrica?"

---

## 🎯 2. DECISÕES ARQUITETURAIS

### 2.1 Localização
- **Rota:** `/financeiro/matriz-gastos`
- **Menu:** Novo item no menu lateral → "Financeiro" → "Gastos por Etapa"
- **Breadcrumb:** Financeiro / Gastos por Etapa

### 2.2 Visualização
**Opção D - Combinação (Tabela + Gráfico):**
- Seção 1: Cards de resumo (totais)
- Seção 2: Gráfico de barras empilhadas (visual rápido)
- Seção 3: Tabela matriz detalhada (dados completos)

### 2.3 Funcionalidades
**Implementar:**
- ✅ Clique em célula → Modal com lista de gastos daquela combinação

**NÃO implementar (futuro):**
- ⏳ Filtros por período
- ⏳ Exportar CSV/PDF
- ⏳ Comparar com orçamento
- ⏳ Mostrar % do total

### 2.4 Casos Edge

#### a) Gastos sem etapa (etapa_relacionada_id = null)
**Decisão:** Criar coluna separada "Geral / Sem Etapa"
- Posição: Última coluna da tabela
- Label: "Geral" ou "Sem Etapa"
- Sempre visível (mesmo se vazia)

#### b) Etapas sem gastos
**Decisão:** Mostrar coluna vazia
- Mantém visibilidade de todas as etapas
- Ajuda a identificar etapas sem custos registrados
- Valor exibido: "R$ 0,00" ou "-"

#### c) Categorias sem gastos
**Decisão:** Mostrar linha vazia
- Mantém visibilidade de todas as categorias
- Valor exibido: "R$ 0,00" ou "-"

#### d) Muitas etapas/categorias
**Decisão:** Scroll horizontal
- Tabela com overflow-x-auto
- Header fixo (sticky)
- Primeira coluna (categorias) também fixa (sticky left)
- Indicador visual de "mais conteúdo" (sombra/gradiente)

---

## 📐 3. MOCKUP DA INTERFACE

### Layout Completo

```
┌─────────────────────────────────────────────────────────────┐
│ [Icon] Relatório Matriz de Gastos                          │
│ Visualize gastos cruzando categorias e etapas da obra      │
│                                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ Total Gasto  │ │ Categorias   │ │ Etapas       │        │
│ │ R$ 450.000   │ │ Ativas: 8    │ │ Total: 12    │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Gráfico de Barras Empilhadas]                          ││
│ │                                                          ││
│ │  Fundação    ████████░░░░                               ││
│ │  Alvenaria   ██████████████░░                           ││
│ │  Instalações ████████░░░░░░                             ││
│ │              └────────────────────────────────┘         ││
│ │              Materiais  Mão de obra  Equipamentos       ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ MATRIZ DETALHADA                      [Exportar] [?]    ││
│ ├─────────────────────────────────────────────────────────┤│
│ │                │ Fundação│ Alvenaria│ Instalações│Geral │Total  ││
│ │────────────────┼─────────┼──────────┼────────────┼──────┼───────││
│ │ 🟦 Materiais   │ 30.000  │  80.000  │   40.000   │ 5.000│155.000││ ← Maior
│ │ 🟩 Mão de obra │ 20.000  │  40.000  │   30.000   │   -  │ 90.000││
│ │ 🟨 Equipamentos│ 10.000  │  15.000  │    5.000   │ 2.000│ 32.000││
│ │ 🟥 Impostos    │  5.000  │   8.000  │    3.000   │ 1.000│ 17.000││ ← Menor
│ │────────────────┼─────────┼──────────┼────────────┼──────┼───────││
│ │ TOTAL          │ 65.000  │ 143.000  │   78.000   │ 8.000│294.000││
│ │                │    ↑         ↑           ↑         ↑            ││
│ │                │ Ordem cronológica (campo ordem) →  Geral        ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [Clique em qualquer célula para ver os gastos detalhados]  │
└─────────────────────────────────────────────────────────────┘
```

### Modal de Detalhes (ao clicar em célula)

```
┌───────────────────────────────────────────────────────┐
│ Gastos: Materiais > Fundação                    [X]   │
├───────────────────────────────────────────────────────┤
│                                                        │
│ Total: R$ 30.000,00 (6 gastos)                        │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ Data       │ Descrição        │ Valor          │   │
│ ├────────────┼──────────────────┼────────────────┤   │
│ │ 15/01/2024 │ Cimento 50 sacos │ R$ 1.500,00    │   │
│ │ 20/01/2024 │ Areia 10m³       │ R$ 800,00      │   │
│ │ 25/01/2024 │ Brita 15m³       │ R$ 1.200,00    │   │
│ │ 05/02/2024 │ Ferragens        │ R$ 8.500,00    │   │
│ │ 10/02/2024 │ Madeira p/ forma │ R$ 3.000,00    │   │
│ │ 28/02/2024 │ Concreto usinado │ R$ 15.000,00   │   │
│ └────────────┴──────────────────┴────────────────┘   │
│                                                        │
│                    [Fechar]  [Exportar Lista]          │
└───────────────────────────────────────────────────────┘
```

---

## 💾 4. ESTRUTURA DE DADOS

### 4.1 Query SQL Principal

```sql
-- Buscar todas as combinações categoria × etapa com valores
SELECT 
  c.id as categoria_id,
  c.nome as categoria_nome,
  c.cor as categoria_cor,
  c.ordem as categoria_ordem,
  COALESCE(e.id, 'sem_etapa') as etapa_id,
  COALESCE(e.nome, 'Geral') as etapa_nome,
  COALESCE(e.ordem, 9999) as etapa_ordem,
  COALESCE(SUM(g.valor), 0) as total_gasto,
  COUNT(g.id) as quantidade_gastos
FROM categorias c
CROSS JOIN etapas e
LEFT JOIN gastos g ON 
  g.categoria_id = c.id 
  AND g.etapa_relacionada_id = e.id
  AND g.status = 'aprovado'
WHERE c.ativo = true
GROUP BY c.id, c.nome, c.cor, c.ordem, e.id, e.nome, e.ordem

UNION ALL

-- Incluir gastos sem etapa
SELECT 
  c.id as categoria_id,
  c.nome as categoria_nome,
  c.cor as categoria_cor,
  c.ordem as categoria_ordem,
  'sem_etapa' as etapa_id,
  'Geral' as etapa_nome,
  9999 as etapa_ordem,
  COALESCE(SUM(g.valor), 0) as total_gasto,
  COUNT(g.id) as quantidade_gastos
FROM categorias c
LEFT JOIN gastos g ON 
  g.categoria_id = c.id 
  AND g.etapa_relacionada_id IS NULL
  AND g.status = 'aprovado'
WHERE c.ativo = true
GROUP BY c.id, c.nome, c.cor, c.ordem

ORDER BY total_gasto DESC, etapa_ordem;
```

### 4.2 Query para Detalhes (ao clicar célula)

```sql
SELECT 
  g.id,
  g.descricao,
  g.valor,
  g.data,
  g.forma_pagamento,
  g.nota_fiscal_numero,
  g.parcela_atual,
  g.parcelas,
  f.nome as fornecedor_nome,
  u.nome_completo as criado_por_nome
FROM gastos g
LEFT JOIN fornecedores f ON g.fornecedor_id = f.id
LEFT JOIN users u ON g.criado_por = u.id
WHERE 
  g.categoria_id = $1 
  AND (
    ($2 = 'sem_etapa' AND g.etapa_relacionada_id IS NULL)
    OR g.etapa_relacionada_id = $2
  )
  AND g.status = 'aprovado'
ORDER BY g.data DESC;
```

### 4.3 Estrutura TypeScript

```typescript
// Tipo para célula da matriz
interface CelulaMatriz {
  categoria_id: string
  categoria_nome: string
  categoria_cor: string
  etapa_id: string | 'sem_etapa'
  etapa_nome: string
  total_gasto: number
  quantidade_gastos: number
}

// Tipo para dados processados (tabela)
interface LinhaMatriz {
  categoria_id: string
  categoria_nome: string
  categoria_cor: string
  gastos_por_etapa: Record<string, number> // etapa_id -> valor
  total_categoria: number // Usado para ordenação DESC
}

// Tipo para colunas (etapas)
interface ColunaEtapa {
  etapa_id: string | 'sem_etapa'
  etapa_nome: string
  etapa_ordem: number
  total_etapa: number
}

// Tipo para detalhes do modal
interface GastoDetalhado {
  id: string
  descricao: string
  valor: number
  data: string
  forma_pagamento: string
  nota_fiscal_numero: string | null
  parcela_atual: number | null
  parcelas: number | null
  fornecedor_nome: string | null
  criado_por_nome: string | null
}
```

---

## 🏗️ 5. ARQUITETURA DE COMPONENTES

### 5.1 Estrutura de Arquivos

```
src/
├── app/
│   └── (dashboard)/
│       └── financeiro/
│           └── matriz-gastos/
│               └── page.tsx          # Server Component - query dados
│
└── components/
    └── features/
        └── financeiro/
            ├── matriz-tabela.tsx      # Client Component - tabela interativa
            ├── matriz-grafico.tsx     # Client Component - gráfico barras
            └── gastos-detalhes-modal.tsx  # Client Component - modal detalhes
```

### 5.2 Responsabilidades

#### `page.tsx` (Server Component)
- Buscar dados do Supabase (query SQL)
- Processar estrutura de matriz
- Calcular totais (por categoria, por etapa, geral)
- **Ordenar categorias por total DESC** (maior gasto primeiro)
- **Ordenar etapas por campo `ordem` ASC** (cronológica)
- Passar dados para componentes client

#### `matriz-tabela.tsx` (Client Component)
- Renderizar tabela responsiva com scroll
- Header e primeira coluna sticky
- Células clicáveis
- Formatação de valores
- Gerenciar estado do modal

#### `matriz-grafico.tsx` (Client Component)
- Gráfico de barras empilhadas (Recharts)
- Barras horizontais (etapas no eixo Y)
- Cores por categoria
- Tooltip com detalhes

#### `gastos-detalhes-modal.tsx` (Client Component)
- Modal com lista de gastos
- Buscar dados ao abrir (fetch API route)
- Tabela com gastos individuais
- Botão para fechar

### 5.3 API Route (para detalhes)

```
src/app/api/financeiro/gastos-detalhes/route.ts
```

Recebe: `categoria_id` e `etapa_id`  
Retorna: Lista de gastos detalhados

---

## 📊 6. DETALHAMENTO DO GRÁFICO

### Tipo: Barras Horizontais Empilhadas

**Eixo Y:** Etapas (Fundação, Alvenaria, Instalações, Geral)  
**Eixo X:** Valor em R$  
**Segmentos:** Categorias (cada cor = categoria)

### Configuração Recharts

```typescript
<BarChart layout="vertical" data={dados}>
  <XAxis type="number" />
  <YAxis type="category" dataKey="etapa_nome" />
  <Tooltip />
  <Legend />
  {categorias.map(cat => (
    <Bar 
      key={cat.id}
      dataKey={cat.nome}
      stackId="a"
      fill={cat.cor}
    />
  ))}
</BarChart>
```

### Interatividade
- Hover: Mostrar valor exato
- Click em barra: Scroll até linha da tabela correspondente (opcional)

---

## 🎨 7. ESTILO E UX

### 7.1 Cores
- Categorias: Usar cores definidas em `categorias.cor` (banco de dados)
- Células vazias: Background `muted/20`
- Hover em célula: Background `muted/50` + cursor pointer
- Total por linha/coluna: Background `muted` + font-bold

### 7.2 Formatação
- Valores: `R$ 1.500,00` (com centavos)
- Valores zero: Mostrar "-" ao invés de "R$ 0,00"
- Números grandes: Usar separador de milhar

### 7.3 Ordenação
- **Etapas (colunas):** Por campo `ordem` do banco (ordem cronológica/cadastrada) + coluna "Geral" sempre por último
- **Categorias (linhas):** Por total gasto DESC (categoria com maior valor total aparece primeiro)

### 7.4 Responsividade
- Desktop (>1024px): Gráfico + Tabela lado a lado
- Tablet (768-1024px): Gráfico e Tabela empilhados
- Mobile (<768px): Apenas tabela (scroll horizontal)

### 7.5 Loading States
- Skeleton para tabela
- Spinner para modal
- Desabilitar cliques durante loading

---

## 🔧 8. IMPLEMENTAÇÃO - ORDEM DE EXECUÇÃO

### Fase 1: Estrutura Base (30 min)
1. ✅ Criar página `app/(dashboard)/financeiro/matriz-gastos/page.tsx`
2. ✅ Adicionar link no menu lateral (sidebar)
3. ✅ Criar layout básico (header + cards de resumo)

### Fase 2: Query e Processamento (45 min)
4. ✅ Implementar query SQL no Supabase
5. ✅ Processar dados em estrutura de matriz
6. ✅ Calcular totais (linhas, colunas, geral)
7. ✅ Passar dados para componentes

### Fase 3: Tabela Matriz (60 min)
8. ✅ Criar componente `matriz-tabela.tsx`
9. ✅ Renderizar header (etapas)
10. ✅ Renderizar linhas (categorias)
11. ✅ Implementar scroll horizontal
12. ✅ Sticky header + primeira coluna
13. ✅ Formatação de valores
14. ✅ Linha/coluna de totais

### Fase 4: Gráfico (30 min)
15. ✅ Criar componente `matriz-grafico.tsx`
16. ✅ Configurar BarChart (Recharts)
17. ✅ Aplicar cores das categorias
18. ✅ Tooltip customizado

### Fase 5: Modal de Detalhes (45 min)
19. ✅ Criar API route `api/financeiro/gastos-detalhes/route.ts`
20. ✅ Criar componente `gastos-detalhes-modal.tsx`
21. ✅ Implementar clique em célula
22. ✅ Fetch dados e renderizar lista
23. ✅ Loading e error states

### Fase 6: Testes e Ajustes (30 min)
24. ✅ Testar com dados reais
25. ✅ Validar casos edge (vazios, muitas linhas)
26. ✅ Ajustes de UX e performance
27. ✅ Verificar responsividade

**TEMPO TOTAL ESTIMADO: 4 horas**

---

## 🧪 9. CASOS DE TESTE

### 9.1 Dados Normais
- ✅ 5 categorias × 8 etapas = 40 células
- ✅ Todas as células com valores > 0
- ✅ Totais corretos

### 9.2 Células Vazias
- ✅ Categoria sem gastos em etapa específica
- ✅ Etapa sem gastos em categoria específica
- ✅ Categoria totalmente vazia (sem gastos)
- ✅ Etapa totalmente vazia (sem gastos)

### 9.3 Gastos Sem Etapa
- ✅ Gastos com `etapa_relacionada_id = null`
- ✅ Aparecem na coluna "Geral"
- ✅ Total da coluna "Geral" correto

### 9.4 Muitos Dados
- ✅ 15 categorias × 20 etapas = 300 células
- ✅ Scroll horizontal funciona
- ✅ Performance adequada (<1s para render)

### 9.5 Modal
- ✅ Abrir modal ao clicar em célula com gastos
- ✅ NÃO abrir modal em célula vazia (ou mostrar "Sem gastos")
- ✅ Lista de gastos correta
- ✅ Fechar modal funciona

---

## 📈 10. MÉTRICAS DE SUCESSO

### Performance
- ⏱️ Query SQL: < 500ms
- ⏱️ Renderização inicial: < 1s
- ⏱️ Abertura de modal: < 300ms

### UX
- ✅ Usuário consegue identificar padrões visualmente (gráfico)
- ✅ Usuário consegue encontrar valores exatos (tabela)
- ✅ Usuário consegue explorar detalhes (modal)

### Dados
- ✅ 100% dos gastos aprovados incluídos
- ✅ Totais batem com página `/financeiro`
- ✅ Gastos sem etapa não são perdidos

---

## 🚀 11. MELHORIAS FUTURAS (Não Implementar Agora)

### Fase 2 (Futuro)
- [ ] Filtro por período (data inicial/final)
- [ ] Filtro por fornecedor
- [ ] Filtro por status (aprovado, pendente)
- [ ] Mostrar % em relação ao total
- [ ] Comparar com orçamento (se existir orçamento por etapa)

### Fase 3 (Futuro)
- [ ] Exportar CSV
- [ ] Exportar PDF com gráfico
- [ ] Gráfico alternativo (pizza, treemap)
- [ ] Drill-down por subcategoria

### Fase 4 (Futuro)
- [ ] Versão mobile otimizada (cards ao invés de tabela)
- [ ] Salvar preferências de visualização
- [ ] Compartilhar link com filtros

---

## 📝 12. NOTAS TÉCNICAS

### Otimização de Query
- Usar índices em `gastos.categoria_id` e `gastos.etapa_relacionada_id`
- Se ficar lento (>1s), criar view materializada no banco
- Considerar cache (5 minutos) se dados não mudam frequentemente

### Acessibilidade
- Tabela com headers semânticos (`<th scope="col">`)
- Células clicáveis com feedback visual
- Modal acessível via teclado (ESC para fechar)
- Cores com contraste adequado (WCAG AA)

### Edge Cases Adicionais
- **Sem categorias ativas:** Mostrar mensagem "Configure categorias"
- **Sem etapas:** Mostrar apenas coluna "Geral"
- **Sem gastos aprovados:** Mostrar mensagem vazia amigável

---

## ✅ 13. CHECKLIST DE IMPLEMENTAÇÃO

### Antes de Começar
- [x] Plano aprovado pelo usuário
- [ ] Confirmar estrutura do banco (índices?)
- [ ] Testar query SQL manualmente no Supabase

### Durante Implementação
- [ ] Commit após cada fase concluída
- [ ] Testar com dados reais após fase 3
- [ ] Validar com usuário após fase 5

### Antes de Concluir
- [ ] Todos os casos de teste passando
- [ ] Código lintado (sem erros)
- [ ] Componentes documentados (comentários)
- [ ] README atualizado (se necessário)

---

## 🎯 14. APROVAÇÃO

**Status:** ✅ APROVADO

**Próximos Passos:**
1. ✅ Plano revisado e aprovado pelo usuário
2. ✅ Todas as decisões pendentes foram tomadas
3. ⏳ Aguardando comando para iniciar implementação

**Decisões Tomadas:**
- [x] Ordem das etapas na tabela: **Por campo `ordem` (cronológica/cadastrada)**
- [x] Ordem das categorias: **Por total gasto, maior primeiro**
- [x] Nome do link no menu: **"Gastos por Etapa"**

---

**Documento criado por:** AI Assistant  
**Última atualização:** 17/12/2024  
**Versão:** 1.1 (Finalizado)

