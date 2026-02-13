<<<<<<< HEAD
# Alteracao 05 - Centralizar CRUD em services (Fase 3: Restante)

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificacao criada → ver [spec-alteracao05.md](../spec-alteracao05.md) |
| Origem | Continuacao das Alteracoes 03 (Fase 1) e 04 (Fase 2) |
| Complexidade | 🟡 Media |
| Especificacao | *(sera criada apos aprovacao da proposta)* |

**Status possiveis:**
- 🟡 Em planejamento
- 🟢 Especificacao criada → ver [spec-alteracao05.md](../spec-alteracao05.md)
=======
# Alteracao 05 - Editar data de vencimento de parcelas inline

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificacao criada |
| Origem | Solicitacao do usuario |
| Complexidade | 🟢 Baixa |
| Especificacao | [spec-alteracao05.md](../spec/spec-alteracao05.md) |

**Status possiveis:**
- 🟡 Em planejamento
- 🟢 Especificacao criada → ver [spec-alteracao05.md](../spec/spec-alteracao05.md)
>>>>>>> main

---

## 1. Ideia Inicial

<<<<<<< HEAD
Fase final da estrategia de centralizacao de CRUD em services. Cobre as entidades restantes nao incluidas nas Fases 1 (Cronograma) e 2 (Financeiro): users, emails_monitorados, documentos, reunioes, reunioes_acoes, comunicacao (feed + topicos), notificacoes, e 1 gap da Fase 1 (etapas_dependencias).

**Diagnostico:** 61 operacoes inline em 10 entidades, espalhadas por ~18 arquivos. 2 tabelas existem no banco mas nao tem operacoes no frontend (`configuracoes_sistema`, `centros_custo`).
=======
Permitir alterar a data de vencimento das parcelas de lancamentos financeiros diretamente na tabela (inline), tanto na pagina `/financeiro/lancamentos` quanto na pagina `/compras/[id]`. Somente parcelas pendentes (nao pagas) podem ser editadas. A edicao e feita clicando na data, que abre um date picker inline.
>>>>>>> main

---

## 2. Conversa de Planejamento

<<<<<<< HEAD
#### usuario: Solicitou criacao da alteracao para Fase 3

#### IA: Levantamento completo de 61 operacoes inline em 10 entidades restantes

Realizei a analise profunda de todas as entidades que nao foram cobertas pelas Fases 1 e 2.

---

### Resumo por Entidade

| Entidade | Operacoes | Arquivos | SELECT | INSERT | UPDATE | DELETE | STORAGE |
|----------|-----------|----------|--------|--------|--------|--------|---------|
| users | 15 | 10 | 13 | 1 | 1 | - | - |
| emails_monitorados | 13 | 3 | 3 | 1 | 9 | - | - |
| notificacoes | 7 | 3 | 2 | - | 3 | 1 | 1 |
| feed_comunicacao | 7 | 4 | 2 | 3 | - | 2 | - |
| topicos_comunicacao | 6 | 2 | 2 | 1 | 2 | 1 | - |
| documentos | 4 | 3 | 1 | 1 | 1 | 1 | - |
| reunioes | 4 | 3 | 2 | 1 | - | 1 | - |
| reunioes_acoes | 3 | 2 | 1 | 1 | 1 | - | - |
| feed_comentarios | 1 | 1 | - | 1 | - | - | - |
| etapas_dependencias | 1 | 1 | - | 1 | - | - | - |
| notas-compras (storage) | 1 | 1 | - | - | - | - | 1 |
| **TOTAL** | **62** | **~18** | **26** | **11** | **17** | **6** | **2** |

### Tabelas sem operacoes no frontend

| Tabela | Observacao |
|--------|-----------|
| `configuracoes_sistema` | Zero operacoes — possivelmente nao implementada ainda ou usada apenas via RPC |
| `centros_custo` | Zero operacoes — possivelmente nao implementada ainda |

---

