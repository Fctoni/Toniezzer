# Especificacao: Alteracao 19 - Renomear codigo de portugues para ingles

| Aspecto | Detalhe |
|---------|---------|
| Status | 🔵 Pronto para executar |
| Conversa | [alteracao19.md](../alteracao/alteracao19.md) |
| Data criacao | 2026-02-13 |
| Complexidade | 🔴 Alta |

**Status possiveis:**
- 🔵 Pronto para executar
- 🔴 Em execucao
- 🟠 Aguardando testes
- 🟢 Concluido
- ❌ Cancelado

---

## 1. Resumo

Renomear ~150 identificadores em portugues (funcoes de services, nomes de arquivos de componentes, interfaces/tipos e funcoes internas de API routes) para ingles, seguindo a secao 7 do `padroes-codigo.md`. Tabelas do banco e textos visiveis ao usuario permanecem em portugues.

---

## 2. O que sera feito

- [ ] Renomear funcoes em 21 arquivos de service (PT -> EN)
- [ ] Renomear variaveis locais em PT dentro dos services (ex: `updatesComDatas` -> `updatesWithDates`)
- [ ] Atualizar TODOS os imports nos arquivos consumidores (pages, components, hooks, API routes)
- [ ] Renomear 12 arquivos de componentes (PT -> EN, kebab-case)
- [ ] Renomear interfaces/tipos em PT dentro dos componentes renomeados
- [ ] Renomear funcoes/schemas/interfaces em PT nas API routes
- [ ] Renomear type aliases locais em PT dentro dos services (ex: `type Etapa` -> `type Stage`)
- [ ] Validar com `npx tsc --noEmit` apos cada service completado
- [ ] Validacao final completa com zero erros TypeScript

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- ~140 funcoes de service com nomes em portugues (buscar*, criar*, atualizar*, deletar*, etc.)
- ~12 arquivos de componentes com nomes em portugues (editar-etapa-dialog.tsx, nova-tarefa-dialog.tsx, etc.)
- ~10 interfaces/tipos em portugues (EditarEtapaDialogProps, NovaSubetapaDialogProps, etc.)
- ~9 funcoes/schemas em API routes em portugues (baixarAnexo, processarImagem, criarUsuarioSchema, etc.)
- Type aliases locais em portugues nos services (type Etapa, type Subetapa, type Tarefa, etc.)
- Inconsistencia total com o padrao do projeto (secao 7 do padroes-codigo.md)

**Depois (comportamento proposto):**
- Todas as funcoes de service renomeadas para ingles (fetch*, create*, update*, delete*, etc.)
- Todos os arquivos de componentes renomeados para ingles (kebab-case)
- Todas as interfaces/tipos renomeados para ingles (PascalCase)
- Todas as funcoes de API renomeadas para ingles
- Type aliases locais renomeados para ingles
- Textos visiveis ao usuario PERMANECEM em portugues (labels, mensagens, toasts)
- Tabelas do banco PERMANECEM com nomes atuais (nao alterar schema)
- Nomes dos arquivos de service PERMANECEM em portugues (decisao 4.5) para evitar churn excessivo

### 3.2 UI Proposta

N/A - alteracao sem impacto visual (textos visiveis continuam em portugues)

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A - tabelas do banco PERMANECEM com nomes atuais em portugues. Apenas o codigo TypeScript muda.

### 4.2 Arquivos a Modificar/Criar

#### 4.2.1 Services — Mapeamento completo funcao por funcao

**Arquivo: `src/lib/services/etapas.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Etapa` | `type Stage` |
| function | `buscarEtapas` | `fetchStages` |
| function | `buscarEtapaNome` | `fetchStageName` |
| function | `criarEtapa` | `createStage` |
| function | `atualizarEtapa` | `updateStage` |
| function | `reordenarEtapas` | `reorderStages` |
| function | `deletarEtapa` | `deleteStage` |
| function | `criarDependenciaEtapa` | `createStageDependency` |
| function | `calcularProgressoEtapa` | `calculateStageProgress` |
| function | `calcularDatasEtapa` | `calculateStageDates` |
| variavel | `updatesComDatas` | `updatesWithDates` |
| variavel | `etapasOrdenadas` | `orderedStages` |
| parametro | `data: etapa` (var interna) | `data: stage` (var interna) |

