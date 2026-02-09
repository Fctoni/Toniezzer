# Especificacao: Alteracao 04 - Centralizar CRUD em services (Fase 2: Financeiro)

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Concluido |
| Conversa | [alteracao04.md](./alteracao/alteracao04.md) |
| Data criacao | 09/02/2026 |
| Complexidade | 🔴 Alta |

**Status possiveis:**
- 🔵 Pronto para executar
- 🔴 Em execucao
- 🟠 Aguardando testes
- 🟢 Concluido
- ❌ Cancelado

---

## 1. Resumo

Continuacao da Alteracao 03 (Fase 1: Cronograma). Centralizar 73 operacoes CRUD inline de 7 entidades financeiras (categorias, subcategorias, compras, fornecedores, gastos, orcamento_detalhado, recibos) em services dedicados seguindo Clean Architecture com Dependency Injection.

Dividido em:
- **Sub-fase 4a:** Criar 7 service files + 1 storage service (~60 funcoes)
- **Sub-fase 4b:** Refatorar 29 arquivos de componentes/pages/API routes

---

## 2. O que sera feito

### Sub-fase 4a — Criar Services

- [ ] Criar `src/lib/services/categorias.ts` (~13 funcoes)
- [ ] Criar `src/lib/services/subcategorias.ts` (~7 funcoes)
- [ ] Criar `src/lib/services/compras.ts` (~6 funcoes)
- [ ] Criar `src/lib/services/fornecedores.ts` (~9 funcoes)
- [ ] Criar `src/lib/services/gastos.ts` (~15 funcoes)
- [ ] Criar `src/lib/services/orcamento-detalhado.ts` (~6 funcoes)
- [ ] Criar `src/lib/services/recibos.ts` (~1 funcao)
- [ ] Validar TypeScript (`npx tsc --noEmit`)

### Sub-fase 4b — Refatorar Componentes

- [ ] `configuracoes/categorias/page.tsx` (16 ops)
- [ ] `compras/page.tsx` (3 ops)
- [ ] `compras/nova/page.tsx` (2 ops)
- [ ] `compras/[id]/page.tsx` (3 ops)
- [ ] `compras/[id]/editar/page.tsx` (3 ops)
- [ ] `compras/compra-form.tsx` (3 ops)
- [ ] `compras/compra-edit-form.tsx` (3 ops)
- [ ] `compras/parcelas-table.tsx` (4 ops)
- [ ] `fornecedores/page.tsx` (1 op)
- [ ] `fornecedores/[id]/page.tsx` (4 ops)
- [ ] `fornecedores/fornecedor-form.tsx` (2 ops)
- [ ] `financeiro/page.tsx` (2 ops)
- [ ] `financeiro/orcamento/page.tsx` (3 ops)
- [ ] `financeiro/fluxo-caixa/page.tsx` (2 ops)
- [ ] `financeiro/matriz-gastos/page.tsx` (3 ops)
- [ ] `financeiro/lancamentos/page.tsx` (3 ops)
- [ ] `financeiro/lancamentos/novo/page.tsx` (2 ops)
- [ ] `financeiro/lancamentos/foto/page.tsx` (2 ops)
- [ ] `financeiro/form-lancamento.tsx` (2 ops)
- [ ] `financeiro/orcamento-editor.tsx` (1 op)
- [ ] `emails/[id]/page.tsx` (2 ops)
- [ ] `emails/form-aprovacao.tsx` (2 ops)
- [ ] `ocr/form-ocr.tsx` (2 ops)
- [ ] `ocr/quick-add-fornecedor.tsx` (1 op)
- [ ] `dashboard/page.tsx` (2 ops)
- [ ] `cronograma/page.tsx` (1 op)
- [ ] `api/financeiro/gastos-detalhes/route.ts` (1 op)
- [ ] `api/orcamento/detalhamento/route.ts` (4 ops)
- [ ] `api/plaud/route.ts` (1 op)
- [ ] Validar TypeScript final (`npx tsc --noEmit`)

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- 73 operacoes Supabase inline espalhadas por ~29 arquivos
- Mesma query duplicada em multiplos arquivos (ex: `categorias.select('*').eq('ativo', true).order('ordem')` em 7+ arquivos)
- Logica de negocio misturada nos componentes (ex: validacao de duplicatas, verificacao de uso antes de deletar)
- 3 API Routes acessando banco diretamente
- Operacoes de Storage acopladas a componentes UI

