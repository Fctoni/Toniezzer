# Especificacao: Alteracao 06 - Refatoracao de padroes de codigo (pos-auditoria)

| Aspecto | Detalhe |
|---------|---------|
| Status | 🔵 Pronto para executar |
| Conversa | [alteracao06.md](./alteracao/alteracao06.md) |
| Data criacao | 09/02/2026 |
| Complexidade | 🟡 Media |

**Status possiveis:**
- 🔵 Pronto para executar
- 🔴 Em execucao
- 🟠 Aguardando testes
- 🟢 Concluido
- ❌ Cancelado

---

## 1. Resumo

Corrigir inconsistencias encontradas na auditoria de conformidade com `padroes-codigo.md`. Dividido em Fase 6a (centralizar TypedSupabaseClient, eliminar `any`, criar loading/error, atualizar padroes para aceitar PT) e Fase 6b (extrair sub-componentes dos 9 arquivos acima de 200 linhas).

---

## 2. O que sera feito

### Fase 6a — Quick Wins

- [ ] Criar `src/lib/types/supabase.ts` com export de `TypedSupabaseClient`
- [ ] Atualizar 13 services para importar `TypedSupabaseClient` do arquivo central
- [ ] Eliminar 9 ocorrencias de `any` em 6 arquivos
- [ ] Criar 13 `loading.tsx` (1 por feature) + 1 `error.tsx` generico
- [ ] Atualizar `.claude/padroes-codigo.md` secao 7 (aceitar PT)
- [ ] Validar TypeScript (`npx tsc --noEmit`)

### Fase 6b — Componentes Grandes

- [ ] Extrair sub-componentes de `cronograma-table.tsx` (1.356 → ~400 linhas)
- [ ] Extrair sub-componentes de `compra-form.tsx` (738 → ~250 linhas)
- [ ] Extrair sub-componentes de `tarefa-detalhes.tsx` (707 → ~300 linhas)
- [ ] Refatorar `compra-edit-form.tsx` para reutilizar secoes do compra-form (737 → ~250 linhas)
- [ ] Extrair sub-componentes de `galeria-fotos.tsx` (699 → ~300 linhas)
- [ ] Extrair sub-componentes de `cronograma-mobile.tsx` (657 → ~250 linhas)
- [ ] Extrair sub-componentes de `parcelas-table.tsx` (592 → ~200 linhas)
- [ ] Extrair sub-componentes de `tarefas-table.tsx` (566 → ~250 linhas)
- [ ] Extrair sub-componentes de `timeline-etapas.tsx` (457 → ~200 linhas)
- [ ] Validar TypeScript final (`npx tsc --noEmit`)

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- `TypedSupabaseClient` redefinido como `type TypedSupabaseClient = SupabaseClient<Database>` na linha 4 de cada um dos 13 services
- O arquivo `src/lib/types/supabase.ts` nao existe
- 9 usos de `any` sem justificativa em 6 arquivos
- Nenhuma das 33 rotas do dashboard possui `loading.tsx` ou `error.tsx`
- 9 componentes acima de 200 linhas (maior: 1.356 linhas)
- `padroes-codigo.md` exige ingles para codigo, mas projeto inteiro usa portugues

**Depois (comportamento proposto):**
- `TypedSupabaseClient` exportado de `src/lib/types/supabase.ts` e importado em todos os services
- `any` substituido por tipos especificos ou `Record<string, unknown>`
- 13 rotas principais com `loading.tsx` + 1 `error.tsx` generico no layout do dashboard
- Componentes grandes extraidos em sub-componentes (meta: nenhum acima de ~300 linhas)
- `padroes-codigo.md` secao 7 (Nomenclatura) atualizada para refletir portugues no codigo

### 3.2 UI Proposta

N/A — refatoracao interna sem impacto visual.

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A — sem alteracoes no banco.

### 4.2 Arquivos a Modificar/Criar

---

#### FASE 6a — QUICK WINS

---

##### TypedSupabaseClient — centralizar

**Criar `src/lib/types/supabase.ts`:**

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database'