### Mapeamento Detalhado: `users`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `api/users/route.ts:30` | SELECT | role | .eq('email', user.email) | isCurrentUserAdmin() |
| 2 | `api/users/route.ts:90` | INSERT | id, email, nome_completo, role, especialidade, telefone, ativo | — | POST — criar usuario |
| 3 | `api/users/route.ts:160` | UPDATE | nome_completo, role, especialidade, telefone, ativo | .eq('id', id) | PATCH — atualizar usuario |
| 4 | `api/users/route.ts:225` | UPDATE | ativo: false | .eq('id', id) | DELETE — soft delete |
| 5 | `lib/hooks/use-current-user.tsx:82` | SELECT | * | .eq('ativo', true).order('nome_completo') | useCurrentUser() — provider |
| 6 | `tarefas/[id]/page.tsx:53` | SELECT | id, nome_completo | .eq('ativo', true) | Carregar usuarios ativos para atribuicao |
| 7 | `tarefas/[id]/page.tsx:96` | SELECT | id | .eq('email', authUser.email) | Mapear usuario atual por email |
| 8 | `tarefas/page.tsx:51` | SELECT | id, nome_completo | .eq('ativo', true) | Carregar usuarios ativos |
| 9 | `dashboard/page.tsx:36` | SELECT | id | .eq('email', user.email) | Mapear usuario atual |
| 10 | `cronograma/page.tsx:83` | SELECT | * | .eq('ativo', true) | Carregar usuarios ativos |
| 11 | `configuracoes/usuarios/page.tsx:103` | SELECT | * | .order('nome_completo') | Carregar todos usuarios (gerenciamento) |
| 12 | `api/plaud/route.ts:152` | SELECT | id, nome_completo | .eq('ativo', true) | Buscar usuarios para atribuicao de acoes |
| 13 | `documentos/upload-form.tsx:125` | SELECT | id | .limit(1) | Obter primeiro usuario para upload |
| 14 | `compras/compra-form.tsx:173` | SELECT | id | .limit(1) | Obter primeiro usuario para criacao |
| 15 | `financeiro/form-lancamento.tsx:90` | SELECT | id | .limit(1) | Obter primeiro usuario para lancamento |

**Padroes identificados:**
- Query mais comum: `.select('id, nome_completo').eq('ativo', true)` — usuarios ativos para dropdowns/atribuicao (6+ arquivos)
- 3 arquivos usam `.select('id').limit(1)` como workaround para obter usuario atual — possivel refatoracao
- CRUD completo via API Route (`api/users/route.ts`)
- Hook `useCurrentUser` ja centraliza parte da logica

---

### Mapeamento Detalhado: `emails_monitorados`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `api/emails/sync/route.ts:57` | SELECT | id | .eq('email_id_externo', emailId) | Verificar se email ja existe |
| 2 | `api/emails/sync/route.ts:122` | INSERT | email_id_externo, remetente, remetente_nome, assunto, corpo, data_recebimento, status, anexos | — | Inserir emails sincronizados |
| 3 | `emails/[id]/page.tsx:28` | SELECT | * | .eq('id', id).single() | Carregar detalhes do email |
| 4 | `emails/[id]/page.tsx:200` | UPDATE | status, compra_sugerida_id, processado_em, processado_por | .eq('id', id) | handleAprovar() |
| 5 | `emails/[id]/page.tsx:232` | UPDATE | status, processado_em, processado_por | .eq('id', id) | handleRejeitar() |
| 6 | `emails/[id]/page.tsx:262` | UPDATE | status | .eq('id', id) | handleReprocessar() |
| 7 | `emails/[id]/page.tsx:275` | SELECT | * | .eq('id', id) | Recarregar email apos reprocessar |
| 8 | `emails/page.tsx:27` | SELECT | * | .order('data_recebimento', {ascending: false}) | Listar todos emails |
| 9 | `api/emails/process/route.ts:342` | SELECT | * | .in('status', ['nao_processado','erro']).limit(5) | Buscar emails para processar |
| 10 | `api/emails/process/route.ts:368` | UPDATE | status | .eq('id', id) | Marcar como "processando" |
| 11 | `api/emails/process/route.ts:383` | UPDATE | status, dados_extraidos, erro_mensagem, processado_em | .eq('id', id) | Atualizar com erro |
| 12 | `api/emails/process/route.ts:462` | UPDATE | status, dados_extraidos, erro_mensagem, processado_em | .eq('id', id) | Atualizar com dados extraidos |
| 13 | `api/emails/process/route.ts:477` | UPDATE | status, dados_extraidos, erro_mensagem, processado_em | .eq('id', id) | Atualizar com falha |

