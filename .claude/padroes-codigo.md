# Padroes de Codigo

Padroes obrigatorios do projeto. Toda IA executora DEVE seguir estas regras.

---

## 1. Arquitetura em Camadas

O projeto segue uma **arquitetura em camadas** inspirada em Clean Architecture, adaptada para Next.js + Supabase.

### Hierarquia de camadas

```
Componente (UI) → Hook (estado React) → Service (logica de dados) → Banco (Supabase)
```

| Camada | Responsabilidade | Pode importar | NAO pode importar |
|--------|-----------------|---------------|-------------------|
| **Service** | Query/mutation pura, logica de negocio | Supabase client, tipos | React, hooks, componentes |
| **Hook** | Estado React + chamada ao service | Services, React | Supabase direto |
| **Componente** | UI, renderizacao | Hooks, services (em Server Components) | Supabase direto |
| **API Route** | Controller HTTP | Services | Supabase direto |

### Regras

- **Services** sao funcoes sem estado interno e sem dependencias de UI ou framework. O unico side-effect permitido e o acesso ao Supabase
- **Hooks** adaptam services ao ciclo de vida do React (estado, loading, erro). Hooks NAO contem regras de negocio
- **Server Components** chamam services diretamente (nao precisam de hooks)
- **Client Components** chamam services dentro de handlers (`onSubmit`, `onClick`), hooks (`useEffect`) ou callbacks — nunca no corpo do render
- **API Routes** sao Controllers — NUNCA acessam o banco diretamente, sempre passam pelo service

---

## 2. Services — Padrao Obrigatorio

### Dependency Injection (DI)

Toda funcao de service recebe o client Supabase como **primeiro parametro**.

```typescript
// CORRETO — DI com client como parametro
export async function fetchTasks(supabase: TypedSupabaseClient): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*').order('order')
  if (error) throw error
  return data
}

// ERRADO — client criado dentro do service
export async function fetchTasks(): Promise<Task[]> {
  const supabase = createClient() // NAO FAZER
  // ...
}
```

**Por que:**
- Funciona em Server Components (`await createClient()` do server) e Client Components (`createClient()` do browser) sem duplicacao
- Permite testar com mocks sem banco real
- Desacopla a logica de dados do framework

### Assinatura padronizada

Todas as funcoes seguem o padrao: `operationName(supabase, ...params)`

```typescript
// Sem parametros extras
fetchStages(supabase)

// Com parametros
fetchTaskById(supabase, id)
updateStage(supabase, id, updates)
createTask(supabase, data)
```

### Tipagem

O tipo `TypedSupabaseClient` e exportado de um unico lugar. NUNCA redefinir em cada service.

```typescript
// src/lib/types/supabase.ts — definicao unica
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

export type TypedSupabaseClient = SupabaseClient<Database>
```

```typescript
// Uso em um service
import { TypedSupabaseClient } from '@/lib/types/supabase'
import { Tables, TablesUpdate } from '@/lib/types/database'

type Stage = Tables<'stages'>
```

- Evitar `any` — preferir `unknown` quando o tipo e desconhecido. Se `any` for inevitavel, adicionar comentario justificando o motivo
- Usar `Tables<'nome_tabela'>` para tipos de retorno
- Usar `TablesUpdate<'nome_tabela'>` para parametros de update
- Usar `Pick<Tipo, 'campo1' | 'campo2'>` quando a query seleciona campos especificos
- Usar duck typing para funcoes de calculo (aceitar interface minima, nao o tipo completo)

### Error handling

Services lancam excecoes (`throw error`). O componente/hook que chama faz `try/catch`.

```typescript
// SERVICE — throw error
export async function fetchStages(supabase: TypedSupabaseClient): Promise<Stage[]> {
  const { data, error } = await supabase.from('stages').select('*').order('order')
  if (error) throw error
  return data
}

// ERRADO — retornar {data, error}
export async function fetchStages(supabase: TypedSupabaseClient) {
  return await supabase.from('stages').select('*').order('order') // NAO FAZER
}
```

**Padrao de consumo no componente:**

```typescript
// Client Component — como tratar erros do service
const onSubmit = async (data: FormData) => {
  try {
    const supabase = createClient()
    await createTask(supabase, { ... })
    toast.success('Tarefa criada com sucesso')
  } catch (error) {
    toast.error('Erro ao criar tarefa')
    console.error(error)
  }
}
```

