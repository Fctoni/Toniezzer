# Especificacao: Alteracao 09 - Convencoes: import order + rename de arquivo

| Aspecto | Detalhe |
|---------|---------|
| Status | 🔵 Pronto para executar |
| Conversa | Auditoria de conformidade (conversa direta no chat) |
| Data criacao | 10/02/2026 |
| Complexidade | 🟢 Baixa |

**Status possiveis:**
- 🔵 Pronto para executar
- 🔴 Em execucao
- 🟠 Aguardando testes
- 🟢 Concluido
- ❌ Cancelado

---

## 1. Resumo

Corrigir 2 tipos de violacao de convencoes: (1) renomear `useEmailSort.ts` para `use-email-sort.ts` (unico arquivo que viola a convencao kebab-case), (2) corrigir a ordem de imports em 8 arquivos que nao seguem a convencao do projeto (React/Next → libs externas → @/lib → @/components → types).

---

## 2. O que sera feito

- [ ] Renomear `useEmailSort.ts` para `use-email-sort.ts`
- [ ] Atualizar todos os imports que referenciam `useEmailSort`
- [ ] Corrigir ordem de imports em `matriz-gastos/page.tsx`
- [ ] Corrigir ordem de imports em `dashboard/page.tsx`
- [ ] Corrigir ordem de imports em `galeria-fotos.tsx`
- [ ] Corrigir ordem de imports em `tarefa-detalhes.tsx`
- [ ] Corrigir ordem de imports em `compra-form.tsx`
- [ ] Corrigir ordem de imports em `compra-edit-form.tsx`
- [ ] Corrigir ordem de imports em `cronograma-table.tsx`
- [ ] Corrigir ordem de imports em `tarefas-table.tsx`
- [ ] Validar TypeScript (`npx tsc --noEmit`)

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- `useEmailSort.ts` usa camelCase, enquanto todos os outros hooks usam kebab-case (`use-current-user.tsx`, `use-media-query.tsx`)
- 8 arquivos tem imports fora de ordem: `@/components` antes de `@/lib`, Next.js imports no meio, `@/lib/utils` apos `@/components`, etc.

**Depois (comportamento proposto):**
- Arquivo renomeado para `use-email-sort.ts` — consistente com demais hooks
- Todos os 8 arquivos com imports na ordem correta conforme `padroes-codigo.md` secao 9

### 3.2 UI Proposta

N/A — sem impacto visual.

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A — sem alteracoes no banco.

### 4.2 Arquivos a Modificar/Criar

---

#### PARTE A — Rename do hook

| Acao | Arquivo | O que muda |
|------|---------|------------|
| RENOMEAR | `src/lib/hooks/useEmailSort.ts` → `src/lib/hooks/use-email-sort.ts` | Nome do arquivo |
| MODIFICAR | Todos os arquivos que importam `useEmailSort` | Atualizar path do import |

**Nota:** O Executor deve:
1. Buscar todas as ocorrencias de `useEmailSort` no codebase com grep
2. Renomear o arquivo
3. Atualizar cada import de `@/lib/hooks/useEmailSort` para `@/lib/hooks/use-email-sort`

---

#### PARTE B — Correcao da ordem de imports

**Convencao obrigatoria (de `padroes-codigo.md` secao 9):**

```typescript
// 1. React / Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 2. Bibliotecas externas
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// 3. @/lib/* (services, types, utils, hooks, supabase)
import { TypedSupabaseClient } from '@/lib/types/supabase'
import { fetchTasks } from '@/lib/services/tasks'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// 4. @/components/*
import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/features/schedule/task-card'

// 5. Tipos (type imports) — isolados no final
import type { Task } from '@/lib/types/database'
```

---

##### Arquivo 1: `src/app/(dashboard)/financeiro/matriz-gastos/page.tsx`

**Problema:** `@/components/ui/card` na linha 2, antes dos imports de `@/lib/services/` nas linhas 6-8.

**Ordem correta:**

```typescript
import { createClient } from "@/lib/supabase/server"
import { buscarCategoriasAtivas } from "@/lib/services/categorias"
import { buscarGastosMatriz } from "@/lib/services/gastos"
import { buscarDetalhamentoMatriz } from "@/lib/services/orcamento-detalhado"

import { BarChart3, DollarSign, Tags, Grid3x3 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MatrizTabelaWrapper } from "@/components/features/financeiro/matriz-tabela-wrapper"
import { MatrizGrafico } from "@/components/features/financeiro/matriz-grafico"
```

---

##### Arquivo 2: `src/app/(dashboard)/dashboard/page.tsx`

**Problema:** `Link` e `redirect` de Next.js aparecem nas linhas 18-20, apos `@/components`. `@/lib/utils` na linha 19 apos `@/components`.

**Ordem correta:**

```typescript
// 1. Next.js
import Link from "next/link"
import { redirect } from "next/navigation"

// 2. Libs externas
import { DollarSign, TrendingUp, Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

// 3. @/lib/*
import { createClient } from "@/lib/supabase/server"
import { buscarEtapas } from "@/lib/services/etapas"
import { buscarSubetapasDoResponsavel, buscarSubetapasPorIds } from "@/lib/services/subetapas"
import { buscarTarefasDoResponsavel, buscarTarefasPorSubetapas } from "@/lib/services/tarefas"
import { buscarCategoriasAtivas } from "@/lib/services/categorias"
import { buscarGastosAprovados } from "@/lib/services/gastos"
import { parseDateString } from "@/lib/utils"

// 4. @/components/*
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MinhasTarefasWidget } from "@/components/features/dashboard/minhas-tarefas-widget"
```

