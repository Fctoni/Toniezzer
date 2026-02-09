# Alteracao 04 - Centralizar CRUD em services (Fase 2: Financeiro)

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟡 Em planejamento |
| Origem | Continuacao da Alteracao 03 (Fase 1: Cronograma) |
| Complexidade | 🔴 Alta |
| Especificacao | *(sera criada apos aprovacao da proposta)* |

**Status possiveis:**
- 🟡 Em planejamento
- 🟢 Especificacao criada → ver [spec-alteracao04.md](../spec-alteracao04.md)

---

## 1. Ideia Inicial

Continuacao da estrategia de centralizacao de CRUD em services iniciada na Alteracao 03 (Fase 1: Cronograma). Esta fase cobre as **entidades financeiras**: `categorias`, `subcategorias`, `compras`, `fornecedores`, `gastos`, `orcamento_detalhado`, e o bucket de storage `recibos`.

**Diagnostico:** 71 operacoes inline espalhadas por ~25 arquivos. A entidade `gastos` e a mais dispersa (17 operacoes em 15 arquivos), seguida por `categorias` (24 operacoes em 13 arquivos).

---

## 2. Conversa de Planejamento

#### usuario: Solicitou analise profunda da Fase 2 e criacao de novo arquivo de alteracao

#### IA: Levantamento completo de 71 operacoes inline em 7 entidades financeiras

Realizei a analise profunda de todas as operacoes inline das entidades financeiras. Abaixo o mapeamento completo.

---

### Resumo por Entidade

| Entidade | Operacoes | Arquivos | SELECT | INSERT | UPDATE | DELETE | STORAGE |
|----------|-----------|----------|--------|--------|--------|--------|---------|
| categorias | 24 | 13 | 17 | 1 | 5 | 1 | - |
| subcategorias | 4 | 3 | 2 | 1 | 1 | - | - |
| compras | 8 | 7 | 3 | 2 | 2 | - | - |
| fornecedores | 12 | 8 | 5 | 2 | 3 | - | - |
| gastos | 17 | 15 | 9 | 5 | 3 | - | - |
| orcamento_detalhado | 6 | 4 | 3 | 1 | - | 2 | - |
| recibos (storage) | 2 | 1 | - | - | - | - | 2 |
| **TOTAL** | **73** | **~25** | **39** | **12** | **14** | **3** | **2** |

---

### Mapeamento Detalhado: `categorias`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `configuracoes/categorias/page.tsx:394` | SELECT | * | .order('ordem') | fetchCategorias() |
| 2 | `configuracoes/categorias/page.tsx:528` | SELECT (count) | id | .ilike('nome', nome).neq('id', id) | handleSubmitCategoria() — validar duplicata |
| 3 | `configuracoes/categorias/page.tsx:557` | SELECT | ordem | .order('ordem', desc).limit(1) | handleSubmitCategoria() — max ordem |
| 4 | `configuracoes/categorias/page.tsx:542` | UPDATE | nome, cor, icone, updated_at | .eq('id', id) | handleSubmitCategoria() — editar |
| 5 | `configuracoes/categorias/page.tsx:565` | INSERT | nome, cor, icone, ordem, ativo, created_by | — | handleSubmitCategoria() — criar |
| 6 | `configuracoes/categorias/page.tsx:458` | UPDATE | ordem | .eq('id', id) | handleDragEnd() — reordenar |
| 7 | `configuracoes/categorias/page.tsx:660` | UPDATE | ativo | .eq('id', id) | handleToggleActive() |
| 8 | `configuracoes/categorias/page.tsx:801` | DELETE | — | .eq('id', id) | handleDelete() |
| 9 | `compras/[id]/editar/page.tsx:107` | SELECT | id, nome, cor | .eq('ativo', true).order('nome') | carregarDados() |
| 10 | `compras/nova/page.tsx:14` | SELECT | id, nome, cor | .eq('ativo', true).order('ordem') | Server component |
| 11 | `compras/page.tsx:56` | SELECT | id, nome, cor | .order('nome') | Server component |
| 12 | `financeiro/page.tsx:21` | SELECT | * | .eq('ativo', true).order('ordem') | Server component |
| 13 | `financeiro/orcamento/page.tsx:15` | SELECT | id, nome, cor | .eq('ativo', true).order('ordem') | Server component |
| 14 | `financeiro/fluxo-caixa/page.tsx:16` | SELECT | orcamento | .eq('ativo', true) | Server component |
| 15 | `financeiro/matriz-gastos/page.tsx:41` | SELECT | * | .eq('ativo', true).order('ordem') | Server component |
| 16 | `financeiro/lancamentos/page.tsx:32` | SELECT | id, nome, cor | .order('nome') | Server component |
| 17 | `financeiro/lancamentos/novo/page.tsx:10` | SELECT | * | .eq('ativo', true).order('ordem') | Server component |
| 18 | `financeiro/orcamento-editor.tsx:76` | UPDATE | orcamento | .eq('id', id) | handleSave() — salvar orcamento |
| 19 | `emails/form-aprovacao.tsx:101` | SELECT | * | .eq('ativo', true).order('ordem') | loadData() |
| 20 | `ocr/form-ocr.tsx:93` | SELECT | * | .eq('ativo', true).order('ordem') | loadData() |
| 21 | `dashboard/page.tsx:52` | SELECT | * | .eq('ativo', true) | Server component |
| 22 | `cronograma/page.tsx` | SELECT | (ja migrada Fase 1 — via inline `gastos` apenas) | — | — |
| 23 | `api/plaud/route.ts:158` | SELECT | id, nome | .eq('ativo', true) | API Route — matching de nomes |

