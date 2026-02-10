# Especificacao: Alteracao 08 - API Routes: Zod validation + client imports + Server Components

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Concluido |
| Conversa | Auditoria de conformidade (conversa direta no chat) |
| Data criacao | 10/02/2026 |
| Complexidade | 🟡 Media |
| Dependencia | Executar APOS spec-alteracao05 (services precisam existir) |

**Status possiveis:**
- 🔵 Pronto para executar
- 🔴 Em execucao
- 🟠 Aguardando testes
- 🟢 Concluido
- ❌ Cancelado

---

## 1. Resumo

Corrigir 3 tipos de violacao em API Routes e pages: (1) substituir imports incorretos de `@supabase/supabase-js` por `@/lib/supabase/server` em `users/route.ts` e `plaud/route.ts`, (2) adicionar validacao Zod nos 3 API routes que usam validacao manual (`users`, `plaud`, `ocr`), (3) converter `emails/page.tsx` e `fornecedores/page.tsx` de Client Components para Server Components.

**Importante:** Esta spec depende da spec-05 estar executada, pois os services criados la sao necessarios para as refatoracoes aqui.

---

## 2. O que sera feito

- [ ] Substituir import `@supabase/supabase-js` por `@/lib/supabase/server` em `api/users/route.ts`
- [ ] Remover criacao manual de admin client em `api/users/route.ts`
- [ ] Substituir import `@supabase/supabase-js` por `@/lib/supabase/server` em `api/plaud/route.ts`
- [ ] Remover criacao manual de client com anon key em `api/plaud/route.ts`
- [ ] Adicionar schema Zod em `api/users/route.ts` (POST e PATCH)
- [ ] Adicionar schema Zod em `api/plaud/route.ts` (POST)
- [ ] Adicionar schema Zod em `api/ocr/route.ts` (POST)
- [ ] Converter `emails/page.tsx` para Server Component
- [ ] Converter `fornecedores/page.tsx` para Server Component
- [ ] Validar TypeScript (`npx tsc --noEmit`)

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- `api/users/route.ts` importa `createClient` diretamente de `@supabase/supabase-js` e cria admin client manualmente com `SUPABASE_SERVICE_ROLE_KEY`
- `api/plaud/route.ts` importa `createClient` de `@supabase/supabase-js` e usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` diretamente
- Validacao de input nos 3 routes e feita com `if (!campo)` manual, sem schema Zod
- `emails/page.tsx` e `fornecedores/page.tsx` sao `'use client'` com `useEffect` para fetch de dados — dados carregam no browser em vez do server

**Depois (comportamento proposto):**
- Ambos os API routes usam `await createClient()` de `@/lib/supabase/server`
- Para operacoes admin (users), usar `createAdminClient()` de `@/lib/supabase/admin` (se existir) ou criar
- Validacao de input em todos os routes via schemas Zod com mensagens de erro em portugues
- `emails/page.tsx` e `fornecedores/page.tsx` sao Server Components que buscam dados no server e passam como props para Client Components

### 3.2 UI Proposta

N/A — sem impacto visual. As paginas continuam identicas, mas carregam dados no server.

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A — sem alteracoes no banco.

### 4.2 Arquivos a Modificar/Criar

---

#### PARTE A — Fix client imports em API Routes

---

##### `src/app/api/users/route.ts`

**Antes:**

```typescript
import { createClient } from '@supabase/supabase-js'

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {...})
}
```

**Depois:**

```typescript
import { createClient } from '@/lib/supabase/server'
```

**Nota sobre admin client:** Este route usa `auth.admin.createUser()` e `auth.admin.updateUserById()` que exigem service_role_key. O Executor deve:
1. Verificar se ja existe `@/lib/supabase/admin.ts` com createAdminClient
2. Se nao existir, criar um utilitario centralizado em `@/lib/supabase/admin.ts`
3. Manter o client padrao para queries normais e o admin client apenas para operacoes de auth admin

---

##### `src/app/api/plaud/route.ts`

**Antes:**

```typescript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// ...
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

**Depois:**

```typescript
import { createClient } from '@/lib/supabase/server'
// ...
const supabase = await createClient()
```

---

#### PARTE B — Zod validation em API Routes

---

##### `src/app/api/users/route.ts` — POST

**Antes (validacao manual):**

