# Especificacao: Alteracao 13 - Refatorar pagina de fornecedores: tabela, remover avaliacao, dados de pagamento

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟠 Aguardando testes |
| Conversa | [alteracao13.md](../alteracao/alteracao13.md) |
| Data criacao | 2026-02-13 |
| Complexidade | 🟡 Media |

---

## 1. Resumo

Refatorar a pagina de fornecedores: trocar visualizacao de cards para tabela (estilo cronograma), remover o sistema de avaliacao (UI + banco), e adicionar campos de dados para pagamento no cadastro com campos condicionais (PIX ou Conta Corrente).

---

## 2. O que sera feito

- [ ] Migration: remover colunas `avaliacao`/`comentario_avaliacao`, adicionar colunas de pagamento
- [ ] Regenerar tipos TypeScript (`database.ts`)
- [ ] Substituir grid de cards por tabela CSS grid na listagem
- [ ] Adicionar acoes inline na tabela (ver, editar, excluir)
- [ ] Deletar `fornecedor-card.tsx` e `avaliacao-stars.tsx`
- [ ] Remover funcao `atualizarAvaliacao` do service
- [ ] Adicionar secao "Dados para Pagamento" no formulario com campos condicionais
- [ ] Substituir card de avaliacao por card de "Dados para Pagamento" na pagina de detalhes
- [ ] Remover estados/handlers de avaliacao da pagina de detalhes

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- Listagem de fornecedores em cards (grid 3 colunas) com icone, badge, estrela de avaliacao, contatos e botao "Ver detalhes"
- Pagina de detalhes tem card de avaliacao com 5 estrelas interativas + comentario
- Formulario de cadastro/edicao tem campos: nome, tipo, CNPJ/CPF, especialidade, telefone, email, endereco
- Banco tem colunas `avaliacao` e `comentario_avaliacao`

**Depois (comportamento proposto):**
- Listagem em tabela com colunas: `Nome | Tipo | Especialidade | Telefone | Email | Acoes` (design inspirado no cronograma)
- Card de avaliacao removido da pagina de detalhes; em seu lugar, card de "Dados para Pagamento"
- Formulario ganha secao "Dados para Pagamento" com campos condicionais (PIX ou Conta Corrente)
- Colunas `avaliacao` e `comentario_avaliacao` removidas do banco; novas colunas de pagamento adicionadas

### 3.2 UI Proposta

#### Tabela de Listagem (substitui os cards)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  👤 Fornecedores                                            [+ Novo]       │
│  Gerencie fornecedores e prestadores de servico                            │
├──────────────────────────────────────────────────────────────────────────────┤
│  [Total: 12]     [Prestadores: 5]     [Fornecedores: 7]                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  🔍 Buscar por nome...                    [Filtrar por tipo ▼]             │
├──────────────────────────────────────────────────────────────────────────────┤
│  Nome              │ Tipo          │ Especialidade │ Telefone    │ Email    │ Acoes │
│────────────────────┼───────────────┼───────────────┼─────────────┼──────────┼───────│
│  Joao Eletricista  │ Prestador     │ Eletrica      │ (11) 9999.. │ joao@..  │ 👁 ✏ 🗑│
│  Ferro & Aco Ltda  │ Fornecedor    │ Metais        │ (11) 3333.. │ ferro@.. │ 👁 ✏ 🗑│
│  Maria Pinturas    │ Prestador     │ Pintura       │ (11) 8888.. │          │ 👁 ✏ 🗑│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Icone de olho leva para a pagina de detalhes (`/fornecedores/[id]`)
- Icone de editar abre Dialog com `FornecedorForm` (mesmo pattern da pagina de detalhes atual)
- Icone de excluir abre AlertDialog de confirmacao (soft delete via `desativarFornecedor`)
- Header, stats e filtros continuam iguais ao layout atual
- Tabela usa CSS grid (nao HTML `<table>`), como o cronograma
- Celulas de texto truncam com ellipsis quando o conteudo e maior que a coluna

#### Secao "Dados para Pagamento" no Formulario

