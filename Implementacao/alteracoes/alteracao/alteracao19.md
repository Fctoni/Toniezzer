# Alteracao 19 - Renomear codigo de portugues para ingles

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificacao criada |
| Origem | Auditoria de padroes de codigo |
| Complexidade | 🔴 Alta |
| Especificacao | [spec-alteracao19.md](../spec/spec-alteracao19.md) |

---

## 1. Ideia Inicial

Auditoria revelou violacao SISTEMICA do padrao de nomenclatura (secao 7 do `padroes-codigo.md`): "codigo em ingles, textos visiveis em portugues". Aproximadamente 150-200 identificadores estao em portugues: funcoes de services, nomes de arquivos, interfaces, tipos e variaveis.

NOTA: A alteracao09 (🔵 Pronto para executar) cobre "import order + rename de arquivo" parcialmente. Esta alteracao 19 e MUITO mais abrangente e complementa a 09.

---

## 2. Conversa de Planejamento

#### usuario: Analise automatica via auditoria de padroes

#### IA: Mapeamento completo de ~150-200 identificadores em portugues

**Services (21 arquivos, ~140 funcoes em PT):**

Mapeamento dos verbos:
| Atual (PT) | Correto (EN) |
|------------|-------------|
| `buscar*` | `fetch*` |
| `buscarPorId*` | `fetchById*` / `fetch*ById` |
| `buscarParaDropdown*` | `fetchForDropdown*` |
| `criar*` | `create*` |
| `atualizar*` | `update*` |
| `deletar*` | `delete*` |
| `reordenar*` | `reorder*` |
| `calcular*` | `calculate*` |
| `verificar*` | `check*` / `verify*` |
| `cancelar*` | `cancel*` |
| `aprovar*` | `approve*` |
| `rejitar*` | `reject*` |
| `desativar*` | `deactivate*` |

Mapeamento das entidades:
| Atual (PT) | Correto (EN) |
|------------|-------------|
| `Etapas` | `Stages` |
| `Subetapas` | `Substages` |
| `Tarefas` | `Tasks` |
| `Gastos` | `Expenses` |
| `Compras` | `Purchases` |
| `Fornecedores` | `Suppliers` |
| `Categorias` | `Categories` |
| `Subcategorias` | `Subcategories` |
| `Reunioes` | `Meetings` |
| `Acoes` | `Actions` |
| `Topicos` | `Topics` |
| `Usuarios` | `Users` |
| `Notificacoes` | `Notifications` |
| `Documentos` | `Documents` |
| `Recibos` | `Receipts` |
| `Orcamento` | `Budget` |
| `Lancamento` | `Entry` |

**Arquivos de componentes em PT (10+):**
- `editar-etapa-dialog.tsx` → `edit-stage-dialog.tsx`
- `editar-subetapa-dialog.tsx` → `edit-substage-dialog.tsx`
- `editar-tarefa-dialog.tsx` → `edit-task-dialog.tsx`
- `nova-etapa-dialog.tsx` → `new-stage-dialog.tsx`
- `nova-subetapa-dialog.tsx` → `new-substage-dialog.tsx`
- `nova-tarefa-dialog.tsx` → `new-task-dialog.tsx`
- `novo-topico-dialog.tsx` → `new-topic-dialog.tsx`
- `novo-post-form.tsx` → `new-post-form.tsx`
- `form-lancamento.tsx` → `expense-form.tsx`
- `tarefa-detalhes.tsx` → `task-details.tsx`
- `galeria-fotos.tsx` → `photo-gallery.tsx`

**Interfaces/tipos em PT (6+):**
- `EditarEtapaDialogProps` → `EditStageDialogProps`
- `EditarSubetapaDialogProps` → `EditSubstageDialogProps`
- `EditarTarefaDialogProps` → `EditTaskDialogProps`
- `NovoTopicoDialogProps` → `NewTopicDialogProps`
- `NovoPostFormProps` → `NewPostFormProps`
- `FormLancamentoProps` → `ExpenseFormProps`

**API routes - funcoes/schemas em PT:**
- `baixarAnexo()` → `downloadAttachment()`
- `processarImagem()` → `processImage()`
- `processarPDF()` → `processPdf()`
- `processarXML()` → `processXml()`
- `criarUsuarioSchema` → `createUserSchema`
- `atualizarUsuarioSchema` → `updateUserSchema`
- `processarPlaudSchema` → `processPlaudSchema`
- `AcaoExtraida` → `ExtractedAction`
- `DadosExtraidos` → `ExtractedData`

---

## 3. Proposta de Implementacao

**Status:** 🟡 Aguardando aprovacao

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- ~140 funcoes de service com nomes em portugues
- ~10 arquivos de componentes com nomes em portugues
- ~6 interfaces/tipos em portugues
- ~9 funcoes/schemas em API routes em portugues
- Inconsistencia total com o padrao do projeto

**Depois (comportamento proposto):**
- Todas as funcoes de service renomeadas para ingles (fetch*, create*, update*, delete*, etc.)
- Todos os arquivos de componentes renomeados para ingles (kebab-case)
- Todas as interfaces/tipos renomeados para ingles (PascalCase)
- Todas as funcoes de API renomeadas para ingles
- Textos visiveis ao usuario PERMANECEM em portugues (labels, mensagens, toasts)
- Tabelas do banco PERMANECEM com nomes atuais (nao alterar schema)

