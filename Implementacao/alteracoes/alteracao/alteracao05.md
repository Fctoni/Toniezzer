# Alteracao 05 - Editar data de vencimento de parcelas inline

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificacao criada |
| Origem | Solicitacao do usuario |
| Complexidade | 🟢 Baixa |
| Especificacao | [spec-alteracao05.md](../spec/spec-alteracao05.md) |

**Status possiveis:**
- 🟡 Em planejamento
- 🟢 Especificacao criada → ver [spec-alteracao05.md](../spec/spec-alteracao05.md)

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

#### IA: Proposta completa apresentada abaixo

Apos analise do codigo existente, identifiquei os componentes e a estrutura:

**Pagina `/compras/[id]`** - usa `parcelas-table.tsx` que ja exibe a coluna "Vencimento" com a data formatada. Parcelas pendentes ja tem interacoes (botao "Pagar"). O padrao de Popover + Calendar ja existe nesse componente (usado no dialog de pagamento).

**Pagina `/financeiro/lancamentos`** - usa `lancamentos-table.tsx` que exibe a data na primeira coluna. Aqui a data aparece como texto simples.

A abordagem: transformar a celula de data de vencimento em um componente clicavel que abre um Popover com Calendar (mesmo padrao ja usado no dialog de pagamento do `parcelas-table.tsx`). Somente para parcelas com `pago === false`.

---

## 3. Proposta de Implementacao

**Status:** 🟢 Aprovado

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

### 3.3 Arquivos Afetados

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/components/features/compras/parcelas-table.tsx` | Celula de vencimento vira Popover+Calendar clicavel para parcelas pendentes |
| MODIFICAR | `src/components/features/financeiro/lancamentos-table.tsx` | Celula de data vira Popover+Calendar clicavel para lancamentos pendentes |

### 3.4 Fluxo de Dados

1. Usuario clica na data de vencimento de uma parcela pendente
2. Popover abre com Calendar mostrando a data atual selecionada
3. Usuario seleciona nova data
4. Componente chama `supabase.from('gastos').update({ data: novaData }).eq('id', parcelaId)`
5. Em caso de sucesso: fecha Popover, exibe toast "Data de vencimento atualizada", callback `onParcelaPaga` (ou equivalente) recarrega dados
6. Em caso de erro: exibe toast de erro, mantem data anterior

### 3.5 Banco de Dados

N/A - sem alteracoes no banco. O campo `data` na tabela `gastos` ja existe e armazena a data de vencimento. Apenas sera feito um UPDATE nesse campo.

### 3.6 Impacto Cross-Domain

N/A - a alteracao e localizada nos componentes de exibicao. Nao afeta outros dominios.

---

## 4. Decisoes Importantes

- **Inline Popover vs Modal**: Optamos por Popover inline por ser mais rapido e intuitivo para edicao de campo unico. O padrao de Popover+Calendar ja existe no projeto (dialog de pagamento em `parcelas-table.tsx`).
- **Salvar automatico vs botao confirmar**: Salvar ao selecionar a data (sem botao extra). Para edicao de campo unico, o clique no calendario ja e a confirmacao.
- **Sem feedback visual diferenciado**: A data de parcelas pendentes tem aparencia identica a de parcelas pagas. Apenas o comportamento muda (clicavel vs nao clicavel).
- **Sem restricao de data**: Nao ha restricao sobre a data selecionada (pode ser passada ou futura), pois o usuario pode precisar corrigir datas erradas.
- **Reuso de componentes**: Usaremos os mesmos componentes `Popover`, `Calendar` e `Button` do shadcn/ui ja importados no projeto.
- **Queries inline**: O codigo atual do projeto faz queries Supabase diretamente nos componentes (nao usa services). Para manter consistencia com o codigo existente, a alteracao seguira o mesmo padrao. A migracao para services e objeto da alteracao 03.

---

## 5. Checkpoints

*(Adicionados automaticamente em sessoes longas)*
