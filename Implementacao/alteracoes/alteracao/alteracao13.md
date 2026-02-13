# Alteracao 13 - Refatorar pagina de fornecedores: tabela, remover avaliacao, dados de pagamento

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificacao criada |
| Origem | Melhoria de usabilidade e novos requisitos de cadastro |
| Complexidade | 🟡 Media |
| Especificacao | [spec-alteracao13.md](../spec/spec-alteracao13.md) |

---

## 1. Ideia Inicial

Tres mudancas na pagina de fornecedores (`/fornecedores`):

1. **Visualizacao em tabela** - Trocar de cards para tabela, usando o design da pagina `/cronograma` como referencia
2. **Remover avaliacao** - Remover o sistema de avaliacao (estrelas) do fornecedor, pois nao faz sentido
3. **Dados para pagamento** - Adicionar campos de dados bancarios no cadastro do fornecedor:
   - Tipo Pagamento: `PIX` ou `Conta Corrente`
   - Se PIX: campo `Chave PIX`
   - Se Conta Corrente: campos `Numero do Banco`, `Agencia`, `Conta`, `CPF/CNPJ`

---

## 2. Conversa de Planejamento

#### usuario: trocar cards por tabela, remover avaliacao, adicionar dados de pagamento

#### IA: analise do codigo e perguntas de refinamento

Analisei todo o codigo de fornecedores. Segue o que encontrei e algumas perguntas:

**Estado atual:**
- Pagina de listagem usa cards em grid 3 colunas (`fornecedores-page-client.tsx` + `fornecedor-card.tsx`)
- Avaliacao aparece em 3 lugares: card (estrela), pagina de detalhes (`[id]/page.tsx` - card de avaliacao completo), e service (`atualizarAvaliacao`)
- Banco tem colunas `avaliacao` (integer) e `comentario_avaliacao` (text)
- Nao existem campos de dados bancarios na tabela `fornecedores`

**Perguntas:**

1. **Colunas da tabela** - Quais colunas voce quer visivel na tabela de listagem? Minha sugestao:
   `Nome | Tipo | Especialidade | Telefone | Email | Acoes`
   Ou quer incluir mais alguma coluna (ex: CNPJ/CPF, endereco)?

2. **Pagina de detalhes** - A pagina `/fornecedores/[id]` tambem tem um card inteiro dedicado a avaliacao (estrelas + comentario). Removo esse card tambem?

3. **Colunas de avaliacao no banco** - Removo as colunas `avaliacao` e `comentario_avaliacao` da tabela, ou apenas escondo da UI? Recomendo remover do banco para manter limpo.

4. **Dados de pagamento na listagem** - Os dados bancarios devem aparecer na tabela de listagem como coluna, ou apenas no formulario de cadastro/edicao e na pagina de detalhes?

---

#### usuario:

1) gostei da sugestão
2) sim
3) sim, remover do banco também
4) apenas nas páginas, não na tabela

---

## 3. Proposta de Implementacao

**Status:** 🟡 Aguardando aprovacao

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
- Cada linha clicavel leva para a pagina de detalhes (ou icone de olho)
- Icone de editar abre dialog de edicao (mesmo comportamento da pagina de detalhes atual)
- Icone de excluir abre AlertDialog de confirmacao (soft delete via `desativarFornecedor`)
- Header, stats e filtros continuam iguais ao layout atual
- Tabela usa CSS grid como o cronograma (nao HTML `<table>`)

#### Secao "Dados para Pagamento" no Formulario