### 3.2 UI Proposta

N/A - alteracao sem impacto visual (textos visiveis continuam em portugues)

### 3.3 Arquivos Afetados

**Services (21 arquivos — renomear funcoes exportadas):**

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/lib/services/etapas.ts` | Renomear: buscarEtapas→fetchStages, criarEtapa→createStage, etc. |
| MODIFICAR | `src/lib/services/subetapas.ts` | Renomear: buscarSubetapas→fetchSubstages, etc. |
| MODIFICAR | `src/lib/services/tarefas.ts` | Renomear: buscarTarefas→fetchTasks, criarTarefa→createTask, etc. |
| MODIFICAR | `src/lib/services/tarefas-anexos.ts` | Renomear: buscarAnexosDaTarefa→fetchTaskAttachments, etc. |
| MODIFICAR | `src/lib/services/tarefas-comentarios.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/tarefas-dependencias.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/categorias.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/subcategorias.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/fornecedores.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/compras.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/gastos.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/documentos.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/notificacoes.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/reunioes.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/reunioes-acoes.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/topicos-comunicacao.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/feed-comunicacao.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/emails-monitorados.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/recibos.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/orcamento-detalhado.ts` | Renomear funcoes |
| MODIFICAR | `src/lib/services/users.ts` | Renomear funcoes |

**Componentes (renomear arquivos + interfaces):**

| Acao | Arquivo | O que muda |
|------|---------|------------|
| RENOMEAR | `editar-etapa-dialog.tsx` → `edit-stage-dialog.tsx` | + renomear interface |
| RENOMEAR | `editar-subetapa-dialog.tsx` → `edit-substage-dialog.tsx` | + renomear interface |
| RENOMEAR | `editar-tarefa-dialog.tsx` → `edit-task-dialog.tsx` | + renomear interface (2 locais) |
| RENOMEAR | `nova-etapa-dialog.tsx` → `new-stage-dialog.tsx` | + renomear interface |
| RENOMEAR | `nova-subetapa-dialog.tsx` → `new-substage-dialog.tsx` | + renomear interface |
| RENOMEAR | `nova-tarefa-dialog.tsx` → `new-task-dialog.tsx` | + renomear interface |
| RENOMEAR | `novo-topico-dialog.tsx` → `new-topic-dialog.tsx` | + renomear interface |
| RENOMEAR | `novo-post-form.tsx` → `new-post-form.tsx` | + renomear interface |
| RENOMEAR | `form-lancamento.tsx` → `expense-form.tsx` | + renomear interface |
| RENOMEAR | `tarefa-detalhes.tsx` → `task-details.tsx` | + renomear interface |

**API routes (renomear funcoes/schemas/tipos):**

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/api/emails/process/route.ts` | baixarAnexo→downloadAttachment, processarImagem→processImage, etc. |
| MODIFICAR | `src/app/api/users/route.ts` | criarUsuarioSchema→createUserSchema, etc. |
| MODIFICAR | `src/app/api/plaud/route.ts` | processarPlaudSchema→processPlaudSchema, AcaoExtraida→ExtractedAction |

**Pages e componentes consumidores (~29 arquivos):**
Todos os arquivos que importam funcoes renomeadas dos services precisam atualizar os imports.

### 3.4 Fluxo de Dados

Estrategia de execucao por camadas (bottom-up):

1. **Fase 1 - Services**: Renomear funcoes em cada service. Exportar com nomes novos
2. **Fase 2 - Imports**: Atualizar imports em TODOS os consumidores (pages, components, API routes, hooks)
3. **Fase 3 - Arquivos de componentes**: Renomear arquivos e atualizar imports correspondentes
4. **Fase 4 - Interfaces/tipos locais**: Renomear interfaces e tipos em API routes
5. **Fase 5 - Validacao**: `npx tsc --noEmit` para garantir zero erros

IMPORTANTE: Fazer um service de cada vez, atualizando todos os consumidores antes de prosseguir para o proximo. Isso evita quebras em cascata.

### 3.5 Banco de Dados

N/A - tabelas do banco PERMANECEM com nomes atuais em portugues. Apenas o codigo TypeScript muda.

### 3.6 Impacto Cross-Domain

ALTO - esta alteracao afeta TODOS os dominios do projeto pois todos os services serao renomeados. Porem e uma mudanca puramente de nomenclatura, sem alterar logica ou comportamento.

---

## 4. Decisoes Importantes

- **Tabelas do banco ficam em PT**: os nomes das tabelas Supabase (`etapas`, `tarefas`, `gastos`, etc.) NAO mudam. Apenas os nomes das funcoes TypeScript mudam
- **Textos visiveis ficam em PT**: labels, toasts, mensagens de erro para o usuario continuam em portugues
- **Nomes de arquivos de services ficam em EN**: mas manter nomes atuais para evitar churn excessivo? (ex: `etapas.ts` → `stages.ts`?) — **DECISAO PENDENTE: perguntar ao usuario se quer renomear os arquivos de service tambem ou apenas as funcoes**
- **Relacao com alteracao09**: a 09 cobre import order + rename parcial. Esta 19 e complementar e muito mais abrangente. Executar 19 apos 09 ou incorporar 09 na 19
- **Estrategia bottom-up**: renomear services primeiro, depois consumidores, para minimizar quebras intermediarias

---

## 5. Checkpoints

*(nenhum checkpoint necessario neste momento)*
