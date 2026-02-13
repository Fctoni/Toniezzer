# Alteracao 16 - Eliminar queries Supabase inline e mover storage para services

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificacao criada |
| Origem | Auditoria de padroes de codigo |
| Complexidade | 🟢 Baixa |
| Especificacao | [spec-alteracao16.md](../spec/spec-alteracao16.md) |

---

## 1. Ideia Inicial

Auditoria revelou 12 violacoes do padrao "NUNCA faca queries Supabase inline em componentes — use services". Queries `supabase.from()` aparecem diretamente em 10 paginas/componentes, e uploads de storage sao feitos diretamente em 2 componentes.

O service `buscarEtapas()` ja existe mas nao esta sendo usado. Nao existe `src/lib/services/storage.ts` para operacoes genericas de storage.

---

## 2. Conversa de Planejamento

#### usuario: Analise automatica via auditoria de padroes

#### IA: Confirmadas 12 violacoes em 3 categorias

**Categoria 1 - Queries `select("id, nome")` de etapas (4 arquivos):**
Precisam de nova funcao `buscarEtapasParaDropdown()` que retorna apenas `id` e `nome`:
- `src/app/(dashboard)/tarefas/page.tsx:51`
- `src/app/(dashboard)/documentos/page.tsx:15`
- `src/app/(dashboard)/compras/nova/page.tsx:17`
- `src/app/(dashboard)/compras/[id]/editar/page.tsx:109`

**Categoria 2 - Queries `select("*")` de etapas (5 arquivos):**
Devem usar `buscarEtapas()` que ja existe:
- `src/app/(dashboard)/financeiro/page.tsx:25`
- `src/app/(dashboard)/financeiro/lancamentos/novo/page.tsx:14`
- `src/app/(dashboard)/financeiro/orcamento/page.tsx:17`
- `src/components/features/emails/form-aprovacao.tsx:172`
- `src/components/features/ocr/form-ocr.tsx:97`

**Categoria 3 - Update inline (1 arquivo):**
Deve usar `atualizarTarefa()` que ja existe:
- `src/components/features/cronograma/editar-tarefa-dialog.tsx:128-131`

**Categoria 4 - Storage inline (2 arquivos):**
Precisam de novo service `storage.ts`:
- `src/app/(dashboard)/financeiro/lancamentos/foto/page.tsx:66-73`
- `src/components/features/documentos/upload-form.tsx:143-152`

---

## 3. Proposta de Implementacao

**Status:** 🟡 Aguardando aprovacao

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- 10 paginas/componentes fazem `supabase.from("etapas").select(...)` diretamente
- 1 componente faz `supabase.from("tarefas").update(...)` diretamente
- 2 componentes fazem `supabase.storage.from(...).upload(...)` diretamente
- Nao existe service generico de storage

**Depois (comportamento proposto):**
- Todas as queries passam por services
- Nova funcao `buscarEtapasParaDropdown(supabase)` no service de etapas
- Novo service `src/lib/services/storage.ts` com funcoes `uploadFile()` e `getPublicUrl()`
- 12 arquivos atualizados para usar services

### 3.2 UI Proposta

N/A - alteracao sem impacto visual (mesmos dados, mesma logica, apenas refatoracao da camada de dados)

### 3.3 Arquivos Afetados

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/lib/services/etapas.ts` | Adicionar `buscarEtapasParaDropdown()` |
| CRIAR | `src/lib/services/storage.ts` | Novo service com `uploadFile()` e `getPublicUrl()` |
| MODIFICAR | `src/app/(dashboard)/tarefas/page.tsx` | Substituir query inline por `buscarEtapasParaDropdown()` |
| MODIFICAR | `src/app/(dashboard)/documentos/page.tsx` | Substituir query inline por `buscarEtapasParaDropdown()` |
| MODIFICAR | `src/app/(dashboard)/compras/nova/page.tsx` | Substituir query inline por `buscarEtapasParaDropdown()` |
| MODIFICAR | `src/app/(dashboard)/compras/[id]/editar/page.tsx` | Substituir query inline por `buscarEtapasParaDropdown()` |
| MODIFICAR | `src/app/(dashboard)/financeiro/page.tsx` | Substituir query inline por `buscarEtapas()` |
| MODIFICAR | `src/app/(dashboard)/financeiro/lancamentos/novo/page.tsx` | Substituir query inline por `buscarEtapas()` |
| MODIFICAR | `src/app/(dashboard)/financeiro/orcamento/page.tsx` | Substituir query inline por `buscarEtapas()` |
| MODIFICAR | `src/components/features/emails/form-aprovacao.tsx` | Substituir query inline por `buscarEtapas()` |
| MODIFICAR | `src/components/features/ocr/form-ocr.tsx` | Substituir query inline por `buscarEtapas()` |
| MODIFICAR | `src/components/features/cronograma/editar-tarefa-dialog.tsx` | Substituir update inline por `atualizarTarefa()` |
| MODIFICAR | `src/app/(dashboard)/financeiro/lancamentos/foto/page.tsx` | Usar service de storage |
| MODIFICAR | `src/components/features/documentos/upload-form.tsx` | Usar service de storage |

### 3.4 Fluxo de Dados

1. Criar `buscarEtapasParaDropdown(supabase)` em `etapas.ts` → retorna `Pick<Etapa, 'id' | 'nome'>[]`
2. Criar `storage.ts` com `uploadFile(supabase, bucket, path, file)` e `getPublicUrl(supabase, bucket, path)`
3. Em cada pagina/componente afetado: remover query inline → importar service → chamar funcao
4. Em componentes Client: `const supabase = createClient()` + `await serviceFn(supabase, ...)`
5. Em paginas Server: `const supabase = await createClient()` + `await serviceFn(supabase, ...)`
6. Validar com `npx tsc --noEmit`

### 3.5 Banco de Dados

N/A - sem alteracoes no banco

### 3.6 Impacto Cross-Domain

N/A - refatoracao interna, sem mudanca de comportamento

---

## 4. Decisoes Importantes

- `buscarEtapasParaDropdown()` retorna apenas `id` e `nome` (com `Pick<>`) — mais eficiente que `buscarEtapas()` para dropdowns
- `storage.ts` segue o padrao do `padroes-codigo.md` secao 4 (Storage) com DI
- Nao alterar logica de negocio, apenas mover para services

---

## 5. Checkpoints

*(nenhum checkpoint necessario - alteracao mecanica)*
