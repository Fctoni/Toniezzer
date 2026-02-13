# Especificacao: Alteracao 14 - Editar data de vencimento de parcelas inline

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟠 Aguardando testes |
| Conversa | [alteracao14.md](../alteracao/alteracao14.md) |
| Data criacao | 13/02/2026 |
| Complexidade | 🟢 Baixa |

**Status possiveis:**
- 🔵 Pronto para executar
- 🔴 Em execucao
- 🟠 Aguardando testes
- 🟢 Concluido
- ❌ Cancelado

---

## 1. Resumo

Permitir editar a data de vencimento de parcelas pendentes diretamente na tabela, clicando na data para abrir um Calendar inline (Popover). Funciona nas paginas `/compras/[id]` e `/financeiro/lancamentos`, sem nenhuma diferenca visual entre datas editaveis e fixas.

---

## 2. O que sera feito

- [ ] Criar funcao `atualizarDataVencimento` no service `gastos.ts`
- [ ] Modificar `parcelas-table.tsx` para abrir Popover+Calendar ao clicar na data de parcelas pendentes
- [ ] Modificar `lancamentos-table.tsx` para abrir Popover+Calendar ao clicar na data de lancamentos pendentes
- [ ] Modificar `lancamentos-list.tsx` para repassar callback de refresh

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- Na pagina `/compras/[id]` (`parcelas-table.tsx`), a coluna "Vencimento" exibe a data como texto estatico: `format(parseDateString(parcela.data), "dd/MM/yyyy")`
- Na pagina `/financeiro/lancamentos` (`lancamentos-table.tsx`), a coluna "Data" exibe a data como texto estatico: `parseDateString(gasto.data).toLocaleDateString("pt-BR")`
- Nenhuma das duas tabelas permite editar a data de vencimento diretamente

**Depois (comportamento proposto):**
- Em ambas as tabelas, a data de vencimento de parcelas **pendentes** (`pago === false`) se torna clicavel
- Ao clicar na data, abre um Popover com Calendar (mesmo padrao visual ja usado no `parcela-pagamento-dialog.tsx`)
- Ao selecionar nova data, o sistema salva automaticamente via service e exibe toast de confirmacao
- Parcelas **pagas** continuam exibindo a data como texto estatico (nao editavel)
- Sem nenhuma diferenca visual entre datas editaveis e fixas. A interacao e puramente funcional

### 3.2 UI Proposta

#### Celula de data - Aparencia identica para todas as parcelas

```
│  12/03/2026     │
```

Visualmente identico para parcelas pagas e pendentes. Nenhum icone, nenhum estilo diferente.

#### Popover aberto (ao clicar em data de parcela pendente)

```
│  ┌──────────────────────────┐  │
│  │      Fevereiro 2026      │  │
│  │  ◄                    ►  │  │
│  │  Do Se Te Qu Qu Se Sa    │  │
│  │                       1  │  │
│  │   2  3  4  5  6  7  8   │  │
│  │   9 10 11 12 [13] 14 15 │  │
│  │  16 17 18 19 20 21 22   │  │
│  │  23 24 25 26 27 28       │  │
│  └──────────────────────────┘  │
```

**Comportamentos:**
- Clicar na data de uma parcela pendente abre o Popover com Calendar
- Clicar na data de uma parcela paga nao faz nada
- Selecionar uma data no Calendar salva automaticamente (sem botao "Confirmar")
- Apos salvar com sucesso: Popover fecha, toast "Data de vencimento atualizada", tabela recarrega dados
- Se erro ao salvar: toast de erro, Popover permanece aberto, data nao muda
- Clicar fora do Popover fecha sem salvar

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A - sem alteracoes no banco. O campo `gastos.data` (tipo `string`, formato `YYYY-MM-DD`) ja existe e ja e atualizavel via `TablesUpdate<'gastos'>`.

### 4.2 Arquivos a Modificar/Criar

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| MODIFICAR | `src/lib/services/gastos.ts` | Adicionar funcao `atualizarDataVencimento(supabase, id, data)` |
| MODIFICAR | `src/components/features/compras/parcelas-table.tsx` | Celula de vencimento vira Popover+Calendar para parcelas pendentes |
| MODIFICAR | `src/components/features/financeiro/lancamentos-table.tsx` | Celula de data vira Popover+Calendar para lancamentos pendentes. Adicionar prop `onDataAlterada` |
| MODIFICAR | `src/components/features/financeiro/lancamentos-list.tsx` | Repassar callback `onDataAlterada` usando `router.refresh()` |

