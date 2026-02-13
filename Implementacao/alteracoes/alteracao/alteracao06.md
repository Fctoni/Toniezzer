<<<<<<< HEAD
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
=======
# Alteracao 06 - Melhorias na pagina de emails: corpo do email e parcelas editaveis

| Aspecto | Detalhe |
|---------|---------|
| Status | Especificacao criada |
| Origem | Solicitacao do usuario |
| Complexidade | Media |
| Especificacao | [spec-alteracao06.md](../spec/spec-alteracao06.md) |

**Status possiveis:**
- Em planejamento
- Especificacao criada -> ver [spec-alteracao06.md](../spec/spec-alteracao06.md)
>>>>>>> main

---

## 1. Ideia Inicial

<<<<<<< HEAD
Auditoria do código revelou 5 inconsistências com os padrões definidos em `padroes-codigo.md` que **não são cobertas** pelas alterações 03-05 (centralização de CRUD em services):

1. **Componentes acima de 200 linhas** — 9 componentes excedem o limite, o maior com 1.356 linhas
2. **TypedSupabaseClient redefinido em cada service** — 13 services redefinem o tipo localmente em vez de importar de um lugar central
3. **Faltam loading.tsx e error.tsx** — nenhuma rota do dashboard tem esses arquivos-convenção
4. **Uso de `any` sem justificativa** — 11 ocorrências espalhadas pelo código
5. **Nomenclatura em português no código** — services, variáveis e funções usam nomes em PT (deveria ser EN por padrão)
=======
Duas alteracoes na pagina de emails (/emails):

**Alteracao 1 - Corpo do email em "Email Original":**
- Hoje a secao "Email Original" mostra: De, Assunto, Recebido, Anexos e Resposta da IA
- Adicionar campo "Mensagem" com o corpo/conteudo do email
- Posicao: antes de "Anexos"
- O corpo pode ser HTML ou texto puro

**Alteracao 2 - Visao de parcelas editaveis em "Dados Extraidos":**
- Quando o tipo selecionado e "parcelas" nos dados extraidos, mostrar uma visao das parcelas que serao criadas
- Todos os campos devem ser editaveis, EXCETO numero da parcela (read-only)
- Validacao: soma do valor das parcelas deve ser igual ao "valor total"
- Edicao ANTES de salvar (ajustar antes de criar as parcelas no sistema)
- Salvar automaticamente ao alterar cada campo (auto-save nos campos)
>>>>>>> main

---

## 2. Conversa de Planejamento

<<<<<<< HEAD
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
=======
#### usuario: Descricao das duas alteracoes acima

#### IA: Analise do codigo existente e perguntas de esclarecimento

Analisei os seguintes arquivos do projeto:

- `email-preview.tsx` - Componente "Email Original" (coluna esquerda)
- `form-aprovacao.tsx` - Componente "Dados Extraidos" (coluna direita)
- `emails/[id]/page.tsx` - Pagina de detalhes do email
- `api/emails/process/route.ts` - API de processamento de emails via Gemini
- `database.ts` - Tipos do banco (tabelas `emails_monitorados`, `gastos`, `compras`)

**Sobre a Alteracao 1 (corpo do email):**

Identifiquei que o campo `corpo` ja existe na tabela `emails_monitorados` (tipo `string | null`) e ja esta sendo exibido no `email-preview.tsx` (linhas 217-228), porem esta posicionado APOS os anexos. O codigo atual:

```
{email.corpo && (
  <div className="border rounded-lg">
    <div className="p-2 bg-muted/50 border-b text-xs text-muted-foreground">
      Conteudo do Email
    </div>
    <ScrollArea className="h-[150px] p-3">
      <div className="text-sm whitespace-pre-wrap">
        {email.corpo}
      </div>
    </ScrollArea>
  </div>
)}
```

Porem, o corpo e renderizado como texto puro (`whitespace-pre-wrap`). Preciso verificar como o campo `corpo` e preenchido na sincronizacao para saber se pode conter HTML.

**Perguntas sobre a Alteracao 1:**

