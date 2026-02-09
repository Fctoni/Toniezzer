# Alteração 03 - Centralizar operações CRUD em funções utilitárias (services)

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificação criada |
| Origem | Diagnóstico de padrões durante planejamento da Alteração 01 |
| Complexidade | 🟡 Média |
| Especificação | [spec-alteracao03.md](../spec-alteracao03.md) |

**Status possíveis:**
- 🟡 Em planejamento
- 🟢 Especificação criada → ver [spec-alteracao03.md](./spec-alteracao03.md)

---

## 1. Ideia Inicial

**Problema identificado:**
Atualmente o projeto faz queries CRUD diretamente inline nos componentes (ex: `supabase.from('etapas').update(...)` copiado em vários arquivos). Com o crescimento do app (3 níveis de hierarquia, múltiplas páginas usando os mesmos dados), a mesma operação aparece duplicada em 4+ arquivos diferentes.

**Exemplo do problema:**
"Atualizar status de tarefa" precisará ser feito em:
- `cronograma-table.tsx`
- `cronograma-mobile.tsx`
- `tarefas-table.tsx`
- `tarefa-detalhes.tsx`

Se um campo mudar, é preciso lembrar de atualizar em todos os lugares. Isso causa bugs e dificulta manutenção.

**Solução proposta:**
Criar camada `src/lib/services/` com funções utilitárias puras (não hooks) que centralizam as operações de banco. Cada entidade terá seu arquivo de service:

```
src/lib/services/
├── etapas.ts
├── subetapas.ts
├── tarefas.ts
├── tarefas-anexos.ts
├── tarefas-comentarios.ts
└── tarefas-dependencias.ts
```

**Exemplo:**
```typescript
// src/lib/services/tarefas.ts
export async function criarTarefa(data: TablesInsert<'tarefas'>) { ... }
export async function atualizarStatusTarefa(id: string, status: string) { ... }
export async function calcularProgressoSubetapa(subetapaId: string): Promise<number> { ... }
```

**Escopo:** Refatorar todo o app para usar services, não apenas as tabelas novas da Alteração 01.

---

## 2. Conversa de Planejamento

#### usuário:

#### IA: Análise inicial do estado atual e perguntas de escopo

Fiz um levantamento completo do projeto. Aqui está o diagnóstico:

**Estado atual:**
- **Não existe** diretório `src/lib/services/` — toda operação de banco é inline
- **224 operações** de banco espalhadas por **67 arquivos**
- **24 tabelas** acessadas diretamente via `supabase.from()`
- Apenas **1 hook** faz operação de banco (`use-current-user.tsx`)
- Muita duplicação: `categorias` usada em 15+ arquivos, `fornecedores` em 12+, `etapas` em 10+

**Tabelas identificadas:**
`categorias`, `subcategorias`, `compras`, `fornecedores`, `gastos`, `etapas`, `etapas_dependencias`, `subetapas`, `tarefas`, `tarefas_anexos`, `tarefas_comentarios`, `tarefas_dependencias`, `users`, `documentos`, `notificacoes`, `feed_comunicacao`, `feed_comentarios`, `topicos_comunicacao`, `emails_monitorados`, `reunioes`, `reunioes_acoes`, `recibos`, `orcamento_detalhado`

**Padrões de uso encontrados:**
1. **Server Components (RSC)** — queries com `await createClient()` (server)
2. **Client Components** — queries com `createClient()` (browser) dentro de `useCallback`
3. **Forms** — insert/update inline nos `onSubmit`
4. **API Routes** — queries em `src/app/api/`

**Perguntas para definir o escopo:**

1. **Abordagem do client Supabase:** Os services precisam funcionar tanto em Server Components (RSC) quanto em Client Components. A abordagem mais limpa seria os services **receberem o client como parâmetro** (ex: `criarTarefa(supabase, data)`), assim quem chama decide se passa o client server ou browser. Concorda com essa abordagem, ou prefere outra?

2. **Escopo da refatoração:** A ideia inicial menciona "refatorar todo o app". Com 224 operações em 67 arquivos, sugiro dividir em fases:
   - **Fase 1:** Criar os services das entidades do cronograma (`etapas`, `subetapas`, `tarefas` + anexos/comentários/dependências) — que é o foco da Alteração 01
   - **Fase 2:** Entidades financeiras (`compras`, `gastos`, `recibos`, `fornecedores`, `categorias`, `subcategorias`)
   - **Fase 3:** Demais entidades (`documentos`, `emails`, `reunioes`, `feed_comunicacao`, `notificacoes`, `users`)

   Ou prefere fazer tudo de uma vez nesta alteração?

3. **Hooks existentes vs services:** O hook `use-current-user.tsx` faz query inline de `users`. Os services substituiriam a lógica de query dos hooks, ou os hooks passariam a consumir os services?