**Arquivo: `src/lib/services/subetapas.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Subetapa` | `type Substage` |
| function | `buscarSubetapas` | `fetchSubstages` |
| function | `buscarSubetapasResumidas` | `fetchSubstagesSummary` |
| function | `buscarSubetapaPorId` | `fetchSubstageById` |
| function | `buscarSubetapasDoResponsavel` | `fetchSubstagesByResponsible` |
| function | `buscarSubetapasPorIds` | `fetchSubstagesByIds` |
| function | `criarSubetapa` | `createSubstage` |
| function | `atualizarSubetapa` | `updateSubstage` |
| function | `reordenarSubetapas` | `reorderSubstages` |
| function | `deletarSubetapa` | `deleteSubstage` |
| function | `calcularProgressoSubetapa` | `calculateSubstageProgress` |
| variavel | `updatesComDatas` | `updatesWithDates` |
| variavel | `subetapasOrdenadas` | `orderedSubstages` |

**Arquivo: `src/lib/services/tarefas.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Tarefa` | `type Task` |
| function | `buscarTarefas` | `fetchTasks` |
| function | `buscarTarefaPorId` | `fetchTaskById` |
| function | `buscarTarefasDoResponsavel` | `fetchTasksByResponsible` |
| function | `buscarTarefasPorSubetapas` | `fetchTasksBySubstages` |
| function | `buscarTarefasPorIds` | `fetchTasksByIds` |
| function | `criarTarefa` | `createTask` |
| function | `atualizarTarefa` | `updateTask` |
| function | `reordenarTarefas` | `reorderTasks` |
| function | `deletarTarefa` | `deleteTask` |
| variavel | `updatesComDatas` | `updatesWithDates` |
| variavel | `tarefasOrdenadas` | `orderedTasks` |

**Arquivo: `src/lib/services/tarefas-anexos.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type TarefaAnexo` | `type TaskAttachment` |
| function | `buscarAnexosDaTarefa` | `fetchTaskAttachments` |
| function | `uploadAnexo` | `uploadAttachment` |
| function | `downloadAnexo` | `downloadAttachment` |
| function | `deletarAnexo` | `deleteAttachment` |
| variavel | `nomeArquivo` | `fileName` |

**Arquivo: `src/lib/services/tarefas-comentarios.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type TarefaComentario` | `type TaskComment` |
| function | `buscarComentariosDaTarefa` | `fetchTaskComments` |
| function | `criarComentario` | `createComment` |

**Arquivo: `src/lib/services/tarefas-dependencias.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type TarefaDependencia` | `type TaskDependency` |
| function | `buscarDependenciasDaTarefa` | `fetchTaskDependencies` |

**Arquivo: `src/lib/services/categorias.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Categoria` | `type Category` |
| function | `buscarCategorias` | `fetchCategories` |
| function | `buscarCategoriasAtivas` | `fetchActiveCategories` |
| function | `buscarCategoriasParaDropdown` | `fetchCategoriesForDropdown` |
| function | `buscarTodasCategoriasParaDropdown` | `fetchAllCategoriesForDropdown` |
| function | `buscarMaxOrdem` | `fetchMaxOrder` |
| function | `criarCategoria` | `createCategory` |
| function | `atualizarCategoria` | `updateCategory` |
| function | `reordenarCategorias` | `reorderCategories` |
| function | `toggleAtivoCategoria` | `toggleActiveCategory` |
| function | `atualizarOrcamentoCategoria` | `updateCategoryBudget` |
| function | `deletarCategoria` | `deleteCategory` |
| function | `verificarDuplicataCategoria` | `checkDuplicateCategory` |
| function | `verificarUsoCategoria` | `checkCategoryUsage` |

**Arquivo: `src/lib/services/subcategorias.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Subcategoria` | `type Subcategory` |
| function | `buscarSubcategorias` | `fetchSubcategories` |
| function | `buscarSubcategoriasAtivas` | `fetchActiveSubcategories` |
| function | `criarSubcategoria` | `createSubcategory` |
| function | `atualizarSubcategoria` | `updateSubcategory` |
| function | `toggleAtivoSubcategoria` | `toggleActiveSubcategory` |
| function | `deletarSubcategoria` | `deleteSubcategory` |
| function | `verificarDuplicataSubcategoria` | `checkDuplicateSubcategory` |
| function | `verificarUsoSubcategoria` | `checkSubcategoryUsage` |