**Padroes identificados:**
- 2 API Routes com operacoes pesadas (sync e process)
- 7 UPDATEs no total — maioria e atualizacao de status durante pipeline de processamento
- Pipeline: sync → process → aprovar/rejeitar (3 etapas)

---

### Mapeamento Detalhado: `notificacoes`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `components/layout/header.tsx:56` | SELECT | * | .eq('usuario_id', id).order('created_at', desc).limit(10) | fetchNotificacoes() — header dropdown |
| 2 | `components/layout/header.tsx:106` | UPDATE | lida, lida_em | .eq('id', id) | marcarComoLida() |
| 3 | `notificacoes/page.tsx:112` | SELECT | * | .eq('usuario_id', id).order('created_at', desc) + filtros | fetchNotificacoes() — pagina completa |
| 4 | `notificacoes/page.tsx:162` | UPDATE | lida, lida_em | .eq('id', id) | marcarComoLida() |
| 5 | `notificacoes/page.tsx:179` | UPDATE | lida, lida_em | .eq('lida', false).eq('usuario_id', id) | marcarTodasComoLidas() |
| 6 | `notificacoes/page.tsx:196` | DELETE | — | .eq('id', id) | excluirNotificacao() |
| 7 | `dashboard/page.tsx:56` | SELECT | * | .eq('lida', false).order('created_at', desc) | Contar nao-lidas no dashboard |

**Padroes identificados:**
- Duplicacao entre header.tsx e notificacoes/page.tsx (mesmas queries de SELECT e marcarComoLida)
- Notificacoes sao read-heavy + update (marcar lida)

---

### Mapeamento Detalhado: `feed_comunicacao`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `comunicacao/page.tsx:93` | SELECT (count) | * | .eq('topico_id', id) | Contar mensagens por topico |
| 2 | `comunicacao/[id]/page.tsx:88` | SELECT | *, autor(*) | .eq('topico_id', id).order('created_at', asc) | Carregar mensagens do topico |
| 3 | `comunicacao/[id]/page.tsx:144` | INSERT | tipo, conteudo, autor_id, topico_id, mencoes | — | handleEnviarMensagem() |
| 4 | `comunicacao/feed-item.tsx:159` | DELETE | — | .eq('id', id) | handleDelete() — post |
| 5 | `comunicacao/novo-post-form.tsx:60` | INSERT | tipo, conteudo, autor_id, mencoes, etapa_relacionada_id | — | handleSubmit() — novo post |
| 6 | `comunicacao/mensagem-topico.tsx:81` | DELETE | — | .eq('id', id) | handleDelete() — mensagem |
| 7 | `api/plaud/route.ts:289` | INSERT | tipo, conteudo, autor_id, reuniao_relacionada_id | — | Post de decisao apos reuniao |

---

### Mapeamento Detalhado: `topicos_comunicacao`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `comunicacao/page.tsx:63` | SELECT | *, autor(*), etapa(*) | .order('fixado', desc).order('updated_at', desc) + filtros | fetchTopicos() |
| 2 | `comunicacao/[id]/page.tsx:77` | SELECT | *, autor(*), etapa(*) | .eq('id', id).single() | fetchData() — topico unico |
| 3 | `comunicacao/[id]/page.tsx:168` | UPDATE | status | .eq('id', id) | handleUpdateStatus() |
| 4 | `comunicacao/[id]/page.tsx:191` | UPDATE | fixado | .eq('id', id) | handleToggleFixado() |
| 5 | `comunicacao/[id]/page.tsx:208` | DELETE | — | .eq('id', id) | handleDelete() |
| 6 | `comunicacao/novo-topico-dialog.tsx:61` | INSERT | titulo, descricao, prioridade, etapa_relacionada_id, autor_id | — | handleSubmit() |

---