4. **API Routes:** As queries em `src/app/api/` também devem migrar para services, ou mantemos separadas?

---

#### usuário: Quer saber o padrão de ouro da indústria para cada decisão; executor será outra IA (Opus 4.6), priorizar confiabilidade
1 - esse é o padrão de ouro da indústria de software? temos que fazer da maneira mais indicada por programadores experientes
2 - outra IA , rodando o OPUS 4.6 da claude que vai executar. Faça da maneira que teremos mais chances de acerto sem bugs, considerando isso
3 - qual é o padrão de ouro da indústria de software? temos que fazer da maneira mais indicada por programadores experientes
4 - qual é o padrão de ouro da indústria de software? temos que fazer da maneira mais indicada por programadores experientes

#### IA: Respostas com padrões de ouro da indústria e adaptações para execução por IA

Entendido. Vou responder cada ponto com o **padrão de ouro da indústria** e adaptar para maximizar a confiabilidade de execução por outra IA.

---

##### Resposta 1 — Client como parâmetro: **Sim, é o padrão de ouro**

O padrão se chama **Dependency Injection (DI)** e é a base da **Clean Architecture** (Robert C. Martin) e do **Repository Pattern** (Martin Fowler). É unanimidade na indústria.

**Por quê é o padrão:**
- Desacopla a lógica de dados do framework (Supabase, Prisma, etc.)
- Permite testar com mocks sem precisar de banco real
- Funciona em qualquer contexto (server, client, API route) sem duplicação

**Como fica no nosso projeto:**
```typescript
// src/lib/services/tarefas.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>

export async function criarTarefa(
  supabase: TypedSupabaseClient,
  data: TablesInsert<'tarefas'>
) {
  const { data: tarefa, error } = await supabase
    .from('tarefas')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return tarefa
}
```

**Quem chama:**
```typescript
// Server Component
const supabase = await createClient() // server
const tarefa = await criarTarefa(supabase, dados)

// Client Component
const supabase = createClient() // browser
const tarefa = await criarTarefa(supabase, dados)
```

**Decisão:** ✅ Adotar DI — client como primeiro parâmetro em todas as funções de service.

---

##### Resposta 2 — Estratégia para execução por IA: faseamento com spec detalhada

Considerando que outra IA vai executar, o mais seguro é:

1. **Spec extremamente detalhada** — com assinaturas exatas de cada função, tipos de retorno, e exemplo de uso
2. **Faseamento por entidade** — cada fase é independente e verificável com `npx tsc --noEmit`
3. **Padrão mecânico e repetitivo** — todas as funções seguem a mesma estrutura, minimizando decisões da IA executora

**Fases propostas (cada uma pode ser uma spec separada ou seções na mesma spec):**

| Fase | Entidades | Justificativa |
|------|-----------|---------------|
| 1 | `etapas`, `subetapas`, `tarefas`, `tarefas_anexos`, `tarefas_comentarios`, `tarefas_dependencias` | Cronograma — foco da Alteração 01, maior duplicação |
| 2 | `compras`, `gastos`, `recibos`, `fornecedores`, `categorias`, `subcategorias`, `orcamento_detalhado` | Financeiro — segundo módulo mais complexo |
| 3 | `documentos`, `emails_monitorados`, `reunioes`, `reunioes_acoes`, `feed_comunicacao`, `feed_comentarios`, `topicos_comunicacao`, `notificacoes`, `users`, `etapas_dependencias` | Demais entidades |

**Decisão:** ✅ Faseamento por módulo. Cada fase cria os services E refatora os componentes que os consomem.

---

##### Resposta 3 — Hooks vs Services: **o padrão de ouro é Hooks consumirem Services**

Na arquitetura em camadas (Clean Architecture), a hierarquia é:

```
Componente (UI) → Hook (estado + ciclo de vida React) → Service (lógica de dados) → Banco
```

**O que cada camada faz:**

| Camada | Responsabilidade | Exemplo |
|--------|-----------------|---------|
| **Service** | Query/mutation pura, sem React | `buscarTarefas(supabase, filtros)` |
| **Hook** | Estado React + chamada ao service | `useTarefas()` → chama `buscarTarefas`, gerencia `loading`, `error` |
| **Componente** | UI pura, consome hook | `<TarefasTable tarefas={tarefas} />` |

**Para o nosso projeto:**
- `use-current-user.tsx` passaria a chamar um service `buscarUsuarioAtual(supabase, authId)` internamente
- Hooks novos (se necessários) consumiriam services
- Server Components chamam services **diretamente** (não precisam de hooks)

**Decisão:** ✅ Services são funções puras. Hooks consomem services quando precisam de estado React. Server Components chamam services diretamente.

---

##### Resposta 4 — API Routes: **Sim, devem usar services**