**Depois (comportamento proposto):**
- 7 services de banco + 1 service de storage centralizados em `src/lib/services/`
- Componentes consomem dados via service calls
- API Routes funcionam como Controllers consumindo services
- Logica de negocio centralizada nos services
- Reutilizacao total: cada query existe em 1 lugar

### 3.2 UI Proposta

N/A — refatoracao interna sem impacto visual. O comportamento para o usuario final permanece identico.

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A — sem alteracoes no banco. Apenas refatoracao de codigo (queries inline → service calls).

### 4.2 Arquivos a Modificar/Criar

**Referencia:** O mapeamento detalhado de todas as 73 operacoes inline esta em [alteracao04.md](./alteracao/alteracao04.md) secao 2. Consulte para ver exatamente qual query cada arquivo usa atualmente.

---

#### SUB-FASE 4a — SERVICES

Todos os services seguem o padrao definido em `.claude/padroes-codigo.md`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
```

---

##### `src/lib/services/categorias.ts`

```typescript
type Categoria = Tables<'categorias'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarCategorias(supabase)` | `Categoria[]` | `select('*').order('ordem')` | config/categorias |
| `buscarCategoriasAtivas(supabase)` | `Categoria[]` | `select('*').eq('ativo', true).order('ordem')` | financeiro, dashboard, emails/form, ocr/form, lancamentos/novo |
| `buscarCategoriasParaDropdown(supabase)` | `Pick<...,'id'|'nome'|'cor'>[]` | `select('id,nome,cor').eq('ativo', true).order('nome')` | compras/nova, compras/editar |
| `buscarTodasCategoriasParaDropdown(supabase)` | `Pick<...,'id'|'nome'|'cor'>[]` | `select('id,nome,cor').order('nome')` | compras/page, lancamentos/page |
| `criarCategoria(supabase, data)` | `Categoria` | `insert(data).select().single()` | config/categorias |
| `atualizarCategoria(supabase, id, updates)` | `Categoria` | `update(updates).eq('id', id).select().single()` | config/categorias |
| `deletarCategoria(supabase, id)` | `void` | `delete().eq('id', id)` | config/categorias |
| `reordenarCategorias(supabase, items)` | `void` | `update({ordem}).eq('id', id)` (loop) | config/categorias |
| `toggleAtivoCategoria(supabase, id, ativo)` | `void` | `update({ativo}).eq('id', id)` | config/categorias |
| `verificarDuplicataCategoria(supabase, nome, excludeId?)` | `boolean` | `select('id', {count}).ilike('nome', nome).neq('id', id)` | config/categorias |
| `buscarMaxOrdem(supabase)` | `number` | `select('ordem').order('ordem', {ascending:false}).limit(1)` | config/categorias |
| `atualizarOrcamentoCategoria(supabase, id, orcamento)` | `void` | `update({orcamento}).eq('id', id)` | orcamento-editor |
| `verificarUsoCategoria(supabase, id)` | `{gastos: number, orcamento: number}` | count em gastos + orcamento_detalhado | config/categorias |

---

##### `src/lib/services/subcategorias.ts`

```typescript
type Subcategoria = Tables<'subcategorias'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarSubcategorias(supabase)` | `Subcategoria[]` | `select('*').order('nome')` | config/categorias |
| `buscarSubcategoriasAtivas(supabase)` | `Pick<...,'id'|'nome'|'categoria_id'>[]` | `select('id,nome,categoria_id').eq('ativo', true).order('nome')` | compra-form, compra-edit-form |
| `criarSubcategoria(supabase, data)` | `Subcategoria` | `insert(data).select().single()` | config/categorias |
| `atualizarSubcategoria(supabase, id, updates)` | `Subcategoria` | `update(updates).eq('id', id).select().single()` | config/categorias |
| `deletarSubcategoria(supabase, id)` | `void` | `delete().eq('id', id)` | config/categorias |
| `toggleAtivoSubcategoria(supabase, id, ativo)` | `void` | `update({ativo}).eq('id', id)` | config/categorias |
| `verificarDuplicataSubcategoria(supabase, categoriaId, nome, excludeId?)` | `boolean` | `select('id', {count}).eq('categoria_id', cid).ilike('nome', nome)` | config/categorias |

---

##### `src/lib/services/compras.ts`

```typescript
type Compra = Tables<'compras'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarComprasComDetalhes(supabase)` | `CompraComDetalhes[]` | `select('*, fornecedor:fornecedores(nome), categoria:categorias(nome,cor), subcategoria:subcategorias(nome), etapa:etapas(nome)').order('created_at', {ascending:false})` | compras/page |
| `buscarCompraPorIdComDetalhes(supabase, id)` | `CompraComDetalhes` | `select('*, fornecedor:fornecedores(nome,cnpj_cpf), categoria:categorias(nome,cor), subcategoria:subcategorias(nome), etapa:etapas(nome)').eq('id', id).single()` | compras/[id] |
| `buscarCompraPorId(supabase, id)` | `Compra` | `select('*').eq('id', id).single()` | compras/[id]/editar |
| `criarCompra(supabase, data)` | `Compra` | `insert(data).select().single()` | compra-form, emails/[id], lancamentos/foto |
| `atualizarCompra(supabase, id, updates)` | `Compra` | `update(updates).eq('id', id).select().single()` | compra-edit-form |
| `cancelarCompra(supabase, id)` | `void` | `update({status: 'cancelada'}).eq('id', id)` | compras/[id] |

**Nota:** `criarCompra` tem 3 fontes de chamada (manual, email, OCR) com campos ligeiramente diferentes. O parametro `data` aceita todos os campos e cada fonte preenche o que for relevante (ex: `criado_via: 'manual' | 'email' | 'ocr'`).

---

##### `src/lib/services/fornecedores.ts`

```typescript
type Fornecedor = Tables<'fornecedores'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarFornecedores(supabase, filtros?)` | `Fornecedor[]` | `select('*').eq('ativo', true).order('nome')` + filtros opcionais (tipo, search) | fornecedores/page |
| `buscarFornecedorPorId(supabase, id)` | `Fornecedor` | `select('*').eq('id', id).single()` | fornecedores/[id] |
| `buscarFornecedoresParaDropdown(supabase)` | `Pick<...,'id'|'nome'>[]` | `select('id,nome').eq('ativo', true).order('nome')` | compras/nova, compras/page, compras/editar, lancamentos/page |
| `buscarFornecedoresAtivos(supabase)` | `Fornecedor[]` | `select('*').eq('ativo', true).order('nome')` | lancamentos/novo, emails/form, ocr/form |
| `criarFornecedor(supabase, data)` | `Fornecedor` | `insert(data).select().single()` | fornecedor-form |
| `criarFornecedorRapido(supabase, data)` | `Fornecedor` | `insert(data).select().single()` | quick-add-fornecedor |
| `atualizarFornecedor(supabase, id, updates)` | `Fornecedor` | `update(updates).eq('id', id).select().single()` | fornecedor-form |
| `atualizarAvaliacao(supabase, id, avaliacao, comentario)` | `void` | `update({avaliacao, comentario_avaliacao, updated_at}).eq('id', id)` | fornecedores/[id] |
| `desativarFornecedor(supabase, id)` | `void` | `update({ativo: false}).eq('id', id)` | fornecedores/[id] |

**Nota:** `buscarFornecedores` aceita filtros opcionais de `tipo` e `search` usados na pagina de listagem. `buscarFornecedoresAtivos` e mais simples (sem filtros extras) para uso em formularios.

---

##### `src/lib/services/gastos.ts`

```typescript
type Gasto = Tables<'gastos'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarGastosComDetalhes(supabase)` | `GastoComDetalhes[]` | `select('*, categorias(nome,cor), fornecedores(nome), etapas(nome), compras(id,descricao)').order('data', {ascending:false})` | lancamentos/page |
| `buscarGastosAprovados(supabase)` | `Gasto[]` | `select('*').eq('status', 'aprovado')` | financeiro, dashboard |
| `buscarGastosAprovadosResumidos(supabase)` | parcial | `select('valor,data,parcelas,parcela_atual').eq('status', 'aprovado').order('data')` | fluxo-caixa |
| `buscarGastosPorEtapa(supabase)` | parcial | `select('etapa_relacionada_id,valor').eq('status', 'aprovado')` | cronograma, orcamento |
| `buscarGastosMatriz(supabase)` | parcial | `select('categoria_id,etapa_relacionada_id,valor').eq('status', 'aprovado')` | matriz-gastos |
| `buscarGastosPorCompra(supabase, compraId)` | parcial | `select('id,valor,data,parcela_atual,parcelas,pago,pago_em,comprovante_pagamento_url').eq('compra_id', id).order('parcela_atual')` | compras/[id] |
| `buscarGastosPorFornecedor(supabase, fornecedorId)` | `GastoComCategoria[]` | `select('*, categoria:categorias(*)').eq('fornecedor_id', id).order('data', {ascending:false})` | fornecedores/[id] |
| `buscarGastosDetalhadosPorCategoria(supabase, categoriaId, filtros?)` | complex | `select('*, fornecedores(*), users:criado_por(email,full_name)').eq('categoria_id', id).eq('status', 'aprovado')` + filtro etapa | api/gastos-detalhes |
| `criarGastos(supabase, parcelas[])` | `Gasto[]` | `insert(parcelas).select()` (batch) | compra-form, emails/[id], lancamentos/foto |
| `criarGastoAvulso(supabase, data)` | `Gasto` | `insert(data).select().single()` | form-lancamento |
| `atualizarGastosPorCompra(supabase, compraId, updates)` | `void` | `update(updates).eq('compra_id', id)` | compra-edit-form |
| `marcarPago(supabase, id, data)` | `void` | `update({pago, pago_em, comprovante_pagamento_url}).eq('id', id)` | parcelas-table |
| `atualizarComprovante(supabase, id, url)` | `void` | `update({comprovante_pagamento_url}).eq('id', id)` | parcelas-table |
| `contarGastosPorCategoria(supabase, categoriaId)` | `number` | `select('id', {count}).eq('categoria_id', id)` | config/categorias |
| `contarGastosPorSubcategoria(supabase, subcategoriaId)` | `number` | `select('id', {count}).eq('subcategoria_id', id)` | config/categorias |

**Nota:** Entidade mais complexa do projeto. 5 variantes de INSERT com campos ligeiramente diferentes (3 com `compra_id`, 2 sem). A funcao `criarGastos` (batch) aceita array — cada fonte (compra-form, emails, OCR) monta o array com os campos que possui.

---

##### `src/lib/services/orcamento-detalhado.ts`

```typescript
type OrcamentoDetalhado = Tables<'orcamento_detalhado'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarDetalhamentoComCategoria(supabase, etapaId)` | complex | `select('id,etapa_id,categoria_id,valor_previsto,observacoes, categorias:categoria_id(nome,cor)').eq('etapa_id', id).order('valor_previsto', {ascending:false})` | api/orcamento/detalhamento GET |
| `buscarDetalhamentoPorEtapa(supabase)` | `Pick<...,'etapa_id'>[]` | `select('etapa_id')` | orcamento/page |
| `buscarDetalhamentoMatriz(supabase)` | `Pick<...,'etapa_id'|'categoria_id'|'valor_previsto'>[]` | `select('etapa_id,categoria_id,valor_previsto')` | matriz-gastos |
| `salvarDetalhamento(supabase, etapaId, items[])` | `OrcamentoDetalhado[]` | DELETE all by etapa_id + INSERT batch | api/orcamento/detalhamento POST |
| `deletarDetalhamentoPorEtapa(supabase, etapaId)` | `void` | `delete().eq('etapa_id', id)` | api/orcamento/detalhamento DELETE |
| `contarDetalhamentoPorCategoria(supabase, categoriaId)` | `number` | `select('id', {count}).eq('categoria_id', id)` | config/categorias |

**Nota:** `salvarDetalhamento` usa padrao delete-all-then-reinsert (DELETE por etapa_id, depois INSERT batch dos novos itens). Manter este padrao.

---

##### `src/lib/services/recibos.ts`

```typescript
// Storage bucket service — NAO e tabela do banco
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `uploadComprovante(supabase, fileName, file)` | `string` (publicUrl) | `storage.from('recibos').upload(fileName, file)` + `getPublicUrl` | parcelas-table |

