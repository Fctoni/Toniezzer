# Alteração XX - [Título curto]

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟡 Em planejamento |
| Origem | [de onde veio a ideia] |
| Complexidade | 🟢 Baixa / 🟡 Média / 🔴 Alta |
| Especificação | *(será criada após aprovação da proposta)* |

**Status possíveis:**
- 🟡 Em planejamento
- 🟢 Especificação criada → ver [spec-alteracaoXX.md](./spec-alteracaoXX.md)

---

## 1. Ideia Inicial

[Descrição livre do usuário sobre o que quer implementar]

---

## 2. Conversa de Planejamento

#### usuário:
[primeira mensagem]

#### IA:
[resposta]

---

## 3. Proposta de Implementação

*(Preenchida pelo Planejador quando tiver informações suficientes da conversa. Será copiada para a spec após aprovação.)*

**Status:** 🟡 Aguardando aprovação

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- [Descrever o que acontece hoje]

**Depois (comportamento proposto):**
- [Descrever o que vai mudar]

### 3.2 UI Proposta

*(Se a alteração envolve mudanças visuais. Caso contrário, escrever "N/A - alteração sem impacto visual")*

#### [Nome do Modal/Tela]

```
┌─────────────────────────────────────────────────────────────┐
│  📄 Título                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Desenho ASCII da interface]                               │
│                                                             │
│                              [Cancelar]  [✅ Confirmar]     │
└─────────────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Comportamento 1
- Comportamento 2

### 3.3 Arquivos Afetados

| Ação | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/...` | [descrição curta] |
| MODIFICAR | `src/...` | [descrição curta] |

### 3.4 Fluxo de Dados

*(Descrever em alto nível o caminho dos dados: de onde vêm, o que acontece com eles, onde são salvos)*

1. [Passo 1: ex. Usuário clica em "Salvar"]
2. [Passo 2: ex. Hook `useExemplo` chama função `salvarDados()`]
3. [Passo 3: ex. Supabase insere na tabela `exemplo`]
4. [Passo 4: ex. Tela recarrega dados via `carregarDados()`]

### 3.5 Banco de Dados

*(Se aplicável. Caso contrário, escrever "N/A - sem alterações no banco")*

| Tabela | Alteração |
|--------|-----------|
| `tabela_exemplo` | [descrição] |

```sql
-- Script SQL (se aplicável)
```

---

## 4. Decisões Importantes

*(Resumo das principais decisões tomadas durante a conversa - útil para referência futura)*

- Decisão 1: [descrição]
- Decisão 2: [descrição]

---

## 5. Checkpoints

*(Adicionados automaticamente em sessões longas)*

#### Checkpoint [data] - [hora]
**Status atual:** [status]
**Decisões tomadas:**
- Decisão 1
- Decisão 2

**Próximo passo:** [descrição]