1. O corpo ja esta sendo exibido, mas depois dos anexos e com titulo "Conteudo do Email". A alteracao seria apenas **reposicionar** para antes dos anexos e renomear para "Mensagem"? Ou ha algo mais?
2. Se o corpo vier em HTML, deseja renderizar o HTML (com sanitizacao para seguranca) ou preferir extrair apenas o texto?

---

**Sobre a Alteracao 2 (parcelas editaveis):**

Analisei o fluxo atual de criacao de parcelas no `handleAprovar` da page `[id]/page.tsx`:

- O usuario preenche o campo "Parcelas" (numero, ex: 3)
- Ao aprovar, o sistema divide o `valor_total` igualmente entre as parcelas
- As datas sao incrementais mensais a partir da data informada
- Cada parcela herda: descricao, categoria_id, fornecedor_id, forma_pagamento
- A ultima parcela absorve a diferenca de arredondamento

Porem, **nao existe** hoje um conceito de "tipo parcelas" nos dados extraidos. O campo `parcelas` no formulario e apenas um `<Input type="number">` com o numero de parcelas.

**Perguntas sobre a Alteracao 2:**

3. Quando voce diz "quando o tipo selecionado e 'parcelas'", o que exatamente dispara essa visao? Seria quando o campo "Parcelas" no formulario tem valor maior que 1? Ou existe uma selecao de tipo que precisa ser criada?

r: mesmo sendo somente 1 parcela, teria que mostra essa parcela, para poder editar a data de vencimento

por tipo, eu quis dizer 'pix, cartão de crédito, etc', mas isso é indiferente para nossa alteração. o que importa é realmente o número de parcelas

4. Quais campos de cada parcela devem ser editaveis? Pelo que vi, cada parcela (registro em `gastos`) tem: descricao, valor, data, categoria_id, fornecedor_id, forma_pagamento. Quais desses o usuario deve poder editar individualmente por parcela?

r: data e valor. Lembrando que temos que validar que a soma de todas parcelas seja igual ao valor do documento

5. O "auto-save" ao alterar campos -- salvar onde? As parcelas ainda nao existem no banco neste momento (sao criadas apenas ao aprovar). O auto-save seria atualizar o estado local (in-memory) para que ao clicar "Aprovar" use os valores editados? Ou espera-se salvar em algum lugar intermediario?

r: isso, salvar no estado local (in memory), para depois registrar tudo no banco

6. A validacao "soma das parcelas = valor total" -- se o usuario alterar o valor de uma parcela, o que acontece? Aparece um alerta impedindo de aprovar? Ou o sistema redistribui automaticamente os valores?

r: o botão de salvar deve mudar para 'blur', e ter um pequeno aviso em algum lugar que a soma das parcelas está diferente do valor total

---

#### usuario: Investigacao revelou causa raiz do corpo nao aparecer

Investigamos o problema e descobrimos a causa raiz: na rota de sincronizacao IMAP (`api/emails/sync/route.ts`, linha 128), o campo `corpo` esta **hardcoded como `null`**:

```typescript
corpo: null,  // <-- nunca extrai o body do email IMAP
```

O componente `email-preview.tsx` ja tem o codigo de renderizacao (`{email.corpo && (...)}`), mas como `corpo` e sempre `null` no banco, nada aparece. O foco agora e apenas na **Alteracao 1** (corpo do email). As perguntas da Alteracao 2 (parcelas) ficam pendentes.

---

#### IA: Causa raiz identificada -- corpo nunca e extraido do IMAP; proposta de implementacao

A descoberta responde as duas perguntas que eu havia feito sobre a Alteracao 1:

**Pergunta 1** (reposicionar ou algo mais?) -- Agora sabemos que **nao e apenas reposicionar**. O problema real e que o corpo **nunca e extraido** do email IMAP. A rota de sync busca apenas `envelope` e `bodyStructure` (metadados), mas nunca faz `download` do conteudo textual da mensagem. Portanto a alteracao precisa:
- **Backend**: Extrair o body (text/plain ou text/html) durante a sincronizacao IMAP
- **Frontend**: Reposicionar e ajustar a renderizacao (ja existe, so precisa mover e tratar HTML)