**Arquivo: `src/lib/services/fornecedores.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Fornecedor` | `type Supplier` |
| function | `buscarFornecedores` | `fetchSuppliers` |
| function | `buscarFornecedorPorId` | `fetchSupplierById` |
| function | `buscarFornecedoresParaDropdown` | `fetchSuppliersForDropdown` |
| function | `buscarTodosFornecedoresParaDropdown` | `fetchAllSuppliersForDropdown` |
| function | `buscarFornecedoresAtivos` | `fetchActiveSuppliers` |
| function | `criarFornecedor` | `createSupplier` |
| function | `criarFornecedorRapido` | `createQuickSupplier` |
| function | `atualizarFornecedor` | `updateSupplier` |
| function | `desativarFornecedor` | `deactivateSupplier` |

**Arquivo: `src/lib/services/compras.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Compra` | `type Purchase` |
| type alias | `type CompraComDetalhes` | `type PurchaseWithDetails` |
| type alias | `type CompraComDetalhesFornecedor` | `type PurchaseWithSupplierDetails` |
| function | `buscarComprasComDetalhes` | `fetchPurchasesWithDetails` |
| function | `buscarCompraPorIdComDetalhes` | `fetchPurchaseByIdWithDetails` |
| function | `buscarCompraPorId` | `fetchPurchaseById` |
| function | `criarCompra` | `createPurchase` |
| function | `atualizarCompra` | `updatePurchase` |
| function | `cancelarCompra` | `cancelPurchase` |

**Arquivo: `src/lib/services/gastos.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Gasto` | `type Expense` |
| type alias | `type GastoComDetalhes` | `type ExpenseWithDetails` |
| type alias | `type GastoAprovado` | `type ApprovedExpense` |
| type alias | `type GastoPorFornecedor` | `type ExpenseBySupplier` |
| type alias | `type GastoDetalhadoPorCategoria` | `type DetailedExpenseByCategory` |
| function | `buscarGastosComDetalhes` | `fetchExpensesWithDetails` |
| function | `buscarGastosAprovados` | `fetchApprovedExpenses` |
| function | `buscarGastosAprovadosResumidos` | `fetchApprovedExpensesSummary` |
| function | `buscarGastosPorEtapa` | `fetchExpensesByStage` |
| function | `buscarGastosMatriz` | `fetchExpensesMatrix` |
| function | `buscarGastosPorCompra` | `fetchExpensesByPurchase` |
| function | `buscarGastosPorFornecedor` | `fetchExpensesBySupplier` |
| function | `buscarGastosDetalhadosPorCategoria` | `fetchDetailedExpensesByCategory` |
| function | `criarGastos` | `createExpenses` |
| function | `criarGastoAvulso` | `createSingleExpense` |
| function | `atualizarGastosPorCompra` | `updateExpensesByPurchase` |
| function | `marcarPago` | `markAsPaid` |
| function | `atualizarDataVencimento` | `updateDueDate` |
| function | `atualizarComprovante` | `updateReceipt` |
| function | `contarGastosPorCategoria` | `countExpensesByCategory` |
| function | `contarGastosPorSubcategoria` | `countExpensesBySubcategory` |

**Arquivo: `src/lib/services/documentos.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Documento` | `type Document` |
| function | `buscarDocumentosComEtapa` | `fetchDocumentsWithStage` |
| function | `criarDocumento` | `createDocument` |
| function | `atualizarDocumento` | `updateDocument` |
| function | `deletarDocumento` | `deleteDocument` |

**Arquivo: `src/lib/services/notificacoes.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Notificacao` | `type Notification` |
| function | `buscarNotificacoes` | `fetchNotifications` |
| function | `buscarNotificacoesRecentes` | `fetchRecentNotifications` |
| function | `buscarNotificacoesNaoLidas` | `fetchUnreadNotifications` |
| function | `marcarComoLida` | `markAsRead` |
| function | `marcarTodasComoLidas` | `markAllAsRead` |
| function | `excluirNotificacao` | `deleteNotification` |

**Arquivo: `src/lib/services/reunioes.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type Reuniao` | `type Meeting` |
| function | `buscarReunioesComDetalhes` | `fetchMeetingsWithDetails` |
| function | `buscarReuniaoPorId` | `fetchMeetingById` |
| function | `criarReuniao` | `createMeeting` |
| function | `deletarReuniao` | `deleteMeeting` |

**Arquivo: `src/lib/services/reunioes-acoes.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type ReuniaoAcao` | `type MeetingAction` |
| function | `buscarAcoesPorReuniao` | `fetchActionsByMeeting` |
| function | `criarAcoes` | `createActions` |
| function | `atualizarStatusAcao` | `updateActionStatus` |

