# Alteração 06 - Refatoração de padrões de código (pós-auditoria)

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificação criada |
| Origem | Auditoria de conformidade com `.claude/padroes-codigo.md` |
| Complexidade | 🟡 Média |
| Especificação | [spec-alteracao06.md](../spec-alteracao06.md) |

**Status possíveis:**
- 🟡 Em planejamento
- 🟢 Especificação criada → ver [spec-alteracao06.md](../spec-alteracao06.md)

---

## 1. Ideia Inicial

Auditoria do código revelou 5 inconsistências com os padrões definidos em `padroes-codigo.md` que **não são cobertas** pelas alterações 03-05 (centralização de CRUD em services):

1. **Componentes acima de 200 linhas** — 9 componentes excedem o limite, o maior com 1.356 linhas
2. **TypedSupabaseClient redefinido em cada service** — 13 services redefinem o tipo localmente em vez de importar de um lugar central
3. **Faltam loading.tsx e error.tsx** — nenhuma rota do dashboard tem esses arquivos-convenção
4. **Uso de `any` sem justificativa** — 11 ocorrências espalhadas pelo código
5. **Nomenclatura em português no código** — services, variáveis e funções usam nomes em PT (deveria ser EN por padrão)

---

## 2. Conversa de Planejamento

#### usuário: Iniciar planejamento dos 5 itens da auditoria

#### IA: Análise inicial e perguntas de escopo

Antes de montar a proposta, preciso alinhar algumas decisões:

**Sobre os componentes grandes:**
Os 9 componentes acima de 200 linhas são:

| Componente | Linhas | Observação |
|------------|--------|------------|
| `cronograma-table.tsx` | 1.356 | Maior do projeto |
| `compra-form.tsx` | 738 | Formulário complexo |
| `compra-edit-form.tsx` | 737 | Similar ao form de criação |
| `tarefa-detalhes.tsx` | 707 | Painel de detalhes |
| `galeria-fotos.tsx` | 699 | Grid + modais de edição |
| `cronograma-mobile.tsx` | 657 | Versão mobile do cronograma |
| `parcelas-table.tsx` | 592 | Tabela com edição inline |
| `tarefas-table.tsx` | 566 | Tabela com filtros |
| `timeline-etapas.tsx` | 457 | Timeline visual |

**Perguntas:**

1. **Prioridade** — Quer atacar todos os 5 itens numa única alteração, ou prefere focar nos mais críticos primeiro (ex: componentes grandes + TypedSupabaseClient) e deixar nomenclatura PT→EN para depois?

2. **Componentes grandes** — O `cronograma-table.tsx` (1.356 linhas) é o caso mais extremo. Quer que eu proponha uma extração detalhada desse componente como modelo, e os demais sigam o mesmo padrão? Ou prefere que eu detalhe todos?

3. **Nomenclatura PT→EN** — Essa é a mudança mais arriscada (afeta 13 services + todos os consumidores). Prefere:
   - (a) Fazer tudo de uma vez (alto risco, mas resolve de vez)
   - (b) Migrar gradualmente conforme mexer nos arquivos por outros motivos
   - (c) Não migrar agora — aceitar PT como padrão do projeto e atualizar o `padroes-codigo.md`

4. **loading.tsx / error.tsx** — São arquivos simples e independentes. Posso incluir como item rápido nesta mesma alteração ou criar uma alteração separada?

---

#### usuário: Pede sugestão para escopo e componentes; nomenclatura PT fica como está

1- qual sua sugestão?
2- qual sua sugestão?
3- não migrar agora

---

#### IA: Recomendações de escopo, abordagem e decisão sobre nomenclatura

Analisei a estrutura interna dos 3 maiores componentes. Minhas sugestões:

**1. Escopo — dividir em 2 fases na mesma alteração:**

