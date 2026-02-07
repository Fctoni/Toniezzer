# Especificação: Alteração XX - [Título curto]

| Aspecto | Detalhe |
|---------|---------|
| Status | 🔵 Pronto para executar |
| Conversa | [alteracaoXX.md](./alteracaoXX.md) |
| Data criação | [data] |
| Complexidade | 🟢 Baixa / 🟡 Média / 🔴 Alta |

**Status possíveis:**
- 🔵 Pronto para executar
- 🔴 Em execução
- 🟠 Aguardando testes
- 🟢 Concluído
- ❌ Cancelado

---

## 1. Resumo

[1-2 linhas resumindo o que será implementado - extraído da conversa de planejamento]

---

## 2. O que será feito

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

---

## 3. Proposta

*(Copiada da seção 3 da conversa de planejamento, após aprovação do usuário)*

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

---

## 4. Implementação Técnica

*(Detalhada a partir das seções 3.3, 3.4 e 3.5 da conversa de planejamento)*

### 4.1 Banco de Dados

*(Se aplicável. Caso contrário, escrever "N/A - sem alterações no banco")*

| Tabela | Alteração |
|--------|-----------|
| `tabela_exemplo` | Adicionar campo `novo_campo` |

```sql
-- Script SQL (se aplicável)
ALTER TABLE tabela_exemplo ADD COLUMN novo_campo TEXT;
```

### 4.2 Arquivos a Modificar/Criar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/exemplo.tsx` | Novo componente |
| MODIFICAR | `src/lib/hooks/useExemplo.ts` | Adicionar função X |

### 4.3 Fluxo de Dados

*(Descrever o caminho dos dados em passos numerados)*

1. [Passo 1: ex. Usuário clica em "Salvar"]
2. [Passo 2: ex. Hook `useExemplo` chama função `salvarDados()`]
3. [Passo 3: ex. Supabase insere na tabela `exemplo`]
4. [Passo 4: ex. Tela recarrega dados via `carregarDados()`]

### 4.4 Dependências Externas

- [ ] Criar bucket no Supabase (se aplicável)
- [ ] Outras dependências externas

---

### 4.5 Decisões de Design e Justificativas

*(Copiado da seção 4 da conversa de planejamento - documenta o PORQUÊ das escolhas técnicas)*

- **[Nome da decisão]:** [Justificativa e alternativas consideradas]
- **[Nome da decisão]:** [Justificativa e alternativas consideradas]


## 5. Execução

*(preenchido pelo Executor)*

### 5.1 Progresso

- [ ] Banco de dados atualizado
- [ ] Componente criado
- [ ] Hook modificado
- [ ] TypeScript sem erros
- [ ] Testado manualmente

### 5.2 Notas de Implementação

[Decisões tomadas durante a execução, problemas encontrados, soluções aplicadas]

### 5.3 Conversa de Execução

*(problemas encontrados durante execução, soluções propostas)*

#### IA:
[mensagem]

---

## 6. Validação Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