### Mapeamento Detalhado: `documentos`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `documentos/page.tsx:14` | SELECT | id, nome, url, tipo, tags, tamanho_bytes, created_at, etapa_relacionada_id, etapas(nome) | .order('created_at', desc) | Server component |
| 2 | `documentos/upload-form.tsx:148` | INSERT | nome, tipo, url, tamanho_bytes, mime_type, etapa_relacionada_id, created_by, tags | — | handleUpload() |
| 3 | `documentos/galeria-fotos.tsx:157` | UPDATE | nome, created_at, tags, etapa_relacionada_id | .eq('id', id) | salvarEdicao() |
| 4 | `documentos/galeria-fotos.tsx:251` | DELETE | — | .eq('id', id) | handleDelete() |

---

### Mapeamento Detalhado: `reunioes`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `reunioes/page.tsx:29` | SELECT | *, created_by_user(nome_completo), reunioes_acoes(id,status) | .order('data_reuniao', desc) | loadReunioes() |
| 2 | `reunioes/[id]/page.tsx:45` | SELECT | * | .eq('id', id).single() | loadReuniao() |
| 3 | `reunioes/[id]/page.tsx:100` | DELETE | — | .eq('id', id) | handleDelete() |
| 4 | `reunioes/nova/page.tsx:67` | INSERT | titulo, data_reuniao, participantes, resumo_markdown, created_by | — | handleUpload() — via Plaud |

---

### Mapeamento Detalhado: `reunioes_acoes`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `reunioes/[id]/page.tsx:61` | SELECT | *, responsavel(nome_completo), categoria(nome,cor) | .eq('reuniao_id', id).order('created_at', asc) | loadReuniao() |
| 2 | `reunioes/[id]/page.tsx:80` | UPDATE | status, updated_at | .eq('id', id) | handleStatusChange() |
| 3 | `api/plaud/route.ts:270` | INSERT | reuniao_id, tipo, descricao, responsavel_id, prazo, valor, categoria_id, status | — | Acoes extraidas por IA |

---

### Mapeamento Detalhado: `feed_comentarios`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `comunicacao/feed-item.tsx:129` | INSERT | feed_id, conteudo, autor_id | .select('*, autor(*)').single() | handleAddComment() |

---

### Mapeamento Detalhado: `etapas_dependencias`

| # | Arquivo | Operacao | Campos | Filtros | Funcao/Handler |
|---|---------|----------|--------|---------|----------------|
| 1 | `cronograma/nova-etapa-dialog.tsx:97` | INSERT | etapa_id, depende_de_etapa_id, tipo | — | onSubmit() |

**Nota:** Este e um gap da Fase 1 — a entidade existe mas nao foi incluida nos services de cronograma.

---

### Storage: `notas-compras`

| # | Arquivo | Operacao | Detalhes | Funcao/Handler |
|---|---------|----------|----------|----------------|
| 1 | `financeiro/lancamentos/foto/page.tsx:70` | getPublicUrl | storage.from('notas-compras').getPublicUrl(fileName) | Obter URL publica da foto da nota |

**Nota:** Apenas 1 operacao de leitura de URL. O upload pode estar sendo feito de outra forma.

---

### Arquivos Afetados (consolidado)

| Arquivo | Entidades | Operacoes | Tipo |
|---------|-----------|-----------|------|
| `api/users/route.ts` | users | 4 | API Route |
| `api/emails/sync/route.ts` | emails_monitorados | 2 | API Route |
| `api/emails/process/route.ts` | emails_monitorados | 5 | API Route |
| `api/plaud/route.ts` | users, reunioes_acoes, feed_comunicacao | 3 | API Route |
| `lib/hooks/use-current-user.tsx` | users | 1 | Hook |
| `tarefas/[id]/page.tsx` | users | 2 | Client |
| `tarefas/page.tsx` | users | 1 | Client |
| `dashboard/page.tsx` | users, notificacoes | 2 | Server |
| `cronograma/page.tsx` | users | 1 | Server |
| `configuracoes/usuarios/page.tsx` | users | 1 | Client |
| `documentos/page.tsx` | documentos | 1 | Server |
| `documentos/upload-form.tsx` | documentos, users | 2 | Client |
| `documentos/galeria-fotos.tsx` | documentos | 2 | Client |
| `emails/page.tsx` | emails_monitorados | 1 | Client |
| `emails/[id]/page.tsx` | emails_monitorados | 5 | Client |
| `reunioes/page.tsx` | reunioes | 1 | Client |
| `reunioes/[id]/page.tsx` | reunioes, reunioes_acoes | 4 | Client |
| `reunioes/nova/page.tsx` | reunioes | 1 | Client |
| `notificacoes/page.tsx` | notificacoes | 4 | Client |
| `components/layout/header.tsx` | notificacoes | 2 | Client |
| `comunicacao/page.tsx` | topicos_comunicacao, feed_comunicacao | 2 | Client |
| `comunicacao/[id]/page.tsx` | topicos_comunicacao, feed_comunicacao | 5 | Client |
| `comunicacao/feed-item.tsx` | feed_comunicacao, feed_comentarios | 2 | Client |
| `comunicacao/novo-post-form.tsx` | feed_comunicacao | 1 | Client |
| `comunicacao/mensagem-topico.tsx` | feed_comunicacao | 1 | Client |
| `comunicacao/novo-topico-dialog.tsx` | topicos_comunicacao | 1 | Client |
| `cronograma/nova-etapa-dialog.tsx` | etapas_dependencias | 1 | Client |
| `compras/compra-form.tsx` | users | 1 | Client |
| `financeiro/form-lancamento.tsx` | users | 1 | Client |
| `financeiro/lancamentos/foto/page.tsx` | notas-compras (storage) | 1 | Client |