- **Fase 6a — Quick wins** (baixo risco, alto valor): centralizar `TypedSupabaseClient`, eliminar `any`, criar `loading.tsx`/`error.tsx`
- **Fase 6b — Componentes grandes** (risco moderado, alto valor): extrair sub-componentes dos 9 arquivos que excedem 200 linhas

Motivo: a Fase 6a é mecânica e pode ser executada rapidamente. A Fase 6b exige mais cuidado e pode ser feita incrementalmente.

**2. Componentes grandes — detalho os 3 piores, os demais seguem o padrão:**

Analisei a estrutura interna dos 3 maiores. Resumo da proposta de extração:

| Componente | Linhas | Proposta | Resultado |
|------------|--------|----------|-----------|
| `cronograma-table.tsx` | 1.356 | Extrair 3 componentes SortableRow + 1 config + 1 handlers | ~400 linhas (-70%) |
| `compra-form.tsx` | 738 | Extrair 3 seções de formulário + handler de submit | ~250 linhas (-66%) |
| `tarefa-detalhes.tsx` | 707 | Extrair 4 cards (info, dependências, anexos, comentários) | ~300 linhas (-57%) |

Os 6 restantes (`compra-edit-form`, `galeria-fotos`, `cronograma-mobile`, `parcelas-table`, `tarefas-table`, `timeline-etapas`) seguiriam o mesmo padrão: identificar blocos de UI repetidos ou com lógica própria e extrair.

**3. Nomenclatura PT — aceitar como padrão do projeto:**

Vou atualizar o `padroes-codigo.md` para refletir que o projeto usa **português** para nomes de funções, variáveis e services. Isso evita uma refatoração massiva sem ganho funcional.

**4. loading/error — incluir na Fase 6a (são ~20 arquivos simples):**

Criar `loading.tsx` e `error.tsx` para as rotas principais do dashboard. São arquivos pequenos e independentes.

---

**Posso preencher a seção 3 (Proposta de Implementação) completa com base nessas decisões?**

---

#### usuário: Aprova preenchimento da proposta
aprovado

---

#### IA: Proposta completa preenchida na seção 3

Levantei todos os detalhes necessários e preenchi a seção 3 completa abaixo. Resumo:

- **Fase 6a:** 1 arquivo novo + 13 services modificados (TypedSupabaseClient) + 6 arquivos corrigidos (any) + 14 pares loading/error + 1 padrões atualizado = **~50 arquivos**
- **Fase 6b:** 9 componentes grandes → ~30 sub-componentes extraídos = **~40 arquivos**

**A proposta de implementação está de acordo? Posso criar a especificação técnica?**

---

#### usuário: Aprova proposta
pode criar!

---

#### IA: Especificação criada

Especificacao criada em [spec-alteracao06.md](../spec-alteracao06.md). O Executor pode iniciar a implementacao.

---

## 3. Proposta de Implementação

**Status:** 🟢 Aprovada — spec criada

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- `TypedSupabaseClient` redefinido como `type TypedSupabaseClient = SupabaseClient<Database>` na linha 4 de cada um dos 13 services
- O arquivo `src/lib/types/supabase.ts` não existe
- 9 usos de `any` sem justificativa em 6 arquivos
- Nenhuma das 33 rotas do dashboard possui `loading.tsx` ou `error.tsx`
- 9 componentes acima de 200 linhas (maior: 1.356 linhas)
- `padroes-codigo.md` exige inglês para código, mas projeto inteiro usa português

**Depois (comportamento proposto):**
- `TypedSupabaseClient` exportado de `src/lib/types/supabase.ts` e importado em todos os services
- `any` substituído por tipos específicos ou `Record<string, unknown>`
- 13 rotas principais com `loading.tsx` + 1 `error.tsx` genérico no layout do dashboard
- Componentes grandes extraídos em sub-componentes (meta: nenhum acima de ~300 linhas)
- `padroes-codigo.md` seção 7 (Nomenclatura) atualizada para refletir português no código

### 3.2 UI Proposta

N/A — refatoração interna sem impacto visual.

