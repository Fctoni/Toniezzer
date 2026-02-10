# Especificacao: Alteracao 05 - Centralizar CRUD em services (Fase 3: Restante)

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Concluido |
| Conversa | [alteracao05.md](./alteracao/alteracao05.md) |
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

Fase final da centralizacao de CRUD em services. Cobre 10 entidades restantes (users, emails_monitorados, documentos, reunioes, reunioes_acoes, topicos_comunicacao, feed_comunicacao, feed_comentarios, notificacoes, etapas_dependencias) com 62 operacoes inline em ~30 arquivos.

Dividido em:
- **Sub-fase 5a:** Criar 8 service files + modificar 1 existente (~50 funcoes)
- **Sub-fase 5b:** Refatorar 29 arquivos

---

## 2. O que sera feito

### Sub-fase 5a — Criar/Modificar Services

- [ ] Criar `src/lib/services/users.ts` (~9 funcoes)
- [ ] Criar `src/lib/services/emails-monitorados.ts` (~8 funcoes)
- [ ] Criar `src/lib/services/documentos.ts` (~4 funcoes)
- [ ] Criar `src/lib/services/reunioes.ts` (~4 funcoes)
- [ ] Criar `src/lib/services/reunioes-acoes.ts` (~3 funcoes)
- [ ] Criar `src/lib/services/topicos-comunicacao.ts` (~6 funcoes)
- [ ] Criar `src/lib/services/feed-comunicacao.ts` (~8 funcoes)
- [ ] Criar `src/lib/services/notificacoes.ts` (~6 funcoes)
- [ ] Modificar `src/lib/services/etapas.ts` (+1 funcao)
- [ ] Validar TypeScript (`npx tsc --noEmit`)

### Sub-fase 5b — Refatorar Componentes

- [ ] `api/users/route.ts` (4 ops)
- [ ] `api/emails/sync/route.ts` (2 ops)
- [ ] `api/emails/process/route.ts` (5 ops)
- [ ] `api/plaud/route.ts` (3 ops)
- [ ] `lib/hooks/use-current-user.tsx` (1 op)
- [ ] `tarefas/[id]/page.tsx` (2 ops)
- [ ] `tarefas/page.tsx` (1 op)
- [ ] `dashboard/page.tsx` (2 ops)
- [ ] `cronograma/page.tsx` (1 op)
- [ ] `configuracoes/usuarios/page.tsx` (1 op)
- [ ] `documentos/page.tsx` (1 op)
- [ ] `documentos/upload-form.tsx` (2 ops)
- [ ] `documentos/galeria-fotos.tsx` (2 ops)
- [ ] `emails/page.tsx` (1 op)
- [ ] `emails/[id]/page.tsx` (5 ops)
- [ ] `reunioes/page.tsx` (1 op)
- [ ] `reunioes/[id]/page.tsx` (4 ops)
- [ ] `reunioes/nova/page.tsx` (1 op)
- [ ] `notificacoes/page.tsx` (4 ops)
- [ ] `components/layout/header.tsx` (2 ops)
- [ ] `comunicacao/page.tsx` (2 ops)
- [ ] `comunicacao/[id]/page.tsx` (5 ops)
- [ ] `comunicacao/feed-item.tsx` (2 ops)
- [ ] `comunicacao/novo-post-form.tsx` (1 op)
- [ ] `comunicacao/mensagem-topico.tsx` (1 op)
- [ ] `comunicacao/novo-topico-dialog.tsx` (1 op)
- [ ] `cronograma/nova-etapa-dialog.tsx` (1 op)
- [ ] `compras/compra-form.tsx` (1 op)
- [ ] `financeiro/form-lancamento.tsx` (1 op)
- [ ] Validar TypeScript final (`npx tsc --noEmit`)

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- 62 operacoes Supabase inline espalhadas por ~30 arquivos
- Queries de users duplicadas em 10 arquivos
- Pipeline de emails com queries inline em 3 API Routes
- Comunicacao sem centralizacao
- Notificacoes duplicadas entre header e pagina

**Depois (comportamento proposto):**
- 8 services novos + 1 modificado em `src/lib/services/`
- Hook `useCurrentUser` consome service `users.ts`
- API Routes funcionam como Controllers
- `notas-compras` (getPublicUrl) mantido inline (trivial)

### 3.2 UI Proposta

N/A — refatoracao interna sem impacto visual.

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A — sem alteracoes no banco.