---

#### SUB-FASE 4b — REFATORAR COMPONENTES

Para cada arquivo, substituir queries inline por chamadas ao service correspondente. O mapeamento detalhado de cada operacao inline esta em [alteracao04.md](./alteracao/alteracao04.md) secao 2.

**Padrao de refatoracao — Server Components:**
```typescript
// ANTES
const { data: categorias } = await supabase.from('categorias').select('*').eq('ativo', true).order('ordem')

// DEPOIS
import { buscarCategoriasAtivas } from '@/lib/services/categorias'
const categorias = await buscarCategoriasAtivas(supabase)
```

**Padrao de refatoracao — Client Components:**
```typescript
// ANTES
const { data, error } = await supabase.from('fornecedores').insert({ nome, tipo }).select().single()
if (error) { toast.error(...); return }

// DEPOIS
import { criarFornecedor } from '@/lib/services/fornecedores'
try {
  const fornecedor = await criarFornecedor(supabase, { nome, tipo })
  toast.success(...)
} catch (error) {
  toast.error(...)
}
```

**Padrao de refatoracao — API Routes:**
```typescript
// ANTES
const { data, error } = await supabase.from('gastos').select('*').eq('status', 'aprovado')

// DEPOIS
import { buscarGastosAprovados } from '@/lib/services/gastos'
const gastos = await buscarGastosAprovados(supabase)
```

