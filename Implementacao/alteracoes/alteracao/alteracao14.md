# Alteracao 14 - Editar data de vencimento de parcelas inline

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificacao criada |
| Origem | Solicitacao do usuario |
| Complexidade | 🟢 Baixa |
| Especificacao | [spec-alteracao14.md](../spec/spec-alteracao14.md) |

**Status possiveis:**
- 🟡 Em planejamento
- 🟢 Especificacao criada → ver [spec-alteracao14.md](../spec/spec-alteracao14.md)

---

## 1. Ideia Inicial

Permitir alterar a data de vencimento das parcelas de lancamentos financeiros diretamente na tabela (inline), tanto na pagina `/financeiro/lancamentos` quanto na pagina `/compras/[id]`. Somente parcelas pendentes (nao pagas) podem ser editadas. A edicao e feita clicando na data, que abre um date picker inline.

---

## 2. Conversa de Planejamento

#### usuario: Editar data de vencimento de parcelas inline

Requisitos ja definidos:
- Somente data de vencimento
- Uma parcela por vez
- Clicar direto na data e editar inline (date picker)
- Somente parcelas pendentes podem ser alteradas
- Comportamento identico nas duas paginas

#### IA: Analise do codigo existente

Apos analise do codigo existente, identifiquei os componentes e a estrutura:

**Pagina `/compras/[id]`** - usa `parcelas-table.tsx` que ja exibe a coluna "Vencimento" com a data formatada. Parcelas pendentes ja tem interacoes (botao "Pagar"). O padrao de Popover + Calendar ja existe nesse componente (usado no dialog de pagamento).

**Pagina `/financeiro/lancamentos`** - usa `lancamentos-table.tsx` que exibe a data na primeira coluna. Aqui a data aparece como texto simples.

A abordagem: transformar a celula de data de vencimento em um componente clicavel que abre um Popover com Calendar (mesmo padrao ja usado no dialog de pagamento do `parcelas-table.tsx`). Somente para parcelas com `pago === false`.

---

#### IA: Proposta completa preenchida abaixo

---

#### usuario: Sem diferenca visual

Nao quero icone de edicao. Nao precisa ter nenhuma diferenca visual das datas fixas. O usuario vai saber que as pendentes podem editar, entao so preciso da funcionalidade, mas nao de diferenca visual (muito menos de botao).

#### IA: Ajustado - removido icone e qualquer diferenca visual

Entendido. A data de parcelas pendentes sera visualmente identica a de parcelas pagas. A unica diferenca e funcional: clicar na data de uma parcela pendente abre o Calendar. Proposta atualizada abaixo.

---

## 3. Proposta de Implementacao

**Status:** 🟡 Aguardando aprovacao

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- Na pagina `/compras/[id]` (`parcelas-table.tsx`), a coluna "Vencimento" exibe a data como texto estatico: `format(parseDateString(parcela.data), "dd/MM/yyyy")`
- Na pagina `/financeiro/lancamentos` (`lancamentos-table.tsx`), a coluna "Data" exibe a data como texto estatico: `parseDateString(gasto.data).toLocaleDateString("pt-BR")`
- Nenhuma das duas tabelas permite editar a data de vencimento diretamente
- Para alterar uma data, seria necessario editar no banco de dados

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

Visualmente identico para parcelas pagas e pendentes. Nenhum icone, nenhum estilo diferente. A unica diferenca e funcional: clicar na data de uma parcela pendente abre o Calendar.

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

O Calendar abre em um Popover alinhado ao inicio da celula (`align="start"`). O dia atualmente selecionado fica destacado.

**Comportamentos:**
- Clicar na data de uma parcela pendente abre o Popover com Calendar
- Clicar na data de uma parcela paga nao faz nada (comportamento atual)
- Selecionar uma data no Calendar salva automaticamente (sem botao "Confirmar")
- Apos salvar com sucesso: Popover fecha, toast "Data de vencimento atualizada", tabela recarrega dados
- Se erro ao salvar: toast de erro, Popover permanece aberto, data nao muda
- Clicar fora do Popover fecha sem salvar

### 3.3 Arquivos Afetados

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/lib/services/gastos.ts` | Adicionar funcao `atualizarDataVencimento(supabase, id, data)` |
| MODIFICAR | `src/components/features/compras/parcelas-table.tsx` | Celula de vencimento vira Popover+Calendar para parcelas pendentes |
| MODIFICAR | `src/components/features/financeiro/lancamentos-table.tsx` | Celula de data vira Popover+Calendar para lancamentos pendentes. Adicionar prop callback `onDataAlterada` |
| MODIFICAR | `src/components/features/financeiro/lancamentos-list.tsx` | Repassar callback `onDataAlterada` usando `router.refresh()` |

### 3.4 Fluxo de Dados

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

### 3.5 Banco de Dados

N/A - sem alteracoes no banco. O campo `gastos.data` (tipo `string`, formato `YYYY-MM-DD`) ja existe e ja e atualizavel via `TablesUpdate<'gastos'>`. Apenas uma nova funcao de service sera criada para atualizar esse campo individualmente.

### 3.6 Impacto Cross-Domain

N/A - a alteracao e restrita ao dominio financeiro (tabela `gastos`). Nenhum outro dominio depende da data de vencimento de parcelas para calculos ou fluxos.

---

## 4. Decisoes Importantes

- **Sem diferenca visual:** A data de parcelas pendentes e visualmente identica a de parcelas pagas. Sem icone, sem underline, sem cursor diferente. A interacao e puramente funcional
- **Reutilizar Popover+Calendar existente:** O padrao ja esta implementado no `parcela-pagamento-dialog.tsx`. Reutilizar os mesmos componentes shadcn/ui (`Popover`, `PopoverTrigger`, `PopoverContent`, `Calendar`) garante consistencia visual
- **Salvar ao selecionar data (sem botao confirmar):** Para edicao inline de um unico campo, o padrao mais fluido e salvar automaticamente ao selecionar. Evita cliques extras. Se houver erro, o toast informa e a data nao muda
- **Reutilizar callback `onParcelaPaga` na pagina de compras:** Embora o nome nao seja semanticamente perfeito, reutilizar o callback existente evita alterar a interface do componente. O efeito e o mesmo (recarregar dados)
- **`router.refresh()` na pagina de lancamentos:** Como a pagina `/financeiro/lancamentos` e um Server Component que busca dados, o padrao correto do Next.js App Router e usar `router.refresh()` para re-triggerar o fetch server-side
- **Nova funcao de service dedicada:** Criar `atualizarDataVencimento` ao inves de reutilizar `atualizarGastosPorCompra` (que atualiza por `compra_id`, nao por `id` individual). A funcao nova e especifica e segue o padrao do projeto (1 funcao por operacao)

---

## 5. Checkpoints

*(Nenhum checkpoint necessario - conversa curta)*
