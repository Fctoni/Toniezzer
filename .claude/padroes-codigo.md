# Padroes de Codigo

Padroes obrigatorios do projeto. Toda IA executora DEVE seguir estas regras.

---

## 1. Arquitetura em Camadas (Clean Architecture)

O projeto segue o padrao **Clean Architecture** (Robert C. Martin) adaptado para Next.js + Supabase.

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

- **Services** sao funcoes puras (sem React, sem estado, sem side-effects alem do Supabase)
- **Hooks** consomem services quando precisam de estado React (`loading`, `error`, `data`)
- **Server Components** chamam services diretamente (nao precisam de hooks)
- **Client Components** chamam services dentro de handlers (`onSubmit`, `onClick`, `useCallback`)
- **API Routes** sao Controllers — NUNCA acessam o banco diretamente, sempre passam pelo service

---

## 2. Services — Padrao Obrigatorio

### Dependency Injection (DI)

Toda funcao de service recebe o client Supabase como **primeiro parametro**. Este e o padrao **Repository Pattern** (Martin Fowler).

```typescript
// CORRETO — DI com client como parametro
export async function buscarTarefas(supabase: TypedSupabaseClient): Promise<Tarefa[]> {
  const { data, error } = await supabase.from('tarefas').select('*').order('ordem')
  if (error) throw error
  return data
}

// ERRADO — client criado dentro do service
export async function buscarTarefas(): Promise<Tarefa[]> {
  const supabase = createClient() // NAO FAZER
  // ...
}
```

**Por que:**
- Funciona em Server Components (`await createClient()` do server) e Client Components (`createClient()` do browser) sem duplicacao
- Permite testar com mocks sem banco real
- Desacopla a logica de dados do framework

### Assinatura padronizada

Todas as funcoes seguem o padrao: `nomeOperacao(supabase, ...params)`

```typescript
// Sem parametros extras
buscarEtapas(supabase)

// Com parametros
buscarTarefaPorId(supabase, id)
atualizarEtapa(supabase, id, updates)
criarTarefa(supabase, data)
```

### Tipagem

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type Etapa = Tables<'etapas'>
```

- **NUNCA** usar `any`
- Usar `Tables<'nome_tabela'>` para tipos de retorno
- Usar `TablesUpdate<'nome_tabela'>` para parametros de update
- Usar `Pick<Tipo, 'campo1' | 'campo2'>` quando a query seleciona campos especificos
- Usar duck typing para funcoes de calculo (aceitar interface minima, nao o tipo completo)

### Error handling

Services lancam excecoes (`throw error`). O componente que chama faz `try/catch`.

```typescript
// CORRETO — throw error
export async function buscarEtapas(supabase: TypedSupabaseClient): Promise<Etapa[]> {
  const { data, error } = await supabase.from('etapas').select('*').order('ordem')
  if (error) throw error
  return data
}