```
┌─────────────────────────────────────────────────────────────┐
│  Dados para Pagamento                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tipo de Pagamento                                          │
│  ┌─────────────────────────────────────┐                    │
│  │ Selecione...                     ▼  │                    │
│  └─────────────────────────────────────┘                    │
│                                                             │
│  ---- SE PIX selecionado: ----                              │
│  Chave PIX                                                  │
│  ┌─────────────────────────────────────┐                    │
│  │ email@exemplo.com                   │                    │
│  └─────────────────────────────────────┘                    │
│                                                             │
│  ---- SE CONTA CORRENTE selecionado: ----                   │
│  Numero do Banco          Agencia                           │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │ 001              │      │ 1234-5           │              │
│  └─────────────────┘      └─────────────────┘              │
│  Conta                    CPF / CNPJ                        │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │ 12345-6          │      │ 12.345.678/0001  │              │
│  └─────────────────┘      └─────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Campo "Tipo de Pagamento" e um Select com opcoes: PIX, Conta Corrente (+ opcao vazia "Selecione...")
- Campos condicionais aparecem/desaparecem conforme o tipo selecionado
- Se trocar de PIX para Conta Corrente (ou vice-versa), os campos do tipo anterior sao limpos
- Todos os campos de pagamento sao opcionais (fornecedor pode existir sem dados bancarios)
- Secao fica abaixo do campo "Endereco" no formulario

#### Card "Dados para Pagamento" na Pagina de Detalhes

```
┌─────────────────────────────────────────────────────┐
│  💳 Dados para Pagamento                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tipo de Pagamento                                  │
│  PIX                                                │
│                                                     │
│  Chave PIX                                          │
│  email@exemplo.com                                  │
│                                                     │
│  (ou, se conta corrente:)                           │
│  Banco         Agencia         Conta                │
│  001           1234-5          12345-6               │
│  CPF/CNPJ                                           │
│  12.345.678/0001-00                                  │
│                                                     │
│  (ou, se nenhum dado cadastrado:)                   │
│  "Nenhum dado de pagamento cadastrado"              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Substitui o card de avaliacao removido (mesma posicao no grid 2 colunas)
- Exibe dados de pagamento em modo somente-leitura
- Se `tipo_pagamento` for null, mostra mensagem "Nenhum dado de pagamento cadastrado"

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

| Tabela | Alteracao |
|--------|-----------|
| `fornecedores` | Remover colunas: `avaliacao`, `comentario_avaliacao` |
| `fornecedores` | Adicionar colunas: `tipo_pagamento`, `chave_pix`, `banco_numero`, `banco_agencia`, `banco_conta`, `banco_cpf_cnpj` |

```sql
-- Migration: refatorar_fornecedores_pagamento

-- Remover colunas de avaliacao
ALTER TABLE fornecedores DROP COLUMN IF EXISTS avaliacao;
ALTER TABLE fornecedores DROP COLUMN IF EXISTS comentario_avaliacao;

-- Adicionar colunas de dados para pagamento
ALTER TABLE fornecedores ADD COLUMN tipo_pagamento text; -- 'pix' | 'conta_corrente'
ALTER TABLE fornecedores ADD COLUMN chave_pix text;
ALTER TABLE fornecedores ADD COLUMN banco_numero text;
ALTER TABLE fornecedores ADD COLUMN banco_agencia text;
ALTER TABLE fornecedores ADD COLUMN banco_conta text;
ALTER TABLE fornecedores ADD COLUMN banco_cpf_cnpj text;
```

### 4.2 Arquivos a Modificar/Criar

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| MODIFICAR | `src/components/features/fornecedores/fornecedores-page-client.tsx` | Substituir grid de cards por tabela CSS grid. Adicionar Dialog de edicao e AlertDialog de exclusao inline. Remover import de `FornecedorCard` |
| MODIFICAR | `src/components/features/fornecedores/fornecedor-form.tsx` | Adicionar secao "Dados para Pagamento" com Select tipo + campos condicionais PIX/Conta Corrente. Atualizar schema zod com novos campos. Limpar campos ao trocar tipo |
| MODIFICAR | `src/app/(dashboard)/fornecedores/[id]/page.tsx` | Remover card de avaliacao, estados `avaliacao`/`comentario`/`savingAvaliacao`, handler `handleSaveAvaliacao`. Remover imports de `AvaliacaoStars` e `Textarea` (se nao usada em outro lugar). Adicionar card "Dados para Pagamento" readonly |
| MODIFICAR | `src/lib/services/fornecedores.ts` | Remover funcao `atualizarAvaliacao` |
| DELETAR | `src/components/features/fornecedores/fornecedor-card.tsx` | Nao sera mais usado (substituido pela tabela) |
| DELETAR | `src/components/features/fornecedores/avaliacao-stars.tsx` | Nao sera mais usado (avaliacao removida do sistema) |
| REGENERAR | `src/lib/types/database.ts` | Regenerar tipos apos migration (novas colunas de pagamento, sem colunas de avaliacao) |