```typescript
// Server Component — como tratar erros do service
export default async function SchedulePage() {
  const supabase = await createClient()

  try {
    const stages = await fetchStages(supabase)
    return <ScheduleView stages={stages} />
  } catch {
    return <ErrorState message="Erro ao carregar cronograma" />
  }
}
```

### Logica de negocio centralizada

Regras de negocio ficam nos services, NAO nos componentes:

```typescript
// CORRETO — logica no service
export async function updateTask(supabase: TypedSupabaseClient, id: string, updates: TablesUpdate<'tasks'>): Promise<Task> {
  const updatesWithDates = { ...updates }

  if (updates.status === 'in_progress') {
    updatesWithDates.actual_start_date = updatesWithDates.actual_start_date ?? new Date().toISOString()
  }
  if (updates.status === 'completed') {
    updatesWithDates.actual_completion_date = updatesWithDates.actual_completion_date ?? new Date().toISOString()
  }

  const { data, error } = await supabase.from('tasks').update(updatesWithDates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ERRADO — logica espalhada nos componentes
// Cada componente decide quando preencher actual_start_date (NAO FAZER)
```

### Tipos de funcoes em um service

Um mesmo arquivo de service pode conter dois tipos de funcoes:

- **Funcoes de acesso a dados** — dependem de Supabase, recebem `supabase` como primeiro parametro
- **Funcoes de dominio/calculo** — NAO dependem de Supabase, sao puras e testaveis isoladamente

### Estrutura de arquivo de service

```typescript
import { TypedSupabaseClient } from '@/lib/types/supabase'
import { Tables, TablesUpdate } from '@/lib/types/database'

type EntityName = Tables<'table_name'>

// ===== SELECT =====

export async function fetchEntities(supabase: TypedSupabaseClient): Promise<EntityName[]> { ... }
export async function fetchEntityById(supabase: TypedSupabaseClient, id: string): Promise<EntityName | null> { ... }

// ===== INSERT =====

export async function createEntity(supabase: TypedSupabaseClient, data: { ... }): Promise<EntityName> { ... }

// ===== UPDATE =====

export async function updateEntity(supabase: TypedSupabaseClient, id: string, updates: TablesUpdate<'table_name'>): Promise<EntityName> { ... }

// ===== DELETE =====

export async function deleteEntity(supabase: TypedSupabaseClient, id: string): Promise<void> { ... }

// ===== CALCULATIONS (puras, sem Supabase) =====

export function calculateSomething(entity: { ... }): number { ... }
```

### Organizacao: 1 arquivo por entidade

```
src/lib/services/
├── stages.ts
├── substages.ts
├── tasks.ts
├── task-attachments.ts
├── task-comments.ts
├── task-dependencies.ts
├── categories.ts
├── suppliers.ts
├── purchases.ts
├── expenses.ts
└── ...
```

---

## 3. Componentes — Padroes Obrigatorios

### Server Components (RSC)

```typescript
import { createClient } from '@/lib/supabase/server'
import { fetchStages } from '@/lib/services/stages'

export default async function SchedulePage() {
  const supabase = await createClient() // ASYNC — server
  const stages = await fetchStages(supabase)
  // ...
}
```

### Client Components

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { createTask } from '@/lib/services/tasks'

export function NewTaskDialog() {
  const onSubmit = async (data: FormData) => {
    const supabase = createClient() // SYNC — browser
    await createTask(supabase, { ... })
  }
}
```

### API Routes (Controllers)

```typescript
import { createClient } from '@/lib/supabase/server'
import { fetchExpenses } from '@/lib/services/expenses'

export async function GET(request: Request) {
  const supabase = await createClient()
  const expenses = await fetchExpenses(supabase)
  return Response.json(expenses)
}
```

API Routes sao responsaveis por:
- Validacao de input HTTP (ex: zod no body/params)
- Autorizacao contextual (quando nao coberta por RLS)
- Traducao de erros para HTTP response (ex: `return Response.json({ error }, { status: 400 })`)

API Routes **NAO contem regras de negocio** — sempre delegam para services.

### Composicao Server + Client Components

Preferir **Server Components para data fetching inicial**. Usar Client Components apenas quando interatividade e necessaria (estado, event handlers).

O padrao principal e: Page (Server) busca dados e passa como props para Client Components.

```typescript
// CORRETO — Server Component busca, Client Component renderiza com interatividade
// app/schedule/page.tsx (Server)
export default async function SchedulePage() {
  const supabase = await createClient()
  const stages = await fetchStages(supabase)
  return <ScheduleBoard stages={stages} /> // Client Component recebe dados como props
}