**Pergunta 2** (HTML ou texto?) -- Como o ImapFlow retorna o conteudo real do email, podemos receber tanto `text/plain` quanto `text/html`. A maioria dos emails modernos envia HTML. A proposta e:
- Priorizar `text/plain` quando disponivel (mais leve, sem riscos de seguranca)
- Usar `text/html` como fallback quando so houver HTML
- Quando for HTML, sanitizar antes de renderizar (remover scripts, iframes, etc.)

Analisei a rota `api/emails/sync/route.ts` em detalhe. Atualmente o `client.fetch()` usa:

```typescript
client.fetch(
  { seen: false, since },
  { envelope: true, bodyStructure: true, uid: true }
)
```

Para extrair o corpo, precisamos de uma chamada separada apos o fetch, usando `client.download()` do ImapFlow, que permite baixar partes especificas da mensagem (text/plain ou text/html) identificadas pela `bodyStructure`.

O fluxo seria:
1. O fetch atual ja traz `bodyStructure` -- nela identificamos as partes text/plain e text/html
2. Apos o fetch, usamos `client.download(message.uid, partId)` para baixar o conteudo textual
3. Salvamos no campo `corpo` da tabela `emails_monitorados`

Sobre a renderizacao no frontend, preciso de uma resposta para prosseguir com a proposta completa:

**Quando o corpo for HTML, prefere:**
- **(A)** Renderizar o HTML sanitizado (visual fiel ao email original, usando `dangerouslySetInnerHTML` + biblioteca de sanitizacao como DOMPurify)
- **(B)** Extrair apenas o texto do HTML (mais simples, sem risco, mas perde formatacao)
- **(C)** Mostrar como texto por padrao com opcao de "Ver HTML" num botao separado

---

#### usuario: Respostas a todas as perguntas pendentes

respondi cada pergunta abaixo dela, com um 'r:'

para a pergunta sobre HTML, pode mostrar a opção B, texto sem formatação. Os line breaks e parágrafos, conseguimos manter, certo?

**Respostas da Alteracao 2:**
- P3: Mesmo com 1 parcela, mostrar a visao para editar data de vencimento. "Tipo" referia-se a forma de pagamento, mas e indiferente.
- P4: Campos editaveis por parcela: **data e valor** apenas. Validar soma = valor total.
- P5: Auto-save em estado local (in-memory), salvar tudo no banco ao aprovar.
- P6: Botao de salvar muda para blur. Aviso quando soma das parcelas diverge do valor total.

---

#### IA: Todas as respostas recebidas -- confirmacao e preparacao da proposta

**Alteracao 1 -- Corpo do email:**
Confirmado. Opcao **(B)** -- texto sem formatacao HTML. Sim, line breaks e paragrafos serao mantidos. Na pratica, quando o email vier em HTML, usaremos uma funcao para extrair apenas o texto, convertendo `<br>`, `<p>`, `<div>` em quebras de linha (`\n`), e removendo todas as tags HTML. O resultado e exibido com `whitespace-pre-wrap` (que ja e o estilo atual no componente), preservando paragrafos e line breaks naturais.

**Alteracao 2 -- Parcelas editaveis:**
Entendido o fluxo completo:

1. **Sempre mostrar a visao de parcelas** (mesmo com 1 parcela), para permitir editar data de vencimento
2. **Campos editaveis:** apenas data e valor por parcela
3. **Estado local:** as parcelas sao geradas em memoria quando o usuario altera o numero de parcelas (ou quando o formulario carrega com parcelas >= 1). Edicoes ficam em estado React local
4. **Validacao:** aviso visual quando soma dos valores das parcelas diverge do valor total. O botao "Aprovar" continua habilitado (nao bloqueia), mas o aviso fica visivel
5. **Auto-save on blur:** cada campo (data, valor) atualiza o estado local quando o usuario sai do campo (onBlur), sem necessidade de botao "salvar" por campo
6. **Ao aprovar:** o `handleAprovar` usa os dados editados das parcelas (em vez de recalcular dividindo igualmente)

Tenho todas as informacoes necessarias. Vou preencher a proposta de implementacao completa (secao 3) a seguir.

---

## 3. Proposta de Implementacao

**Status:** Aprovada -- spec criada em [spec-alteracao06.md](../spec/spec-alteracao06.md)