### 4.2 Arquivos a Modificar/Criar

**Referencia:** Mapeamento detalhado em [alteracao05.md](./alteracao/alteracao05.md) secao 2.

---

#### SUB-FASE 5a — SERVICES

Todos seguem padrao de `.claude/padroes-codigo.md`.

---

##### `src/lib/services/users.ts`

```typescript
type User = Tables<'users'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarUsuarios(supabase)` | `User[]` | `select('*').order('nome_completo')` | configuracoes/usuarios |
| `buscarUsuariosAtivos(supabase)` | `User[]` | `select('*').eq('ativo', true)` | cronograma, use-current-user |
| `buscarUsuariosParaDropdown(supabase)` | `Pick<...,'id'\|'nome_completo'>[]` | `select('id,nome_completo').eq('ativo', true)` | tarefas/[id], tarefas/page, api/plaud |
| `buscarUsuarioPorEmail(supabase, email)` | `Pick<...,'id'>` | `select('id').eq('email', email).single()` | dashboard, tarefas/[id] |
| `buscarPrimeiroUsuario(supabase)` | `Pick<...,'id'>` | `select('id').limit(1).single()` | upload-form, compra-form, form-lancamento |
| `isAdmin(supabase, email)` | `boolean` | `select('role').eq('email', email).single()` | api/users |
| `criarUsuario(supabase, data)` | `User` | `insert(data).select().single()` | api/users POST |
| `atualizarUsuario(supabase, id, updates)` | `User` | `update(updates).eq('id', id).select().single()` | api/users PATCH |
| `desativarUsuario(supabase, id)` | `void` | `update({ativo: false}).eq('id', id)` | api/users DELETE |

---

##### `src/lib/services/emails-monitorados.ts`

```typescript
type EmailMonitorado = Tables<'emails_monitorados'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarEmails(supabase)` | `EmailMonitorado[]` | `select('*').order('data_recebimento', {ascending:false})` | emails/page |
| `buscarEmailPorId(supabase, id)` | `EmailMonitorado` | `select('*').eq('id', id).single()` | emails/[id] |
| `buscarEmailPorIdExterno(supabase, emailId)` | `Pick<...,'id'> \| null` | `select('id').eq('email_id_externo', emailId)` | api/emails/sync |
| `buscarEmailsParaProcessar(supabase, limit?)` | `EmailMonitorado[]` | `select('*').in('status', ['nao_processado','erro']).limit(limit)` | api/emails/process |
| `criarEmail(supabase, data)` | `EmailMonitorado` | `insert(data).select().single()` | api/emails/sync |
| `atualizarStatusEmail(supabase, id, updates)` | `void` | `update(updates).eq('id', id)` | api/emails/process (varias chamadas) |
| `aprovarEmail(supabase, id, data)` | `void` | `update({status, compra_sugerida_id, processado_em, processado_por}).eq('id', id)` | emails/[id] handleAprovar |
| `rejeitarEmail(supabase, id, data)` | `void` | `update({status, processado_em, processado_por}).eq('id', id)` | emails/[id] handleRejeitar |

**Nota:** `atualizarStatusEmail` e generico — usado pelas varias etapas do pipeline (processando, erro, sucesso). `aprovarEmail` e `rejeitarEmail` sao especificos da pagina de detalhe.

---

##### `src/lib/services/documentos.ts`

```typescript
type Documento = Tables<'documentos'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarDocumentosComEtapa(supabase)` | complex | `select('id,nome,url,tipo,tags,tamanho_bytes,created_at,etapa_relacionada_id, etapas(nome)').order('created_at', {ascending:false})` | documentos/page |
| `criarDocumento(supabase, data)` | `Documento` | `insert(data).select().single()` | upload-form |
| `atualizarDocumento(supabase, id, updates)` | `Documento` | `update(updates).eq('id', id).select().single()` | galeria-fotos |
| `deletarDocumento(supabase, id)` | `void` | `delete().eq('id', id)` | galeria-fotos |

---

##### `src/lib/services/reunioes.ts`

```typescript
type Reuniao = Tables<'reunioes'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarReunioesComDetalhes(supabase)` | complex | `select('*, created_by_user(nome_completo), reunioes_acoes(id,status)').order('data_reuniao', {ascending:false})` | reunioes/page |
| `buscarReuniaoPorId(supabase, id)` | `Reuniao` | `select('*').eq('id', id).single()` | reunioes/[id] |
| `criarReuniao(supabase, data)` | `Reuniao` | `insert(data).select().single()` | reunioes/nova |
| `deletarReuniao(supabase, id)` | `void` | `delete().eq('id', id)` | reunioes/[id] |