### 3.3 Arquivos Afetados

#### FASE 6a — Quick Wins

**TypedSupabaseClient — centralizar:**

| Ação | Arquivo | O que muda |
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

**Eliminar `any` (9 ocorrências em 6 arquivos):**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/api/emails/sync/route.ts` (L77, L103) | Criar interface `BodyStructure` para estrutura IMAP, substituir 2x `any` |
| MODIFICAR | `src/app/api/emails/process/route.ts` (L278) | Criar interface `NFeDetalhe` para XML parsed, substituir `any` |
| MODIFICAR | `src/components/features/emails/emails-table.tsx` (L56) | Tipar `dadosExtraidos` como `Record<string, unknown>` |
| MODIFICAR | `src/components/features/cronograma/orcamento-detalhamento-dialog.tsx` (L85) | Criar interface `DetalhamentoItem`, substituir `any` |
| MODIFICAR | `src/lib/hooks/useEmailSort.ts` (L100, L101) | Substituir `as any` por `as Record<string, unknown>` |
| MODIFICAR | `src/app/(dashboard)/emails/page.tsx` (L96, L124) | Substituir `as any` por `as Record<string, unknown>` |

**loading.tsx / error.tsx:**

Abordagem prática: criar `loading.tsx` para as 13 rotas principais (nível de feature) + 1 `error.tsx` genérico no nível do layout dashboard.

| Ação | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/app/(dashboard)/error.tsx` | Error boundary genérico (`'use client'`, recebe `{error, reset}`) |
| CRIAR | `src/app/(dashboard)/compras/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/comunicacao/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/configuracoes/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/cronograma/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/dashboard/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/documentos/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/emails/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/financeiro/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/fornecedores/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/notificacoes/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/perfil/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/reunioes/loading.tsx` | Skeleton genérico |
| CRIAR | `src/app/(dashboard)/tarefas/loading.tsx` | Skeleton genérico |

**Atualizar padrões:**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `.claude/padroes-codigo.md` | Seção 7: aceitar PT para código. Tabela de prefixos: `buscar*`, `criar*`, `atualizar*`, `deletar*` |

#### FASE 6b — Componentes Grandes

**1. cronograma-table.tsx (1.356 → ~400 linhas)**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/components/features/cronograma/sortable-tarefa-row.tsx` | Extrair componente de linha de tarefa drag-and-drop (~160 linhas) |
| CRIAR | `src/components/features/cronograma/sortable-subetapa-row.tsx` | Extrair componente de linha de subetapa com tarefas aninhadas (~280 linhas) |
| CRIAR | `src/components/features/cronograma/sortable-etapa-row.tsx` | Extrair componente de linha de etapa com subetapas (~270 linhas) |
| CRIAR | `src/components/features/cronograma/cronograma-config.ts` | Extrair constantes de status/prioridade e helpers de formatação (~60 linhas) |
| MODIFICAR | `src/components/features/cronograma/cronograma-table.tsx` | Importar sub-componentes, manter apenas state + handlers + render principal |

**2. compra-form.tsx (738 → ~250 linhas)**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/components/features/compras/compra-info-section.tsx` | Seção "Informações da Compra" do form (~200 linhas) |
| CRIAR | `src/components/features/compras/compra-pagamento-section.tsx` | Seção "Pagamento" com preview de parcelas (~90 linhas) |
| CRIAR | `src/components/features/compras/compra-notafiscal-section.tsx` | Seção "Nota Fiscal" com upload (~60 linhas) |
| MODIFICAR | `src/components/features/compras/compra-form.tsx` | Importar seções, manter form setup + onSubmit |