---

**Guia por arquivo:**

| Arquivo | Ops | Substituicoes |
|---------|-----|---------------|
| `configuracoes/categorias/page.tsx` | 16 | categorias: buscarCategorias, criarCategoria, atualizarCategoria, deletarCategoria, reordenarCategorias, toggleAtivoCategoria, verificarDuplicataCategoria, buscarMaxOrdem, verificarUsoCategoria. subcategorias: buscarSubcategorias, criarSubcategoria, atualizarSubcategoria, deletarSubcategoria, toggleAtivoSubcategoria, verificarDuplicataSubcategoria. gastos: contarGastosPorCategoria, contarGastosPorSubcategoria. orcamento-detalhado: contarDetalhamentoPorCategoria |
| `compras/page.tsx` | 3 | compras: buscarComprasComDetalhes. fornecedores: buscarFornecedoresParaDropdown. categorias: buscarTodasCategoriasParaDropdown |
| `compras/nova/page.tsx` | 2 | categorias: buscarCategoriasParaDropdown. fornecedores: buscarFornecedoresParaDropdown |
| `compras/[id]/page.tsx` | 3 | compras: buscarCompraPorIdComDetalhes, cancelarCompra. gastos: buscarGastosPorCompra |
| `compras/[id]/editar/page.tsx` | 3 | compras: buscarCompraPorId. categorias: buscarCategoriasParaDropdown. fornecedores: buscarFornecedoresParaDropdown |
| `compras/compra-form.tsx` | 3 | compras: criarCompra. gastos: criarGastos. subcategorias: buscarSubcategoriasAtivas |
| `compras/compra-edit-form.tsx` | 3 | compras: atualizarCompra. gastos: atualizarGastosPorCompra. subcategorias: buscarSubcategoriasAtivas |
| `compras/parcelas-table.tsx` | 4 | gastos: marcarPago, atualizarComprovante. recibos: uploadComprovante (x2) |
| `fornecedores/page.tsx` | 1 | fornecedores: buscarFornecedores |
| `fornecedores/[id]/page.tsx` | 4 | fornecedores: buscarFornecedorPorId, atualizarAvaliacao, desativarFornecedor. gastos: buscarGastosPorFornecedor |
| `fornecedores/fornecedor-form.tsx` | 2 | fornecedores: criarFornecedor, atualizarFornecedor |
| `financeiro/page.tsx` | 2 | categorias: buscarCategoriasAtivas. gastos: buscarGastosAprovados |
| `financeiro/orcamento/page.tsx` | 3 | categorias: buscarCategoriasParaDropdown. gastos: buscarGastosPorEtapa. orcamento-detalhado: buscarDetalhamentoPorEtapa |
| `financeiro/fluxo-caixa/page.tsx` | 2 | categorias: buscarCategoriasAtivas. gastos: buscarGastosAprovadosResumidos |
| `financeiro/matriz-gastos/page.tsx` | 3 | categorias: buscarCategoriasAtivas. gastos: buscarGastosMatriz. orcamento-detalhado: buscarDetalhamentoMatriz |
| `financeiro/lancamentos/page.tsx` | 3 | gastos: buscarGastosComDetalhes. categorias: buscarTodasCategoriasParaDropdown. fornecedores: buscarFornecedoresParaDropdown |
| `financeiro/lancamentos/novo/page.tsx` | 2 | categorias: buscarCategoriasAtivas. fornecedores: buscarFornecedoresAtivos |
| `financeiro/lancamentos/foto/page.tsx` | 2 | compras: criarCompra. gastos: criarGastos |
| `financeiro/form-lancamento.tsx` | 2 | gastos: criarGastos, criarGastoAvulso |
| `financeiro/orcamento-editor.tsx` | 1 | categorias: atualizarOrcamentoCategoria |
| `emails/[id]/page.tsx` | 2 | compras: criarCompra. gastos: criarGastos |
| `emails/form-aprovacao.tsx` | 2 | categorias: buscarCategoriasAtivas. fornecedores: buscarFornecedoresAtivos |
| `ocr/form-ocr.tsx` | 2 | categorias: buscarCategoriasAtivas. fornecedores: buscarFornecedoresAtivos |
| `ocr/quick-add-fornecedor.tsx` | 1 | fornecedores: criarFornecedorRapido |
| `dashboard/page.tsx` | 2 | categorias: buscarCategoriasAtivas. gastos: buscarGastosAprovados |
| `cronograma/page.tsx` | 1 | gastos: buscarGastosPorEtapa |
| `api/financeiro/gastos-detalhes/route.ts` | 1 | gastos: buscarGastosDetalhadosPorCategoria |
| `api/orcamento/detalhamento/route.ts` | 4 | orcamento-detalhado: buscarDetalhamentoComCategoria, salvarDetalhamento, deletarDetalhamentoPorEtapa |
| `api/plaud/route.ts` | 1 | categorias: buscarCategoriasAtivas (ou funcao especifica com select 'id,nome') |