**Padroes identificados:**
- Query mais comum: `.select('*').eq('ativo', true).order('ordem')` — aparece em 7+ arquivos
- Query para dropdown: `.select('id, nome, cor').eq('ativo', true).order('nome')` — aparece em 5+ arquivos
- CRUD completo apenas em `configuracoes/categorias/page.tsx`

---

### Mapeamento Detalhado: `subcategorias`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `configuracoes/categorias/page.tsx:407` | SELECT | * | .order('nome') | fetchCategorias() |
| 2 | `configuracoes/categorias/page.tsx:607` | SELECT (count) | id | .eq('categoria_id', id).ilike('nome', nome).neq('id', id) | handleSubmitSubcategoria() — validar duplicata |
| 3 | `configuracoes/categorias/page.tsx:622` | UPDATE | nome, updated_at | .eq('id', id) | handleSubmitSubcategoria() — editar |
| 4 | `configuracoes/categorias/page.tsx:634` | INSERT | nome, categoria_id, ativo | — | handleSubmitSubcategoria() — criar |
| 5 | `configuracoes/categorias/page.tsx:680` | UPDATE | ativo | .eq('id', id) | handleToggleSubcategoriaActive() |
| 6 | `configuracoes/categorias/page.tsx:809` | DELETE | — | .eq('id', id) | handleDelete() |
| 7 | `compras/compra-form.tsx:113` | SELECT | id, nome, categoria_id | .eq('ativo', true).order('nome') | fetchSubcategorias() |
| 8 | `compras/compra-edit-form.tsx:139` | SELECT | id, nome, categoria_id | .eq('ativo', true).order('nome') | fetchSubcategorias() |

---