É o mesmo padrão de ouro. Na indústria, API Routes são equivalentes a **Controllers** no padrão MVC. Controllers **nunca** acessam o banco diretamente — sempre passam pelo Service/Repository.

```
API Route (Controller) → Service → Banco
```

**Decisão:** ✅ API Routes também migram para consumir services.

---

**Resumo das decisões:**

| # | Decisão | Padrão |
|---|---------|--------|
| 1 | Client como parâmetro (DI) | ✅ Clean Architecture / Repository Pattern |
| 2 | Faseamento por módulo (3 fases) | ✅ Entrega incremental + verificável |
| 3 | Hooks consumem services | ✅ Separação de responsabilidades em camadas |
| 4 | API Routes consomem services | ✅ MVC / Controller → Service |

**Próximo passo:** Com essas decisões definidas, posso preencher a **seção 3 completa** (Proposta de Implementação) com a Fase 1 detalhada. Quer que eu prossiga, ou tem algum ajuste nas decisões?

---

#### usuário: Prossiga com a seção 3

Prossiga

#### IA: Seção 3 preenchida com proposta completa da Fase 1 (cronograma)

Preenchi toda a seção 3 abaixo com base na análise de **224 operações** em **67 arquivos**. A proposta cobre a Fase 1 (entidades do cronograma). As Fases 2 e 3 serão alterações separadas.

**A proposta de implementação está de acordo? Posso criar a especificação técnica?**

---

#### usuário: Aprovado, prosseguir

#### IA: Especificação técnica criada

Especificação criada em [`spec-alteracao03.md`](../spec-alteracao03.md). O Executor pode iniciar a implementação.

---

## 3. Proposta de Implementação

**Status:** ✅ Aprovada — spec criada

**Escopo desta alteração:** Fase 1 — Entidades do cronograma (`etapas`, `subetapas`, `tarefas`, `tarefas_anexos`, `tarefas_comentarios`, `tarefas_dependencias`). Fases 2 e 3 serão alterações separadas.

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- Toda operação CRUD é feita **inline** nos componentes e páginas, usando `supabase.from('tabela')` diretamente
- A mesma query aparece duplicada em múltiplos arquivos (ex: `select("*").order("ordem")` para tarefas aparece em 5 arquivos)
- Lógica de negócio (auto-preenchimento de `data_inicio_real`, `data_conclusao_real` baseado em status) está espalhada e duplicada em vários componentes
- Funções de cálculo de progresso estão definidas localmente em `cronograma-table.tsx` e não são reutilizáveis
- Operação de delete de etapa tem **bug**: tenta deletar tarefas com `etapa_id`, mas tarefas são vinculadas a `subetapas` (não a etapas diretamente)
- Reordenação (drag-drop) faz updates um-a-um em loop sem transação
- Upload de anexo faz Storage upload + DB insert sem tratamento atômico

**Depois (comportamento proposto):**
- Toda operação CRUD passa por funções centralizadas em `src/lib/services/`
- Cada entidade tem seu arquivo de service com funções puras (não-React), tipadas, que recebem o client Supabase como parâmetro (Dependency Injection)
- Lógica de negócio (datas automáticas, validações) fica centralizada nos services
- Funções de cálculo de progresso ficam nos services e são reutilizáveis
- Bug de cascade no delete de etapa é corrigido (deleta subetapas → que cascadeiam tarefas)
- Componentes e páginas chamam services ao invés de queries diretas
- Assinatura consistente: `funcao(supabase, ...params)` em todas as funções

### 3.2 UI Proposta

N/A — alteração sem impacto visual. O comportamento externo permanece idêntico.

### 3.3 Arquivos Afetados

#### Arquivos a CRIAR (services)

| Ação | Arquivo | O que faz |
|------|---------|-----------|
| CRIAR | `src/lib/services/etapas.ts` | CRUD de etapas + cálculo de progresso + cálculo de datas |
| CRIAR | `src/lib/services/subetapas.ts` | CRUD de subetapas + cálculo de progresso |
| CRIAR | `src/lib/services/tarefas.ts` | CRUD de tarefas + lógica de datas automáticas |
| CRIAR | `src/lib/services/tarefas-anexos.ts` | CRUD + Storage upload/download/delete |
| CRIAR | `src/lib/services/tarefas-comentarios.ts` | Criar e listar comentários |
| CRIAR | `src/lib/services/tarefas-dependencias.ts` | CRUD de dependências entre tarefas |

#### Arquivos a MODIFICAR (componentes que passam a consumir services)