---

### Questoes para Decisao

**1. `etapas_dependencias` — incluir no service existente `etapas.ts` ou criar novo?**
E apenas 1 operacao (INSERT). Faz sentido adicionar `criarDependenciaEtapa(supabase, data)` ao service `etapas.ts` ja existente da Fase 1, ou criar `etapas-dependencias.ts` separado?

**2. `users` — hook `useCurrentUser` ja centraliza parte. Criar service `users.ts`?**
O hook `useCurrentUser` ja centraliza a busca do usuario atual. Mas ha 13 SELECTs inline espalhados + CRUD completo na API Route. Criar um service `users.ts` e refatorar tudo?

**3. Comunicacao — 3 entidades em 1 service ou separados?**
`feed_comunicacao` (7 ops), `topicos_comunicacao` (6 ops) e `feed_comentarios` (1 op) sao fortemente acoplados. Opcoes:
- **A)** 1 service `comunicacao.ts` com tudo
- **B)** 3 services separados (feed-comunicacao.ts, topicos-comunicacao.ts, feed-comentarios.ts)
- **C)** 2 services (topicos-comunicacao.ts, feed-comunicacao.ts) e feed_comentarios dentro de feed-comunicacao

**4. `notas-compras` (storage) — onde colocar?**
Apenas 1 operacao (getPublicUrl). Incluir no service `compras.ts` da Fase 2 ou criar `notas-compras.ts`?

**5. Escopo: dividir em sub-fases como a Fase 2?**
Com 62 operacoes e ~30 arquivos:
- **A)** Sub-fases: 5a = services, 5b = refatorar componentes (como Fase 2)
- **B)** Executar tudo junto (menos complexo que Fase 2, queries mais simples)

---

#### usuario: Concordo com todas as sugestoes

#### IA: Decisoes registradas, prosseguindo para proposta e spec

---

#### usuario:
=======
#### usuario: Editar data de vencimento de parcelas inline

Requisitos ja definidos:
- Somente data de vencimento
- Uma parcela por vez
- Clicar direto na data e editar inline (date picker)
- Somente parcelas pendentes podem ser alteradas
- Comportamento identico nas duas paginas

#### IA: Proposta completa apresentada abaixo

Apos analise do codigo existente, identifiquei os componentes e a estrutura:

**Pagina `/compras/[id]`** - usa `parcelas-table.tsx` que ja exibe a coluna "Vencimento" com a data formatada. Parcelas pendentes ja tem interacoes (botao "Pagar"). O padrao de Popover + Calendar ja existe nesse componente (usado no dialog de pagamento).

**Pagina `/financeiro/lancamentos`** - usa `lancamentos-table.tsx` que exibe a data na primeira coluna. Aqui a data aparece como texto simples.

A abordagem: transformar a celula de data de vencimento em um componente clicavel que abre um Popover com Calendar (mesmo padrao ja usado no dialog de pagamento do `parcelas-table.tsx`). Somente para parcelas com `pago === false`.
>>>>>>> main