```typescript
if (!email || !password || !nome_completo || !role) {
  return NextResponse.json({ error: 'Email, senha, nome e role sao obrigatorios' }, { status: 400 })
}
if (!['admin', 'editor', 'viewer'].includes(role)) {
  return NextResponse.json({ error: 'Role invalido...' }, { status: 400 })
}
```

**Depois (schema Zod):**

```typescript
import { z } from 'zod'

const criarUsuarioSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  nome_completo: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  role: z.enum(['admin', 'editor', 'viewer'], { message: 'Role deve ser admin, editor ou viewer' }),
  especialidade: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
})
```

**Padrao de uso no handler:**

```typescript
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const resultado = criarUsuarioSchema.safeParse(body)
  if (!resultado.success) {
    return NextResponse.json(
      { error: resultado.error.issues[0].message },
      { status: 400 }
    )
  }

  const { email, password, nome_completo, role, especialidade, telefone } = resultado.data
  // ... delegacao para services
}
```

---

##### `src/app/api/users/route.ts` — PATCH

```typescript
const atualizarUsuarioSchema = z.object({
  id: z.string().uuid('ID invalido'),
  nome_completo: z.string().min(2).optional(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
  especialidade: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  nova_senha: z.string().min(6).optional(),
})
```

---

##### `src/app/api/plaud/route.ts` — POST

```typescript
const processarPlaudSchema = z.object({
  markdown: z.string().min(1, 'Markdown nao fornecido'),
  reuniao_id: z.string().uuid('ID da reuniao invalido'),
  autor_id: z.string().uuid().optional(),
})
```

---

##### `src/app/api/ocr/route.ts` — POST

```typescript
const ocrSchema = z.object({
  image_base64: z.string().min(100, 'Imagem nao fornecida'),
})
```

---

#### PARTE C — Converter pages para Server Components

---

##### `src/app/(dashboard)/emails/page.tsx`

**Antes:** Client Component com `'use client'`, `useState`, `useEffect` para buscar emails.

**Depois:** Server Component que busca dados no server e passa para um Client Component de apresentacao.

```typescript
// emails/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { buscarEmails } from '@/lib/services/emails-monitorados'
import { EmailsPageClient } from '@/components/features/emails/emails-page-client'

export default async function EmailsPage() {
  const supabase = await createClient()
  const emails = await buscarEmails(supabase)
  return <EmailsPageClient emails={emails} />
}
```

**Nota:** O Executor deve:
1. Mover toda a logica de estado (filtros, sort, etc.) para um novo Client Component `emails-page-client.tsx`
2. A page server apenas busca e passa dados
3. O service `buscarEmails` sera criado na spec-05

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/(dashboard)/emails/page.tsx` | Converter para Server Component |
| CRIAR | `src/components/features/emails/emails-page-client.tsx` | Client Component com estado/filtros |

---

##### `src/app/(dashboard)/fornecedores/page.tsx`

**Antes:** Client Component com `'use client'`, `useState`, `useEffect` para buscar fornecedores.

**Depois:** Server Component que busca dados no server.

```typescript
// fornecedores/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { buscarFornecedoresComGastos } from '@/lib/services/fornecedores'
import { FornecedoresPageClient } from '@/components/features/fornecedores/fornecedores-page-client'

export default async function FornecedoresPage() {
  const supabase = await createClient()
  const fornecedores = await buscarFornecedoresComGastos(supabase)
  return <FornecedoresPageClient fornecedores={fornecedores} />
}
```

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/(dashboard)/fornecedores/page.tsx` | Converter para Server Component |
| CRIAR | `src/components/features/fornecedores/fornecedores-page-client.tsx` | Client Component com estado/filtros |

---