| Ação | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/(dashboard)/cronograma/page.tsx` | Substitui queries inline de etapas, subetapas, tarefas por chamadas a services |
| MODIFICAR | `src/app/(dashboard)/tarefas/page.tsx` | Substitui queries inline de tarefas e subetapas por chamadas a services |
| MODIFICAR | `src/app/(dashboard)/tarefas/[id]/page.tsx` | Substitui queries inline de tarefa, subetapa, etapa, anexos, comentários, dependências por services |
| MODIFICAR | `src/app/(dashboard)/dashboard/page.tsx` | Substitui queries inline de etapas, subetapas, tarefas por services |
| MODIFICAR | `src/components/features/cronograma/cronograma-table.tsx` | Remove queries inline e funções locais de progresso, substitui por services |
| MODIFICAR | `src/components/features/cronograma/nova-etapa-dialog.tsx` | Substitui insert inline por service |
| MODIFICAR | `src/components/features/cronograma/editar-etapa-dialog.tsx` | Substitui update/delete inline por service (corrige bug de cascade) |
| MODIFICAR | `src/components/features/cronograma/nova-subetapa-dialog.tsx` | Substitui insert inline por service |
| MODIFICAR | `src/components/features/cronograma/editar-subetapa-dialog.tsx` | Substitui update/delete inline por service |
| MODIFICAR | `src/components/features/tarefas/nova-tarefa-dialog.tsx` | Substitui insert inline por service |
| MODIFICAR | `src/components/features/tarefas/editar-tarefa-dialog.tsx` | Substitui update/delete inline por service |
| MODIFICAR | `src/components/features/tarefas/tarefa-detalhes.tsx` | Substitui todas operações inline (update, delete, upload, download, comentário) por services |

### 3.4 Fluxo de Dados

**Antes:**
```
Componente → createClient() → supabase.from('tabela').operacao() → Banco
```

**Depois:**
```
Componente → createClient() → service.funcao(supabase, params) → supabase.from('tabela').operacao() → Banco
```

**Detalhamento por camada:**

1. **Componente/Página** cria o client Supabase (server ou browser, conforme contexto)
2. **Componente/Página** chama a função do service passando o client + parâmetros
3. **Service** executa a query/mutation usando o client recebido
4. **Service** aplica lógica de negócio (datas automáticas, validações, cálculos)
5. **Service** retorna dados tipados ou lança erro
6. **Componente/Página** trata o retorno (exibe dados, toast de sucesso/erro)

**Exemplo concreto — atualizar status de tarefa:**
1. Usuário clica no novo status em qualquer componente (cronograma-table, tarefa-detalhes, editar-tarefa-dialog)
2. Componente chama `atualizarTarefa(supabase, tarefaId, { status: 'em_andamento' })`
3. Service detecta que status mudou para 'em_andamento' → adiciona `data_inicio_real: new Date().toISOString()`
4. Service executa `supabase.from('tarefas').update(updates).eq('id', tarefaId)`
5. Service retorna a tarefa atualizada
6. Componente exibe toast de sucesso e recarrega dados

### 3.5 Banco de Dados

N/A — sem alterações no banco de dados. Os services utilizam as tabelas existentes.

**Nota:** O bug identificado no delete de etapa (que tenta `delete().eq("etapa_id", etapa.id)` na tabela `tarefas`, mas tarefas não têm campo `etapa_id`) será corrigido no service fazendo o cascade correto: buscar subetapas da etapa → deletar tarefas de cada subetapa → deletar subetapas → deletar etapa.

---

## 4. Decisões Importantes

| # | Decisão | Justificativa |
|---|---------|---------------|
| 1 | **Dependency Injection** — client como 1º parâmetro | Clean Architecture / Repository Pattern. Funciona em server e client sem duplicação |
| 2 | **Faseamento por módulo** — 3 fases | Entrega incremental, verificável com `tsc --noEmit` a cada fase |
| 3 | **Hooks consumem services** | Separação de responsabilidades: service = dados puros, hook = estado React |
| 4 | **API Routes consomem services** | Padrão Controller → Service (MVC) |
| 5 | **Fase 1 = cronograma** | Maior duplicação, foco da Alteração 01, 6 entidades relacionadas |
| 6 | **Services são funções puras** | Sem estado, sem React, sem side-effects além do Supabase. Maximiza previsibilidade para execução por IA |
| 7 | **Assinatura padronizada** | Todas funções: `nomeOperacao(supabase, ...params)` — padrão mecânico e repetitivo para minimizar erros |
| 8 | **Correção do bug de cascade** | Delete de etapa será corrigido nos services (subetapas → tarefas → etapa) |

---

## 5. Checkpoints

#### Checkpoint 08/02/2026
**Status atual:** 🟡 Seção 3 preenchida, aguardando aprovação
**Decisões tomadas:**
- DI com client como parâmetro (Clean Architecture)
- Faseamento em 3 fases (cronograma → financeiro → demais)
- Hooks consumem services, API Routes consomem services
- Services são funções puras, assinatura padronizada
- Bug de cascade no delete de etapa será corrigido

**Próximo passo:** Aguardar aprovação da proposta para criar `spec-alteracao03.md`
