# Especificacao: Alteracao 05 - Editar data de vencimento de parcelas inline

| Aspecto | Detalhe |
|---------|---------|
| Status | 🔴 Em execucao |
| Conversa | [alteracao05.md](../alteracao/alteracao05.md) |
| Data criacao | 12/02/2026 |
| Complexidade | 🟢 Baixa |

**Status possiveis:**
- 🔵 Pronto para executar
- 🔴 Em execucao
- 🟠 Aguardando testes
- 🟢 Concluido
- ❌ Cancelado

---

## 1. Resumo

Permitir alterar a data de vencimento de parcelas pendentes clicando na data na tabela, que abre um Popover com Calendar. Aplica-se a `parcelas-table.tsx` (pagina de compra) e `lancamentos-table.tsx` (pagina de lancamentos financeiros).

---

## 2. O que sera feito

- [ ] Tornar a celula de vencimento clicavel em `parcelas-table.tsx` (parcelas pendentes)
- [ ] Tornar a celula de data clicavel em `lancamentos-table.tsx` (lancamentos pendentes)
- [ ] Salvar nova data no banco automaticamente ao selecionar
- [ ] Exibir toast de sucesso/erro
- [ ] TypeScript sem erros

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- A data de vencimento e exibida como texto estatico em ambas as tabelas
- Nao ha forma de alterar a data de vencimento de uma parcela apos criacao
- Para alterar, seria necessario cancelar a compra e recriar

**Depois (comportamento proposto):**
- Parcelas pendentes: a data de vencimento e clicavel (sem indicacao visual diferenciada)
- Ao clicar, abre um Popover com Calendar para selecionar nova data
- Ao selecionar a data, salva automaticamente no banco (update na tabela `gastos`, campo `data`)
- Exibe toast de sucesso/erro
- Parcelas pagas: clique nao faz nada (sem interacao)
- Comportamento identico em ambas as paginas

### 3.2 UI Proposta

#### Celula de vencimento (ambas as tabelas)

```
Parcela pendente (aparencia identica a paga):
┌──────────────────────┐
│  12/03/2025          │  ← visualmente igual, mas clicavel
└──────────────────────┘

Ao clicar (pendente):
┌──────────────────────┐
│  12/03/2025          │
├──────────────────────┤
│  ┌────────────────┐  │
│  │   Calendario   │  │  ← Popover com Calendar
│  │   date picker  │  │
│  └────────────────┘  │
└──────────────────────┘

Parcela paga:
┌──────────────────────┐
│  12/03/2025          │  ← texto estatico, clique nao faz nada
└──────────────────────┘
```

**Comportamentos:**
- Sem diferenciacao visual entre editavel e nao editavel
- Click em pendente: abre Popover com Calendar
- Selecionar data: salva imediatamente, fecha Popover, exibe toast
- Erro: exibe toast de erro, mantem data anterior
- Parcela paga: clique nao faz nada

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A - sem alteracoes no banco. O campo `data` na tabela `gastos` ja existe e armazena a data de vencimento. Apenas sera feito um UPDATE nesse campo.

### 4.2 Arquivos a Modificar/Criar

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| MODIFICAR | `src/components/features/compras/parcelas-table.tsx` | Celula de vencimento: se `pago === false`, envolver data em `Popover` + `PopoverTrigger` + `PopoverContent` com `Calendar`. Ao selecionar data, chamar funcao de update e callback `onParcelaPaga` para refresh. Os imports de `Popover`, `Calendar`, `CalendarIcon` ja existem neste arquivo. |
| MODIFICAR | `src/components/features/financeiro/lancamentos-table.tsx` | Celula de data: se `pago === false`, envolver data em `Popover` + `PopoverTrigger` + `PopoverContent` com `Calendar`. Adicionar imports de `Popover`, `PopoverContent`, `PopoverTrigger`, `Calendar`, `CalendarIcon` (do shadcn/ui). Adicionar imports de `createClient` (supabase/client), `toast` (sonner), `format` (date-fns), `ptBR`. Adicionar prop `onDataAlterada?: () => void` na interface para callback de refresh. |

### 4.3 Fluxo de Dados

1. Usuario clica na data de vencimento de uma parcela pendente
2. Popover abre com `Calendar` mostrando a data atual como `selected`
3. Usuario seleciona nova data
4. Handler `onSelect` do Calendar:
   a. Fecha o Popover
   b. Chama `supabase.from('gastos').update({ data: formatDateToString(novaData) }).eq('id', parcelaId)`
   c. Sucesso: `toast.success('Data de vencimento atualizada')` + callback de refresh
   d. Erro: `toast.error('Erro ao atualizar data de vencimento')`

### 4.4 Dependencias Externas

Nenhuma. Todos os componentes necessarios ja existem no projeto.

### 4.5 Decisoes de Design e Justificativas

- **Inline Popover vs Modal**: Popover inline por ser mais rapido para edicao de campo unico. Padrao ja existe no projeto (dialog de pagamento em `parcelas-table.tsx`).
- **Salvar automatico vs botao confirmar**: Salvar ao selecionar a data (sem botao extra). O clique no calendario ja e a confirmacao.
- **Sem feedback visual diferenciado**: A data de parcelas pendentes tem aparencia identica a de parcelas pagas. Apenas o comportamento muda (clicavel vs nao clicavel).
- **Sem restricao de data**: Nao ha restricao sobre a data selecionada (pode ser passada ou futura), pois o usuario pode precisar corrigir datas erradas.
- **Queries inline**: O codigo atual do projeto faz queries Supabase diretamente nos componentes. Para manter consistencia, a alteracao segue o mesmo padrao.

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [ ] `parcelas-table.tsx` - celula de vencimento clicavel
- [ ] `lancamentos-table.tsx` - celula de data clicavel
- [ ] TypeScript sem erros
- [ ] Testado manualmente

### 5.2 Notas de Implementacao

[Decisoes tomadas durante a execucao, problemas encontrados, solucoes aplicadas]

### 5.3 Conversa de Execucao

*(problemas encontrados durante execucao, solucoes propostas)*

#### IA:
[mensagem]

---

## 6. Validacao Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)