**Arquivo: `src/lib/services/topicos-comunicacao.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type TopicoComunicacao` | `type CommunicationTopic` |
| function | `buscarTopicos` | `fetchTopics` |
| function | `buscarTopicoPorId` | `fetchTopicById` |
| function | `criarTopico` | `createTopic` |
| function | `atualizarStatusTopico` | `updateTopicStatus` |
| function | `toggleFixadoTopico` | `togglePinnedTopic` |
| function | `deletarTopico` | `deleteTopic` |

**Arquivo: `src/lib/services/feed-comunicacao.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type FeedComunicacao` | `type FeedPost` |
| type alias | `type FeedComentario` | `type FeedComment` |
| function | `buscarMensagensPorTopico` | `fetchMessagesByTopic` |
| function | `contarMensagensPorTopico` | `countMessagesByTopic` |
| function | `criarMensagem` | `createMessage` |
| function | `criarPost` | `createPost` |
| function | `criarPostDecisao` | `createDecisionPost` |
| function | `deletarPost` | `deletePost` |
| function | `deletarMensagem` | `deleteMessage` |
| function | `criarComentario` | `createFeedComment` |

**Arquivo: `src/lib/services/emails-monitorados.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type EmailMonitorado` | `type MonitoredEmail` |
| function | `buscarEmails` | `fetchEmails` |
| function | `buscarEmailPorId` | `fetchEmailById` |
| function | `buscarEmailPorIdExterno` | `fetchEmailByExternalId` |
| function | `buscarEmailsParaProcessar` | `fetchEmailsForProcessing` |
| function | `criarEmail` | `createEmail` |
| function | `atualizarAnexosEmail` | `updateEmailAttachments` |
| function | `atualizarStatusEmail` | `updateEmailStatus` |
| function | `aprovarEmail` | `approveEmail` |
| function | `rejeitarEmail` | `rejectEmail` |

**Arquivo: `src/lib/services/recibos.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| function | `uploadComprovante` | `uploadReceipt` |

**Arquivo: `src/lib/services/orcamento-detalhado.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| type alias | `type OrcamentoDetalhado` | `type DetailedBudget` |
| type alias | `type DetalhamentoComCategoria` | `type BudgetDetailWithCategory` |
| function | `buscarDetalhamentoComCategoria` | `fetchBudgetDetailWithCategory` |
| function | `buscarDetalhamentoPorEtapa` | `fetchBudgetDetailByStage` |
| function | `buscarDetalhamentoMatriz` | `fetchBudgetDetailMatrix` |
| function | `salvarDetalhamento` | `saveBudgetDetail` |
| function | `deletarDetalhamentoPorEtapa` | `deleteBudgetDetailByStage` |
| function | `contarDetalhamentoPorCategoria` | `countBudgetDetailByCategory` |