// ERRADO — Client Component busca dados que poderiam vir do Server
'use client'
export function ScheduleBoard() {
  const [stages, setStages] = useState([])
  useEffect(() => { fetchStages(createClient()).then(setStages) }, []) // NAO FAZER
}
```

### Tamanho e extracao

- Se um componente ultrapassar **200 linhas**, considerar extrair sub-componentes
- Extrair quando houver blocos de UI **repetidos** em mais de um lugar
- Extrair quando um trecho de UI tiver **logica propria** (estado, handlers) que pode ser isolada

### Estados de loading e erro

Todo componente que carrega dados deve tratar os 3 estados: **loading**, **erro** e **sucesso**.

```typescript
// Client Component com hook
function TaskList() {
  const { data, error, isLoading } = useTasks()

  if (isLoading) return <Skeleton />
  if (error) return <ErrorState message="Erro ao carregar tarefas" />
  return <TasksView tasks={data} />
}
```

### loading.tsx e error.tsx (App Router)

Usar os arquivos-convencao do Next.js para loading e error boundaries por rota:

```
app/
├── schedule/
│   ├── page.tsx          # Server Component da pagina
│   ├── loading.tsx       # Skeleton automatico enquanto page.tsx carrega
│   └── error.tsx         # Error boundary automatico ('use client' obrigatorio)
```

- `loading.tsx` substitui `<Suspense fallback>` para a rota inteira — usar quando a pagina tem um unico bloco de dados
- `error.tsx` deve ser `'use client'` e receber `{ error, reset }` como props
- Para carregamentos parciais dentro de uma pagina, continuar usando `<Suspense>` com fallback diretamente

### Estrutura de pastas de componentes

Componentes ficam organizados por feature/pagina:

```
src/components/
├── ui/                     # shadcn/ui (nao editar manualmente)
├── schedule/               # componentes da feature cronograma
│   ├── stage-card.tsx
│   ├── task-item.tsx
│   └── new-stage-dialog.tsx
├── finances/               # componentes da feature financeiro
│   ├── expense-form.tsx
│   └── expenses-table.tsx
└── shared/                 # componentes reutilizaveis do projeto
    ├── error-state.tsx
    ├── loading-skeleton.tsx
    └── confirm-dialog.tsx
```

---

## 4. Supabase — Regras de Uso

### Clients

| Contexto | Import | Chamada |
|----------|--------|---------|
| Server Component / API Route | `from '@/lib/supabase/server'` | `const supabase = await createClient()` |
| Client Component | `from '@/lib/supabase/client'` | `const supabase = createClient()` |

### Queries diretas (inline) — PROIBIDO

```typescript
// ERRADO — query inline no componente
const { data } = await supabase.from('tasks').select('*').order('order')