---

## 3. Proposta de Implementacao

<<<<<<< HEAD
**Status:** 🟡 Aguardando aprovacao
=======
**Status:** 🟢 Aprovado
>>>>>>> main

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
<<<<<<< HEAD
- 62 operacoes Supabase inline espalhadas por ~30 arquivos
- Queries de users duplicadas em 10 arquivos
- Pipeline de emails com queries inline em 3 API Routes
- Comunicacao (feed + topicos + comentarios) sem centralizacao
- Notificacoes duplicadas entre header e pagina

**Depois (comportamento proposto):**
- 8 services novos + 1 service modificado centralizados em `src/lib/services/`
- Hook `useCurrentUser` consome service `users.ts`
- API Routes de emails e plaud funcionam como Controllers
- `notas-compras` (getPublicUrl) mantido inline (trivial)

### 3.2 UI Proposta

N/A — refatoracao interna sem impacto visual.

### 3.3 Arquivos Afetados

#### Sub-fase 5a — Criar/Modificar Services

| Acao | Arquivo | Funcoes principais |
|------|---------|--------------------|
| CRIAR | `src/lib/services/users.ts` | buscarUsuarios, buscarUsuariosAtivos, buscarUsuariosParaDropdown, buscarUsuarioPorEmail, buscarPrimeiroUsuario, criarUsuario, atualizarUsuario, desativarUsuario, isAdmin |
| CRIAR | `src/lib/services/emails-monitorados.ts` | buscarEmails, buscarEmailPorId, buscarEmailPorIdExterno, buscarEmailsParaProcessar, criarEmail, atualizarStatusEmail, aprovarEmail, rejeitarEmail |
| CRIAR | `src/lib/services/documentos.ts` | buscarDocumentosComEtapa, criarDocumento, atualizarDocumento, deletarDocumento |
| CRIAR | `src/lib/services/reunioes.ts` | buscarReunioesComDetalhes, buscarReuniaoPorId, criarReuniao, deletarReuniao |
| CRIAR | `src/lib/services/reunioes-acoes.ts` | buscarAcoesPorReuniao, criarAcoes (batch), atualizarStatusAcao |
| CRIAR | `src/lib/services/topicos-comunicacao.ts` | buscarTopicos, buscarTopicoPorId, criarTopico, atualizarStatusTopico, toggleFixadoTopico, deletarTopico |
| CRIAR | `src/lib/services/feed-comunicacao.ts` | buscarMensagensPorTopico, contarMensagensPorTopico, criarMensagem, criarPost, criarPostDecisao, deletarPost, deletarMensagem, criarComentario |
| CRIAR | `src/lib/services/notificacoes.ts` | buscarNotificacoes, buscarNotificacoesRecentes, buscarNotificacoesNaoLidas, marcarComoLida, marcarTodasComoLidas, excluirNotificacao |
| MODIFICAR | `src/lib/services/etapas.ts` | + criarDependenciaEtapa (1 funcao adicionada) |

**Total: 8 novos arquivos + 1 modificado, ~50 funcoes**

#### Sub-fase 5b — Refatorar Componentes