### Mapeamento Detalhado: `compras`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `compras/page.tsx:34` | SELECT | *, fornecedor:fornecedores(nome), categoria:categorias(nome,cor), subcategoria:subcategorias(nome), etapa:etapas(nome) | .order('created_at', desc) | Server component |
| 2 | `compras/[id]/page.tsx:92` | SELECT | *, fornecedor:fornecedores(nome,cnpj_cpf), categoria:categorias(nome,cor), subcategoria:subcategorias(nome), etapa:etapas(nome) | .eq('id', id).single() | carregarDados() |
| 3 | `compras/[id]/page.tsx:173` | UPDATE | status: 'cancelada' | .eq('id', id) | handleCancelar() |
| 4 | `compras/[id]/editar/page.tsx:67` | SELECT | * | .eq('id', id).single() | carregarDados() |
| 5 | `compras/compra-form.tsx:211` | INSERT | descricao, valor_total, data_compra, fornecedor_id, categoria_id, subcategoria_id, etapa_relacionada_id, forma_pagamento, parcelas, data_primeira_parcela, nota_fiscal_numero, nota_fiscal_url, observacoes, criado_por, criado_via | — | onSubmit() |
| 6 | `compras/compra-edit-form.tsx:249` | UPDATE | descricao, data_compra, fornecedor_id, categoria_id, subcategoria_id, etapa_relacionada_id, forma_pagamento, nota_fiscal_numero, nota_fiscal_url, observacoes | .eq('id', id) | onSubmit() |
| 7 | `emails/[id]/page.tsx:129` | INSERT | descricao, valor_total, data_compra, data_primeira_parcela, categoria_id, fornecedor_id, forma_pagamento, parcelas, nota_fiscal_numero, nota_fiscal_url, etapa_relacionada_id, observacoes, criado_por, criado_via, status, valor_pago, parcelas_pagas | — | handleAprovar() — criar compra via email |
| 8 | `financeiro/lancamentos/foto/page.tsx:160` | INSERT | descricao, valor_total, data_compra, categoria_id, fornecedor_id, etapa_relacionada_id, forma_pagamento, parcelas, data_primeira_parcela, nota_fiscal_url, nota_fiscal_numero, observacoes, criado_por, criado_via, status, valor_pago, parcelas_pagas | — | handleSubmit() — criar compra via OCR |

**Padroes identificados:**
- SELECTs usam JOINs pesados (fornecedores, categorias, subcategorias, etapas)
- 3 fontes de criacao: manual (compra-form), email (emails/[id]), OCR (lancamentos/foto)
- Cada fonte usa campos ligeiramente diferentes e valores de `criado_via` distintos

---

### Mapeamento Detalhado: `fornecedores`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `fornecedores/page.tsx:30` | SELECT | * | .eq('ativo', true).order('nome') + filtros opcionais (tipo, search) | fetchFornecedores() |
| 2 | `fornecedores/[id]/page.tsx:74` | SELECT | * | .eq('id', id).single() | fetchData() |
| 3 | `fornecedores/[id]/page.tsx:115` | UPDATE | avaliacao, comentario_avaliacao, updated_at | .eq('id', id) | handleSaveAvaliacao() |
| 4 | `fornecedores/[id]/page.tsx:138` | UPDATE | ativo: false | .eq('id', id) | handleDelete() — soft delete |
| 5 | `fornecedores/fornecedor-form.tsx:69` | UPDATE | nome, tipo, cnpj_cpf, email, telefone, endereco, especialidade, updated_at | .eq('id', id) | onSubmit() — editar |
| 6 | `fornecedores/fornecedor-form.tsx:80` | INSERT | nome, tipo, cnpj_cpf, email, telefone, endereco, especialidade | — | onSubmit() — criar |
| 7 | `compras/nova/page.tsx:19` | SELECT | id, nome | .eq('ativo', true).order('nome') | Server component |
| 8 | `compras/page.tsx:50` | SELECT | id, nome | .eq('ativo', true).order('nome') | Server component |
| 9 | `compras/[id]/editar/page.tsx:108` | SELECT | id, nome | .eq('ativo', true).order('nome') | carregarDados() |
| 10 | `financeiro/lancamentos/page.tsx:26` | SELECT | id, nome | .order('nome') | Server component |
| 11 | `financeiro/lancamentos/novo/page.tsx:11` | SELECT | * | .eq('ativo', true).order('nome') | Server component |
| 12 | `emails/form-aprovacao.tsx:102` | SELECT | * | .eq('ativo', true).order('nome') | loadData() |
| 13 | `ocr/form-ocr.tsx:94` | SELECT | * | .eq('ativo', true).order('nome') | loadData() |
| 14 | `ocr/quick-add-fornecedor.tsx:68` | INSERT | nome, tipo, cnpj_cpf, telefone, ativo | — | onSubmit() — criacao rapida |

**Padroes identificados:**
- Query para dropdown: `.select('id, nome').eq('ativo', true).order('nome')` — 5+ arquivos
- Soft delete (ativo: false) em vez de hard delete
- 2 fontes de criacao: formulario completo e quick-add (durante criacao de compra)

---

