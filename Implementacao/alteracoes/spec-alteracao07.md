# Especificacao: Alteracao 07 - Correcoes em Services (error handling + return types)

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Concluido |
| Conversa | Auditoria de conformidade (conversa direta no chat) |
| Data criacao | 10/02/2026 |
| Complexidade | 🟢 Baixa |

**Status possiveis:**
- 🔵 Pronto para executar
- 🔴 Em execucao
- 🟠 Aguardando testes
- 🟢 Concluido
- ❌ Cancelado

---

## 1. Resumo

Corrigir 2 tipos de violacao encontrados na auditoria dos 13 services: 1 funcao sem error handling no storage (`tarefas-anexos.ts`) e 7 funcoes sem anotacao de return type em 3 services (`compras.ts`, `gastos.ts`, `orcamento-detalhado.ts`).

---

## 2. O que sera feito

- [ ] Adicionar error handling em `deletarAnexo()` no `tarefas-anexos.ts`
- [ ] Adicionar return type em `buscarComprasComDetalhes()` e `buscarCompraPorIdComDetalhes()` no `compras.ts`
- [ ] Adicionar return type em `buscarGastosComDetalhes()`, `buscarGastosAprovados()`, `buscarGastosPorFornecedor()` e `buscarGastosDetalhadosPorCategoria()` no `gastos.ts`
- [ ] Adicionar return type em `buscarDetalhamentoComCategoria()` no `orcamento-detalhado.ts`
- [ ] Validar TypeScript (`npx tsc --noEmit`)

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- `deletarAnexo()` em `tarefas-anexos.ts` faz `storage.remove()` sem verificar o erro — se o storage falhar, o registro no banco e deletado mesmo assim, criando inconsistencia
- 7 funcoes em 3 services nao possuem anotacao explicita de `Promise<ReturnType>` — TypeScript infere, mas o padrao do projeto exige anotacao explicita para clareza

**Depois (comportamento proposto):**
- `deletarAnexo()` verifica o erro do `storage.remove()` antes de prosseguir com o delete no banco
- Todas as 7 funcoes possuem return type explicito

### 3.2 UI Proposta

N/A — correcao interna sem impacto visual.

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A — sem alteracoes no banco.

### 4.2 Arquivos a Modificar/Criar

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/lib/services/tarefas-anexos.ts` | Adicionar error handling na linha 72 do `storage.remove()` |
| MODIFICAR | `src/lib/services/compras.ts` | Adicionar return types em 2 funcoes |
| MODIFICAR | `src/lib/services/gastos.ts` | Adicionar return types em 4 funcoes |
| MODIFICAR | `src/lib/services/orcamento-detalhado.ts` | Adicionar return type em 1 funcao |

---

#### `src/lib/services/tarefas-anexos.ts` — error handling

**Antes (linha 72):**

```typescript
export async function deletarAnexo(
  supabase: TypedSupabaseClient,
  id: string,
  storagePath: string
): Promise<void> {
  await supabase.storage.from('tarefas-anexos').remove([storagePath])  // SEM ERROR HANDLING
  const { error } = await supabase.from('tarefas_anexos').delete().eq('id', id)
  if (error) throw error
}
```

**Depois:**

```typescript
export async function deletarAnexo(
  supabase: TypedSupabaseClient,
  id: string,
  storagePath: string
): Promise<void> {
  const { error: storageError } = await supabase.storage.from('tarefas-anexos').remove([storagePath])
  if (storageError) throw storageError
  const { error } = await supabase.from('tarefas_anexos').delete().eq('id', id)
  if (error) throw error
}
```

---

#### `src/lib/services/compras.ts` — return types

As funcoes `buscarComprasComDetalhes` e `buscarCompraPorIdComDetalhes` usam JOINs com `.select()` que retornam tipos complexos. O Executor deve:

1. Verificar o tipo inferido pelo TypeScript (hovering sobre `data`)
2. Se o tipo e um array de objetos com joins, declarar o return type como o tipo inferido
3. Alternativa: deixar TypeScript inferir mas adicionar pelo menos `Promise<>` wrapper

**Padrao para funcoes com JOINs complexos:**

```typescript
// Opcao 1: tipo inferido (recomendado para JOINs)
// Deixar TypeScript inferir o tipo do data e anotar com o que ele retorna