| Acao | Arquivo | Entidades refatoradas |
|------|---------|----------------------|
| MODIFICAR | `api/users/route.ts` | users (4 ops) |
| MODIFICAR | `api/emails/sync/route.ts` | emails_monitorados (2 ops) |
| MODIFICAR | `api/emails/process/route.ts` | emails_monitorados (5 ops) |
| MODIFICAR | `api/plaud/route.ts` | users, reunioes_acoes, feed_comunicacao (3 ops) |
| MODIFICAR | `lib/hooks/use-current-user.tsx` | users (1 op) |
| MODIFICAR | `tarefas/[id]/page.tsx` | users (2 ops) |
| MODIFICAR | `tarefas/page.tsx` | users (1 op) |
| MODIFICAR | `dashboard/page.tsx` | users, notificacoes (2 ops) |
| MODIFICAR | `cronograma/page.tsx` | users (1 op) |
| MODIFICAR | `configuracoes/usuarios/page.tsx` | users (1 op) |
| MODIFICAR | `documentos/page.tsx` | documentos (1 op) |
| MODIFICAR | `documentos/upload-form.tsx` | documentos, users (2 ops) |
| MODIFICAR | `documentos/galeria-fotos.tsx` | documentos (2 ops) |
| MODIFICAR | `emails/page.tsx` | emails_monitorados (1 op) |
| MODIFICAR | `emails/[id]/page.tsx` | emails_monitorados (5 ops) |
| MODIFICAR | `reunioes/page.tsx` | reunioes (1 op) |
| MODIFICAR | `reunioes/[id]/page.tsx` | reunioes, reunioes_acoes (4 ops) |
| MODIFICAR | `reunioes/nova/page.tsx` | reunioes (1 op) |
| MODIFICAR | `notificacoes/page.tsx` | notificacoes (4 ops) |
| MODIFICAR | `components/layout/header.tsx` | notificacoes (2 ops) |
| MODIFICAR | `comunicacao/page.tsx` | topicos_comunicacao, feed_comunicacao (2 ops) |
| MODIFICAR | `comunicacao/[id]/page.tsx` | topicos_comunicacao, feed_comunicacao (5 ops) |
| MODIFICAR | `comunicacao/feed-item.tsx` | feed_comunicacao, feed_comentarios (2 ops) |
| MODIFICAR | `comunicacao/novo-post-form.tsx` | feed_comunicacao (1 op) |
| MODIFICAR | `comunicacao/mensagem-topico.tsx` | feed_comunicacao (1 op) |
| MODIFICAR | `comunicacao/novo-topico-dialog.tsx` | topicos_comunicacao (1 op) |
| MODIFICAR | `cronograma/nova-etapa-dialog.tsx` | etapas_dependencias (1 op) |
| MODIFICAR | `compras/compra-form.tsx` | users (1 op) |
| MODIFICAR | `financeiro/form-lancamento.tsx` | users (1 op) |

**Total: 29 arquivos modificados**

### 3.4 Fluxo de Dados

Identico ao padrao das Fases 1 e 2 (ver `padroes-codigo.md`).

### 3.5 Banco de Dados

N/A — sem alteracoes no banco.
=======
- A data de vencimento e exibida como texto estatico em ambas as tabelas
- Nao ha forma de alterar a data de vencimento de uma parcela apos criacao
- Para alterar, seria necessario cancelar a compra e recriar

**Depois (comportamento proposto):**
- Parcelas pendentes: a data de vencimento e clicavel (sem indicacao visual diferenciada)
- Ao clicar, abre um Popover com Calendar para selecionar nova data
- Ao selecionar a data, salva automaticamente no banco (update na tabela `gastos`, campo `data`)
- Exibe toast de sucesso/erro
- Parcelas pagas: clique nao faz nada (sem interacao)
- Comportamento identico em ambas as paginas

### 3.2 UI Proposta

#### Celula de vencimento (ambas as tabelas)

```
Parcela pendente (aparencia identica a paga):
┌──────────────────────┐
│  12/03/2025          │  ← visualmente igual, mas clicavel
└──────────────────────┘

Ao clicar (pendente):
┌──────────────────────┐
│  12/03/2025          │
├──────────────────────┤
│  ┌────────────────┐  │
│  │   Calendario   │  │  ← Popover com Calendar
│  │   date picker  │  │
│  └────────────────┘  │
└──────────────────────┘

Parcela paga:
┌──────────────────────┐
│  12/03/2025          │  ← texto estatico, clique nao faz nada
└──────────────────────┘
```

**Comportamentos:**
- Sem diferenciacao visual entre editavel e nao editavel
- Click em pendente: abre Popover com Calendar
- Selecionar data: salva imediatamente, fecha Popover, exibe toast
- Erro: exibe toast de erro, mantem data anterior
- Parcela paga: clique nao faz nada