### 3.1 Antes vs Depois

#### Alteracao 1 -- Corpo do email

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Sincronizacao IMAP | `corpo: null` hardcoded na rota de sync. O body do email nunca e extraido | A rota de sync extrai o body do email via `client.download()`. Prioriza text/plain; se so houver text/html, converte para texto puro (strip tags, preservando line breaks) |
| Armazenamento | Campo `corpo` na tabela `emails_monitorados` sempre `null` | Campo `corpo` preenchido com o texto extraido do email |
| Exibicao no frontend | Bloco de renderizacao existe em `email-preview.tsx` mas nunca aparece (corpo sempre null). Posicionado apos anexos, com titulo "Conteudo do Email" | Bloco reposicionado para **antes dos anexos** (entre Recebido e Anexos). Titulo renomeado para "Mensagem". Renderiza como texto puro com `whitespace-pre-wrap` (preserva line breaks e paragrafos) |

#### Alteracao 2 -- Parcelas editaveis

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Visao de parcelas | Nao existe. O usuario preenche apenas o numero de parcelas num Input. Ao aprovar, o sistema calcula automaticamente valores e datas (divisao igual, datas mensais incrementais) | Abaixo do campo "Parcelas", aparece uma tabela editavel mostrando cada parcela com: numero (read-only), data (editavel), valor (editavel). Aparece sempre (mesmo com 1 parcela) |
| Edicao de parcelas | Impossivel. Valores e datas sao calculados automaticamente no `handleAprovar` | Usuario pode editar data e valor de cada parcela individualmente, on blur (sem botao salvar por campo). Estado mantido em memoria |
| Validacao | Nenhuma validacao visual sobre parcelas | Aviso visual quando soma dos valores das parcelas difere do valor total. Botao "Aprovar" continua habilitado |
| Fluxo de aprovacao | `handleAprovar` gera as parcelas internamente (loop com calculo de divisao) | `handleAprovar` usa os dados das parcelas editadas pelo usuario (vindas do estado local) em vez de recalcular |

### 3.2 UI Proposta

#### Alteracao 1 -- Corpo do email no EmailPreview (coluna esquerda)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Mail] Email Original                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  De:        Nome Remetente <email@exemplo.com>                      │
│  Assunto:   Nota fiscal #12345                                      │
│  Recebido:  segunda-feira, 10 de fevereiro de 2026, 14:30           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Mensagem                                                       ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ Boa tarde,                                                     ││
│  │                                                                ││
│  │ Segue em anexo a nota fiscal referente ao                      ││
│  │ pedido #12345.                                                 ││
│  │                                                                ││
│  │ Atenciosamente,                                                ││
│  │ Fornecedor XYZ                                                 ││
│  └──────────────────────────────────────────── (ScrollArea 150px) ─┘│
│                                                                     │
│  [Paperclip] Anexos (1)                                             │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ [imagem inline do anexo]                                       ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ 📄 nota-fiscal.pdf  120.5 KB        [🔗] [⬇️]                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [Bug] Ver resposta bruta da IA                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Mudancas visuais:**
- Bloco "Mensagem" (antes chamado "Conteudo do Email") agora aparece **entre os metadados (De/Assunto/Recebido) e os Anexos**
- Titulo alterado de "Conteudo do Email" para "Mensagem"
- Renderizacao continua como texto puro com `whitespace-pre-wrap`