### Mapeamento Detalhado: `gastos`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `compras/compra-form.tsx:269` | INSERT (batch) | compra_id, descricao, valor, data, categoria_id, subcategoria_id, fornecedor_id, forma_pagamento, parcelas, parcela_atual, etapa_relacionada_id, status, pago, criado_por, criado_via | — | onSubmit() — criar parcelas da compra |
| 2 | `compras/compra-edit-form.tsx:269` | UPDATE (batch) | descricao, categoria_id, subcategoria_id, fornecedor_id, forma_pagamento, etapa_relacionada_id | .eq('compra_id', id) | onSubmit() — atualizar parcelas |
| 3 | `compras/parcelas-table.tsx:153` | UPDATE | pago, pago_em, comprovante_pagamento_url | .eq('id', id) | handlePaymentSubmit() — marcar pago |
| 4 | `compras/parcelas-table.tsx:208` | UPDATE | comprovante_pagamento_url | .eq('id', id) | handleProofSubmit() — atualizar comprovante |
| 5 | `financeiro/form-lancamento.tsx:121` | INSERT (batch) | descricao, valor, data, categoria_id, fornecedor_id, forma_pagamento, parcelas, parcela_atual, etapa_relacionada_id, observacoes, status, criado_por, criado_via | — | onSubmit() — lancamento parcelado |
| 6 | `financeiro/form-lancamento.tsx:128` | INSERT | descricao, valor, data, categoria_id, fornecedor_id, forma_pagamento, parcelas, parcela_atual, etapa_relacionada_id, observacoes, status, pago, criado_por, criado_via | — | onSubmit() — lancamento avulso |
| 7 | `emails/[id]/page.tsx:190` | INSERT (batch) | compra_id, descricao, valor, data, categoria_id, fornecedor_id, forma_pagamento, parcelas, parcela_atual, etapa_relacionada_id, status, pago, criado_por, criado_via | — | handleAprovar() — parcelas via email |
| 8 | `financeiro/lancamentos/foto/page.tsx:217` | INSERT (batch) | compra_id, descricao, valor, data, categoria_id, fornecedor_id, forma_pagamento, parcelas, parcela_atual, etapa_relacionada_id, status, pago, criado_por, criado_via | — | handleSubmit() — parcelas via OCR |
| 9 | `api/financeiro/gastos-detalhes/route.ts:21` | SELECT | *, fornecedores(*), users:criado_por(email, full_name) | .eq('categoria_id', id).eq('status', 'aprovado') + filtro etapa | API Route GET |
| 10 | `compras/[id]/page.tsx:136` | SELECT | id, valor, data, parcela_atual, parcelas, pago, pago_em, comprovante_pagamento_url | .eq('compra_id', id).order('parcela_atual') | Server component |
| 11 | `cronograma/page.tsx:87` | SELECT | etapa_relacionada_id, valor | .eq('status', 'aprovado') | Server component |
| 12 | `dashboard/page.tsx:53` | SELECT | * | .eq('status', 'aprovado') | Server component |
| 13 | `financeiro/page.tsx:22` | SELECT | *, categorias(nome, cor) | .eq('status', 'aprovado') | Server component |
| 14 | `fornecedores/[id]/page.tsx:76` | SELECT | *, categoria:categorias(*) | .eq('fornecedor_id', id).order('data', desc) | Server component |
| 15 | `financeiro/lancamentos/page.tsx:12` | SELECT | *, categorias(nome,cor), fornecedores(nome), etapas(nome), compras(id,descricao) | .order('data', desc) | Server component |
| 16 | `financeiro/fluxo-caixa/page.tsx:12` | SELECT | valor, data, parcelas, parcela_atual | .eq('status', 'aprovado').order('data') | Server component |
| 17 | `financeiro/matriz-gastos/page.tsx:50` | SELECT | categoria_id, etapa_relacionada_id, valor | .eq('status', 'aprovado') | Server component |
| 18 | `financeiro/orcamento/page.tsx:17` | SELECT | etapa_relacionada_id, valor | .eq('status', 'aprovado') | Server component |
| 19 | `configuracoes/categorias/page.tsx:705` | SELECT (count) | id | .eq('categoria_id', id) | handleDelete() — validar uso |
| 20 | `configuracoes/categorias/page.tsx:733` | SELECT (count) | id | .eq('subcategoria_id', id) | handleDelete() — validar uso |

