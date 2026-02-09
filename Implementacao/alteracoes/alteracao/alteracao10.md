# Alteração 04 - Atualização otimista local em vez de router.refresh() para ações rápidas

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟡 Em planejamento |
| Origem | Diagnóstico de padrões durante planejamento da Alteração 01 |
| Complexidade | 🟡 Média |
| Especificação | *(será criada após aprovação da proposta)* |

**Status possíveis:**
- 🟡 Em planejamento
- 🟢 Especificação criada → ver [spec-alteracao04.md](./spec-alteracao04.md)

---

## 1. Ideia Inicial

**Problema identificado:**
Atualmente, após qualquer operação CRUD, o app chama `router.refresh()` para recarregar os dados. Isso causa um re-render completo do server component, o que:
- Perde o estado visual do usuário (etapas expandidas, scroll position, etc.)
- É lento para ações simples (mudar status, reordenar)
- Dá sensação de "travado" na UI

Com a Alteração 01 (3 níveis hierárquicos), o problema piora: se o usuário expandiu 5 etapas e 10 subetapas e editou 1 tarefa, tudo colapsa.

**Padrão atual do drag & drop (já funciona bem):**
O drag & drop já usa atualização otimista: atualiza a UI local → salva no banco → mostra toast. Este padrão deveria ser estendido para outras ações rápidas.

**Solução proposta:**
Padronizar dois tipos de atualização:

| Tipo de ação | Estratégia | Exemplo |
|-------------|-----------|---------|
| **Ações rápidas** (status, progresso, ordem) | Atualização otimista local + save em background | Mudar status de tarefa, reordenar |
| **CRUDs pesados** (criar, deletar, editar múltiplos campos) | `router.refresh()` após sucesso do modal | Criar nova etapa, deletar tarefa |

**Escopo:** Refatorar todo o app para usar atualização otimista em ações rápidas, não apenas os componentes novos da Alteração 01.

---

## 2. Conversa de Planejamento

#### usuário:

#### IA:

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

N/A - alteração sem impacto visual (melhoria de UX/performance)

### 3.3 Arquivos Afetados

| Ação | Arquivo | O que muda |
|------|---------|------------|

### 3.4 Fluxo de Dados

### 3.5 Banco de Dados

N/A - sem alterações no banco

---

## 4. Decisões Importantes

---

## 5. Checkpoints