---

##### `src/lib/services/reunioes-acoes.ts`

```typescript
type ReuniaoAcao = Tables<'reunioes_acoes'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarAcoesPorReuniao(supabase, reuniaoId)` | complex | `select('*, responsavel(nome_completo), categoria(nome,cor)').eq('reuniao_id', id).order('created_at')` | reunioes/[id] |
| `criarAcoes(supabase, acoes[])` | `ReuniaoAcao[]` | `insert(acoes).select()` (batch) | api/plaud |
| `atualizarStatusAcao(supabase, id, status)` | `void` | `update({status, updated_at}).eq('id', id)` | reunioes/[id] |

---

##### `src/lib/services/topicos-comunicacao.ts`

```typescript
type TopicoComunicacao = Tables<'topicos_comunicacao'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarTopicos(supabase, filtros?)` | complex | `select('*, autor(*), etapa(*)').order('fixado', {ascending:false}).order('updated_at', {ascending:false})` + filtros opcionais (status, search) | comunicacao/page |
| `buscarTopicoPorId(supabase, id)` | complex | `select('*, autor(*), etapa(*)').eq('id', id).single()` | comunicacao/[id] |
| `criarTopico(supabase, data)` | `TopicoComunicacao` | `insert(data).select().single()` | novo-topico-dialog |
| `atualizarStatusTopico(supabase, id, status)` | `void` | `update({status}).eq('id', id)` | comunicacao/[id] |
| `toggleFixadoTopico(supabase, id, fixado)` | `void` | `update({fixado}).eq('id', id)` | comunicacao/[id] |
| `deletarTopico(supabase, id)` | `void` | `delete().eq('id', id)` | comunicacao/[id] |

---

##### `src/lib/services/feed-comunicacao.ts`

```typescript
type FeedComunicacao = Tables<'feed_comunicacao'>
type FeedComentario = Tables<'feed_comentarios'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarMensagensPorTopico(supabase, topicoId)` | complex | `select('*, autor(*)').eq('topico_id', id).order('created_at')` | comunicacao/[id] |
| `contarMensagensPorTopico(supabase, topicoId)` | `number` | `select('*', {count:'exact', head:true}).eq('topico_id', id)` | comunicacao/page |
| `criarMensagem(supabase, data)` | `FeedComunicacao` | `insert({tipo, conteudo, autor_id, topico_id, mencoes}).select().single()` | comunicacao/[id] |
| `criarPost(supabase, data)` | `FeedComunicacao` | `insert({tipo, conteudo, autor_id, mencoes, etapa_relacionada_id}).select().single()` | novo-post-form |
| `criarPostDecisao(supabase, data)` | `FeedComunicacao` | `insert({tipo, conteudo, autor_id, reuniao_relacionada_id}).select().single()` | api/plaud |
| `deletarPost(supabase, id)` | `void` | `delete().eq('id', id)` | feed-item |
| `deletarMensagem(supabase, id)` | `void` | `delete().eq('id', id)` | mensagem-topico |
| `criarComentario(supabase, data)` | complex | `from('feed_comentarios').insert({feed_id, conteudo, autor_id}).select('*, autor(*)').single()` | feed-item |

**Nota:** `criarComentario` opera na tabela `feed_comentarios` (nao `feed_comunicacao`). Incluido aqui pois comentarios sao parte do feed.

---

##### `src/lib/services/notificacoes.ts`

```typescript
type Notificacao = Tables<'notificacoes'>
```

| Funcao | Retorno | Query base | Usado por |
|--------|---------|------------|-----------|
| `buscarNotificacoes(supabase, usuarioId, filtros?)` | `Notificacao[]` | `select('*').eq('usuario_id', id).order('created_at', {ascending:false})` + filtros (tipo, lida) | notificacoes/page |
| `buscarNotificacoesRecentes(supabase, usuarioId, limit)` | `Notificacao[]` | `select('*').eq('usuario_id', id).order('created_at', {ascending:false}).limit(limit)` | header |
| `buscarNotificacoesNaoLidas(supabase)` | `Notificacao[]` | `select('*').eq('lida', false).order('created_at', {ascending:false})` | dashboard |
| `marcarComoLida(supabase, id)` | `void` | `update({lida: true, lida_em: now()}).eq('id', id)` | header, notificacoes/page |
| `marcarTodasComoLidas(supabase, usuarioId)` | `void` | `update({lida: true, lida_em: now()}).eq('lida', false).eq('usuario_id', id)` | notificacoes/page |
| `excluirNotificacao(supabase, id)` | `void` | `delete().eq('id', id)` | notificacoes/page |

