# Especificação: Alteração 03 - Centralizar CRUD em services (Fase 1: Cronograma)

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟠 Aguardando testes |
| Conversa | [alteracao03.md](./alteracao/alteracao03.md) |
| Data criação | 08/02/2026 |
| Complexidade | 🟡 Média |

**Status possíveis:**
- 🔵 Pronto para executar
- 🔴 Em execução
- 🟠 Aguardando testes
- 🟢 Concluído
- ❌ Cancelado

---

## 1. Resumo

Criar camada de services em `src/lib/services/` com funções puras que centralizam todas as operações CRUD das entidades do cronograma (etapas, subetapas, tarefas, tarefas_anexos, tarefas_comentarios, tarefas_dependencias). Refatorar todos os componentes e páginas para consumir esses services ao invés de queries Supabase inline.

---

## 2. O que será feito

### Services (criar)
- [ ] Criar `src/lib/services/etapas.ts`
- [ ] Criar `src/lib/services/subetapas.ts`
- [ ] Criar `src/lib/services/tarefas.ts`
- [ ] Criar `src/lib/services/tarefas-anexos.ts`
- [ ] Criar `src/lib/services/tarefas-comentarios.ts`
- [ ] Criar `src/lib/services/tarefas-dependencias.ts`

### Componentes (refatorar para usar services)
- [ ] Refatorar `src/app/(dashboard)/cronograma/page.tsx`
- [ ] Refatorar `src/app/(dashboard)/tarefas/page.tsx`
- [ ] Refatorar `src/app/(dashboard)/tarefas/[id]/page.tsx`
- [ ] Refatorar `src/app/(dashboard)/dashboard/page.tsx`
- [ ] Refatorar `src/components/features/cronograma/cronograma-table.tsx`
- [ ] Refatorar `src/components/features/cronograma/nova-etapa-dialog.tsx`
- [ ] Refatorar `src/components/features/cronograma/editar-etapa-dialog.tsx`
- [ ] Refatorar `src/components/features/cronograma/nova-subetapa-dialog.tsx`
- [ ] Refatorar `src/components/features/cronograma/editar-subetapa-dialog.tsx`
- [ ] Refatorar `src/components/features/tarefas/nova-tarefa-dialog.tsx`
- [ ] Refatorar `src/components/features/tarefas/editar-tarefa-dialog.tsx`
- [ ] Refatorar `src/components/features/tarefas/tarefa-detalhes.tsx`

### Validação
- [ ] `npx tsc --noEmit` sem erros novos
- [ ] Testado manualmente

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- Toda operação CRUD é feita **inline** nos componentes e páginas, usando `supabase.from('tabela')` diretamente
- A mesma query aparece duplicada em múltiplos arquivos (ex: `select("*").order("ordem")` para tarefas aparece em 5 arquivos)
- Lógica de negócio (auto-preenchimento de `data_inicio_real`, `data_conclusao_real` baseado em status) está espalhada e duplicada em vários componentes
- Funções de cálculo de progresso estão definidas localmente em `cronograma-table.tsx` e não são reutilizáveis
- Operação de delete de etapa tem **bug**: tenta deletar tarefas com `etapa_id`, mas tarefas são vinculadas a `subetapas` (não a etapas diretamente)

**Depois (comportamento proposto):**
- Toda operação CRUD passa por funções centralizadas em `src/lib/services/`
- Cada entidade tem seu arquivo de service com funções puras (não-React), tipadas, que recebem o client Supabase como parâmetro (Dependency Injection)
- Lógica de negócio (datas automáticas, validações) fica centralizada nos services
- Funções de cálculo de progresso ficam nos services e são reutilizáveis
- Bug de cascade no delete de etapa é corrigido
- Assinatura consistente: `funcao(supabase, ...params)` em todas as funções

### 3.2 UI Proposta

N/A — alteração sem impacto visual. O comportamento externo permanece idêntico.

---

## 4. Implementação Técnica

### 4.1 Banco de Dados

N/A — sem alterações no banco de dados.

### 4.2 Arquivos a Modificar/Criar

#### Tipo compartilhado para o client Supabase