### 4.3 Fluxo de Dados

O fluxo segue o padrao ja estabelecido na Fase 1 e documentado em `.claude/padroes-codigo.md`:

**Server Components:**
1. `const supabase = await createClient()` (server)
2. `const dados = await buscarEntidade(supabase)` (service call)
3. Renderiza com os dados

**Client Components:**
1. Handler (`onSubmit`, `onClick`) cria `const supabase = createClient()` (browser)
2. `await criarEntidade(supabase, data)` (service call)
3. try/catch com toast de sucesso/erro

**API Routes (Controller → Service):**
1. `const supabase = await createClient()` (server)
2. `const dados = await buscarEntidade(supabase)` (service call)
3. `return Response.json(dados)`

### 4.4 Dependencias Externas

N/A — nenhuma dependencia externa necessaria.

### 4.5 Decisoes de Design e Justificativas

| # | Decisao | Justificativa |
|---|---------|---------------|
| 1 | **Dependency Injection** — client como 1o parametro | Clean Architecture / Repository Pattern (herdado da Alt. 03) |
| 2 | **Services sao funcoes puras** | Sem estado, sem React, sem side-effects (herdado da Alt. 03) |
| 3 | **throw error** | Services lancam excecoes, componente faz try/catch (herdado da Alt. 03) |
| 4 | **JOINs nos services** | Funcoes nomeadas por "visao": `buscarX()` (simples) vs `buscarXComDetalhes()` (com JOINs) |
| 5 | **Storage em arquivo dedicado** | `recibos.ts` separado — 1 arquivo por bucket, nao misturar com services de tabelas |
| 6 | **Validacoes de uso nos services** | `verificarUsoCategoria`, `contarGastosPorCategoria` etc. sao logica de negocio |
| 7 | **Sub-fases** | 4a cria services, 4b refatora componentes — permite validacao intermediaria |
| 8 | **`criarCompra` unificado** | Uma unica funcao aceita dados de 3 fontes (manual, email, OCR) — cada fonte monta o objeto |