// ERRADO — retornar {data, error}
export async function buscarEtapas(supabase: TypedSupabaseClient) {
  return await supabase.from('etapas').select('*').order('ordem') // NAO FAZER
}
```

### Logica de negocio centralizada

Regras de negocio ficam nos services, NAO nos componentes:

```typescript
// CORRETO — logica no service
export async function atualizarTarefa(supabase: TypedSupabaseClient, id: string, updates: TablesUpdate<'tarefas'>): Promise<Tarefa> {
  const updatesComDatas = { ...updates }

  if (updates.status === 'em_andamento') {
    updatesComDatas.data_inicio_real = updatesComDatas.data_inicio_real ?? new Date().toISOString()
  }
  if (updates.status === 'concluida') {
    updatesComDatas.data_conclusao_real = updatesComDatas.data_conclusao_real ?? new Date().toISOString()
  }

  const { data, error } = await supabase.from('tarefas').update(updatesComDatas).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ERRADO — logica espalhada nos componentes
// Cada componente decide quando preencher data_inicio_real (NAO FAZER)
```

### Estrutura de arquivo de service

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesUpdate } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type NomeDaEntidade = Tables<'nome_tabela'>

// ===== SELECT =====

export async function buscarEntidades(supabase: TypedSupabaseClient): Promise<NomeDaEntidade[]> { ... }
export async function buscarEntidadePorId(supabase: TypedSupabaseClient, id: string): Promise<NomeDaEntidade | null> { ... }

// ===== INSERT =====

export async function criarEntidade(supabase: TypedSupabaseClient, data: { ... }): Promise<NomeDaEntidade> { ... }

// ===== UPDATE =====

export async function atualizarEntidade(supabase: TypedSupabaseClient, id: string, updates: TablesUpdate<'nome_tabela'>): Promise<NomeDaEntidade> { ... }

// ===== DELETE =====

export async function deletarEntidade(supabase: TypedSupabaseClient, id: string): Promise<void> { ... }

// ===== CALCULOS =====

export function calcularAlgo(entidade: { ... }): number { ... }
```

### Organizacao: 1 arquivo por entidade

```
src/lib/services/
├── etapas.ts
├── subetapas.ts
├── tarefas.ts
├── tarefas-anexos.ts
├── tarefas-comentarios.ts
├── tarefas-dependencias.ts
├── categorias.ts
├── fornecedores.ts
├── compras.ts
├── gastos.ts
└── ...
```

---

## 3. Componentes — Como Consumir Services

### Server Components (RSC)

```typescript
import { createClient } from '@/lib/supabase/server'
import { buscarEtapas } from '@/lib/services/etapas'

export default async function CronogramaPage() {
  const supabase = await createClient() // ASYNC — server
  const etapas = await buscarEtapas(supabase)
  // ...
}
```

### Client Components

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { criarTarefa } from '@/lib/services/tarefas'

export function NovaTarefaDialog() {
  const onSubmit = async (data: FormData) => {
    const supabase = createClient() // SYNC — browser
    await criarTarefa(supabase, { ... })
  }
}
```

### API Routes (Controllers)

```typescript
import { createClient } from '@/lib/supabase/server'
import { buscarGastos } from '@/lib/services/gastos'

export async function GET(request: Request) {
  const supabase = await createClient()
  const gastos = await buscarGastos(supabase)
  return Response.json(gastos)
}
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
const { data } = await supabase.from('tarefas').select('*').order('ordem')

// CORRETO — via service
const tarefas = await buscarTarefas(supabase)
```

A unica excecao e para entidades que **ainda nao tem service criado** (migracoes em andamento).

### Cascade e Deletes

- Confiar no `ON DELETE CASCADE` do banco quando configurado
- NAO fazer deletes manuais em tabelas filhas antes de deletar a pai
- Service de delete faz apenas `supabase.from('tabela').delete().eq('id', id)`

---

## 5. TypeScript — Regras

- **NUNCA** usar `any`
- Validar com `npx tsc --noEmit` apos cada alteracao
- Usar tipos gerados do Supabase (`Tables<>`, `TablesInsert<>`, `TablesUpdate<>`)
- Preferir `Pick<>` quando a query seleciona campos especificos
- Usar duck typing para funcoes de calculo (aceitar a interface minima necessaria)

---

## 6. Stack do Projeto

| Tecnologia | Uso |
|-----------|-----|
| **Next.js 15** (App Router) | Framework principal |
| **Supabase** | Banco de dados + Auth + Storage |
| **TypeScript** | Tipagem obrigatoria |
| **shadcn/ui** | Componentes de UI |
| **react-hook-form + zod** | Formularios + validacao |
| **sonner** | Toasts/notificacoes |
| **date-fns + ptBR** | Formatacao de datas |
| **lucide-react** | Icones |
| **Tailwind CSS** | Estilizacao |

---

## 7. Nomenclatura

### Services (portugues)

| Operacao | Prefixo | Exemplo |
|----------|---------|---------|
| Buscar todos | `buscar` | `buscarEtapas()` |
| Buscar por ID | `buscarPorId` | `buscarTarefaPorId()` |
| Buscar resumido | `buscarResumidas` | `buscarSubetapasResumidas()` |
| Criar | `criar` | `criarTarefa()` |
| Atualizar | `atualizar` | `atualizarEtapa()` |
| Deletar | `deletar` | `deletarSubetapa()` |
| Reordenar | `reordenar` | `reordenarEtapas()` |
| Calcular | `calcular` | `calcularProgressoEtapa()` |

### Arquivos (kebab-case, portugues)

```
nova-etapa-dialog.tsx
editar-tarefa-dialog.tsx
tarefa-detalhes.tsx
form-lancamento.tsx
```

---

## 8. Resumo das Decisoes (padrao de ouro)

| # | Decisao | Referencia |
|---|---------|-----------|
| 1 | Dependency Injection — client como 1o parametro | Clean Architecture (Robert C. Martin) |
| 2 | Services sao funcoes puras — sem React, sem estado | Repository Pattern (Martin Fowler) |
| 3 | Assinatura padronizada — `funcao(supabase, ...params)` | Consistencia mecanica |
| 4 | throw error — services lancam excecoes | Padrao de services da industria |
| 5 | Hooks consomem services | Separacao de responsabilidades em camadas |
| 6 | API Routes consomem services | MVC / Controller → Service |
| 7 | Faseamento por modulo | Entrega incremental e verificavel |
| 8 | 1 arquivo por entidade | Organizacao e rastreabilidade |
| 9 | Logica de negocio nos services | Centralizacao, evita duplicacao |
| 10 | Confiar no CASCADE do banco | Simplicidade, evita bugs de delete manual |