export type TypedSupabaseClient = SupabaseClient<Database>
```

**Modificar 13 services** — em cada arquivo, substituir:

```typescript
// REMOVER (linha 1-4 de cada service)
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesUpdate } from '@/lib/types/database'

type TypedSupabaseClient = SupabaseClient<Database>
```

```typescript
// SUBSTITUIR POR
import { TypedSupabaseClient } from '@/lib/types/supabase'
import { Tables, TablesUpdate } from '@/lib/types/database'
```

**Nota:** Cada service importa tipos diferentes de `database` (Tables, TablesInsert, TablesUpdate). Manter apenas os que cada arquivo usa. A linha `import { SupabaseClient }` e a linha `type TypedSupabaseClient` sao removidas de todos.

| Acao | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/lib/types/supabase.ts` | Exportar `TypedSupabaseClient` |
| MODIFICAR | `src/lib/services/tarefas.ts` | Remover type local, importar de `@/lib/types/supabase` |
| MODIFICAR | `src/lib/services/tarefas-anexos.ts` | Idem |
| MODIFICAR | `src/lib/services/tarefas-comentarios.ts` | Idem |
| MODIFICAR | `src/lib/services/tarefas-dependencias.ts` | Idem |
| MODIFICAR | `src/lib/services/etapas.ts` | Idem |
| MODIFICAR | `src/lib/services/subetapas.ts` | Idem |
| MODIFICAR | `src/lib/services/categorias.ts` | Idem |
| MODIFICAR | `src/lib/services/subcategorias.ts` | Idem |
| MODIFICAR | `src/lib/services/compras.ts` | Idem |
| MODIFICAR | `src/lib/services/fornecedores.ts` | Idem |
| MODIFICAR | `src/lib/services/recibos.ts` | Idem |
| MODIFICAR | `src/lib/services/gastos.ts` | Idem |
| MODIFICAR | `src/lib/services/orcamento-detalhado.ts` | Idem |

---

##### Eliminar `any` (9 ocorrencias em 6 arquivos)

| Acao | Arquivo | Linha(s) | Substituicao |
|------|---------|----------|--------------|
| MODIFICAR | `src/app/api/emails/sync/route.ts` | L77 | `structure: any` → criar interface `BodyStructure` com campos: `disposition?, type?, subtype?, size?, dispositionParameters?, parameters?, childNodes?` |
| MODIFICAR | `src/app/api/emails/sync/route.ts` | L103 | `child: any` → `child: BodyStructure` |
| MODIFICAR | `src/app/api/emails/process/route.ts` | L278 | `d: any` → criar interface `NFeDetalhe { prod?: { xProd?: string } }` |
| MODIFICAR | `src/components/features/emails/emails-table.tsx` | L56 | `dadosExtraidos: any` → `dadosExtraidos: Record<string, unknown>` |
| MODIFICAR | `src/components/features/cronograma/orcamento-detalhamento-dialog.tsx` | L85 | `item: any` → criar interface `DetalhamentoItem { categoria_id: string; valor_previsto: number }` |
| MODIFICAR | `src/lib/hooks/useEmailSort.ts` | L100 | `as any` → `as Record<string, unknown>` |
| MODIFICAR | `src/lib/hooks/useEmailSort.ts` | L101 | `as any` → `as Record<string, unknown>` |
| MODIFICAR | `src/app/(dashboard)/emails/page.tsx` | L96 | `as any` → `as Record<string, unknown>` |
| MODIFICAR | `src/app/(dashboard)/emails/page.tsx` | L124 | `as any` → `as Record<string, unknown>` |

---

##### loading.tsx / error.tsx

**`error.tsx` generico (1 arquivo no nivel dashboard):**

```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="text-muted-foreground">
        Ocorreu um erro ao carregar esta pagina.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
```