---

## 5. Execucao

### 5.1 Progresso

#### Sub-fase 4a
- [x] categorias.ts criado
- [x] subcategorias.ts criado
- [x] compras.ts criado
- [x] fornecedores.ts criado
- [x] gastos.ts criado
- [x] orcamento-detalhado.ts criado
- [x] recibos.ts criado
- [x] TypeScript sem erros (pos 4a)

#### Sub-fase 4b
- [x] configuracoes/categorias/page.tsx refatorado
- [x] compras/page.tsx refatorado
- [x] compras/nova/page.tsx refatorado
- [x] compras/[id]/page.tsx refatorado
- [x] compras/[id]/editar/page.tsx refatorado
- [x] compras/compra-form.tsx refatorado
- [x] compras/compra-edit-form.tsx refatorado
- [x] compras/parcelas-table.tsx refatorado
- [x] fornecedores/page.tsx refatorado
- [x] fornecedores/[id]/page.tsx refatorado
- [x] fornecedores/fornecedor-form.tsx refatorado
- [x] financeiro/page.tsx refatorado
- [x] financeiro/orcamento/page.tsx refatorado
- [x] financeiro/fluxo-caixa/page.tsx refatorado
- [x] financeiro/matriz-gastos/page.tsx refatorado
- [x] financeiro/lancamentos/page.tsx refatorado
- [x] financeiro/lancamentos/novo/page.tsx refatorado
- [x] financeiro/lancamentos/foto/page.tsx refatorado
- [x] financeiro/form-lancamento.tsx refatorado
- [x] financeiro/orcamento-editor.tsx refatorado
- [x] emails/[id]/page.tsx refatorado
- [x] emails/form-aprovacao.tsx refatorado
- [x] ocr/form-ocr.tsx refatorado
- [x] ocr/quick-add-fornecedor.tsx refatorado
- [x] dashboard/page.tsx refatorado
- [x] cronograma/page.tsx refatorado
- [x] api/financeiro/gastos-detalhes/route.ts refatorado
- [x] api/orcamento/detalhamento/route.ts refatorado
- [x] api/plaud/route.ts refatorado
- [x] TypeScript sem erros (final)