**Arquivo: `src/lib/services/users.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| function | `buscarUsuarios` | `fetchUsers` |
| function | `buscarUsuariosAtivos` | `fetchActiveUsers` |
| function | `buscarUsuariosParaDropdown` | `fetchUsersForDropdown` |
| function | `buscarUsuarioPorEmail` | `fetchUserByEmail` |
| function | `buscarPrimeiroUsuario` | `fetchFirstUser` |
| function | `criarUsuario` | `createUser` |
| function | `atualizarUsuario` | `updateUser` |
| function | `desativarUsuario` | `deactivateUser` |
| function | `isAdmin` | `isAdmin` (ja em ingles, manter) |

#### 4.2.2 Componentes — Renomear arquivos + interfaces

| Acao | Caminho atual | Caminho novo | Interface PT | Interface EN |
|------|---------------|--------------|--------------|--------------|
| RENOMEAR | `src/components/features/cronograma/editar-etapa-dialog.tsx` | `src/components/features/cronograma/edit-stage-dialog.tsx` | `EditarEtapaDialogProps` | `EditStageDialogProps` |
| RENOMEAR | `src/components/features/cronograma/editar-subetapa-dialog.tsx` | `src/components/features/cronograma/edit-substage-dialog.tsx` | `EditarSubetapaDialogProps` | `EditSubstageDialogProps` |
| RENOMEAR | `src/components/features/cronograma/editar-tarefa-dialog.tsx` | `src/components/features/cronograma/edit-task-dialog.tsx` | `EditarTarefaDialogProps` | `EditTaskDialogProps` |
| RENOMEAR | `src/components/features/tarefas/editar-tarefa-dialog.tsx` | `src/components/features/tarefas/edit-task-dialog.tsx` | `EditarTarefaDialogProps` | `EditTaskDialogProps` |
| RENOMEAR | `src/components/features/cronograma/nova-etapa-dialog.tsx` | `src/components/features/cronograma/new-stage-dialog.tsx` | `NovaEtapaDialogProps` | `NewStageDialogProps` |
| RENOMEAR | `src/components/features/cronograma/nova-subetapa-dialog.tsx` | `src/components/features/cronograma/new-substage-dialog.tsx` | `NovaSubetapaDialogProps` | `NewSubstageDialogProps` |
| RENOMEAR | `src/components/features/tarefas/nova-tarefa-dialog.tsx` | `src/components/features/tarefas/new-task-dialog.tsx` | `NovaTarefaDialogProps` | `NewTaskDialogProps` |
| RENOMEAR | `src/components/features/comunicacao/novo-topico-dialog.tsx` | `src/components/features/comunicacao/new-topic-dialog.tsx` | `NovoTopicoDialogProps` | `NewTopicDialogProps` |
| RENOMEAR | `src/components/features/comunicacao/novo-post-form.tsx` | `src/components/features/comunicacao/new-post-form.tsx` | `NovoPostFormProps` | `NewPostFormProps` |
| RENOMEAR | `src/components/features/financeiro/form-lancamento.tsx` | `src/components/features/financeiro/expense-form.tsx` | `FormLancamentoProps` | `ExpenseFormProps` |
| RENOMEAR | `src/components/features/tarefas/tarefa-detalhes.tsx` | `src/components/features/tarefas/task-details.tsx` | `TarefaDetalhesProps` | `TaskDetailsProps` |
| RENOMEAR | `src/components/features/documentos/galeria-fotos.tsx` | `src/components/features/documentos/photo-gallery.tsx` | `GaleriaFotosProps` | `PhotoGalleryProps` |

#### 4.2.3 API Routes — Renomear funcoes/schemas/tipos internos

**Arquivo: `src/app/api/emails/process/route.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| interface | `DadosExtraidos` | `ExtractedData` |
| function | `baixarAnexo` | `downloadAttachment` |
| function | `processarImagem` | `processImage` |
| function | `processarPDF` | `processPdf` |
| function | `processarXML` | `processXml` |