### 4.3 Fluxo de Dados

**Listagem em tabela:**
1. Server Component (`page.tsx`) busca fornecedores via `buscarFornecedores(supabase)`
2. Passa dados para `FornecedoresPageClient` como `initialFornecedores`
3. Client Component renderiza tabela grid. Filtros de busca/tipo continuam refazendo fetch via service
4. Acao "editar" abre Dialog com `FornecedorForm` pre-preenchido; ao salvar, refaz fetch
5. Acao "excluir" chama `desativarFornecedor(supabase, id)` e refaz fetch

**Cadastro/edicao com dados de pagamento:**
1. Usuario preenche formulario incluindo tipo de pagamento + campos condicionais
2. `onSubmit` chama `criarFornecedor(supabase, data)` ou `atualizarFornecedor(supabase, id, data)` com os novos campos
3. Service insere/atualiza no banco (novos campos ja estarao na tipagem via `TablesInsert`/`TablesUpdate`)
4. Ao trocar tipo de pagamento no form, `watch('tipo_pagamento')` dispara limpeza dos campos do tipo anterior via `setValue`

**Detalhes com dados de pagamento:**
1. Pagina `[id]` busca fornecedor via `buscarFornecedorPorId(supabase, id)`
2. Card "Dados para Pagamento" exibe dados readonly conforme `tipo_pagamento` do fornecedor
3. Se `tipo_pagamento` for null, mostra placeholder "Nenhum dado de pagamento cadastrado"

### 4.4 Dependencias Externas

Nenhuma. Nao requer novas libs, buckets ou configuracoes externas.

### 4.5 Decisoes de Design e Justificativas

- **Tabela usa CSS grid (nao HTML `<table>`):** Manter consistencia visual com a pagina de cronograma, que ja usa esse pattern
- **Avaliacao removida completamente (UI + service + banco):** Sem backwards-compatibility — feature nao faz sentido no contexto do projeto
- **Dados de pagamento sao todos opcionais:** Fornecedor pode ser cadastrado sem dados bancarios; preenchimento gradual
- **Campos condicionais no form:** PIX mostra apenas `chave_pix`, Conta Corrente mostra `banco_*`. Trocar tipo limpa campos do tipo anterior para evitar dados inconsistentes
- **Acoes inline na tabela (ver/editar/excluir):** Permite operacoes rapidas sem navegar para pagina de detalhes. Editar reutiliza o `FornecedorForm` existente em um Dialog
- **Sem novas funcoes no service:** `criarFornecedor` e `atualizarFornecedor` ja aceitam todos os campos via `TablesInsert`/`TablesUpdate` — os novos campos entram automaticamente apos regenerar os tipos

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [x] Migration aplicada (remover avaliacao + adicionar pagamento)
- [x] Tipos TypeScript regenerados
- [x] Remover `atualizarAvaliacao` do service
- [x] Deletar `fornecedor-card.tsx`
- [x] Deletar `avaliacao-stars.tsx`
- [x] Refatorar `fornecedores-page-client.tsx` para tabela com acoes inline
- [x] Adicionar campos de pagamento no `fornecedor-form.tsx`
- [x] Refatorar `[id]/page.tsx` (remover avaliacao, adicionar card pagamento)
- [x] `npx tsc --noEmit` sem erros
- [ ] Testado manualmente

### 5.2 Notas de Implementacao

- Ao regenerar `database.ts`, os tipos customizados (`TopicoStatus`, `FeedTipo`, etc.) que existiam no final do arquivo foram perdidos. Restaurados manualmente apos a regeneracao.
- O `useEffect` de limpeza de campos de pagamento ao trocar tipo usa `eslint-disable-next-line react-hooks/exhaustive-deps` pois so deve reagir a mudanca de `tipoPagamento`, nao de `form.setValue`.
- A tabela usa CSS grid com `grid-cols-[minmax(180px,1fr)_130px_150px_140px_180px_100px]` para 6 colunas.
- O `FornecedorForm` agora aceita strings vazias para `tipo_pagamento` no schema zod via `.or(z.literal(""))`, convertendo para `null` no payload.

### 5.3 Conversa de Execucao

#### IA: Execucao completa sem bloqueios

Todos os 9 itens implementados sem problemas. Unico ponto de atencao foi a restauracao dos custom type aliases no `database.ts` apos regeneracao.

---

## 6. Validacao Final

- [x] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