```
┌─────────────────────────────────────────────────────────────┐
│  Dados para Pagamento                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tipo de Pagamento *                                        │
│  ┌─────────────────────────────────────┐                    │
│  │ PIX                              ▼  │                    │
│  └─────────────────────────────────────┘                    │
│                                                             │
│  ---- SE PIX: ----                                          │
│  Chave PIX                                                  │
│  ┌─────────────────────────────────────┐                    │
│  │ email@exemplo.com                   │                    │
│  └─────────────────────────────────────┘                    │
│                                                             │
│  ---- SE CONTA CORRENTE: ----                               │
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
- Campo "Tipo de Pagamento" e um Select com opcoes: PIX, Conta Corrente
- Campos condicionais aparecem/desaparecem conforme o tipo selecionado (nao precisa ser obrigatorio - fornecedor pode nao ter dados bancarios)
- Se trocar de PIX para Conta Corrente (ou vice-versa), os campos do tipo anterior sao limpos
- Todos os campos de pagamento sao opcionais

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
│  Banco: 001 | Agencia: 1234-5 | Conta: 12345-6     │
│  CPF/CNPJ: 12.345.678/0001-00                       │
│                                                     │
│  (ou, se nenhum dado cadastrado:)                   │
│  "Nenhum dado de pagamento cadastrado"              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Substitui o card de avaliacao que sera removido
- Exibe dados de pagamento em modo somente-leitura
- Se nenhum dado cadastrado, mostra mensagem placeholder

### 3.3 Arquivos Afetados

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/components/features/fornecedores/fornecedores-page-client.tsx` | Substituir grid de cards por tabela CSS grid com colunas Nome/Tipo/Especialidade/Telefone/Email/Acoes. Adicionar acoes inline (ver, editar, excluir) |
| MODIFICAR | `src/components/features/fornecedores/fornecedor-form.tsx` | Adicionar secao "Dados para Pagamento" com Select de tipo + campos condicionais. Atualizar schema zod |
| MODIFICAR | `src/app/(dashboard)/fornecedores/[id]/page.tsx` | Remover card de avaliacao + estados relacionados. Adicionar card "Dados para Pagamento" (readonly). Remover imports de AvaliacaoStars |
| MODIFICAR | `src/lib/services/fornecedores.ts` | Remover funcao `atualizarAvaliacao`. Sem novas funcoes necessarias (os campos novos passam pelo `criarFornecedor` e `atualizarFornecedor` existentes) |
| DELETAR | `src/components/features/fornecedores/fornecedor-card.tsx` | Nao sera mais usado (substituido pela tabela) |
| DELETAR | `src/components/features/fornecedores/avaliacao-stars.tsx` | Nao sera mais usado (avaliacao removida) |
| MODIFICAR | `src/lib/types/database.ts` | Sera regenerado apos migration (novas colunas de pagamento, sem colunas de avaliacao) |

### 3.4 Fluxo de Dados

**Listagem em tabela:**
1. Server Component (`page.tsx`) busca fornecedores via `buscarFornecedores(supabase)`
2. Passa dados para `FornecedoresPageClient` como `initialFornecedores`
3. Client Component renderiza tabela grid. Filtros de busca/tipo continuam refazendo fetch via service
4. Acoes inline (editar/excluir) abrem dialogs direto na listagem

**Cadastro com dados de pagamento:**
1. Usuario preenche formulario incluindo tipo de pagamento + campos condicionais
2. `onSubmit` chama `criarFornecedor(supabase, data)` com os novos campos
3. Service insere no banco (os novos campos ja estarao na tipagem via `TablesInsert<'fornecedores'>`)

**Detalhes com dados de pagamento:**
1. Pagina `[id]` busca fornecedor via `buscarFornecedorPorId(supabase, id)`
2. Dados de pagamento exibidos em card readonly (substitui card de avaliacao removido)

### 3.5 Banco de Dados

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

---

## 4. Decisoes Importantes

- **Tabela usa CSS grid** (como cronograma), nao HTML `<table>`, para manter consistencia visual
- **Avaliacao removida completamente**: UI + service + banco. Sem backwards-compatibility
- **Dados de pagamento sao opcionais**: fornecedor pode existir sem dados bancarios
- **Campos condicionais no form**: PIX mostra `chave_pix`, Conta Corrente mostra `banco_*`. Trocar tipo limpa campos do tipo anterior
- **Acoes inline na tabela**: ver detalhes, editar (dialog), excluir (alert dialog) — sem precisar navegar para pagina de detalhes para acoes basicas
- **Sem novas funcoes no service**: `criarFornecedor` e `atualizarFornecedor` ja aceitam todos os campos via `TablesInsert`/`TablesUpdate`

---

## 5. Checkpoints

*(Nenhum checkpoint registrado)*