**Arquivo: `src/app/api/users/route.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| const | `criarUsuarioSchema` | `createUserSchema` |
| const | `atualizarUsuarioSchema` | `updateUserSchema` |
| variavel | `resultado` | `result` |

**Arquivo: `src/app/api/plaud/route.ts`**

| Tipo | Nome atual (PT) | Nome novo (EN) |
|------|-----------------|----------------|
| const | `processarPlaudSchema` | `processPlaudSchema` (ja parcialmente EN, manter) |
| interface | `AcaoExtraida` | `ExtractedAction` |
| interface | `DadosExtraidos` | `ExtractedData` |
| variavel | `resultado` | `result` |
| variavel | `acoesParaInserir` | `actionsToInsert` |
| variavel | `acoesCriadas` | `actionsCreated` |
| variavel | `acoesInseridas` | `insertedActions` |
| variavel | `decisoesTexto` | `decisionsText` |

#### 4.2.4 Consumidores — Arquivos que importam services renomeados

Todos os arquivos que importam funcoes dos 21 services listados acima precisam ter seus imports atualizados. O Executor deve usar busca global (`grep`/`Grep`) para cada funcao renomeada para encontrar todos os consumidores.

**Estrategia:** Para cada service, apos renomear as funcoes exportadas, buscar em todo o projeto por cada nome antigo e atualizar os imports.

### 4.3 Fluxo de Dados

Estrategia de execucao bottom-up, **um service por vez**:

**Fase 1 — Services (um a um, com validacao intermediaria):**

Para CADA service, na ordem abaixo:

1. Renomear funcoes exportadas no service
2. Renomear type aliases locais no service
3. Renomear variaveis internas em PT no service
4. Buscar TODOS os arquivos que importam funcoes do service (grep pelo nome do arquivo ou nome das funcoes)
5. Atualizar imports e chamadas em TODOS os consumidores
6. Executar `npx tsc --noEmit` para validar zero erros antes de prosseguir

**Ordem sugerida de services** (dos menos dependidos aos mais dependidos):

1. `tarefas-dependencias.ts` (1 funcao, poucos consumidores)
2. `tarefas-comentarios.ts` (2 funcoes)
3. `tarefas-anexos.ts` (4 funcoes)
4. `recibos.ts` (1 funcao)
5. `documentos.ts` (4 funcoes)
6. `notificacoes.ts` (6 funcoes)
7. `reunioes-acoes.ts` (3 funcoes)
8. `reunioes.ts` (4 funcoes)
9. `feed-comunicacao.ts` (9 funcoes)
10. `topicos-comunicacao.ts` (6 funcoes)
11. `emails-monitorados.ts` (9 funcoes)
12. `orcamento-detalhado.ts` (6 funcoes)
13. `subcategorias.ts` (8 funcoes)
14. `users.ts` (9 funcoes)
15. `fornecedores.ts` (9 funcoes)
16. `categorias.ts` (14 funcoes)
17. `compras.ts` (6 funcoes)
18. `gastos.ts` (14 funcoes)
19. `subetapas.ts` (11 funcoes)
20. `tarefas.ts` (10 funcoes)
21. `etapas.ts` (10 funcoes)

**Fase 2 — Arquivos de componentes (renomear ficheiros):**

Para CADA componente da lista 4.2.2:

1. Criar o novo arquivo com o novo nome
2. Atualizar a interface Props dentro do arquivo
3. Buscar TODOS os imports que referenciam o arquivo antigo
4. Atualizar os imports para o novo caminho
5. Deletar o arquivo antigo
6. Executar `npx tsc --noEmit`

**Fase 3 — API Routes (funcoes internas):**

1. Renomear funcoes/schemas/interfaces/variaveis internas em cada API route
2. Estes sao internos (nao exportados), entao nao afetam outros arquivos
3. Executar `npx tsc --noEmit`

**Fase 4 — Validacao final:**

1. `npx tsc --noEmit` completo — zero erros
2. Revisao rapida para garantir que nenhum nome em PT restou nos exports

### 4.4 Dependencias Externas

Nenhuma dependencia externa necessaria. Alteracao puramente de refatoracao de nomenclatura.

---

### 4.5 Decisoes de Design e Justificativas

- **Nomes de ARQUIVOS de service permanecem em PT:** Os arquivos `etapas.ts`, `subetapas.ts`, `tarefas.ts`, etc. NAO serao renomeados para `stages.ts`, `substages.ts`, `tasks.ts`. Motivo: (1) os nomes refletem as tabelas do banco que tambem estao em PT, mantendo rastreabilidade direta; (2) evita churn excessivo nos imports de dezenas de consumidores; (3) a alteracao09 ja cobre renomeacao parcial de arquivos e pode ser executada separadamente se desejado
- **Tabelas do banco ficam em PT:** os nomes das tabelas Supabase (`etapas`, `tarefas`, `gastos`, etc.) NAO mudam. Apenas os nomes das funcoes TypeScript mudam
- **Textos visiveis ficam em PT:** labels, toasts, mensagens de erro para o usuario continuam em portugues
- **Estrategia bottom-up:** renomear services primeiro, depois consumidores, depois componentes, para minimizar quebras intermediarias. Validar com tsc apos cada service
- **Type aliases locais nos services serao renomeados:** `type Etapa` -> `type Stage`, etc. Estes tipos sao apenas aliases internos do service e nao afetam consumidores (que usam `Tables<'etapas'>` diretamente ou recebem via retorno de funcao)
- **Relacao com alteracao09:** a 09 cobre import order + rename parcial de arquivos. Esta 19 e complementar e muito mais abrangente. Recomendacao: executar 19 primeiro, depois 09 (que pode ser simplificada apos 19)

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [ ] Fase 1: Services renomeados (21 arquivos)
- [ ] Fase 1: Todos os consumidores atualizados
- [ ] Fase 2: Componentes renomeados (12 arquivos)
- [ ] Fase 2: Interfaces renomeadas
- [ ] Fase 3: API routes renomeadas (3 arquivos)
- [ ] Fase 4: `npx tsc --noEmit` sem erros
- [ ] Testado manualmente

### 5.2 Notas de Implementacao

[Decisoes tomadas durante a execucao, problemas encontrados, solucoes aplicadas]

### 5.3 Conversa de Execucao

*(problemas encontrados durante execucao, solucoes propostas)*

#### IA:
[mensagem]

---

## 6. Validacao Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
