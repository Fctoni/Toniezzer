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

#### IA: Proposta

Apos analise do codigo existente, identifiquei os componentes e a estrutura:

**Pagina `/compras/[id]`** - usa `parcelas-table.tsx` que ja exibe a coluna "Vencimento" com a data formatada. Parcelas pendentes ja tem interacoes (botao "Pagar"). O padrao de Popover + Calendar ja existe nesse componente (usado no dialog de pagamento).

**Pagina `/financeiro/lancamentos`** - usa `lancamentos-table.tsx` que exibe a data na primeira coluna. Aqui a data aparece como texto simples.

A abordagem: transformar a celula de data de vencimento em um componente clicavel que abre um Popover com Calendar (mesmo padrao ja usado no dialog de pagamento do `parcelas-table.tsx`). Somente para parcelas com `pago === false`.

Posso preencher a proposta completa, conforme template?