---

##### Arquivo 3: `src/components/features/documentos/galeria-fotos.tsx`

**Problema:** `@/components/ui/*` nas linhas 4-22, antes de `@/lib/supabase/client` na linha 42. `useRouter` na linha 44 apos `@/components`.

**Ordem correta:**

```typescript
"use client"

// 1. React / Next.js
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"

// 2. Libs externas
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Download, Trash2, Loader2, Calendar, LayoutGrid, GitBranch, Columns, Clock, ChevronLeft, ChevronRight, Tag, FileImage, Pencil, X, Save } from "lucide-react"
import { toast } from "sonner"

// 3. @/lib/*
import { createClient } from "@/lib/supabase/client"
import { useMobile } from "@/lib/hooks/use-media-query"

// 4. @/components/*
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// ... restante dos @/components/ui
// ... @/components/features
```

---

##### Arquivo 4: `src/components/features/tarefas/tarefa-detalhes.tsx`

**Problema:** `@/components/ui/*` na linha 8, antes de todos `@/lib`. `Link` de Next.js na linha 33.

**Ordem correta:**

```typescript
// 1. React / Next.js
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// 2. Libs externas
import { toast } from "sonner"

// 3. @/lib/*
import { createClient } from "@/lib/supabase/client"
import { atualizarTarefa, deletarTarefa } from "@/lib/services/tarefas"
import { uploadAnexo, downloadAnexoService, deletarAnexo } from "@/lib/services/tarefas-anexos"
import { criarComentario } from "@/lib/services/tarefas-comentarios"

// 4. @/components/*
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// ... restante
```

---

##### Arquivo 5: `src/components/features/compras/compra-form.tsx`

**Problema:** `@/lib/utils` (formatDateToString) na linha 25, apos `@/components/ui`.

**Ordem correta:** Mover `import { formatDateToString } from "@/lib/utils"` para o bloco 3 (@/lib), antes dos `@/components`.

---

##### Arquivo 6: `src/components/features/compras/compra-edit-form.tsx`

**Problema:** Mesmo padrao — `@/lib/utils` apos `@/components/ui`. Lucide-react apos `@/components`.

**Ordem correta:** Reordenar para seguir a convencao.

---

##### Arquivo 7: `src/components/features/cronograma/cronograma-table.tsx`

**Problema:** Provavel padrao similar aos demais — `@/components` antes de `@/lib`.

**Nota:** O Executor deve verificar e corrigir conforme convencao.

---

##### Arquivo 8: `src/components/features/tarefas/tarefas-table.tsx`

**Problema:** `@/components/ui/*` na linha 5, antes de `@/lib/utils` (cn) na linha 18. Type import `type TarefaComContexto` misturado com imports regulares.

**Ordem correta:**

```typescript
"use client"

// 1. React / Next.js
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"

// 2. Libs externas
import { Flag, ArrowUpDown, Eye, AlertTriangle } from "lucide-react"

// 3. @/lib/*
import { cn } from "@/lib/utils"

// 4. @/components/*
import { Badge } from "@/components/ui/badge"
// ... restante @/components/ui
import { TarefasFilters, TarefasFiltersState } from "@/components/features/tarefas/tarefas-filters"
import { EditarTarefaDialog } from "@/components/features/tarefas/editar-tarefa-dialog"
import { TarefasMetricas } from "@/components/features/tarefas/tarefas-metricas"
import {
  statusConfig,
  prioridadeConfig,
  prioridadeOrder,
  getInitials,
} from "@/components/features/tarefas/tarefas-config"

// 5. Types
import type { TarefaComContexto } from "@/components/features/tarefas/tarefas-config"
```

---

### 4.3 Fluxo de Dados

N/A — sem mudanca de fluxo. Apenas reordenacao de imports (nao afeta runtime).

### 4.4 Dependencias Externas

N/A.

### 4.5 Decisoes de Design e Justificativas

| # | Decisao | Justificativa |
|---|---------|---------------|
| 1 | **Rename do arquivo, nao da funcao** | O hook internamente se chama `useEmailSort` (camelCase correto para funcoes React). Apenas o ARQUIVO deve ser kebab-case |
| 2 | **Nao adicionar ESLint rule automatico** | Escopo desta spec e correcao manual. Regra de lint pode ser adicionada separadamente se desejado |
| 3 | **Correcao manual arquivo por arquivo** | Imports sao sensiveis — reordenar automaticamente pode quebrar side-effects ou imports com alias |
| 4 | **Separar `type` imports no bloco 5** | Conforme convencao. `import type` no final facilita identificar dependencias de runtime vs compile-time |

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [ ] useEmailSort.ts renomeado para use-email-sort.ts
- [ ] Imports do hook atualizados
- [ ] matriz-gastos/page.tsx imports reordenados
- [ ] dashboard/page.tsx imports reordenados
- [ ] galeria-fotos.tsx imports reordenados
- [ ] tarefa-detalhes.tsx imports reordenados
- [ ] compra-form.tsx imports reordenados
- [ ] compra-edit-form.tsx imports reordenados
- [ ] cronograma-table.tsx imports reordenados
- [ ] tarefas-table.tsx imports reordenados
- [ ] TypeScript sem erros

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