**Padroes identificados:**
- 5 variantes de INSERT com campos ligeiramente diferentes (3 com compra_id, 2 sem)
- Filtro mais comum em SELECTs: `.eq('status', 'aprovado')`
- Muitos SELECTs usam JOINs com categorias, fornecedores, etapas, compras
- 2 SELECTs sao para validacao (count) antes de deletar categorias/subcategorias

---

### Mapeamento Detalhado: `orcamento_detalhado`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `api/orcamento/detalhamento/route.ts:20` | SELECT | id, etapa_id, categoria_id, valor_previsto, observacoes, categorias:categoria_id(nome,cor) | .eq('etapa_id', id).order('valor_previsto', desc) | API Route GET |
| 2 | `api/orcamento/detalhamento/route.ts:67` | DELETE | — | .eq('etapa_id', id) | API Route POST — limpar antes de re-inserir |
| 3 | `api/orcamento/detalhamento/route.ts:93` | INSERT (batch) | etapa_id, categoria_id, valor_previsto, observacoes | — | API Route POST — inserir novos registros |
| 4 | `api/orcamento/detalhamento/route.ts:134` | DELETE | — | .eq('etapa_id', id) | API Route DELETE |
| 5 | `financeiro/matriz-gastos/page.tsx:54` | SELECT | etapa_id, categoria_id, valor_previsto | — | Server component |
| 6 | `financeiro/orcamento/page.tsx:20` | SELECT | etapa_id | — | Server component |
| 7 | `configuracoes/categorias/page.tsx:710` | SELECT (count) | id | .eq('categoria_id', id) | handleDelete() — validar uso |

**Padrao identificado:**
- CRUD completo via API Route (`api/orcamento/detalhamento/route.ts`)
- Padrao de "upsert" via DELETE + INSERT (delete-all-then-reinsert)

---

### Mapeamento Detalhado: `recibos` (Storage Bucket)

| # | Arquivo | Operacao | Detalhes | Funcao/Handler |
|---|---------|----------|----------|----------------|
| 1 | `compras/parcelas-table.tsx:132` | UPLOAD | storage.from('recibos').upload(fileName, file) | handleProofSubmit() — upload inicial |
| 2 | `compras/parcelas-table.tsx:190` | UPLOAD | storage.from('recibos').upload(fileName, file) | handleProofSubmit() — substituir existente |

**IMPORTANTE:** `recibos` NAO e uma tabela do banco de dados — e um **bucket de Storage**. A URL do comprovante e salva em `gastos.comprovante_pagamento_url`.

---

### Arquivos Afetados (consolidado)

| Arquivo | Entidades | Operacoes | Tipo |
|---------|-----------|-----------|------|
| `configuracoes/categorias/page.tsx` | categorias, subcategorias, compras, gastos, orcamento_detalhado | 16 | Client |
| `compras/page.tsx` | compras, fornecedores, categorias | 3 | Server |
| `compras/nova/page.tsx` | categorias, fornecedores | 2 | Server |
| `compras/[id]/page.tsx` | compras, gastos | 3 | Client |
| `compras/[id]/editar/page.tsx` | compras, categorias, fornecedores | 3 | Client |
| `compras/compra-form.tsx` | compras, gastos, subcategorias | 3 | Client |
| `compras/compra-edit-form.tsx` | compras, gastos, subcategorias | 3 | Client |
| `compras/parcelas-table.tsx` | gastos, recibos (storage) | 4 | Client |
| `fornecedores/page.tsx` | fornecedores | 1 | Client |
| `fornecedores/[id]/page.tsx` | fornecedores, gastos | 4 | Client |
| `fornecedores/fornecedor-form.tsx` | fornecedores | 2 | Client |
| `financeiro/page.tsx` | categorias, gastos | 2 | Server |
| `financeiro/orcamento/page.tsx` | categorias, gastos, orcamento_detalhado | 3 | Server |
| `financeiro/fluxo-caixa/page.tsx` | categorias, gastos | 2 | Server |
| `financeiro/matriz-gastos/page.tsx` | categorias, gastos, orcamento_detalhado | 3 | Server |
| `financeiro/lancamentos/page.tsx` | categorias, fornecedores, gastos | 3 | Server |
| `financeiro/lancamentos/novo/page.tsx` | categorias, fornecedores | 2 | Server |
| `financeiro/lancamentos/foto/page.tsx` | compras, gastos | 2 | Client |
| `financeiro/form-lancamento.tsx` | gastos | 2 | Client |
| `financeiro/orcamento-editor.tsx` | categorias | 1 | Client |
| `emails/[id]/page.tsx` | compras, gastos | 2 | Client |
| `emails/form-aprovacao.tsx` | categorias, fornecedores | 2 | Client |
| `ocr/form-ocr.tsx` | categorias, fornecedores | 2 | Client |
| `ocr/quick-add-fornecedor.tsx` | fornecedores | 1 | Client |
| `dashboard/page.tsx` | categorias, gastos | 2 | Server |
| `cronograma/page.tsx` | gastos | 1 | Server |
| `api/financeiro/gastos-detalhes/route.ts` | gastos | 1 | API Route |
| `api/orcamento/detalhamento/route.ts` | orcamento_detalhado | 4 | API Route |
| `api/plaud/route.ts` | categorias | 1 | API Route |