// Opcao 2: tipo explicito simplificado
export async function buscarComprasComDetalhes(
  supabase: TypedSupabaseClient
): Promise<(Tables<'compras'> & {
  fornecedor: Pick<Tables<'fornecedores'>, 'nome'> | null
  categoria: Pick<Tables<'categorias'>, 'nome' | 'cor'> | null
  subcategoria: Pick<Tables<'subcategorias'>, 'nome'> | null
  etapa: Pick<Tables<'etapas'>, 'nome'> | null
})[]> {
  // ...
}
```

**Nota:** Se o tipo inferido for muito verboso, o Executor pode criar type aliases no topo do arquivo. Ex: `type CompraComDetalhes = ...`

---

#### `src/lib/services/gastos.ts` — return types

Mesma abordagem de `compras.ts`. As 4 funcoes (`buscarGastosComDetalhes`, `buscarGastosAprovados`, `buscarGastosPorFornecedor`, `buscarGastosDetalhadosPorCategoria`) usam o mesmo `.select()` com JOINs.

**Recomendacao:** Criar um type alias `GastoComDetalhes` no topo do arquivo e reutilizar nas 4 funcoes.

```typescript
type GastoComDetalhes = Tables<'gastos'> & {
  categorias: Pick<Tables<'categorias'>, 'nome' | 'cor'> | null
  fornecedores: Pick<Tables<'fornecedores'>, 'nome'> | null
  etapas: Pick<Tables<'etapas'>, 'nome'> | null
}
```

---

#### `src/lib/services/orcamento-detalhado.ts` — return type

Similar. A funcao `buscarDetalhamentoComCategoria` usa `.select()` com campos especificos e JOIN.

### 4.3 Fluxo de Dados

N/A — sem mudanca de fluxo. Apenas adicao de anotacoes de tipo e error handling.

### 4.4 Dependencias Externas

N/A.

### 4.5 Decisoes de Design e Justificativas

| # | Decisao | Justificativa |
|---|---------|---------------|
| 1 | **Error handling no storage ANTES do delete no banco** | Evita inconsistencia: se o storage falhar, o registro do banco permanece intacto |
| 2 | **Type aliases para JOINs complexos** | Evita return types excessivamente verbosos. Reutilizavel entre funcoes do mesmo service |
| 3 | **Escopo limitado a 4 arquivos** | Demais services ja possuem return types corretos (verificado na auditoria) |

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [x] tarefas-anexos.ts error handling corrigido
- [x] compras.ts return types adicionados
- [x] gastos.ts return types adicionados
- [x] orcamento-detalhado.ts return type adicionado
- [x] TypeScript sem erros

### 5.2 Notas de Implementacao

- **gastos.ts — hint de FK corrigido:** A query de `buscarGastosDetalhadosPorCategoria` usava `criado_por_user:criado_por(nome_completo)`, mas como existem multiplas FKs de `gastos` para `users`, o TypeScript nao conseguia resolver a relacao. Corrigido para `criado_por_user:users!criado_por(nome_completo)` (hint explicito). Sem impacto no runtime.
- **gastos.ts — tipos separados por funcao:** A spec sugeria um unico type alias `GastoComDetalhes` para as 4 funcoes, mas cada funcao usa um `.select()` diferente. Criados 4 tipos distintos: `GastoComDetalhes`, `GastoAprovado`, `GastoPorFornecedor`, `GastoDetalhadoPorCategoria`.
- **compras.ts — 2 type aliases:** `buscarComprasComDetalhes` e `buscarCompraPorIdComDetalhes` diferem no select do fornecedor (a segunda inclui `cnpj_cpf`). Criados `CompraComDetalhes` e `CompraComDetalhesFornecedor`.

### 5.3 Conversa de Execucao

#### IA: Execucao concluida — 4 arquivos modificados, 0 erros tsc

Implementados todos os itens da spec:
- `tarefas-anexos.ts`: error handling no `storage.remove()` antes do delete no banco
- `compras.ts`: 2 type aliases + return types em `buscarComprasComDetalhes` e `buscarCompraPorIdComDetalhes`
- `gastos.ts`: 4 type aliases + return types em 4 funcoes + correcao de FK hint em `buscarGastosDetalhadosPorCategoria`
- `orcamento-detalhado.ts`: 1 type alias + return type em `buscarDetalhamentoComCategoria`

---

## 6. Validacao Final

- [x] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