### 4.3 Fluxo de Dados

**Fluxo em `/compras/[id]` (parcelas-table):**

1. Usuario clica na data de vencimento de uma parcela pendente
2. Popover abre com Calendar, dia atual pre-selecionado
3. Usuario seleciona nova data no Calendar
4. `parcelas-table.tsx` chama `atualizarDataVencimento(supabase, parcela.id, formatDateToString(novaData))` do service `gastos.ts`
5. Service faz `UPDATE gastos SET data = novaData WHERE id = parcelaId`
6. Toast de sucesso, Popover fecha
7. Callback `onParcelaPaga()` e chamado (ja existente), que dispara `carregarDados()` no pai (`compras/[id]/page.tsx`), recarregando parcelas

**Fluxo em `/financeiro/lancamentos` (lancamentos-table):**

1. Usuario clica na data de um lancamento pendente
2. Popover abre com Calendar, dia atual pre-selecionado
3. Usuario seleciona nova data no Calendar
4. `lancamentos-table.tsx` chama `atualizarDataVencimento(supabase, gasto.id, formatDateToString(novaData))` do service `gastos.ts`
5. Service faz `UPDATE gastos SET data = novaData WHERE id = gastoId`
6. Toast de sucesso, Popover fecha
7. Callback `onDataAlterada()` e chamado, que dispara `router.refresh()` em `lancamentos-list.tsx`, causando re-fetch server-side da pagina

### 4.4 Dependencias Externas

Nenhuma. Todos os componentes necessarios (Popover, Calendar) ja existem no projeto via shadcn/ui.

### 4.5 Decisoes de Design e Justificativas

- **Sem diferenca visual:** A data de parcelas pendentes e visualmente identica a de parcelas pagas. Sem icone, sem underline, sem cursor diferente. A interacao e puramente funcional
- **Reutilizar Popover+Calendar existente:** O padrao ja esta implementado no `parcela-pagamento-dialog.tsx`. Reutilizar os mesmos componentes shadcn/ui garante consistencia visual
- **Salvar ao selecionar data (sem botao confirmar):** Para edicao inline de um unico campo, salvar automaticamente ao selecionar. Se houver erro, o toast informa e a data nao muda
- **Reutilizar callback `onParcelaPaga` na pagina de compras:** Embora o nome nao seja semanticamente perfeito, reutilizar o callback existente evita alterar a interface do componente. O efeito e o mesmo (recarregar dados)
- **`router.refresh()` na pagina de lancamentos:** Como a pagina `/financeiro/lancamentos` e um Server Component que busca dados, o padrao correto do Next.js App Router e usar `router.refresh()` para re-triggerar o fetch server-side
- **Nova funcao de service dedicada:** Criar `atualizarDataVencimento` ao inves de reutilizar `atualizarGastosPorCompra` (que atualiza por `compra_id`, nao por `id` individual)

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [x] Service `atualizarDataVencimento` criado
- [x] `parcelas-table.tsx` com edicao inline
- [x] `lancamentos-table.tsx` com edicao inline
- [x] `lancamentos-list.tsx` com callback
- [x] TypeScript sem erros
- [ ] Testado manualmente

### 5.2 Notas de Implementacao

- Removido `initialFocus` deprecated do Calendar no `parcelas-table.tsx`
- Usado estado `editandoDataId` controlado para garantir que apenas um Popover fique aberto por vez em cada tabela
- No `lancamentos-table.tsx`, removidos imports nao utilizados (`Pencil`, `Trash2`, `FileText`, `getStatusBadge`, `getFormaPagamento`) que ja existiam antes da alteracao

### 5.3 Conversa de Execucao

#### IA: Implementacao concluida sem problemas

Todos os 4 arquivos modificados conforme spec. TypeScript validado sem erros.

---

## 6. Validacao Final

- [x] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente em `/compras/[id]`
- [ ] Funcionalidade testada manualmente em `/financeiro/lancamentos`
- [ ] PRD atualizado (via Doc Editor)