### 5.2 Notas de Implementacao

- `verificarUsoCategoria` inclui contagem de `compras` alem de `gastos` e `orcamento_detalhado` (o codigo original verificava as 3 tabelas)
- `verificarUsoSubcategoria` criada no service `subcategorias.ts` (inclui contagem de `compras` e `gastos`)
- `buscarTodosFornecedoresParaDropdown` criada para paginas de filtro (sem `.eq('ativo', true)`) — diferente de `buscarFornecedoresParaDropdown` que filtra ativos (para formularios de criacao)
- `buscarGastosAprovados` retorna com JOIN `categorias(nome, cor)` — usado pela pagina financeiro/page que precisa desses dados
- Para `fluxo-caixa/page.tsx`, usamos `buscarCategoriasAtivas` que retorna objetos completos (a pagina so usa campo `orcamento` mas funciona pois e um superset)
- Queries de `etapas` e `users` e uploads `notas-compras` mantidos inline (fora do escopo desta alteracao)

### 5.3 Conversa de Execucao

#### IA: Execucao concluida com sucesso

Sub-fase 4a: 7 services + 1 storage service criados (~60 funcoes) com TypeScript zero erros.
Sub-fase 4b: 29 arquivos refatorados (1 manualmente + 28 via agentes paralelos) com TypeScript zero erros.

---

## 6. Validacao Final

- [x] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