// CORRETO — via service
const tasks = await fetchTasks(supabase)
```

Sem excecoes. Se a entidade nao tem service, **crie o service antes de usar**. Um service minimo com uma unica funcao leva 2 minutos.

### Cascade e Deletes

- Confiar no `ON DELETE CASCADE` do banco quando configurado
- NAO fazer deletes manuais em tabelas filhas antes de deletar a pai
- Service de delete faz apenas `supabase.from('tabela').delete().eq('id', id)`

### Auth

- Protecao de rotas e feita via **middleware** (`src/middleware.ts`), NAO em cada page individualmente
- O middleware verifica a sessao e redireciona para login quando necessario
- Para acessar o usuario autenticado em services, extrair do supabase client:

```typescript
// Em um service que precisa do usuario
export async function fetchMyTasks(supabase: TypedSupabaseClient): Promise<Task[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id)
  if (error) throw error
  return data
}
```

- Preferir **RLS (Row Level Security)** no banco para controle de acesso. Services NAO reimplementam regras que ja estao no RLS
- Logica de autorizacao que NAO pode ser expressa via RLS fica nas **API Routes** (ex: verificar role antes de chamar o service)

### Storage

- Upload e download de arquivos seguem o mesmo padrao de services — funcoes em um arquivo de service dedicado
- Arquivos de storage ficam em `src/lib/services/storage.ts`

```typescript
// src/lib/services/storage.ts
export async function uploadFile(
  supabase: TypedSupabaseClient,
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteFile(
  supabase: TypedSupabaseClient,
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}
```

- NAO fazer upload direto no componente — sempre via service
- Nomes de buckets sao constantes definidas em um unico lugar (ex: `src/lib/constants.ts`)

### Realtime / Subscriptions (se aplicavel)

Se o projeto usar Supabase Realtime:

- Subscriptions vivem em **hooks** ou **Client Components** — nunca em services
- Sempre fazer `unsubscribe` no cleanup do `useEffect`

```typescript
// Hook de realtime
function useTasksRealtime(initialTasks: Task[]) {
  const [tasks, setTasks] = useState(initialTasks)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        // atualizar estado local
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) } // cleanup obrigatorio
  }, [])

  return tasks
}
```

---

## 5. TypeScript — Regras

- O projeto usa `strict: true` no `tsconfig.json`. NAO desabilitar flags de strict individualmente
- Evitar `any` — preferir `unknown` quando o tipo e desconhecido. Se `any` for inevitavel, adicionar comentario justificando
- Validar com `npx tsc --noEmit` ao concluir um conjunto de alteracoes relacionadas (ex: ao final de uma feature ou correcao), nao apos cada arquivo individual
- Usar tipos gerados do Supabase (`Tables<>`, `TablesInsert<>`, `TablesUpdate<>`)
- Preferir `Pick<>` quando a query seleciona campos especificos
- Usar duck typing para funcoes de calculo (aceitar a interface minima necessaria)

---

## 6. Stack do Projeto

| Tecnologia | Uso |
|-----------|-----|
| **Next.js 16** (App Router) | Framework principal |
| **Supabase** | Banco de dados + Auth + Storage |
| **TypeScript** | Tipagem obrigatoria |
| **shadcn/ui** | Componentes de UI |
| **react-hook-form + zod** | Formularios + validacao |
| **sonner** | Toasts/notificacoes |
| **date-fns + ptBR** | Formatacao de datas |
| **lucide-react** | Icones |
| **Tailwind CSS** | Estilizacao |

### Restricoes — o que NAO usar

- **NAO instalar novas dependencias** sem perguntar ao usuario primeiro
- **NAO usar `axios`** — usar `fetch` nativo
- **NAO usar `moment.js`** — usar `date-fns`
- **NAO usar CSS Modules ou styled-components** — usar Tailwind CSS
- **NAO criar componentes de UI do zero** — usar shadcn/ui como base

---

## 7. Nomenclatura

### Idioma do codigo

O projeto usa **ingles** para todo o codigo: funcoes, variaveis, arquivos, tipos e componentes. Portugues e usado apenas para textos visiveis ao usuario (labels, mensagens, tooltips, placeholders).

```typescript
// CORRETO — codigo em ingles, texto visivel em portugues
export async function updateTask(supabase: TypedSupabaseClient, id: string, updates: TablesUpdate<'tasks'>)
toast.success('Tarefa atualizada com sucesso')

// ERRADO — codigo em portugues
export async function atualizarTarefa(supabase: TypedSupabaseClient, id: string, updates: TablesUpdate<'tarefas'>)
```

### Services (ingles)

| Operacao | Prefixo | Exemplo |
|----------|---------|---------|
| Buscar todos | `fetch` | `fetchStages()` |
| Buscar por ID | `fetchById` | `fetchTaskById()` |
| Buscar resumido | `fetchSummary` | `fetchSubstagesSummary()` |
| Criar | `create` | `createTask()` |
| Atualizar | `update` | `updateStage()` |
| Deletar | `delete` | `deleteSubstage()` |
| Reordenar | `reorder` | `reorderStages()` |
| Calcular | `calculate` | `calculateStageProgress()` |

### Arquivos (kebab-case, ingles)

```
new-stage-dialog.tsx
edit-task-dialog.tsx
task-details.tsx
expense-form.tsx
```

---

## 8. Testes

- **Framework:** Vitest
- **Comando:** `npx vitest` (watch mode) ou `npx vitest run` (CI/uma vez)
- Funcoes de calculo/dominio (sem Supabase) **devem ter testes unitarios**
- Testes ficam em arquivos `.test.ts` ao lado do arquivo testado
- Services de acesso a dados NAO sao mockados rotineiramente — ficam cobertos por testes e2e quando necessario

```typescript
// src/lib/services/stages.test.ts
import { calculateStageProgress } from './stages'