**`loading.tsx` generico (13 arquivos, mesmo conteudo):**

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[400px]" />
      <div className="grid gap-4 mt-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  )
}
```

| Acao | Arquivo |
|------|---------|
| CRIAR | `src/app/(dashboard)/error.tsx` |
| CRIAR | `src/app/(dashboard)/compras/loading.tsx` |
| CRIAR | `src/app/(dashboard)/comunicacao/loading.tsx` |
| CRIAR | `src/app/(dashboard)/configuracoes/loading.tsx` |
| CRIAR | `src/app/(dashboard)/cronograma/loading.tsx` |
| CRIAR | `src/app/(dashboard)/dashboard/loading.tsx` |
| CRIAR | `src/app/(dashboard)/documentos/loading.tsx` |
| CRIAR | `src/app/(dashboard)/emails/loading.tsx` |
| CRIAR | `src/app/(dashboard)/financeiro/loading.tsx` |
| CRIAR | `src/app/(dashboard)/fornecedores/loading.tsx` |
| CRIAR | `src/app/(dashboard)/notificacoes/loading.tsx` |
| CRIAR | `src/app/(dashboard)/perfil/loading.tsx` |
| CRIAR | `src/app/(dashboard)/reunioes/loading.tsx` |
| CRIAR | `src/app/(dashboard)/tarefas/loading.tsx` |

---

##### Atualizar padroes-codigo.md

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `.claude/padroes-codigo.md` | Secao 7: trocar "ingles" por "portugues" para codigo. Atualizar tabela de prefixos de services: `buscar*`, `criar*`, `atualizar*`, `deletar*`, `reordenar*`, `calcular*` |

---

#### FASE 6b — COMPONENTES GRANDES

Regra geral: sub-componentes recebem dados e handlers via props. O componente pai mantem state e handlers. Constantes/configs vao para arquivos `.ts` separados.

---

##### 1. cronograma-table.tsx (1.356 → ~400 linhas)

| Acao | Arquivo | Descricao | Linhas aprox |
|------|---------|-----------|--------------|
| CRIAR | `src/components/features/cronograma/cronograma-config.ts` | Constantes de status/prioridade, grid layout, helpers de formatacao | ~60 |
| CRIAR | `src/components/features/cronograma/sortable-tarefa-row.tsx` | Componente de linha de tarefa com drag-and-drop. Recebe: tarefa, users[], handlers de update/status | ~160 |
| CRIAR | `src/components/features/cronograma/sortable-subetapa-row.tsx` | Componente de linha de subetapa com lista de tarefas aninhada. Contem DndContext interno para reordenacao de tarefas. Recebe: subetapa, tarefas[], users[], handlers | ~280 |
| CRIAR | `src/components/features/cronograma/sortable-etapa-row.tsx` | Componente de linha de etapa com lista de subetapas. Gerencia expand/collapse, calculo de orcamento. Recebe: etapa, subetapas[], handlers | ~270 |
| MODIFICAR | `src/components/features/cronograma/cronograma-table.tsx` | Importar sub-componentes e config. Manter: state, data refresh, DndContext principal, handlers de drag/update, render da tabela | ~400 |

---

##### 2. compra-form.tsx (738 → ~250 linhas)

| Acao | Arquivo | Descricao | Linhas aprox |
|------|---------|-----------|--------------|
| CRIAR | `src/components/features/compras/compra-info-section.tsx` | Secao "Informacoes da Compra": campos fornecedor, categoria, subcategoria, descricao, valor. Recebe: form (useFormReturn), fornecedores[], categorias[], subcategorias[] | ~200 |
| CRIAR | `src/components/features/compras/compra-pagamento-section.tsx` | Secao "Pagamento": forma_pagamento, parcelas, data_primeira_parcela, preview de parcelas. Recebe: form, valorTotal | ~90 |
| CRIAR | `src/components/features/compras/compra-notafiscal-section.tsx` | Secao "Nota Fiscal": drag-and-drop upload com preview. Recebe: arquivo state, handleFileSelect, handleRemoveFile | ~60 |
| MODIFICAR | `src/components/features/compras/compra-form.tsx` | Manter: form setup (useForm + zodResolver), state, fetchSubcategorias, onSubmit handler. Importar secoes | ~250 |

---

##### 3. tarefa-detalhes.tsx (707 → ~300 linhas)

| Acao | Arquivo | Descricao | Linhas aprox |
|------|---------|-----------|--------------|
| CRIAR | `src/components/features/tarefas/tarefa-info-card.tsx` | Card de info: status, prioridade, responsavel, datas. Recebe: tarefa, users[], updateField handler | ~100 |
| CRIAR | `src/components/features/tarefas/tarefa-dependencias-card.tsx` | Card de dependencias: lista com status. Recebe: dependencias[], statusConfig | ~50 |
| CRIAR | `src/components/features/tarefas/tarefa-anexos-card.tsx` | Card de anexos: lista com upload/download/delete. Recebe: anexos[], handlers | ~60 |
| CRIAR | `src/components/features/tarefas/tarefa-comentarios-card.tsx` | Card de comentarios: lista com input. Recebe: comentarios[], submitComentario | ~55 |
| MODIFICAR | `src/components/features/tarefas/tarefa-detalhes.tsx` | Manter: state, handlers (updateField, upload, download, delete, comentario), render principal. Importar cards | ~300 |

---

##### 4. compra-edit-form.tsx (737 → ~250 linhas)

| Acao | Arquivo | Descricao | Linhas aprox |
|------|---------|-----------|--------------|
| MODIFICAR | `src/components/features/compras/compra-edit-form.tsx` | Reutilizar `compra-info-section`, `compra-pagamento-section` e `compra-notafiscal-section` extraidos do compra-form. Adaptar props se necessario | ~250 |

**Nota:** Se as secoes precisarem de variantes (create vs edit), usar props condicionais ou componentes compostos. Evitar duplicar codigo.

---

##### 5. galeria-fotos.tsx (699 → ~300 linhas)

| Acao | Arquivo | Descricao | Linhas aprox |
|------|---------|-----------|--------------|
| CRIAR | `src/components/features/documentos/galeria-filtros.tsx` | Painel de filtros: data, tags, etapa. Recebe: filtros state, setFiltros, etapas[] | ~70 |
| CRIAR | `src/components/features/documentos/foto-edit-form.tsx` | Formulario de edicao de foto: nome, tags, etapa. Recebe: documento, onSave, onCancel | ~80 |
| MODIFICAR | `src/components/features/documentos/galeria-fotos.tsx` | Manter: state, filter computation, navigation, delete handler. Importar sub-componentes | ~300 |

---

##### 6. cronograma-mobile.tsx (657 → ~250 linhas)

| Acao | Arquivo | Descricao | Linhas aprox |
|------|---------|-----------|--------------|
| CRIAR | `src/components/features/cronograma/cronograma-mobile-sheet.tsx` | Bottom sheet de edicao de status para subetapas/tarefas. Recebe: item selecionado, tipo, onUpdate, onClose | ~180 |
| CRIAR | `src/components/features/cronograma/cronograma-mobile-row.tsx` | Linha de tarefa/subetapa mobile com progress bar. Recebe: item, tipo, onSelect | ~120 |
| MODIFICAR | `src/components/features/cronograma/cronograma-mobile.tsx` | Manter: state, toggle functions, render de etapas. Importar sub-componentes. Reutilizar `cronograma-config.ts` da Fase 6b.1 | ~250 |

---

##### 7. parcelas-table.tsx (592 → ~200 linhas)

| Acao | Arquivo | Descricao | Linhas aprox |
|------|---------|-----------|--------------|
| CRIAR | `src/components/features/compras/parcela-pagamento-dialog.tsx` | Dialog de pagamento de parcela: data, valor, metodo. Recebe: parcela, open, onOpenChange, onSave | ~130 |
| CRIAR | `src/components/features/compras/parcela-comprovante-dialog.tsx` | Dialog de upload de comprovante: file input, preview. Recebe: parcela, open, onOpenChange, onSave | ~130 |
| MODIFICAR | `src/components/features/compras/parcelas-table.tsx` | Manter: state de dialogs, handlers, render da tabela. Importar dialogs | ~200 |

---

##### 8. tarefas-table.tsx (566 → ~250 linhas)

| Acao | Arquivo | Descricao | Linhas aprox |
|------|---------|-----------|--------------|
| CRIAR | `src/components/features/tarefas/tarefas-metricas.tsx` | 6 cards de metricas: total, pendentes, em andamento, concluidas, atrasadas, progresso. Recebe: tarefas[] | ~70 |
| CRIAR | `src/components/features/tarefas/tarefas-config.ts` | Constantes de status/prioridade (cores, labels, icones) | ~60 |
| MODIFICAR | `src/components/features/tarefas/tarefas-table.tsx` | Manter: state, filter/sort logic, render da tabela. Importar metricas e config | ~250 |

---

##### 9. timeline-etapas.tsx (457 → ~200 linhas)

| Acao | Arquivo | Descricao | Linhas aprox |
|------|---------|-----------|--------------|
| CRIAR | `src/components/features/cronograma/timeline-etapa-card.tsx` | Card individual de etapa com dropdown de status, progress, metadata. Recebe: etapa, expanded, onToggle, onStatusUpdate | ~200 |
| MODIFICAR | `src/components/features/cronograma/timeline-etapas.tsx` | Manter: state de expansao, handler de status update. Importar card. Reutilizar `cronograma-config.ts` | ~200 |

---

### 4.3 Fluxo de Dados

N/A — refatoracao sem mudanca de fluxo. Sub-componentes recebem dados e handlers via props do componente pai. Nenhuma logica de negocio e movida ou alterada.

### 4.4 Dependencias Externas

N/A — sem novas dependencias.

### 4.5 Decisoes de Design e Justificativas

| # | Decisao | Justificativa |
|---|---------|---------------|
| 1 | **Nomenclatura PT aceita como padrao** | Migrar 13 services + todos os consumidores tem alto risco e zero ganho funcional. Atualizar o padrao e mais pragmatico |
| 2 | **Dividir em Fase 6a e 6b** | 6a e mecanica e de baixo risco (find-and-replace). 6b exige cuidado com props e estado. Validacao TypeScript intermediaria entre fases |
| 3 | **loading.tsx por feature, nao por sub-rota** | 13 arquivos em vez de 33. Sub-rotas herdam o loading da feature pai. Evita proliferacao de arquivos identicos |
| 4 | **Um unico error.tsx no nivel dashboard** | Error boundary generico cobre todas as rotas. Especifico so se necessario no futuro |
| 5 | **compra-edit-form reutiliza secoes do compra-form** | Os dois forms tem ~95% de overlap visual. Evita duplicar 3 componentes de secao |
| 6 | **Constantes em *-config.ts dedicados** | Status/prioridade se repetem em cronograma-table, cronograma-mobile, timeline-etapas, tarefas-table. Centralizar evita divergencia |
| 7 | **Sub-componentes recebem handlers via props** | Manter state no pai simplifica a refatoracao (nao precisa mover logica) e facilita testes futuros |

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

#### Fase 6a
- [ ] `src/lib/types/supabase.ts` criado
- [ ] 13 services atualizados (TypedSupabaseClient)
- [ ] 9 `any` eliminados em 6 arquivos
- [ ] 13 `loading.tsx` criados
- [ ] 1 `error.tsx` criado
- [ ] `padroes-codigo.md` atualizado
- [ ] TypeScript sem erros (pos 6a)

#### Fase 6b
- [ ] cronograma-table.tsx refatorado (4 novos + 1 modificado)
- [ ] compra-form.tsx refatorado (3 novos + 1 modificado)
- [ ] tarefa-detalhes.tsx refatorado (4 novos + 1 modificado)
- [ ] compra-edit-form.tsx refatorado (reutiliza secoes)
- [ ] galeria-fotos.tsx refatorado (2 novos + 1 modificado)
- [ ] cronograma-mobile.tsx refatorado (2 novos + 1 modificado)
- [ ] parcelas-table.tsx refatorado (2 novos + 1 modificado)
- [ ] tarefas-table.tsx refatorado (2 novos + 1 modificado)
- [ ] timeline-etapas.tsx refatorado (1 novo + 1 modificado)
- [ ] TypeScript sem erros (final)

### 5.2 Notas de Implementacao

[Decisoes tomadas durante a execucao, problemas encontrados, solucoes aplicadas]

### 5.3 Conversa de Execucao

#### IA:
[mensagem]

---

## 6. Validacao Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
