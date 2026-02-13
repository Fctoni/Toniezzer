# Alteracao 18 - Refatorar componentes grandes e adicionar loading/error

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificacao criada |
| Origem | Auditoria de padroes de codigo |
| Complexidade | 🟡 Media |
| Especificacao | [spec-alteracao18.md](../spec/spec-alteracao18.md) |

---

## 1. Ideia Inicial

Auditoria revelou que 6 componentes excedem o limite de 200 linhas, 2 paginas Client deveriam ser Server Components, e 8+ rotas estao sem `loading.tsx`/`error.tsx`.

---

## 2. Conversa de Planejamento

#### usuario: Analise automatica via auditoria de padroes

#### IA: Confirmadas violacoes em 3 categorias

**Componentes > 200 linhas:**

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `src/app/(dashboard)/compras/[id]/page.tsx` | 493 | Client Component fazendo fetch |
| `src/components/features/financeiro/form-lancamento.tsx` | 428 | Form grande |
| `src/components/features/compras/compra-form.tsx` | ~400 | Form grande |
| `src/components/features/tarefas/tarefa-detalhes.tsx` | 362 | Detalhes com muitas secoes |
| `src/app/(dashboard)/comunicacao/page.tsx` | 289 | `'use client'` desnecessario |
| `src/components/features/emails/email-preview.tsx` | 273 | Preview com logica |

**Server/Client mal classificado:**
- `comunicacao/page.tsx` — marcado `'use client'` mas faz data fetching inicial → deveria ser Server
- `compras/[id]/page.tsx` — Client Component fazendo fetch em useEffect → deveria ser Server passando dados como props

**Rotas sem loading.tsx/error.tsx:**
- `/compras/[id]/editar`, `/compras/nova`, `/documentos/upload`, `/fornecedores/novo`
- `/financeiro/lancamentos/novo`, `/financeiro/lancamentos/foto`, `/financeiro/matriz-gastos`
- Varias rotas sem `error.tsx`: `/compras`, `/comunicacao`, `/cronograma`

---

## 3. Proposta de Implementacao

**Status:** 🟡 Aguardando aprovacao

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- 6 componentes com 270-493 linhas (limite: 200)
- 2 paginas Client fazendo data fetching que deveria ser Server-side
- 8+ rotas sem `loading.tsx` ou `error.tsx`
- UX inconsistente em estados de loading/erro

**Depois (comportamento proposto):**
- Componentes grandes divididos em sub-componentes < 200 linhas
- `comunicacao/page.tsx` convertido para Server Component
- `compras/[id]/page.tsx` convertido para Server Component com dados passados como props
- Todas as rotas com `loading.tsx` e `error.tsx` padronizados

### 3.2 UI Proposta

Sem mudanca visual para o usuario. A divisao de componentes e interna:

**compras/[id]/page.tsx (493 → ~3 arquivos):**
- `page.tsx` (Server) — busca dados, ~30 linhas
- `compra-detalhes-client.tsx` (Client) — interatividade, ~200 linhas
- `compra-info-section.tsx` — secao de informacoes, ~100 linhas

**form-lancamento.tsx (428 → ~3 arquivos):**
- `form-lancamento.tsx` — form principal, ~200 linhas
- `form-lancamento-campos.tsx` — campos do formulario extraidos
- `form-lancamento-resumo.tsx` — secao de resumo

**comunicacao/page.tsx (289 → Server + Client):**
- `page.tsx` (Server) — busca dados iniciais, ~30 linhas
- `comunicacao-page-client.tsx` (Client) — interatividade + realtime, ~200 linhas

### 3.3 Arquivos Afetados

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/(dashboard)/compras/[id]/page.tsx` | Converter para Server Component, extrair client |
| CRIAR | `src/components/features/compras/compra-detalhes-client.tsx` | Client Component extraido |
| MODIFICAR | `src/components/features/financeiro/form-lancamento.tsx` | Extrair sub-componentes |
| CRIAR | `src/components/features/financeiro/form-lancamento-campos.tsx` | Campos extraidos |
| MODIFICAR | `src/app/(dashboard)/comunicacao/page.tsx` | Converter para Server Component |
| CRIAR | `src/components/features/comunicacao/comunicacao-page-client.tsx` | Client extraido |
| CRIAR | `src/app/(dashboard)/compras/[id]/editar/loading.tsx` | Skeleton loading |
| CRIAR | `src/app/(dashboard)/compras/[id]/editar/error.tsx` | Error boundary |
| CRIAR | `src/app/(dashboard)/compras/nova/loading.tsx` | Skeleton loading |
| CRIAR | `src/app/(dashboard)/compras/nova/error.tsx` | Error boundary |
| CRIAR | `src/app/(dashboard)/documentos/upload/loading.tsx` | Skeleton loading |
| CRIAR | `src/app/(dashboard)/documentos/upload/error.tsx` | Error boundary |
| CRIAR | `src/app/(dashboard)/fornecedores/novo/loading.tsx` | Skeleton loading |
| CRIAR | `src/app/(dashboard)/fornecedores/novo/error.tsx` | Error boundary |
| CRIAR | `src/app/(dashboard)/financeiro/lancamentos/novo/loading.tsx` | Skeleton loading |
| CRIAR | `src/app/(dashboard)/financeiro/lancamentos/novo/error.tsx` | Error boundary |
| CRIAR | `src/app/(dashboard)/financeiro/lancamentos/foto/loading.tsx` | Skeleton loading |
| CRIAR | `src/app/(dashboard)/financeiro/lancamentos/foto/error.tsx` | Error boundary |
| CRIAR | `src/app/(dashboard)/financeiro/matriz-gastos/loading.tsx` | Skeleton loading |
| CRIAR | `src/app/(dashboard)/financeiro/matriz-gastos/error.tsx` | Error boundary |
| CRIAR | `src/app/(dashboard)/compras/error.tsx` | Error boundary |
| CRIAR | `src/app/(dashboard)/comunicacao/error.tsx` | Error boundary |
| CRIAR | `src/app/(dashboard)/cronograma/error.tsx` | Error boundary |

### 3.4 Fluxo de Dados

1. Para cada componente grande: identificar blocos de UI/logica independentes
2. Extrair sub-componentes passando dados via props
3. Para conversao Server→Client: mover fetch para `page.tsx` (Server), passar como props para Client
4. Para `loading.tsx`: criar Skeleton consistente usando componentes shadcn/ui
5. Para `error.tsx`: usar padrao `'use client'` com props `{ error, reset }`
6. Validar com `npx tsc --noEmit`

### 3.5 Banco de Dados

N/A - sem alteracoes no banco

### 3.6 Impacto Cross-Domain

N/A - refatoracao interna, sem mudanca de comportamento

---

## 4. Decisoes Importantes

- **loading.tsx** padronizado: usar `Skeleton` do shadcn/ui com layout similar a pagina
- **error.tsx** padronizado: `'use client'` obrigatorio, botao de retry via `reset()`
- **Componentes < 200 linhas** como meta, mas nao forcar divisao artificial
- **Server Components para fetch**: seguir padrao RSC do projeto (Page busca, Client renderiza)
- Priorizar `compras/[id]/page.tsx` e `comunicacao/page.tsx` por serem as maiores violacoes

---

## 5. Checkpoints

*(nenhum checkpoint necessario)*