describe('calculateStageProgress', () => {
  it('returns 0 when no tasks are completed', () => {
    const stage = { total: 10, completed: 0 }
    expect(calculateStageProgress(stage)).toBe(0)
  })

  it('returns 100 when all tasks are completed', () => {
    const stage = { total: 5, completed: 5 }
    expect(calculateStageProgress(stage)).toBe(100)
  })
})
```

---

## 9. Convencoes Gerais

### Ordem de imports

```typescript
// 1. React / Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Bibliotecas externas
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'

// 3. @/lib/* (services, types, utils)
import { TypedSupabaseClient } from '@/lib/types/supabase'
import { fetchTasks } from '@/lib/services/tasks'

// 4. @/components/*
import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/schedule/task-card'

// 5. Tipos (type imports)
import type { Task } from '@/lib/types/database'
```

### Validacao de input

Validacao acontece na **fronteira** — onde dados entram no sistema:

- **API Routes** validam com zod
- **Formularios** validam com react-hook-form + zod
- **Services** confiam que os dados ja foram validados. NAO revalidar dentro do service

### Variaveis de ambiente

- Nunca hardcodar URLs de API, chaves ou credenciais
- Usar `process.env.NEXT_PUBLIC_*` para variaveis acessiveis no client
- Usar `process.env.*` para variaveis exclusivas do server
- NAO commitar arquivos `.env` ou `.env.local` — manter no `.gitignore`

### Comentarios

- NAO comentar o que o codigo faz — o codigo deve ser auto-explicativo
- Comentar apenas o **por que** de decisoes nao-obvias
- NAO adicionar comentarios, docstrings ou anotacoes de tipo em codigo que nao foi alterado

```typescript
// ERRADO — comenta o obvio
// Busca as tarefas do banco de dados
const tasks = await fetchTasks(supabase)

// CORRETO — explica decisao nao-obvia
// Ordena por data de criacao em vez de ordem manual porque
// esta view nao permite reordenacao pelo usuario
const tasks = await fetchTasksByCreatedAt(supabase)
```

---

## 10. Resumo das Decisoes

| # | Decisao | Motivo |
|---|---------|--------|
| 1 | Dependency Injection — client como 1o parametro | Desacopla services do contexto (server/client), permite testes com mock |
| 2 | Services sao funcoes sem estado, sem dependencia de UI | Reutilizaveis em qualquer camada, faceis de testar |
| 3 | Assinatura padronizada — `function(supabase, ...params)` | Consistencia mecanica, previsivel para qualquer desenvolvedor ou agente |
| 4 | throw error — services lancam excecoes | Separa decisao de "o que deu errado" (service) de "o que mostrar" (componente) |
| 5 | try/catch + toast no componente | Padroniza como erros sao exibidos ao usuario |
| 6 | Hooks consomem services, sem regras de negocio | Separacao de responsabilidades em camadas |
| 7 | API Routes consomem services | Controller valida input/auth e delega para service |
| 8 | 1 arquivo por entidade | Organizacao e rastreabilidade |
| 9 | Logica de negocio nos services | Centralizacao, evita duplicacao |
| 10 | Confiar no CASCADE do banco | Simplicidade, evita bugs de delete manual |
| 11 | Componentes de ate 200 linhas | Mantenabilidade, facilita entendimento por agentes diferentes |
| 12 | Loading/error/sucesso em todo componente | UX consistente, evita telas quebradas |
| 13 | Server Components para data fetching, Client para interatividade | Evita fetching desnecessario no client, aproveita o server |
| 14 | TypedSupabaseClient centralizado em um unico arquivo | Evita redefinicao e inconsistencia entre services |
| 15 | Validacao na fronteira (API Routes e forms) | Services confiam nos dados, nao revalidam |
| 16 | Codigo em ingles, textos visiveis em portugues | Consistencia com ecossistema, legibilidade para agentes |