---

### Questoes para Decisao

Antes de prosseguir para a proposta (secao 3), preciso alinhar:

**1. API Routes: migrar para services ou manter separadas?**
Na Alteracao 03, decidimos que API Routes devem consumir services (padrao Controller → Service). Aqui temos 3 API Routes:
- `api/financeiro/gastos-detalhes/route.ts` (1 SELECT complexo com JOINs)
- `api/orcamento/detalhamento/route.ts` (CRUD completo de orcamento_detalhado)
- `api/plaud/route.ts` (1 SELECT simples de categorias)

Manter a decisao da Alteracao 03?

**2. JOINs nos services?**
Diferente da Fase 1 (queries simples sem JOINs), a Fase 2 tem muitos SELECTs com JOINs Supabase (ex: `gastos.select('*, categorias(nome, cor), fornecedores(nome)')`). Opcoes:
- **A)** Services retornam dados com JOINs (funcoes especificas como `buscarGastosComDetalhes`)
- **B)** Services retornam dados simples, componente faz JOINs separadamente

**3. `recibos` (Storage) — incluir em qual service?**
Como `recibos` e um bucket de Storage (nao tabela), e as operacoes estao acopladas a `gastos`, sugiro incluir as funcoes de upload no service `gastos.ts` ao inves de criar arquivo separado.

**4. Complexidade do `configuracoes/categorias/page.tsx`**
Este arquivo tem **16 operacoes** cobrindo 5 entidades (categorias, subcategorias, compras, gastos, orcamento_detalhado). As operacoes de compras/gastos/orcamento_detalhado neste arquivo sao apenas SELECTs de validacao (verificar se categoria esta em uso antes de deletar). Incluir essas validacoes no service `categorias.ts` (como `verificarUsoCategorias`) ou manter inline?

**5. Escopo: dividir em sub-fases?**
Com 73 operacoes e ~29 arquivos, podemos:
- **A)** Executar tudo de uma vez (como Fase 1)
- **B)** Dividir em sub-fases: 4a = services, 4b = refatorar componentes

---

#### usuario: Respostas as questoes de decisao

**1. API Routes:** Concordo, migrar para services (ja coberto por padroes-codigo.md)

**2. JOINs:** Concordo com Opcao A — services com JOINs, funcoes nomeadas por "visao" (`buscarGastos` vs `buscarGastosComDetalhes`)

**3. `recibos` Storage:** Criar `recibos.ts` separado (arquivo dedicado para operacoes de storage)

**4. Validacoes de uso:** Concordo, incluir no service como funcoes dedicadas (ja coberto por padroes-codigo.md)

**5. Sub-fases:** Concordo com Opcao B — dividir em sub-fases (4a = services, 4b = refatorar componentes)

---

#### IA: Todas as 5 questoes respondidas, decisoes registradas

Decisoes registradas na secao 4. Agora tenho todas as informacoes para preencher a Proposta (secao 3).

---

#### usuario:

---

