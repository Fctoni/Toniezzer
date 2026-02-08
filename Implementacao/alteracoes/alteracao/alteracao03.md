# Alteração 03 - Centralizar operações CRUD em funções utilitárias (services)

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟡 Em planejamento |
| Origem | Diagnóstico de padrões durante planejamento da Alteração 01 |
| Complexidade | 🟡 Média |
| Especificação | *(será criada após aprovação da proposta)* |

**Status possíveis:**
- 🟡 Em planejamento
- 🟢 Especificação criada → ver [spec-alteracao03.md](./spec-alteracao03.md)

---

## 1. Ideia Inicial

**Problema identificado:**
Atualmente o projeto faz queries CRUD diretamente inline nos componentes (ex: `supabase.from('etapas').update(...)` copiado em vários arquivos). Com o crescimento do app (3 níveis de hierarquia, múltiplas páginas usando os mesmos dados), a mesma operação aparece duplicada em 4+ arquivos diferentes.

**Exemplo do problema:**
"Atualizar status de tarefa" precisará ser feito em:
- `cronograma-table.tsx`
- `cronograma-mobile.tsx`
- `tarefas-table.tsx`
- `tarefa-detalhes.tsx`

Se um campo mudar, é preciso lembrar de atualizar em todos os lugares. Isso causa bugs e dificulta manutenção.

**Solução proposta:**
Criar camada `src/lib/services/` com funções utilitárias puras (não hooks) que centralizam as operações de banco. Cada entidade terá seu arquivo de service:

```
src/lib/services/
├── etapas.ts
├── subetapas.ts
├── tarefas.ts
├── tarefas-anexos.ts
├── tarefas-comentarios.ts
└── tarefas-dependencias.ts
```

**Exemplo:**
```typescript
// src/lib/services/tarefas.ts
export async function criarTarefa(data: TablesInsert<'tarefas'>) { ... }
export async function atualizarStatusTarefa(id: string, status: string) { ... }
export async function calcularProgressoSubetapa(subetapaId: string): Promise<number> { ... }
```

**Escopo:** Refatorar todo o app para usar services, não apenas as tabelas novas da Alteração 01.

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

N/A - alteração sem impacto visual

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