#### Tabela resumo de arquivos

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/api/users/route.ts` | Fix import, Zod schemas, remover admin client manual |
| MODIFICAR | `src/app/api/plaud/route.ts` | Fix import, Zod schema |
| MODIFICAR | `src/app/api/ocr/route.ts` | Zod schema |
| MODIFICAR | `src/app/(dashboard)/emails/page.tsx` | Converter para Server Component |
| MODIFICAR | `src/app/(dashboard)/fornecedores/page.tsx` | Converter para Server Component |
| CRIAR | `src/components/features/emails/emails-page-client.tsx` | Client Component extraido da page |
| CRIAR | `src/components/features/fornecedores/fornecedores-page-client.tsx` | Client Component extraido da page |
| CRIAR (se necessario) | `src/lib/supabase/admin.ts` | Admin client centralizado para operacoes auth.admin |

### 4.3 Fluxo de Dados

**Conversao de pages:**

Antes:
1. Browser carrega page (Client Component)
2. `useEffect` dispara fetch no browser
3. Dados carregam apos render inicial (flash de loading)

Depois:
1. Server renderiza page (Server Component)
2. Server busca dados via service
3. Server passa dados como props para Client Component
4. Browser recebe HTML ja com dados (sem flash de loading)

### 4.4 Dependencias Externas

- [ ] spec-alteracao05 executada (services necessarios: `buscarEmails`, `buscarFornecedoresComGastos`, etc.)
- [ ] Verificar existencia de `@/lib/supabase/admin.ts` (criar se nao existir)

### 4.5 Decisoes de Design e Justificativas

| # | Decisao | Justificativa |
|---|---------|---------------|
| 1 | **Executar APOS spec-05** | Os services criados na spec-05 sao pre-requisito para as pages e routes |
| 2 | **Zod com `safeParse` + mensagem do primeiro erro** | Consistente, retorna mensagem legivel. Nao expoe detalhes internos |
| 3 | **Schemas definidos no topo do arquivo de rota** | Simples, sem over-engineering. Se crescer, extrair para `@/lib/schemas/` |
| 4 | **Server Components delegam toda interatividade para Client Component filho** | Mantem hydration limpa. Page server apenas busca dados |
| 5 | **Admin client centralizado** | Evita duplicar URL + service_role_key em cada rota que precisa de auth.admin |

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [x] users/route.ts — import corrigido
- [x] users/route.ts — admin client centralizado
- [x] users/route.ts — Zod schemas (POST + PATCH)
- [x] plaud/route.ts — import corrigido
- [x] plaud/route.ts — Zod schema
- [x] ocr/route.ts — Zod schema
- [x] emails/page.tsx — convertido para Server Component
- [x] emails-page-client.tsx — criado
- [x] fornecedores/page.tsx — convertido para Server Component
- [x] fornecedores-page-client.tsx — criado
- [x] TypeScript sem erros

### 5.2 Notas de Implementacao

1. **Admin client centralizado** — Criado `src/lib/supabase/admin.ts` com `createAdminClient()`. Usa `@supabase/supabase-js` (sem SSR/cookies) com `SUPABASE_SERVICE_ROLE_KEY`. Funcao sincrona (nao precisa de cookies).

2. **plaud/route.ts — autor_id opcional** — O Zod schema define `autor_id` como `z.string().uuid().optional()`, mas `criarPostDecisao` exige `autor_id: string`. Solucao: condicionou a criacao do post de decisao a existencia de `autor_id` (`if (... && autor_id)`). Comportamento anterior passava `undefined` sem validacao.

3. **Fornecedores — refetch no client** — O Client Component mantem `useEffect + useCallback` para refetch quando filtros mudam. O Server Component fornece dados iniciais (sem filtros). Na montagem, o useEffect refetcha os mesmos dados (overhead minimo, sem flash de loading pois state ja tem dados do server).

4. **Emails — loading removido** — Como o Server Component ja fornece os dados, o estado `loading` e o skeleton foram removidos do client. A funcao `loadEmails` permanece para refresh apos sincronizacao.

### 5.3 Conversa de Execucao

#### IA: Execucao completa da alteracao 08

Implementados todos os itens da spec:
- PARTE A: Fix client imports em 2 API routes + admin client centralizado
- PARTE B: Zod validation em 3 API routes (users POST/PATCH, plaud POST, ocr POST)
- PARTE C: Conversao de 2 pages para Server Components com Client Components extraidos

Arquivos criados: `admin.ts`, `emails-page-client.tsx`, `fornecedores-page-client.tsx`
Arquivos modificados: `users/route.ts`, `plaud/route.ts`, `ocr/route.ts`, `emails/page.tsx`, `fornecedores/page.tsx`

TypeScript: sem erros (`npx tsc --noEmit`)

---

#### usuario:

---

## 6. Validacao Final

- [x] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