---

##### `src/lib/services/etapas.ts` (MODIFICAR)

Adicionar ao final do arquivo existente:

```typescript
// ===== DEPENDENCIAS =====

export async function criarDependenciaEtapa(
  supabase: TypedSupabaseClient,
  data: { etapa_id: string; depende_de_etapa_id: string; tipo: string }
): Promise<void> {
  const { error } = await supabase.from('etapas_dependencias').insert(data)
  if (error) throw error
}
```

Usado por: `cronograma/nova-etapa-dialog.tsx`

---

#### SUB-FASE 5b — REFATORAR COMPONENTES

Padroes de refatoracao identicos as Fases 1 e 2 (ver spec-alteracao03 e spec-alteracao04).

**Guia por arquivo:**

| Arquivo | Ops | Substituicoes |
|---------|-----|---------------|
| `api/users/route.ts` | 4 | users: isAdmin, criarUsuario, atualizarUsuario, desativarUsuario |
| `api/emails/sync/route.ts` | 2 | emails-monitorados: buscarEmailPorIdExterno, criarEmail |
| `api/emails/process/route.ts` | 5 | emails-monitorados: buscarEmailsParaProcessar, atualizarStatusEmail (x4) |
| `api/plaud/route.ts` | 3 | users: buscarUsuariosParaDropdown. reunioes-acoes: criarAcoes. feed-comunicacao: criarPostDecisao |
| `lib/hooks/use-current-user.tsx` | 1 | users: buscarUsuariosAtivos |
| `tarefas/[id]/page.tsx` | 2 | users: buscarUsuariosParaDropdown, buscarUsuarioPorEmail |
| `tarefas/page.tsx` | 1 | users: buscarUsuariosParaDropdown |
| `dashboard/page.tsx` | 2 | users: buscarUsuarioPorEmail. notificacoes: buscarNotificacoesNaoLidas |
| `cronograma/page.tsx` | 1 | users: buscarUsuariosAtivos |
| `configuracoes/usuarios/page.tsx` | 1 | users: buscarUsuarios |
| `documentos/page.tsx` | 1 | documentos: buscarDocumentosComEtapa |
| `documentos/upload-form.tsx` | 2 | documentos: criarDocumento. users: buscarPrimeiroUsuario |
| `documentos/galeria-fotos.tsx` | 2 | documentos: atualizarDocumento, deletarDocumento |
| `emails/page.tsx` | 1 | emails-monitorados: buscarEmails |
| `emails/[id]/page.tsx` | 5 | emails-monitorados: buscarEmailPorId, aprovarEmail, rejeitarEmail, atualizarStatusEmail, buscarEmailPorId (reload) |
| `reunioes/page.tsx` | 1 | reunioes: buscarReunioesComDetalhes |
| `reunioes/[id]/page.tsx` | 4 | reunioes: buscarReuniaoPorId, deletarReuniao. reunioes-acoes: buscarAcoesPorReuniao, atualizarStatusAcao |
| `reunioes/nova/page.tsx` | 1 | reunioes: criarReuniao |
| `notificacoes/page.tsx` | 4 | notificacoes: buscarNotificacoes, marcarComoLida, marcarTodasComoLidas, excluirNotificacao |
| `components/layout/header.tsx` | 2 | notificacoes: buscarNotificacoesRecentes, marcarComoLida |
| `comunicacao/page.tsx` | 2 | topicos-comunicacao: buscarTopicos. feed-comunicacao: contarMensagensPorTopico |
| `comunicacao/[id]/page.tsx` | 5 | topicos-comunicacao: buscarTopicoPorId, atualizarStatusTopico, toggleFixadoTopico, deletarTopico. feed-comunicacao: buscarMensagensPorTopico, criarMensagem |
| `comunicacao/feed-item.tsx` | 2 | feed-comunicacao: deletarPost, criarComentario |
| `comunicacao/novo-post-form.tsx` | 1 | feed-comunicacao: criarPost |
| `comunicacao/mensagem-topico.tsx` | 1 | feed-comunicacao: deletarMensagem |
| `comunicacao/novo-topico-dialog.tsx` | 1 | topicos-comunicacao: criarTopico |
| `cronograma/nova-etapa-dialog.tsx` | 1 | etapas: criarDependenciaEtapa |
| `compras/compra-form.tsx` | 1 | users: buscarPrimeiroUsuario |
| `financeiro/form-lancamento.tsx` | 1 | users: buscarPrimeiroUsuario |