### 3.3 Arquivos Afetados

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/components/features/compras/parcelas-table.tsx` | Celula de vencimento vira Popover+Calendar clicavel para parcelas pendentes |
| MODIFICAR | `src/components/features/financeiro/lancamentos-table.tsx` | Celula de data vira Popover+Calendar clicavel para lancamentos pendentes |

### 3.4 Fluxo de Dados

1. Usuario clica na data de vencimento de uma parcela pendente
2. Popover abre com Calendar mostrando a data atual selecionada
3. Usuario seleciona nova data
4. Componente chama `supabase.from('gastos').update({ data: novaData }).eq('id', parcelaId)`
5. Em caso de sucesso: fecha Popover, exibe toast "Data de vencimento atualizada", callback `onParcelaPaga` (ou equivalente) recarrega dados
6. Em caso de erro: exibe toast de erro, mantem data anterior

### 3.5 Banco de Dados

N/A - sem alteracoes no banco. O campo `data` na tabela `gastos` ja existe e armazena a data de vencimento. Apenas sera feito um UPDATE nesse campo.

### 3.6 Impacto Cross-Domain

N/A - a alteracao e localizada nos componentes de exibicao. Nao afeta outros dominios.
>>>>>>> main

---

## 4. Decisoes Importantes

<<<<<<< HEAD
*(Decisoes herdadas das Alteracoes 03 e 04)*

| # | Decisao | Justificativa |
|---|---------|---------------|
| 1 | **Dependency Injection** — client como 1o parametro | Clean Architecture / Repository Pattern |
| 2 | **Services sao funcoes puras** | Sem estado, sem React, sem side-effects |
| 3 | **throw error** | Services lancam excecoes, componente faz try/catch |
| 4 | **JOINs nos services** | Funcoes nomeadas por "visao" |
| 5 | **Storage em arquivo dedicado** | 1 arquivo por bucket |
| 6 | **Sub-fases** | Criar services primeiro, refatorar componentes depois |
| 7 | **etapas_dependencias em etapas.ts** | Adicionar ao service existente (1 funcao, entidade acoplada) |
| 8 | **users.ts service** | Criar service proprio apesar do hook existente (hook consome service) |
| 9 | **Comunicacao em 2 services** | topicos-comunicacao.ts + feed-comunicacao.ts (inclui feed_comentarios) |
| 10 | **notas-compras inline** | Manter getPublicUrl inline (trivial, sem logica) |
=======
- **Inline Popover vs Modal**: Optamos por Popover inline por ser mais rapido e intuitivo para edicao de campo unico. O padrao de Popover+Calendar ja existe no projeto (dialog de pagamento em `parcelas-table.tsx`).
- **Salvar automatico vs botao confirmar**: Salvar ao selecionar a data (sem botao extra). Para edicao de campo unico, o clique no calendario ja e a confirmacao.
- **Sem feedback visual diferenciado**: A data de parcelas pendentes tem aparencia identica a de parcelas pagas. Apenas o comportamento muda (clicavel vs nao clicavel).
- **Sem restricao de data**: Nao ha restricao sobre a data selecionada (pode ser passada ou futura), pois o usuario pode precisar corrigir datas erradas.
- **Reuso de componentes**: Usaremos os mesmos componentes `Popover`, `Calendar` e `Button` do shadcn/ui ja importados no projeto.
- **Queries inline**: O codigo atual do projeto faz queries Supabase diretamente nos componentes (nao usa services). Para manter consistencia com o codigo existente, a alteracao seguira o mesmo padrao. A migracao para services e objeto da alteracao 03.
>>>>>>> main

---

## 5. Checkpoints

<<<<<<< HEAD
#### Checkpoint 09/02/2026 - Analise
**Status atual:** 🟡 Analise profunda concluida, aguardando respostas
**Levantamento:**
- 62 operacoes inline mapeadas
- 10 entidades + 1 storage bucket
- ~30 arquivos afetados
- 4 API Routes envolvidas (users, emails/sync, emails/process, plaud)
- 2 tabelas sem operacoes no frontend (configuracoes_sistema, centros_custo)

**Proximo passo:** Responder 5 questoes de decisao, preencher secao 3

#### Checkpoint 09/02/2026 - Proposta e Spec
**Status atual:** 🟢 Spec criada
**Decisoes tomadas:** 5 questoes respondidas
**Proposta inclui:**
- 8 services novos + 1 modificado (~50 funcoes)
- 29 arquivos a refatorar
- Sub-fases 5a/5b

**Proximo passo:** Executor pode iniciar
=======
*(Adicionados automaticamente em sessoes longas)*
>>>>>>> main