#### Alteracao 2 -- Tabela de parcelas no FormAprovacao (coluna direita)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dados Extraidos                                   [85% confianca]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Descricao        [Nota fiscal fornecedor XYZ               ]      │
│  Valor (R$)  [1500.00]         Data  [2026-02-10]                   │
│  Categoria   [Material de construcao  v]                            │
│  Fornecedor  [Fornecedor XYZ          v]                            │
│  Forma Pgto  [PIX v]  Parcelas [3]  N. NF [123456]                 │
│  Etapa       [Fundacao                v]                            │
│  Observacoes [Importado do email de...]                             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Parcelas                                            R$ Total │  │
│  │                                                     1.500,00 │  │
│  ├──────────┬────────────────────┬──────────────────────────────┤  │
│  │ Parcela  │ Data               │ Valor (R$)                   │  │
│  ├──────────┼────────────────────┼──────────────────────────────┤  │
│  │ 1/3      │ [2026-02-10]       │ [500.00]                     │  │
│  │ 2/3      │ [2026-03-10]       │ [500.00]                     │  │
│  │ 3/3      │ [2026-04-10]       │ [500.00]                     │  │
│  ├──────────┴────────────────────┴──────────────────────────────┤  │
│  │                                         Soma: R$ 1.500,00   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌ ⚠️  ────────────────────────────────────────────────────────────┐│
│  │ A soma das parcelas (R$ 1.480,00) difere do valor              ││
│  │ total (R$ 1.500,00) em R$ 20,00                                ││
│  └────────────────────────────────────────────────────────────────┘│
│  (aviso acima so aparece quando soma != valor total)               │
│                                                                     │
│                              [Rejeitar]  [Aprovar]                  │
│                        [Reprocessar com IA]                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Comportamentos da tabela de parcelas:**
- Aparece sempre que `parcelas >= 1` (ou seja, sempre)
- Quando o usuario muda o campo "Parcelas" (numero), a tabela e regenerada: valores divididos igualmente, datas incrementais mensais a partir da data do formulario
- Campos "Data" e "Valor" de cada parcela sao inputs editaveis
- Edicao on blur: ao sair do campo, o estado local e atualizado
- Coluna "Parcela" e read-only (ex: "1/3", "2/3", "3/3")
- Header mostra "R$ Total" com o valor total do formulario para referencia
- Footer mostra a soma atual dos valores das parcelas
- Aviso amarelo aparece **somente** quando a soma das parcelas difere do valor total

### 3.3 Arquivos Afetados

#### Alteracao 1 -- Corpo do email

| Arquivo | Acao | O que muda |
|---------|------|------------|
| `src/app/api/emails/sync/route.ts` | MODIFICAR | Apos o fetch de cada email, usar `client.download()` para extrair o body (text/plain ou text/html). Adicionar funcao auxiliar para encontrar a parte de texto na `bodyStructure`. Se for HTML, converter para texto puro (strip tags preservando line breaks). Salvar no campo `corpo` em vez de `null` |
| `src/components/features/emails/email-preview.tsx` | MODIFICAR | Mover o bloco de renderizacao do corpo para **antes** da secao de anexos. Renomear titulo de "Conteudo do Email" para "Mensagem" |

#### Alteracao 2 -- Parcelas editaveis

| Arquivo | Acao | O que muda |
|---------|------|------------|
| `src/components/features/emails/form-aprovacao.tsx` | MODIFICAR | Adicionar estado local para parcelas (`useState` com array de `{ parcela: number, data: string, valor: number }`). Adicionar `useEffect` para regenerar parcelas quando numero de parcelas ou data ou valor total mudam. Renderizar tabela de parcelas com inputs editaveis (data e valor). Adicionar aviso visual de validacao (soma != total). Passar dados das parcelas editadas no `onAprovar` |
| `src/app/(dashboard)/emails/[id]/page.tsx` | MODIFICAR | Alterar a assinatura de `handleAprovar` para receber dados de parcelas editadas. Substituir o loop de geracao de parcelas por uso direto dos dados editados recebidos do formulario |

### 3.4 Fluxo de Dados

#### Alteracao 1 -- Corpo do email

1. A rota `POST /api/emails/sync` conecta ao servidor IMAP e faz `client.fetch()` com `{ envelope, bodyStructure, uid }`
2. **NOVO:** Para cada email, percorrer a `bodyStructure` procurando a parte com tipo `text/plain` (prioridade) ou `text/html` (fallback)
3. **NOVO:** Usar `client.download(message.uid, partId, { uid: true })` para baixar o conteudo da parte identificada
4. **NOVO:** Ler o stream retornado pelo download e converter para string
5. **NOVO:** Se o conteudo for HTML, aplicar funcao `stripHtmlToText()` que converte tags de bloco (`<br>`, `<p>`, `<div>`) em `\n` e remove todas as demais tags
6. O insert no banco agora usa o texto extraido no campo `corpo` em vez de `null`
7. No frontend, `email-preview.tsx` recebe `email.corpo` (agora preenchido) e renderiza como texto com `whitespace-pre-wrap`