## 3. Proposta de Implementacao

**Status:** 🟡 Aguardando aprovacao

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
- Logica de negocio (validacoes, calculos, regras) centralizada nos services
- Reutilizacao total: cada query existe em 1 lugar

### 3.2 UI Proposta

N/A — refatoracao interna sem impacto visual. O comportamento para o usuario final permanece identico.

### 3.3 Arquivos Afetados

#### Sub-fase 4a — Criar Services

| Acao | Arquivo | Funcoes principais |
|------|---------|--------------------|
| CRIAR | `src/lib/services/categorias.ts` | buscarCategorias, buscarCategoriasAtivas, buscarCategoriasParaDropdown, criarCategoria, atualizarCategoria, deletarCategoria, reordenarCategorias, toggleAtivoCategoria, verificarDuplicataCategoria, verificarUsoCategoria, atualizarOrcamentoCategoria |
| CRIAR | `src/lib/services/subcategorias.ts` | buscarSubcategorias, buscarSubcategoriasAtivas, criarSubcategoria, atualizarSubcategoria, deletarSubcategoria, toggleAtivoSubcategoria, verificarDuplicataSubcategoria |
| CRIAR | `src/lib/services/compras.ts` | buscarCompras, buscarComprasComDetalhes, buscarCompraPorId, buscarCompraPorIdComDetalhes, criarCompra, atualizarCompra, cancelarCompra |
| CRIAR | `src/lib/services/fornecedores.ts` | buscarFornecedores, buscarFornecedoresAtivos, buscarFornecedoresParaDropdown, buscarFornecedorPorId, criarFornecedor, criarFornecedorRapido, atualizarFornecedor, atualizarAvaliacao, desativarFornecedor |
| CRIAR | `src/lib/services/gastos.ts` | buscarGastos, buscarGastosComDetalhes, buscarGastosPorCompra, buscarGastosAprovados, buscarGastosResumidos, criarGastos (batch), criarGastoAvulso, atualizarGastos (batch), marcarPago, atualizarComprovante, contarGastosPorCategoria, contarGastosPorSubcategoria |
| CRIAR | `src/lib/services/orcamento-detalhado.ts` | buscarDetalhamentoPorEtapa, buscarDetalhamentoComCategoria, salvarDetalhamento (delete+insert), deletarDetalhamentoPorEtapa, contarDetalhamentoPorCategoria |
| CRIAR | `src/lib/services/recibos.ts` | uploadComprovante |

**Total: 7 novos arquivos, ~60 funcoes**

#### Sub-fase 4b — Refatorar Componentes

| Acao | Arquivo | Entidades refatoradas |
|------|---------|----------------------|
| MODIFICAR | `configuracoes/categorias/page.tsx` | categorias, subcategorias (16 ops → service calls) |
| MODIFICAR | `compras/page.tsx` | compras, fornecedores, categorias |
| MODIFICAR | `compras/nova/page.tsx` | categorias, fornecedores |
| MODIFICAR | `compras/[id]/page.tsx` | compras, gastos |
| MODIFICAR | `compras/[id]/editar/page.tsx` | compras, categorias, fornecedores |
| MODIFICAR | `compras/compra-form.tsx` | compras, gastos, subcategorias |
| MODIFICAR | `compras/compra-edit-form.tsx` | compras, gastos, subcategorias |
| MODIFICAR | `compras/parcelas-table.tsx` | gastos, recibos |
| MODIFICAR | `fornecedores/page.tsx` | fornecedores |
| MODIFICAR | `fornecedores/[id]/page.tsx` | fornecedores, gastos |
| MODIFICAR | `fornecedores/fornecedor-form.tsx` | fornecedores |
| MODIFICAR | `financeiro/page.tsx` | categorias, gastos |
| MODIFICAR | `financeiro/orcamento/page.tsx` | categorias, gastos, orcamento_detalhado |
| MODIFICAR | `financeiro/fluxo-caixa/page.tsx` | categorias, gastos |
| MODIFICAR | `financeiro/matriz-gastos/page.tsx` | categorias, gastos, orcamento_detalhado |
| MODIFICAR | `financeiro/lancamentos/page.tsx` | categorias, fornecedores, gastos |
| MODIFICAR | `financeiro/lancamentos/novo/page.tsx` | categorias, fornecedores |
| MODIFICAR | `financeiro/lancamentos/foto/page.tsx` | compras, gastos |
| MODIFICAR | `financeiro/form-lancamento.tsx` | gastos |
| MODIFICAR | `financeiro/orcamento-editor.tsx` | categorias |
| MODIFICAR | `emails/[id]/page.tsx` | compras, gastos |
| MODIFICAR | `emails/form-aprovacao.tsx` | categorias, fornecedores |
| MODIFICAR | `ocr/form-ocr.tsx` | categorias, fornecedores |
| MODIFICAR | `ocr/quick-add-fornecedor.tsx` | fornecedores |
| MODIFICAR | `dashboard/page.tsx` | categorias, gastos |
| MODIFICAR | `cronograma/page.tsx` | gastos |
| MODIFICAR | `api/financeiro/gastos-detalhes/route.ts` | gastos |
| MODIFICAR | `api/orcamento/detalhamento/route.ts` | orcamento_detalhado |
| MODIFICAR | `api/plaud/route.ts` | categorias |