### 4.3 Fluxo de Dados

Identico ao padrao das Fases 1 e 2. Ver `.claude/padroes-codigo.md`.

### 4.4 Dependencias Externas

N/A.

### 4.5 Decisoes de Design e Justificativas

| # | Decisao | Justificativa |
|---|---------|---------------|
| 1 | **etapas_dependencias em etapas.ts** | 1 funcao, entidade acoplada — evita arquivo quase vazio |
| 2 | **users.ts service** | 15 ops em 10 arquivos, muita duplicacao. Hook consome service |
| 3 | **Comunicacao em 2 services** | topicos-comunicacao.ts (entidade propria) + feed-comunicacao.ts (posts + mensagens + comentarios) |
| 4 | **notas-compras inline** | 1 getPublicUrl trivial — criar service quando surgir upload |
| 5 | **Sub-fases 5a/5b** | Consistente com Fase 2, validacao TypeScript intermediaria |
| 6 | **Herda decisoes 1-5 da Fase 2** | DI, funcoes puras, throw error, JOINs nomeados, sub-fases |

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

#### Sub-fase 5a
- [x] users.ts criado
- [x] emails-monitorados.ts criado
- [x] documentos.ts criado
- [x] reunioes.ts criado
- [x] reunioes-acoes.ts criado
- [x] topicos-comunicacao.ts criado
- [x] feed-comunicacao.ts criado
- [x] notificacoes.ts criado
- [x] etapas.ts modificado (+criarDependenciaEtapa)
- [x] TypeScript sem erros (pos 5a)

#### Sub-fase 5b
- [x] api/users/route.ts refatorado
- [x] api/emails/sync/route.ts refatorado
- [x] api/emails/process/route.ts refatorado
- [x] api/plaud/route.ts refatorado
- [x] lib/hooks/use-current-user.tsx refatorado
- [x] tarefas/[id]/page.tsx refatorado
- [x] tarefas/page.tsx refatorado
- [x] dashboard/page.tsx refatorado
- [x] cronograma/page.tsx refatorado
- [x] configuracoes/usuarios/page.tsx refatorado
- [x] documentos/page.tsx refatorado
- [x] documentos/upload-form.tsx refatorado
- [x] documentos/galeria-fotos.tsx refatorado
- [x] emails/page.tsx refatorado
- [x] emails/[id]/page.tsx refatorado
- [x] reunioes/page.tsx refatorado
- [x] reunioes/[id]/page.tsx refatorado
- [x] reunioes/nova/page.tsx refatorado
- [x] notificacoes/page.tsx refatorado
- [x] components/layout/header.tsx refatorado
- [x] comunicacao/page.tsx refatorado
- [x] comunicacao/[id]/page.tsx refatorado
- [x] comunicacao/feed-item.tsx refatorado
- [x] comunicacao/novo-post-form.tsx refatorado
- [x] comunicacao/mensagem-topico.tsx refatorado
- [x] comunicacao/novo-topico-dialog.tsx refatorado
- [x] cronograma/nova-etapa-dialog.tsx refatorado
- [x] compras/compra-form.tsx refatorado
- [x] financeiro/form-lancamento.tsx refatorado
- [x] TypeScript sem erros (final)

### 5.2 Notas de Implementacao

- `isAdmin` no service users.ts nao lanca excecao — retorna false se usuario nao encontrado (mantendo comportamento original)
- `buscarUsuariosAtivos` inclui `.order('nome_completo')` pois todos os consumidores esperavam ordenacao
- api/users/route.ts: `createAdminClient` tipado com `<Database>` para compatibilidade com TypedSupabaseClient
- `buscarEmailPorIdExterno` usa array result (sem `.single()`) para evitar erro quando email nao existe
- Dashboard: notificacoesRes removido, service retorna array diretamente

### 5.3 Conversa de Execucao

#### IA: Execucao completa da alteracao 05

8 services criados, 1 modificado, 29 arquivos refatorados. TypeScript sem erros.

---

## 6. Validacao Final

- [x] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