#### Alteracao 2 -- Parcelas editaveis

1. O `form-aprovacao.tsx` mantem um estado local `parcelas` (array de objetos `{ parcela, data, valor }`)
2. Quando o formulario carrega (ou quando usuario altera campos "Parcelas", "Valor" ou "Data"), um `useEffect` regenera o array: divide o valor total igualmente, gera datas mensais incrementais
3. O usuario pode editar data e valor de cada parcela diretamente nos inputs da tabela
4. Ao sair do campo (onBlur), o estado local e atualizado com o novo valor
5. A soma das parcelas e calculada em tempo real. Se diferir do valor total, um aviso aparece
6. Ao clicar "Aprovar", o `onAprovar` recebe os dados do formulario **mais** o array de parcelas editadas
7. No `handleAprovar` da page `[id]/page.tsx`, ao inves de recalcular parcelas com divisao igual, usa diretamente o array recebido para construir os lancamentos inseridos na tabela `gastos`

### 3.5 Banco de Dados

Nenhuma alteracao de schema necessaria.

- O campo `corpo` (tipo `text | null`) ja existe na tabela `emails_monitorados`. Hoje esta sempre `null` por falta de extracao. A rota de sync passara a preenche-lo
- A tabela `gastos` ja tem todos os campos necessarios para as parcelas (valor, data, parcela_atual, etc.)
- Emails ja sincronizados continuarao com `corpo = null`. Somente novos emails sincronizados terao o corpo preenchido

### 3.6 Impacto Cross-Domain

**N/A** -- Nao existe arquivo `docs/mapa-dependencias.md` no projeto.

Analise manual de impacto:

- **Alteracao 1:** impacto isolado no dominio de emails. A rota de sync e o componente de preview sao os unicos afetados. Nenhum outro dominio consome o campo `corpo`
- **Alteracao 2:** impacto leve no fluxo email -> financeiro (gastos). A forma como as parcelas sao criadas na tabela `gastos` muda (de calculo automatico para dados editados pelo usuario), mas a estrutura dos dados inseridos permanece identica. Nenhuma outra tela ou service consome esses dados de forma diferente

---

## 4. Decisoes Importantes

| # | Decisao | Motivo |
|---|---------|--------|
| 1 | Opcao B -- texto sem formatacao para corpo do email | Simplicidade, sem risco de XSS, sem dependencia de DOMPurify. Line breaks preservados via strip de tags HTML |
| 2 | Priorizar text/plain sobre text/html na extracao | text/plain e mais limpo e nao requer conversao. HTML so como fallback |
| 3 | Tabela de parcelas aparece sempre (mesmo com 1 parcela) | Permite editar data de vencimento ate de pagamento avista |
| 4 | Apenas data e valor editaveis por parcela | Demais campos (descricao, categoria, fornecedor, forma pagamento) sao herdados do formulario principal -- nao faz sentido diferir por parcela |
| 5 | Estado de parcelas em memoria (in-memory) | Parcelas so existem no banco apos aprovacao. Nao ha necessidade de persistencia intermediaria |
| 6 | Aviso visual (nao bloqueante) quando soma diverge | Usuario pode aprovar mesmo com divergencia (flexibilidade), mas e alertado visualmente |
| 7 | Edicao on blur (sem botao salvar por campo) | Experiencia mais fluida, consistente com auto-save solicitado |
| 8 | Nenhuma alteracao de schema no banco | Campo `corpo` ja existe. Tabela `gastos` ja suporta os campos necessarios |
>>>>>>> main

---

## 5. Checkpoints

<<<<<<< HEAD
*(Adicionados automaticamente em sessões longas)*
=======
#### Checkpoint 2026-02-12
**Status atual:** Proposta de implementacao completa, aguardando aprovacao
**Decisoes tomadas:**
- Alteracao 1: extrair corpo do email na sync IMAP, exibir como texto puro com line breaks
- Alteracao 2: tabela de parcelas editaveis (data e valor), estado local, aviso de divergencia

**Proximo passo:** Aprovacao da proposta pelo usuario -> Criar spec-alteracao06.md
>>>>>>> main