**Total: 29 arquivos modificados**

### 3.4 Fluxo de Dados

O fluxo segue o padrao ja estabelecido na Fase 1:

**Server Components:**
1. `const supabase = await createClient()` (server)
2. `const dados = await buscarEntidade(supabase)` (service call)
3. Renderiza com os dados

**Client Components:**
1. Handler (`onSubmit`, `onClick`) cria `const supabase = createClient()` (browser)
2. `await criarEntidade(supabase, data)` (service call)
3. try/catch com toast de sucesso/erro

**API Routes:**
1. `const supabase = await createClient()` (server)
2. `const dados = await buscarEntidade(supabase)` (service call)
3. `return Response.json(dados)`

### 3.5 Banco de Dados

N/A — sem alteracoes no banco. Apenas refatoracao de codigo (queries inline → service calls).

---

## 4. Decisoes Importantes

*(Decisoes herdadas da Alteracao 03)*

| # | Decisao | Justificativa |
|---|---------|---------------|
| 1 | **Dependency Injection** — client como 1o parametro | Clean Architecture / Repository Pattern |
| 2 | **Services sao funcoes puras** | Sem estado, sem React, sem side-effects |
| 3 | **Assinatura padronizada** | `nomeOperacao(supabase, ...params)` |
| 4 | **throw error** | Services lancam excecoes, componente faz try/catch |
| 5 | **Tipos do Supabase** | `Tables<>`, `TablesInsert<>`, `TablesUpdate<>` |
| 6 | **JOINs nos services** | Funcoes nomeadas por "visao": `buscarX()` (simples) vs `buscarXComDetalhes()` (com JOINs) |
| 7 | **Storage em arquivo dedicado** | Operacoes de Storage bucket ficam em service proprio (`recibos.ts`), nao dentro de outra entidade |
| 8 | **Validacoes de uso nos services** | Verificar dependencias antes de deletar e logica de negocio, vai no service |
| 9 | **Sub-fases** | Dividir em 4a (criar services) e 4b (refatorar componentes) |

---

## 5. Checkpoints

#### Checkpoint 08/02/2026 - Analise
**Status atual:** 🟡 Analise profunda concluida, aguardando respostas
**Levantamento:**
- 73 operacoes inline mapeadas
- 7 entidades: categorias, subcategorias, compras, fornecedores, gastos, orcamento_detalhado, recibos (storage)
- ~29 arquivos afetados
- 3 API Routes envolvidas

**Proximo passo:** Responder 5 questoes de decisao, preencher secao 3

#### Checkpoint 09/02/2026 - Proposta
**Status atual:** 🟡 Proposta elaborada, aguardando aprovacao
**Decisoes tomadas:**
- 5 questoes respondidas e documentadas
- padroes-codigo.md atualizado com JOINs e Storage
**Proposta inclui:**
- 7 services + 1 storage service (~60 funcoes)
- 29 arquivos a refatorar
- Dividido em sub-fases: 4a (services) e 4b (componentes)

**Proximo passo:** Aprovacao do usuario → criar spec-alteracao04.md