**3. tarefa-detalhes.tsx (707 → ~300 linhas)**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/components/features/tarefas/tarefa-info-card.tsx` | Card de info (status, prioridade, responsável, datas) (~100 linhas) |
| CRIAR | `src/components/features/tarefas/tarefa-dependencias-card.tsx` | Card de dependências (~50 linhas) |
| CRIAR | `src/components/features/tarefas/tarefa-anexos-card.tsx` | Card de anexos com upload/download (~60 linhas) |
| CRIAR | `src/components/features/tarefas/tarefa-comentarios-card.tsx` | Card de comentários (~55 linhas) |
| MODIFICAR | `src/components/features/tarefas/tarefa-detalhes.tsx` | Importar cards, manter state + handlers |

**4. compra-edit-form.tsx (737 → ~250 linhas)**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/components/features/compras/compra-edit-form.tsx` | Reutilizar seções extraídas do compra-form (info, pagamento, NF) |

**5. galeria-fotos.tsx (699 → ~300 linhas)**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/components/features/documentos/galeria-filtros.tsx` | Painel de filtros (~70 linhas) |
| CRIAR | `src/components/features/documentos/foto-edit-form.tsx` | Formulário de edição de foto (~80 linhas) |
| MODIFICAR | `src/components/features/documentos/galeria-fotos.tsx` | Importar sub-componentes |

**6. cronograma-mobile.tsx (657 → ~250 linhas)**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/components/features/cronograma/cronograma-mobile-sheet.tsx` | Bottom sheet de edição de status (~180 linhas) |
| CRIAR | `src/components/features/cronograma/cronograma-mobile-row.tsx` | Linha de tarefa/subetapa mobile (~120 linhas) |
| MODIFICAR | `src/components/features/cronograma/cronograma-mobile.tsx` | Importar sub-componentes |

**7. parcelas-table.tsx (592 → ~200 linhas)**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/components/features/compras/parcela-pagamento-dialog.tsx` | Dialog de pagamento (~130 linhas) |
| CRIAR | `src/components/features/compras/parcela-comprovante-dialog.tsx` | Dialog de comprovante (~130 linhas) |
| MODIFICAR | `src/components/features/compras/parcelas-table.tsx` | Importar dialogs |

**8. tarefas-table.tsx (566 → ~250 linhas)**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/components/features/tarefas/tarefas-metricas.tsx` | Cards de métricas (~70 linhas) |
| CRIAR | `src/components/features/tarefas/tarefas-config.ts` | Constantes de status/prioridade (~60 linhas) |
| MODIFICAR | `src/components/features/tarefas/tarefas-table.tsx` | Importar sub-componentes |

**9. timeline-etapas.tsx (457 → ~200 linhas)**

| Ação | Arquivo | O que muda |
|------|---------|------------|
| CRIAR | `src/components/features/cronograma/timeline-etapa-card.tsx` | Card individual de etapa (~200 linhas) |
| MODIFICAR | `src/components/features/cronograma/timeline-etapas.tsx` | Importar card, manter lógica de expansão |

### 3.4 Fluxo de Dados

N/A — refatoração sem mudança de fluxo. Sub-componentes recebem dados e handlers via props do componente pai.

### 3.5 Banco de Dados

N/A — sem alterações no banco.

---

## 4. Decisões Importantes

- **Decisão 1:** Nomenclatura PT aceita como padrão — atualizar `padroes-codigo.md` em vez de migrar código
- **Decisão 2:** Dividir em Fase 6a (quick wins) e Fase 6b (componentes grandes)
- **Decisão 3:** Detalhar extração dos 3 maiores componentes; demais seguem o padrão
- **Decisão 4:** `loading.tsx` por feature (13 rotas), não por sub-rota (33 rotas) — evita proliferação de arquivos quase idênticos
- **Decisão 5:** Um único `error.tsx` no nível `(dashboard)/` — error boundary genérico cobre todas as rotas
- **Decisão 6:** `compra-edit-form.tsx` reutiliza seções extraídas do `compra-form.tsx` em vez de criar duplicatas
- **Decisão 7:** Constantes de status/prioridade que se repetem em cronograma e tarefas → arquivos `*-config.ts` dedicados

---

## 5. Checkpoints

*(Adicionados automaticamente em sessões longas)*