Todas as funções de service recebem o client Supabase como primeiro parâmetro. O tipo é:

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
```

Os tipos de entidade usam os helpers do Supabase gerado:

```typescript
import { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

// Exemplo:
type Etapa = Tables<'etapas'>
type EtapaInsert = TablesInsert<'etapas'>
type EtapaUpdate = TablesUpdate<'etapas'>
```

---

#### CRIAR: `src/lib/services/etapas.ts`

**Funções a implementar:**

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type Etapa = Tables<'etapas'>

// ===== SELECT =====

/**
 * Busca todas as etapas ordenadas por ordem.
 * Usado em: cronograma/page.tsx, dashboard/page.tsx, cronograma-table.tsx (refreshData)
 */
export async function buscarEtapas(supabase: TypedSupabaseClient): Promise<Etapa[]>
// Implementação: supabase.from('etapas').select('*').order('ordem')

/**
 * Busca uma etapa pelo ID (apenas nome).
 * Usado em: tarefas/[id]/page.tsx (breadcrumb)
 */
export async function buscarEtapaNome(supabase: TypedSupabaseClient, id: string): Promise<{ nome: string } | null>
// Implementação: supabase.from('etapas').select('nome').eq('id', id).single()

// ===== INSERT =====

/**
 * Cria uma nova etapa.
 * Usado em: nova-etapa-dialog.tsx
 */
export async function criarEtapa(
  supabase: TypedSupabaseClient,
  data: {
    nome: string
    descricao?: string | null
    responsavel_id?: string | null
    ordem: number
  }
): Promise<Etapa>
// Implementação: supabase.from('etapas').insert({
//   nome: data.nome,
//   descricao: data.descricao || null,
//   responsavel_id: data.responsavel_id || null,
//   ordem: data.ordem,
//   status: 'nao_iniciada',
//   data_inicio_prevista: null,
//   data_fim_prevista: null,
// }).select().single()

// ===== UPDATE =====

/**
 * Atualiza campos de uma etapa.
 * Usado em: editar-etapa-dialog.tsx, cronograma-table.tsx (updateEtapa)
 *
 * LÓGICA DE NEGÓCIO:
 * - Se status muda para 'em_andamento' e data_inicio_real é null → preencher data_inicio_real
 * - Se status muda para 'concluida' → preencher data_fim_real e progresso_percentual = 100
 */
export async function atualizarEtapa(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'etapas'>
): Promise<Etapa>
// Implementação: aplicar lógica de datas, depois supabase.from('etapas').update(updates).eq('id', id).select().single()

/**
 * Reordena etapas (drag & drop).
 * Usado em: cronograma-table.tsx (handleEtapaDragEnd)
 */
export async function reordenarEtapas(
  supabase: TypedSupabaseClient,
  etapasOrdenadas: { id: string; ordem: number }[]
): Promise<void>
// Implementação: loop com supabase.from('etapas').update({ ordem }).eq('id', id) para cada item

// ===== DELETE =====

/**
 * Deleta uma etapa e todas suas subetapas/tarefas em cascade.
 * Usado em: editar-etapa-dialog.tsx (handleDelete)
 *
 * CORREÇÃO DE BUG: O código antigo tentava deletar tarefas com etapa_id,
 * mas tarefas não têm campo etapa_id. O cascade correto é:
 * 1. Buscar subetapas da etapa
 * 2. Deletar tarefas de cada subetapa (ON DELETE CASCADE do banco cuidará disso)
 * 3. Deletar subetapas da etapa (ON DELETE CASCADE do banco cuidará disso)
 * 4. Deletar a etapa
 *
 * Na prática: como as tabelas têm ON DELETE CASCADE configurado,
 * basta deletar a etapa que o banco cascadeia automaticamente.
 * O código antigo fazia delete manual em 'tarefas' com filtro errado.
 */
export async function deletarEtapa(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void>
// Implementação: supabase.from('etapas').delete().eq('id', id)
// O banco faz cascade: etapa → subetapas → tarefas → anexos/comentários/dependências

// ===== CÁLCULOS =====

/**
 * Calcula o progresso de uma etapa baseado nas subetapas.
 * Usado em: cronograma-table.tsx (calcularProgressoEtapa)
 *
 * Se não tem subetapas, retorna progresso_manual/progresso_percentual.
 * Se tem subetapas, calcula: concluídas / total * 100
 */
export function calcularProgressoEtapa(etapa: Etapa & { subetapas: { status: string }[] }): number

/**
 * Calcula as datas de uma etapa baseado nas subetapas.
 * Usado em: cronograma-table.tsx (calcularDatasEtapa)
 *
 * inicio = menor data_inicio_prevista das subetapas
 * fim = maior data_fim_prevista das subetapas
 */
export function calcularDatasEtapa(subetapas: { data_inicio_prevista: string | null; data_fim_prevista: string | null }[]): { inicio: string | null; fim: string | null }
```

---

#### CRIAR: `src/lib/services/subetapas.ts`

**Funções a implementar:**

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type Subetapa = Tables<'subetapas'>

// ===== SELECT =====

/**
 * Busca todas as subetapas ordenadas por ordem.
 * Usado em: cronograma/page.tsx, cronograma-table.tsx (refreshData)
 */
export async function buscarSubetapas(supabase: TypedSupabaseClient): Promise<Subetapa[]>
// Implementação: supabase.from('subetapas').select('*').order('ordem')

/**
 * Busca subetapas com campos reduzidos para dropdowns/filtros.
 * Usado em: tarefas/page.tsx
 */
export async function buscarSubetapasResumidas(supabase: TypedSupabaseClient): Promise<Pick<Subetapa, 'id' | 'etapa_id' | 'nome'>[]>
// Implementação: supabase.from('subetapas').select('id, etapa_id, nome').order('ordem')

/**
 * Busca uma subetapa pelo ID (campos reduzidos).
 * Usado em: tarefas/[id]/page.tsx (breadcrumb)
 */
export async function buscarSubetapaPorId(supabase: TypedSupabaseClient, id: string): Promise<Pick<Subetapa, 'id' | 'nome' | 'etapa_id'> | null>
// Implementação: supabase.from('subetapas').select('id, nome, etapa_id').eq('id', id).single()

/**
 * Busca subetapas do responsável (para dashboard).
 * Usado em: dashboard/page.tsx
 */
export async function buscarSubetapasDoResponsavel(
  supabase: TypedSupabaseClient,
  responsavelId: string
): Promise<Pick<Subetapa, 'id' | 'nome'>[]>
// Implementação: supabase.from('subetapas').select('id, nome').eq('responsavel_id', responsavelId).neq('status', 'cancelada')

/**
 * Busca subetapas por lista de IDs (para dashboard).
 * Usado em: dashboard/page.tsx
 */
export async function buscarSubetapasPorIds(
  supabase: TypedSupabaseClient,
  ids: string[]
): Promise<Pick<Subetapa, 'id' | 'nome'>[]>
// Implementação: supabase.from('subetapas').select('id, nome').in('id', ids)

// ===== INSERT =====

/**
 * Cria uma nova subetapa.
 * Usado em: nova-subetapa-dialog.tsx
 */
export async function criarSubetapa(
  supabase: TypedSupabaseClient,
  data: {
    etapa_id: string
    nome: string
    descricao?: string | null
    data_inicio_prevista?: string | null
    data_fim_prevista?: string | null
    responsavel_id?: string | null
    ordem: number
  }
): Promise<Subetapa>
// Implementação: supabase.from('subetapas').insert({
//   ...data,
//   descricao: data.descricao || null,
//   responsavel_id: data.responsavel_id || null,
//   status: 'nao_iniciada',
// }).select().single()

// ===== UPDATE =====

/**
 * Atualiza campos de uma subetapa.
 * Usado em: editar-subetapa-dialog.tsx, cronograma-table.tsx (updateSubetapa)
 *
 * LÓGICA DE NEGÓCIO:
 * - Se status muda para 'em_andamento' e data_inicio_real é null → preencher data_inicio_real
 * - Se status muda para 'concluida' → preencher data_fim_real
 */
export async function atualizarSubetapa(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'subetapas'>
): Promise<Subetapa>
// Implementação: aplicar lógica de datas, depois supabase.from('subetapas').update(updates).eq('id', id).select().single()

/**
 * Reordena subetapas (drag & drop).
 * Usado em: cronograma-table.tsx (handleReorderSubetapas)
 */
export async function reordenarSubetapas(
  supabase: TypedSupabaseClient,
  subetapasOrdenadas: { id: string; ordem: number }[]
): Promise<void>
// Implementação: loop com supabase.from('subetapas').update({ ordem }).eq('id', id) para cada item

// ===== DELETE =====

/**
 * Deleta uma subetapa (banco faz cascade em tarefas).
 * Usado em: editar-subetapa-dialog.tsx (handleDelete)
 */
export async function deletarSubetapa(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void>
// Implementação: supabase.from('subetapas').delete().eq('id', id)

// ===== CÁLCULOS =====

/**
 * Calcula o progresso de uma subetapa baseado nas tarefas.
 * Usado em: cronograma-table.tsx (calcularProgressoSubetapa)
 *
 * Se não tem tarefas, retorna progresso_percentual ou 0.
 * Se tem tarefas, calcula: concluídas / total * 100
 */
export function calcularProgressoSubetapa(subetapa: Subetapa & { tarefas: { status: string }[] }): number
```

---

#### CRIAR: `src/lib/services/tarefas.ts`

**Funções a implementar:**

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type Tarefa = Tables<'tarefas'>

// ===== SELECT =====

/**
 * Busca todas as tarefas ordenadas por ordem.
 * Usado em: cronograma/page.tsx, tarefas/page.tsx, cronograma-table.tsx (refreshData)
 */
export async function buscarTarefas(supabase: TypedSupabaseClient): Promise<Tarefa[]>
// Implementação: supabase.from('tarefas').select('*').order('ordem')

/**
 * Busca uma tarefa pelo ID.
 * Usado em: tarefas/[id]/page.tsx
 */
export async function buscarTarefaPorId(supabase: TypedSupabaseClient, id: string): Promise<Tarefa | null>
// Implementação: supabase.from('tarefas').select('*').eq('id', id).single()

/**
 * Busca tarefas do responsável (para dashboard).
 * Usado em: dashboard/page.tsx
 */
export async function buscarTarefasDoResponsavel(
  supabase: TypedSupabaseClient,
  responsavelId: string
): Promise<Pick<Tarefa, 'id' | 'nome' | 'status' | 'data_prevista' | 'prioridade' | 'subetapa_id'>[]>
// Implementação: supabase.from('tarefas').select('id, nome, status, data_prevista, prioridade, subetapa_id')
//   .eq('responsavel_id', responsavelId).neq('status', 'cancelada')

/**
 * Busca tarefas por lista de subetapa_ids (para dashboard).
 * Usado em: dashboard/page.tsx
 */
export async function buscarTarefasPorSubetapas(
  supabase: TypedSupabaseClient,
  subetapaIds: string[]
): Promise<Pick<Tarefa, 'id' | 'subetapa_id' | 'status'>[]>
// Implementação: supabase.from('tarefas').select('id, subetapa_id, status').in('subetapa_id', subetapaIds)

/**
 * Busca tarefas por lista de IDs (para resolver dependências).
 * Usado em: tarefas/[id]/page.tsx
 */
export async function buscarTarefasPorIds(
  supabase: TypedSupabaseClient,
  ids: string[]
): Promise<Pick<Tarefa, 'id' | 'nome' | 'status'>[]>
// Implementação: supabase.from('tarefas').select('id, nome, status').in('id', ids)

// ===== INSERT =====

/**
 * Cria uma nova tarefa.
 * Usado em: nova-tarefa-dialog.tsx
 */
export async function criarTarefa(
  supabase: TypedSupabaseClient,
  data: {
    subetapa_id: string
    nome: string
    descricao?: string | null
    responsavel_id?: string | null
    prioridade?: string
    data_prevista?: string | null
    ordem: number
    tags?: string[]
  }
): Promise<Tarefa>
// Implementação: supabase.from('tarefas').insert({
//   subetapa_id: data.subetapa_id,
//   nome: data.nome,
//   descricao: data.descricao || null,
//   responsavel_id: data.responsavel_id || null,
//   prioridade: data.prioridade || 'media',
//   data_prevista: data.data_prevista || null,
//   status: 'pendente',
//   ordem: data.ordem,
//   tags: data.tags || [],
// }).select().single()

// ===== UPDATE =====

/**
 * Atualiza campos de uma tarefa.
 * Usado em: editar-tarefa-dialog.tsx, cronograma-table.tsx (updateTarefa), tarefa-detalhes.tsx (updateField)
 *
 * LÓGICA DE NEGÓCIO:
 * - Se status muda para 'em_andamento' e data_inicio_real é null → preencher data_inicio_real com new Date().toISOString()
 * - Se status muda para 'concluida' → preencher data_conclusao_real com new Date().toISOString()
 */
export async function atualizarTarefa(
  supabase: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<'tarefas'>
): Promise<Tarefa>
// Implementação: aplicar lógica de datas automáticas, depois:
// supabase.from('tarefas').update(updatesComDatas).eq('id', id).select().single()

/**
 * Reordena tarefas (drag & drop).
 * Usado em: cronograma-table.tsx (handleReorderTarefas)
 */
export async function reordenarTarefas(
  supabase: TypedSupabaseClient,
  tarefasOrdenadas: { id: string; ordem: number }[]
): Promise<void>
// Implementação: loop com supabase.from('tarefas').update({ ordem }).eq('id', id) para cada item

// ===== DELETE =====

/**
 * Deleta uma tarefa (banco faz cascade em anexos/comentários/dependências).
 * Usado em: tarefa-detalhes.tsx (handleDelete), editar-tarefa-dialog.tsx (handleDelete)
 */
export async function deletarTarefa(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void>
// Implementação: supabase.from('tarefas').delete().eq('id', id)
```

---

#### CRIAR: `src/lib/services/tarefas-anexos.ts`

**Funções a implementar:**

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type TarefaAnexo = Tables<'tarefas_anexos'>

// ===== SELECT =====

/**
 * Busca anexos de uma tarefa.
 * Usado em: tarefas/[id]/page.tsx
 */
export async function buscarAnexosDaTarefa(
  supabase: TypedSupabaseClient,
  tarefaId: string
): Promise<Pick<TarefaAnexo, 'id' | 'nome_original' | 'tipo_arquivo' | 'tamanho_bytes' | 'storage_path' | 'created_at' | 'created_by'>[]>
// Implementação: supabase.from('tarefas_anexos')
//   .select('id, nome_original, tipo_arquivo, tamanho_bytes, storage_path, created_at, created_by')
//   .eq('tarefa_id', tarefaId)
//   .order('created_at', { ascending: false })

// ===== UPLOAD =====

/**
 * Faz upload de arquivo e registra no banco.
 * Usado em: tarefa-detalhes.tsx (handleUpload)
 *
 * Passos:
 * 1. Gerar nome de arquivo com timestamp: `${Date.now()}-${file.name}`
 * 2. Upload para storage: supabase.storage.from('tarefas-anexos').upload(nomeArquivo, file)
 * 3. Insert no banco: supabase.from('tarefas_anexos').insert({...})
 */
export async function uploadAnexo(
  supabase: TypedSupabaseClient,
  tarefaId: string,
  file: File,
  userId: string
): Promise<TarefaAnexo>
// Implementação:
// const nomeArquivo = `${Date.now()}-${file.name}`
// const { error: uploadError } = await supabase.storage.from('tarefas-anexos').upload(nomeArquivo, file)
// if (uploadError) throw uploadError
// const { data, error } = await supabase.from('tarefas_anexos').insert({
//   tarefa_id: tarefaId,
//   nome_arquivo: nomeArquivo,
//   nome_original: file.name,
//   tipo_arquivo: file.type,
//   tamanho_bytes: file.size,
//   storage_path: nomeArquivo,
//   created_by: userId,
// }).select().single()
// if (error) throw error
// return data

// ===== DOWNLOAD =====

/**
 * Faz download de um anexo do storage.
 * Usado em: tarefa-detalhes.tsx (downloadAnexo)
 */
export async function downloadAnexo(
  supabase: TypedSupabaseClient,
  storagePath: string
): Promise<Blob>
// Implementação: supabase.storage.from('tarefas-anexos').download(storagePath)

// ===== DELETE =====

/**
 * Deleta um anexo (storage + banco).
 * Usado em: tarefa-detalhes.tsx (deleteAnexo)
 *
 * Passos:
 * 1. Buscar storage_path do anexo (ou receber como parâmetro)
 * 2. Deletar do storage: supabase.storage.from('tarefas-anexos').remove([storagePath])
 * 3. Deletar do banco: supabase.from('tarefas_anexos').delete().eq('id', id)
 */
export async function deletarAnexo(
  supabase: TypedSupabaseClient,
  id: string,
  storagePath: string
): Promise<void>
// Implementação:
// await supabase.storage.from('tarefas-anexos').remove([storagePath])
// const { error } = await supabase.from('tarefas_anexos').delete().eq('id', id)
// if (error) throw error
```

---

#### CRIAR: `src/lib/services/tarefas-comentarios.ts`

**Funções a implementar:**

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type TarefaComentario = Tables<'tarefas_comentarios'>

// ===== SELECT =====

/**
 * Busca comentários de uma tarefa (ordem cronológica).
 * Usado em: tarefas/[id]/page.tsx
 */
export async function buscarComentariosDaTarefa(
  supabase: TypedSupabaseClient,
  tarefaId: string
): Promise<Pick<TarefaComentario, 'id' | 'conteudo' | 'created_at' | 'created_by'>[]>
// Implementação: supabase.from('tarefas_comentarios')
//   .select('id, conteudo, created_at, created_by')
//   .eq('tarefa_id', tarefaId)
//   .order('created_at', { ascending: true })

// ===== INSERT =====

/**
 * Cria um comentário em uma tarefa.
 * Usado em: tarefa-detalhes.tsx (submitComentario)
 */
export async function criarComentario(
  supabase: TypedSupabaseClient,
  tarefaId: string,
  conteudo: string,
  userId: string
): Promise<TarefaComentario>
// Implementação: supabase.from('tarefas_comentarios').insert({
//   tarefa_id: tarefaId,
//   conteudo: conteudo.trim(),
//   created_by: userId,
// }).select().single()
```

---

#### CRIAR: `src/lib/services/tarefas-dependencias.ts`

**Funções a implementar:**

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
type TarefaDependencia = Tables<'tarefas_dependencias'>

// ===== SELECT =====

/**
 * Busca dependências de uma tarefa.
 * Usado em: tarefas/[id]/page.tsx
 */
export async function buscarDependenciasDaTarefa(
  supabase: TypedSupabaseClient,
  tarefaId: string
): Promise<Pick<TarefaDependencia, 'id' | 'depende_de_tarefa_id'>[]>
// Implementação: supabase.from('tarefas_dependencias')
//   .select('id, depende_de_tarefa_id')
//   .eq('tarefa_id', tarefaId)
```

---

#### MODIFICAR: Componentes que passam a consumir services

Para cada componente abaixo, a refatoração segue o **mesmo padrão mecânico**:

1. Adicionar import do service relevante
2. Substituir a query inline pela chamada ao service
3. Remover o `createClient()` se não for mais usado para nenhuma outra operação no componente
4. Manter todo o restante do componente intacto (UI, estado, toast, router.refresh, etc.)

---

##### MODIFICAR: `src/app/(dashboard)/cronograma/page.tsx`

**Imports a adicionar:**
```typescript
import { buscarEtapas } from '@/lib/services/etapas'
import { buscarSubetapas } from '@/lib/services/subetapas'
import { buscarTarefas } from '@/lib/services/tarefas'
```

**Substituições:**
| Código atual | Substituir por |
|---|---|
| `supabase.from("etapas").select("*").order("ordem")` | `buscarEtapas(supabase)` |
| `supabase.from("subetapas").select("*").order("ordem")` | `buscarSubetapas(supabase)` |
| `supabase.from("tarefas").select("*").order("ordem")` | `buscarTarefas(supabase)` |

**Nota:** Este page.tsx também faz queries de `gastos` e `users` que NÃO fazem parte da Fase 1. Manter essas queries inline.

---

##### MODIFICAR: `src/app/(dashboard)/tarefas/page.tsx`

**Imports a adicionar:**
```typescript
import { buscarTarefas } from '@/lib/services/tarefas'
import { buscarSubetapasResumidas } from '@/lib/services/subetapas'
```

**Substituições:**
| Código atual | Substituir por |
|---|---|
| `supabase.from("tarefas").select("*").order("ordem")` | `buscarTarefas(supabase)` |
| `supabase.from("subetapas").select("id, etapa_id, nome").order("ordem")` | `buscarSubetapasResumidas(supabase)` |

---

##### MODIFICAR: `src/app/(dashboard)/tarefas/[id]/page.tsx`

**Imports a adicionar:**
```typescript
import { buscarTarefaPorId, buscarTarefasPorIds } from '@/lib/services/tarefas'
import { buscarSubetapaPorId } from '@/lib/services/subetapas'
import { buscarEtapaNome } from '@/lib/services/etapas'
import { buscarAnexosDaTarefa } from '@/lib/services/tarefas-anexos'
import { buscarComentariosDaTarefa } from '@/lib/services/tarefas-comentarios'
import { buscarDependenciasDaTarefa } from '@/lib/services/tarefas-dependencias'
```

**Substituições:**
| Código atual | Substituir por |
|---|---|
| `supabase.from("tarefas").select("*").eq("id", id).single()` | `buscarTarefaPorId(supabase, id)` |
| `supabase.from("subetapas").select("id, nome, etapa_id").eq("id", tarefa.subetapa_id).single()` | `buscarSubetapaPorId(supabase, tarefa.subetapa_id)` |
| `supabase.from("etapas").select("nome").eq("id", subetapa.etapa_id).single()` | `buscarEtapaNome(supabase, subetapa.etapa_id)` |
| `supabase.from("tarefas_dependencias").select("id, depende_de_tarefa_id").eq("tarefa_id", id)` | `buscarDependenciasDaTarefa(supabase, id)` |
| `supabase.from("tarefas_anexos").select("id, nome_original, tipo_arquivo, tamanho_bytes, storage_path, created_at, created_by").eq("tarefa_id", id).order(...)` | `buscarAnexosDaTarefa(supabase, id)` |
| `supabase.from("tarefas_comentarios").select("id, conteudo, created_at, created_by").eq("tarefa_id", id).order(...)` | `buscarComentariosDaTarefa(supabase, id)` |
| `supabase.from("tarefas").select("id, nome, status").in("id", depTarefaIds)` | `buscarTarefasPorIds(supabase, depTarefaIds)` |

---

##### MODIFICAR: `src/app/(dashboard)/dashboard/page.tsx`

**Imports a adicionar:**
```typescript
import { buscarEtapas } from '@/lib/services/etapas'
import { buscarSubetapasDoResponsavel, buscarSubetapasPorIds } from '@/lib/services/subetapas'
import { buscarTarefasDoResponsavel, buscarTarefasPorSubetapas } from '@/lib/services/tarefas'
```

**Substituições:**
| Código atual | Substituir por |
|---|---|
| `supabase.from("etapas").select("*").order("ordem")` | `buscarEtapas(supabase)` |
| `supabase.from("tarefas").select("id, nome, status, data_prevista, prioridade, subetapa_id").eq("responsavel_id", currentUserId).neq("status", "cancelada")` | `buscarTarefasDoResponsavel(supabase, currentUserId)` |
| `supabase.from("subetapas").select("id, nome").eq("responsavel_id", currentUserId).neq("status", "cancelada")` | `buscarSubetapasDoResponsavel(supabase, currentUserId)` |
| `supabase.from("subetapas").select("id, nome").in("id", subetapaIds)` | `buscarSubetapasPorIds(supabase, subetapaIds)` |
| `supabase.from("tarefas").select("id, subetapa_id, status").in("subetapa_id", subIds)` | `buscarTarefasPorSubetapas(supabase, subIds)` |

**Nota:** Manter inline as queries de `categorias`, `gastos`, `fornecedores` — Fase 2.

---

##### MODIFICAR: `src/components/features/cronograma/cronograma-table.tsx`

**Imports a adicionar:**
```typescript
import { buscarEtapas, atualizarEtapa, reordenarEtapas, calcularProgressoEtapa, calcularDatasEtapa } from '@/lib/services/etapas'
import { buscarSubetapas, atualizarSubetapa, reordenarSubetapas } from '@/lib/services/subetapas'
import { buscarTarefas, atualizarTarefa, reordenarTarefas } from '@/lib/services/tarefas'
```

**Substituições:**

1. **refreshData** — substituir as 3 queries inline:
   - `supabase.from("etapas").select("*").order("ordem")` → `buscarEtapas(supabase)`
   - `supabase.from("subetapas").select("*").order("ordem")` → `buscarSubetapas(supabase)`
   - `supabase.from("tarefas").select("*").order("ordem")` → `buscarTarefas(supabase)`

2. **Funções locais de cálculo** — REMOVER e usar services:
   - `calcularProgressoEtapa()` local → import de `@/lib/services/etapas`
   - `calcularProgressoSubetapa()` local → import de `@/lib/services/subetapas`
   - `calcularDatasEtapa()` local → import de `@/lib/services/etapas`

3. **handleEtapaDragEnd** — substituir loop de updates:
   - Loop `supabase.from("etapas").update({ ordem: i + 1 }).eq("id", ...)` → `reordenarEtapas(supabase, etapasOrdenadas)`

4. **handleReorderSubetapas** — substituir loop de updates:
   - Loop `supabase.from("subetapas").update({ ordem: i + 1 }).eq("id", ...)` → `reordenarSubetapas(supabase, subetapasOrdenadas)`

5. **handleReorderTarefas** — substituir loop de updates:
   - Loop `supabase.from("tarefas").update({ ordem: i + 1 }).eq("id", ...)` → `reordenarTarefas(supabase, tarefasOrdenadas)`

6. **updateEtapa** — substituir update inline:
   - `supabase.from("etapas").update(updates).eq("id", etapaId)` → `atualizarEtapa(supabase, etapaId, updates)`

7. **updateSubetapa** — substituir update inline:
   - `supabase.from("subetapas").update(updates).eq("id", subetapaId)` → `atualizarSubetapa(supabase, subetapaId, updates)`

8. **updateTarefa** — substituir update inline:
   - `supabase.from("tarefas").update(updates).eq("id", tarefaId)` → `atualizarTarefa(supabase, tarefaId, updates)`

**IMPORTANTE:** A lógica de auto-preenchimento de datas (data_inicio_real, data_fim_real, data_conclusao_real) que hoje está DENTRO de updateEtapa/updateSubetapa/updateTarefa no componente deve ser REMOVIDA do componente. Essa lógica agora está nos services.

---

##### MODIFICAR: `src/components/features/cronograma/nova-etapa-dialog.tsx`

**Import a adicionar:**
```typescript
import { criarEtapa } from '@/lib/services/etapas'
```

**Substituição no onSubmit:**
- `supabase.from("etapas").insert({...}).select().single()` → `criarEtapa(supabase, { nome, descricao, responsavel_id, ordem })`

---

##### MODIFICAR: `src/components/features/cronograma/editar-etapa-dialog.tsx`

**Import a adicionar:**
```typescript
import { atualizarEtapa, deletarEtapa } from '@/lib/services/etapas'
```

**Substituições:**
- **onSubmit:** `supabase.from("etapas").update({...}).eq("id", etapa.id)` → `atualizarEtapa(supabase, etapa.id, { nome, descricao, responsavel_id })`
- **handleDelete:** Todo o bloco de delete (que deletava tarefas + etapa com bug) → `deletarEtapa(supabase, etapa.id)`

---

##### MODIFICAR: `src/components/features/cronograma/nova-subetapa-dialog.tsx`

**Import a adicionar:**
```typescript
import { criarSubetapa } from '@/lib/services/subetapas'
```

**Substituição no onSubmit:**
- `supabase.from("subetapas").insert({...})` → `criarSubetapa(supabase, { etapa_id, nome, descricao, data_inicio_prevista, data_fim_prevista, responsavel_id, ordem })`

---

##### MODIFICAR: `src/components/features/cronograma/editar-subetapa-dialog.tsx`

**Import a adicionar:**
```typescript
import { atualizarSubetapa, deletarSubetapa } from '@/lib/services/subetapas'
```

**Substituições:**
- **onSubmit:** `supabase.from("subetapas").update({...}).eq("id", subetapa.id)` → `atualizarSubetapa(supabase, subetapa.id, { nome, descricao, data_inicio_prevista, data_fim_prevista, responsavel_id })`
- **handleDelete:** `supabase.from("subetapas").delete().eq("id", subetapa.id)` → `deletarSubetapa(supabase, subetapa.id)`

---

##### MODIFICAR: `src/components/features/tarefas/nova-tarefa-dialog.tsx`

**Import a adicionar:**
```typescript
import { criarTarefa } from '@/lib/services/tarefas'
```

**Substituição no onSubmit:**
- `supabase.from("tarefas").insert({...})` → `criarTarefa(supabase, { subetapa_id, nome, descricao, responsavel_id, prioridade, data_prevista, ordem, tags })`

---

##### MODIFICAR: `src/components/features/tarefas/editar-tarefa-dialog.tsx`

**Import a adicionar:**
```typescript
import { atualizarTarefa, deletarTarefa } from '@/lib/services/tarefas'
```

**Substituições:**
- **onSubmit:** `supabase.from("tarefas").update(updatedData).eq("id", tarefa.id)` → `atualizarTarefa(supabase, tarefa.id, updatedData)`
  - **REMOVER** a lógica local de datas automáticas (data_inicio_real, data_conclusao_real) — agora está no service
- **handleDelete:** `supabase.from("tarefas").delete().eq("id", tarefa.id)` → `deletarTarefa(supabase, tarefa.id)`

---

##### MODIFICAR: `src/components/features/tarefas/tarefa-detalhes.tsx`

**Imports a adicionar:**
```typescript
import { atualizarTarefa, deletarTarefa } from '@/lib/services/tarefas'
import { uploadAnexo, downloadAnexo, deletarAnexo } from '@/lib/services/tarefas-anexos'
import { criarComentario } from '@/lib/services/tarefas-comentarios'
```

**Substituições:**
- **updateField:** `supabase.from("tarefas").update({ [field]: value }).eq("id", tarefa.id)` → `atualizarTarefa(supabase, tarefa.id, { [field]: value })`
- **handleDelete:** `supabase.from("tarefas").delete().eq("id", tarefa.id)` → `deletarTarefa(supabase, tarefa.id)`
- **handleUpload:** Todo o bloco (storage.upload + from('tarefas_anexos').insert) → `uploadAnexo(supabase, tarefa.id, file, userId)`
- **downloadAnexo:** `supabase.storage.from("tarefas-anexos").download(path)` → `downloadAnexo(supabase, path)`
- **deleteAnexo:** Todo o bloco (storage.remove + from('tarefas_anexos').delete) → `deletarAnexo(supabase, anexoId, storagePath)`
- **submitComentario:** `supabase.from("tarefas_comentarios").insert({...})` → `criarComentario(supabase, tarefa.id, conteudo, userId)`

---

### 4.3 Fluxo de Dados

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
4. **Service** aplica lógica de negócio (datas automáticas)
5. **Service** retorna dados tipados ou lança erro (throw)
6. **Componente/Página** trata o retorno (exibe dados, toast de sucesso/erro, router.refresh)

### 4.4 Dependências Externas

Nenhuma dependência externa. Utiliza apenas bibliotecas já instaladas:
- `@supabase/supabase-js` (já instalado)
- Tipos de `@/lib/types/database` (já gerados)

### 4.5 Decisões de Design e Justificativas

- **Dependency Injection (client como parâmetro):** Padrão Clean Architecture / Repository Pattern. Funciona em Server Components (client server) e Client Components (client browser) sem duplicação de código. Permite testes com mocks.
- **Funções puras (sem React, sem estado):** Services são funções async que recebem input e retornam output. Sem useState, useEffect, hooks. Maximiza previsibilidade e testabilidade.
- **Assinatura padronizada `funcao(supabase, ...params)`:** Todas as funções seguem o mesmo padrão mecânico. O primeiro parâmetro é sempre o client tipado. Minimiza decisões do executor.
- **throw error ao invés de retornar {data, error}:** Services lançam exceções em caso de erro. O componente que chama faz try/catch. Simplifica o fluxo e é o padrão mais comum em services.
- **Lógica de datas automáticas nos services:** A regra "se status = em_andamento → preencher data_inicio_real" fica centralizada no service `atualizarTarefa/atualizarSubetapa/atualizarEtapa`. Removida dos componentes.
- **Correção de bug no delete de etapa:** O código antigo tentava `supabase.from("tarefas").delete().eq("etapa_id", etapa.id)` mas tarefas não têm `etapa_id`. O service apenas deleta a etapa e confia no ON DELETE CASCADE do banco.
- **Faseamento em 3 fases:** Fase 1 = cronograma (esta spec), Fase 2 = financeiro, Fase 3 = demais. Cada fase é independente e verificável.

---

## 5. Execução

*(preenchido pelo Executor)*

### 5.1 Progresso

#### Services (criar)
- [x] `src/lib/services/etapas.ts`
- [x] `src/lib/services/subetapas.ts`
- [x] `src/lib/services/tarefas.ts`
- [x] `src/lib/services/tarefas-anexos.ts`
- [x] `src/lib/services/tarefas-comentarios.ts`
- [x] `src/lib/services/tarefas-dependencias.ts`

#### Refatorar componentes
- [x] `cronograma/page.tsx`
- [x] `tarefas/page.tsx`
- [x] `tarefas/[id]/page.tsx`
- [x] `dashboard/page.tsx`
- [x] `cronograma-table.tsx`
- [x] `nova-etapa-dialog.tsx`
- [x] `editar-etapa-dialog.tsx`
- [x] `nova-subetapa-dialog.tsx`
- [x] `editar-subetapa-dialog.tsx`
- [x] `nova-tarefa-dialog.tsx`
- [x] `editar-tarefa-dialog.tsx`
- [x] `tarefa-detalhes.tsx`

#### Validação
- [x] TypeScript sem erros novos
- [ ] Testado manualmente

### 5.2 Notas de Implementação

- Upload de anexo usa path `${tarefaId}/${Date.now()}-${file.name}` (mesmo padrão do componente existente)
- Lógica de datas automáticas usa `new Date().toISOString().split('T')[0]` para etapas/subetapas (date only) e `new Date().toISOString()` para tarefas (timestamp completo), conforme padrão dos componentes existentes
- `calcularProgressoEtapa` retorna `progresso_percentual ?? 0` quando não há subetapas (mesmo padrão do componente)
- TypeScript validado sem erros novos após criação dos 6 services
- `calcularProgressoEtapa` e `calcularProgressoSubetapa` usam tipos estruturais (duck typing) ao invés de `Tables<'etapas'>` completo, para compatibilidade com interfaces locais dos componentes
- `downloadAnexo` do service renomeado para `downloadAnexoService` no import do `tarefa-detalhes.tsx` para evitar conflito com a função local `handleDownloadAnexo`
- Bug fix em `editar-etapa-dialog.tsx`: removido `supabase.from("tarefas").delete().eq("etapa_id", etapa.id)` (query bugada), agora usa `deletarEtapa` que confia no CASCADE do banco
- Dashboard: queries de etapas, tarefas do responsável e subetapas agora retornam dados diretamente (não `{data, error}`), ajustando destructuring e removendo type casts desnecessários

### 5.3 Conversa de Execução

#### IA: 6 services criados e validados

Criados os 6 arquivos de service conforme spec seção 4.2:
- `etapas.ts` — buscar, criar, atualizar, reordenar, deletar, calcularProgresso, calcularDatas
- `subetapas.ts` — buscar (5 variantes), criar, atualizar, reordenar, deletar, calcularProgresso
- `tarefas.ts` — buscar (5 variantes), criar, atualizar, reordenar, deletar
- `tarefas-anexos.ts` — buscar, upload, download, deletar
- `tarefas-comentarios.ts` — buscar, criar
- `tarefas-dependencias.ts` — buscar

TypeScript: sem erros. Próximo passo: refatorar componentes para consumir os services.

---

#### IA: 12 componentes refatorados e validados

Refatorados todos os 12 componentes conforme tabelas de substituição da spec seção 4.2:

**Pages (Server Components):**
- `cronograma/page.tsx` — 3 queries substituídas (etapas, subetapas, tarefas)
- `tarefas/page.tsx` — 2 queries substituídas (tarefas, subetapas resumidas)
- `tarefas/[id]/page.tsx` — 7 queries substituídas (tarefa, subetapa, etapa nome, dependências, anexos, comentários, tarefas por IDs)
- `dashboard/page.tsx` — 5 queries substituídas (etapas, tarefas responsável, subetapas responsável, subetapas por IDs, tarefas por subetapas)

**Client Components:**
- `cronograma-table.tsx` — 3 funções locais removidas (calcularProgressoEtapa, calcularProgressoSubetapa, calcularDatasEtapa), refreshData, 3 reorder handlers, 3 update handlers
- `nova-etapa-dialog.tsx` — insert → criarEtapa
- `editar-etapa-dialog.tsx` — update → atualizarEtapa, delete → deletarEtapa (bug fix: removido delete de tarefas com etapa_id)
- `nova-subetapa-dialog.tsx` — insert → criarSubetapa
- `editar-subetapa-dialog.tsx` — update → atualizarSubetapa, delete → deletarSubetapa
- `nova-tarefa-dialog.tsx` — insert → criarTarefa
- `editar-tarefa-dialog.tsx` — update → atualizarTarefa (removida lógica local de datas), delete → deletarTarefa
- `tarefa-detalhes.tsx` — updateField → atualizarTarefa, handleDelete → deletarTarefa, handleUpload → uploadAnexo, downloadAnexo → downloadAnexoService, deleteAnexo → deletarAnexo, submitComentario → criarComentario

TypeScript: `npx tsc --noEmit` sem erros. 2 erros de tipo corrigidos (funções de cálculo ajustadas para tipos estruturais).

---

#### usuário:

---

## 6. Validação Final

- [x] `npx tsc --noEmit` sem erros novos
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
