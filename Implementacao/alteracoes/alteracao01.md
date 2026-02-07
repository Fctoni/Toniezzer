# Alteração 01 - Sistema de 3 níveis: Etapa → Subetapa → Tarefas

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificação criada |
| Origem | Necessidade de expandir cronograma para 3 níveis hierárquicos |
| Complexidade | 🔴 Alta |
| Especificação | [spec-alteracao01.md](./spec-alteracao01.md) |

**Status possíveis:**
- 🟡 Em planejamento
- 🟢 Especificação criada → ver [spec-alteracao01.md](./spec-alteracao01.md)

---

## 1. Ideia Inicial

**Problema identificado:**
Hoje o sistema tem apenas 2 níveis: `Etapa → Tarefas`

**Exemplo atual:**
- Etapa: Serviços preliminares
  - Tarefa: Base da caixa de entrada
  - Tarefa: Tampões

**Estrutura necessária:**
Criar hierarquia de 3 níveis: `Etapa → Subetapa → Tarefas`

**Exemplo proposto:**
- Etapa: Serviços preliminares
  - Subetapa: Base da caixa de entrada
    - Tarefa: Adquirir concreto
    - Tarefa: Adquirir ferro
    - Tarefa: Marcar com a escavadeira
  - Subetapa: Tampões
    - Tarefa: ...

**Necessidades:**
- Renomear/migrar o que hoje é "tarefa" para "subetapa"
- Criar novo conceito de "tarefas" vinculadas a subetapas
- Página `/tarefas` com visão geral de todas as tarefas
- Filtros por usuário, etapa, subetapa, status, data, etc.
- Sistema de dependências entre tarefas (travas)
- Apenas admins podem criar/editar/excluir etapas e subetapas
- Responsáveis podem editar suas próprias tarefas

---

## 2. Conversa de Planejamento

#### IA: Perguntas de esclarecimento

Preciso entender melhor a estrutura para propor a implementação. Tenho 8 grupos de perguntas sobre migração, campos, visualização, páginas, permissões, dashboard, campos adicionais e plano.

---

#### usuário: Respostas

1. **Migração**: Pode remover tarefas atuais (são mock data)
2. **Campos Subetapas**: Trazer sugestões
3. **Campos Tarefas**: Sistema de dependências/travas entre tarefas
4. **Visualização**: Combinar expansão aninhada + modal + página dedicada por tarefa
5. **Páginas**: `/tarefas` com tabela plana e filtros; sem página dedicada de subetapas
6. **Permissões**:
   - Etapas: apenas admins
   - Subetapas: admin + responsável da etapa
   - Tarefas: admin + resp. subetapa + resp. tarefa (pode editar descrição, anexos, notas)
7. **Dashboard**: Sim, widget com tarefas e subetapas do usuário
8. **Campos**: Prioridade, data estimada, tags, anexos, comentários - tudo marcado

---

## 3. Proposta de Implementação

**Status:** 🟡 Aguardando aprovação (após análise do código existente)

### 📚 Padrões Encontrados no Projeto

Antes de propor a implementação, foram analisados os padrões existentes:

| Aspecto | Padrão Atual | Como Seguir |
|---------|--------------|-------------|
| **Modais/Dialogs** | `Dialog` shadcn/ui + `react-hook-form` + `zod` | Props: `open`, `onOpenChange`, `onSuccess`, `onDelete` |
| **Estado** | `useState` manual (sem React Query/SWR) | Queries diretas com `createClient()` |
| **Hooks** | Apenas utilitários (useCurrentUser, useMediaQuery) | **NÃO criar hooks de CRUD** - fazer queries inline |
| **Tipos** | Gerados pelo Supabase: `Tables<"nome">.Row` | Seguir estrutura `database.ts` |
| **Refresh** | Callback `onSuccess` + `router.refresh()` | Atualização otimista + toast |
| **Upload** | `supabase.storage.from('bucket').upload()` | Interface `FileWithPreview` com preview/progress |
| **Filtros** | Componente separado, client-side | Interface `Filters` + função `updateFilter` genérica |
| **Drag & Drop** | `@dnd-kit` com estado otimista | Atualiza UI → salva banco → toast |
| **RLS** | Usa `auth.uid()` ao invés de `auth.jwt()` | Verificar sintaxe correta |

**Referências de implementação:**
- Modal: `nova-tarefa-dialog.tsx` (linha 129: padrão Dialog + onOpenChange)
- Tabela: `cronograma-table.tsx` (linha 651: estado local + queries diretas)
- Filtros: `compras-filters.tsx` (linha 76: interface + updateFilter genérica)
- Upload: `upload-form.tsx` (linha 38: FileWithPreview + supabase.storage)
- Tipos: `database.ts` (estrutura Tables)

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- Sistema tem 2 níveis: Etapa → Tarefas
- Tabela `tarefas` vinculada a `etapas`
- Exemplo: Etapa "Serviços Preliminares" → Tarefa "Base da caixa"
- Não há nível intermediário de agrupamento
- Sem sistema de dependências entre tarefas
- Sem prioridades, tags ou anexos em tarefas

**Depois (comportamento proposto):**
- Sistema terá 3 níveis: Etapa → Subetapa → Tarefas
- Tabela `subetapas` vinculada a `etapas`
- Tabela `tarefas` (nova) vinculada a `subetapas`
- Exemplo: Etapa "Serviços Preliminares" → Subetapa "Base da caixa" → Tarefas ("Adquirir concreto", "Marcar empilhadeira")
- Sistema de dependências: tarefas podem bloquear outras
- Tarefas com prioridade, tags, anexos, notas
- Página dedicada `/tarefas` com visão geral e filtros
- Widget "Minhas Tarefas" no dashboard
- Página individual por tarefa `/tarefas/[id]`

### 3.2 UI Proposta

#### Tela 1: `/cronograma` (atualizar existente)

```
┌──────────────────────────────────────────────────────────────┐
│ 🏗️ Cronograma                           [+ Nova Etapa]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [▼] Etapa: Serviços Preliminares          Status: ⚡ Em And. │
│     Resp: João Silva    Prazo: 15/02-20/03   Progresso: 45%  │
│                                                              │
│     [▼] Subetapa: Base da caixa de entrada  [+ Tarefa] [✏️]  │
│         Resp: Maria    Prazo: 15/02-20/02    3/5 tarefas     │
│                                                              │
│         ├─ ✅ Adquirir concreto (Maria) - 15/02             │
│         ├─ ✅ Adquirir ferro (João) - 16/02                 │
│         ├─ 🔒 Marcar empilhadeira (Pedro) - 17/02 [👁️]      │
│         ├─ ⏸️ Instalar base (Maria) - 18/02 [👁️]            │
│         └─ ⏸️ Conferir nível (João) - 20/02 [👁️]            │
│                                                              │
│         [Ver todas tarefas]  [+ Adicionar tarefa]            │
│                                                              │
│     [▶] Subetapa: Tampões                  [+ Tarefa] [✏️]  │
│         Resp: Carlos    Prazo: 21/02-25/02   0/3 tarefas    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Click em [▼] expande/colapsa subetapa
- Click em [👁️] abre modal com detalhes rápidos da tarefa
- Click no nome da tarefa navega para `/tarefas/[id]`
- Ícone 🔒 indica tarefa bloqueada por dependências
- [+ Tarefa] visível apenas para Admin/Resp.Subetapa
- Drag & drop para reordenar subetapas e tarefas

---

#### Tela 2: `/tarefas` (nova)

```
┌──────────────────────────────────────────────────────────────────┐
│ ✓ Tarefas                                       [+ Nova Tarefa]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Filtros:                                                         │
│ [🔍 Buscar...] [Etapa ▼] [Subetapa ▼] [Responsável ▼] [Status ▼]│
│ [Prioridade ▼] [📅 Período] [🏷️ Tags] [⚠️ Só bloqueadas]        │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Métricas                                                   │  │
│ │ Total: 45  │  Pendentes: 12  │  Em And.: 8  │  Concluídas: 25│
│ │ Bloqueadas: 3  │  Atrasadas: 2                             │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Nome │ Etapa/Sub │ Resp. │ Prazo │ Status │ Prior. │ Ações  ││
│ ├──────────────────────────────────────────────────────────────│ │
│ │ 🔒 Marcar emp. │ Serv.Prel/Base │ Pedro │ 17/02 │ 🔒 │ 🔴 │ [👁️]││
│ │ Adq. concreto │ Serv.Prel/Base │ Maria │ 15/02 │ ✅ │ 🟠 │ [👁️]││
│ │ Instalar base │ Serv.Prel/Base │ Maria │ 18/02 │ ⏸️ │ 🟢 │ [👁️]││
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Ordenação: [Data ▲] [Prioridade] [Status] [Etapa]              │
└──────────────────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Filtros combinados em tempo real
- Click na linha abre `/tarefas/[id]`
- Hover mostra tooltip com dependências (se bloqueada)
- Badges coloridos por prioridade
- Exportar CSV (apenas admin)

---

#### Tela 3: `/tarefas/[id]` (nova)

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Voltar   ✓ Marcar com empilhadeira                    [Editar]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────┬──────────────────────────────────┐  │
│ │ 📋 Informações Básicas  │  🎯 Status & Responsável         │  │
│ ├─────────────────────────┼──────────────────────────────────┤  │
│ │ Etapa: Serviços Prelim. │  Status: 🔒 Bloqueada            │  │
│ │ Subetapa: Base caixa    │  Prioridade: 🔴 Crítica          │  │
│ │ Prazo: 17/02/2026       │  Responsável: Pedro Silva        │  │
│ └─────────────────────────┴──────────────────────────────────┘  │
│                                                                  │
│ ⚠️ Tarefa bloqueada - aguardando:                               │
│    • ✅ Adquirir concreto (concluída)                           │
│    • ⏸️ Adquirir ferro (pendente)                               │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 📝 Descrição                                               │  │
│ │ [Textarea editável pelo responsável]                       │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 🏷️ Tags: [elétrica] [urgente] [externa]      [+ Tag]      │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 📎 Anexos (2)                                [Upload]       │  │
│ │ • projeto-base.pdf (150KB)                    [Baixar] [X] │  │
│ │ • foto-terreno.jpg (2.3MB)                    [Baixar] [X] │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 💬 Notas & Comentários                                     │  │
│ │ [Adicionar nota...]                                        │  │
│ │ 📌 15/02 10:30 - João: Aguardando aprovação do projeto    │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│                              [Salvar alterações] [Excluir]      │
└──────────────────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Admin: edita tudo + exclui
- Resp. Subetapa: edita tudo (não exclui)
- Resp. Tarefa: edita descrição, anexos, notas, status
- Outros: apenas visualizam

---

#### Componente 4: Widget Dashboard "Minhas Tarefas"

```
┌──────────────────────────────────────────────────────────────┐
│ 📋 Minhas Tarefas                        [Ver todas]          │
├──────────────────────────────────────────────────────────────┤
│ ⚠️ Atrasadas (2)                                             │
│ • 🔴 Conferir instalação elétrica  (Atraso: 3 dias)  [Ver]   │
│                                                              │
│ 🎯 Em Andamento (1)                                          │
│ • 🟠 Marcar empilhadeira           (Prazo: Hoje)     [Ver]   │
│                                                              │
│ 📅 Próximas (3) - próximos 7 dias                            │
│ • Instalar base (18/02)  • Impermeabilizar (20/02)          │
│                                                              │
│ 📊 Minhas Subetapas (2)                                      │
│ • Base da caixa: 3/5 ████░  • Hidráulicas: 0/8 ░░░░░        │
└──────────────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Atualiza em tempo real
- Click em [Ver] abre `/tarefas/[id]`
- Quick actions: Iniciar, Concluir, Pausar

---

#### Modal 5: Criar/Editar Tarefa

```
┌─────────────────────────────────────────────────────────────┐
│ ✏️ Editar Tarefa                                [X]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nome *                                                      │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Marcar com empilhadeira                               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Descrição                                                   │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [Textarea]                                            │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Responsável          Prioridade           Data Prevista    │
│ [Pedro Silva ▼]      [🔴 Crítica ▼]      [17/02/2026 📅]   │
│                                                             │
│ Esta tarefa depende de: (opcional)                          │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [X] Adquirir concreto                                 │   │
│ │ [X] Adquirir ferro                                    │   │
│ │ [ ] Preparar terreno                                  │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ⚠️ Tarefa bloqueada até conclusão de 2 tarefas anteriores  │
│                                                             │
│                            [Cancelar]  [Salvar]             │
└─────────────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Multi-select de dependências
- Validação: não permite dependência circular
- Calcula automaticamente status "bloqueada"

### 3.3 Arquivos Afetados

| Ação | Arquivo | O que muda |
|------|---------|------------|
| **BANCO DE DADOS** |
| DELETAR | `tarefas` (tabela antiga) | Remover tabela de mock data |
| CRIAR | `subetapas` (tabela) | Nova tabela com campos similares às tarefas antigas |
| CRIAR | `tarefas` (tabela nova) | Nova tabela com dependências, prioridade, tags, anexos |
| **TIPOS TYPESCRIPT** |
| MODIFICAR | `src/lib/types/database.ts` | Adicionar tipos `Subetapa` e `Tarefa` (nova estrutura) |
| **PÁGINAS** |
| MODIFICAR | `src/app/(dashboard)/cronograma/page.tsx` | Atualizar para carregar 3 níveis (etapas → subetapas → tarefas) |
| CRIAR | `src/app/(dashboard)/tarefas/page.tsx` | Nova página com tabela de todas as tarefas + filtros |
| CRIAR | `src/app/(dashboard)/tarefas/[id]/page.tsx` | Página dedicada de detalhes da tarefa |
| MODIFICAR | `src/app/(dashboard)/dashboard/page.tsx` | Adicionar widget "Minhas Tarefas" |
| **COMPONENTES - CRONOGRAMA** |
| MODIFICAR | `src/components/features/cronograma/cronograma-table.tsx` | Adicionar nível de subetapas (3 níveis hierárquicos) |
| MODIFICAR | `src/components/features/cronograma/cronograma-mobile.tsx` | Adaptar para 3 níveis no mobile |
| DELETAR | `src/components/features/cronograma/nova-tarefa-dialog.tsx` | Remover (antigo) |
| DELETAR | `src/components/features/cronograma/tarefas-list.tsx` | Remover (antigo) |
| CRIAR | `src/components/features/cronograma/nova-subetapa-dialog.tsx` | Dialog para criar subetapa |
| CRIAR | `src/components/features/cronograma/editar-subetapa-dialog.tsx` | Dialog para editar subetapa |
| CRIAR | `src/components/features/cronograma/subetapas-list.tsx` | Lista de subetapas dentro de uma etapa |
| **COMPONENTES - TAREFAS** |
| CRIAR | `src/components/features/tarefas/nova-tarefa-dialog.tsx` | Dialog para criar tarefa (com dependências) |
| CRIAR | `src/components/features/tarefas/editar-tarefa-dialog.tsx` | Dialog para editar tarefa |
| CRIAR | `src/components/features/tarefas/tarefas-table.tsx` | Tabela de tarefas com filtros |
| CRIAR | `src/components/features/tarefas/tarefas-filters.tsx` | Componente de filtros avançados |
| CRIAR | `src/components/features/tarefas/tarefa-detail.tsx` | Componente de detalhes completos da tarefa |
| CRIAR | `src/components/features/tarefas/dependencias-selector.tsx` | Multi-select de dependências |
| CRIAR | `src/components/features/tarefas/anexos-upload.tsx` | Upload de anexos |
| CRIAR | `src/components/features/tarefas/notas-comentarios.tsx` | Sistema de notas/comentários |
| **COMPONENTES - DASHBOARD** |
| CRIAR | `src/components/features/dashboard/minhas-tarefas-widget.tsx` | Widget de tarefas do usuário |
| **UTILS** |
| CRIAR | `src/lib/utils/dependencias.ts` | Funções auxiliares (detectar ciclo, calcular bloqueios) |
| CRIAR | `src/lib/utils/progresso.ts` | Calcular progresso de subetapas/etapas |
| **STORAGE** |
| CRIAR | Bucket `tarefas-anexos` no Supabase Storage | Armazenamento de anexos de tarefas |

**Total:** ~31 arquivos (10 modificar, 3 deletar, 18 criar) + 1 storage bucket

**Observação:** Seguindo o padrão do projeto, **NÃO serão criados hooks de CRUD**. As queries serão feitas diretamente nos componentes usando `createClient()`, conforme padrão existente em `cronograma-table.tsx`.

### 3.4 Fluxo de Dados

#### Fluxo 1: Carregar Cronograma (3 níveis)

1. Usuário acessa `/cronograma`
2. `page.tsx` executa query Supabase:
   ```typescript
   SELECT * FROM etapas
   SELECT * FROM subetapas WHERE etapa_id IN (...)
   SELECT * FROM tarefas WHERE subetapa_id IN (...)
   ```
3. Agrupa dados em estrutura hierárquica:
   ```typescript
   etapas: [
     { id, nome, subetapas: [
       { id, nome, tarefas: [
         { id, nome, bloqueada_por, ... }
       ]}
     ]}
   ]
   ```
4. Para cada tarefa, calcula se está bloqueada:
   ```typescript
   status_real = calcularStatusReal(tarefa.status, tarefa.bloqueada_por)
   ```
5. Passa dados para `<CronogramaTable>` que renderiza 3 níveis
6. Componente calcula progresso de cada subetapa/etapa automaticamente

---

#### Fluxo 2: Criar Tarefa com Dependências

1. Admin/Resp.Subetapa click em [+ Tarefa]
2. Abre `<NovaTarefaDialog>`
3. Dialog carrega lista de tarefas da mesma subetapa (ou anteriores) para multi-select de dependências
4. Usuário preenche: nome, descrição, responsável, prioridade, data, dependências (array de IDs)
5. Ao salvar, valida se não há ciclo de dependências:
   ```typescript
   if (detectarCiclo(novasTarefaId, dependencias)) {
     toast.error("Dependência circular detectada")
     return
   }
   ```
6. Se válido, insere em `tarefas`:
   ```sql
   INSERT INTO tarefas (nome, subetapa_id, bloqueada_por, ...)
   ```
7. Chama `router.refresh()` para recarregar cronograma
8. Sistema recalcula automaticamente status de todas as tarefas relacionadas

---

#### Fluxo 3: Marcar Tarefa como Concluída

1. Usuário click em botão "Concluir" ou altera status no dropdown
2. Sistema valida se tarefa não está bloqueada:
   ```typescript
   const bloqueada = tarefa.bloqueada_por.some(id =>
     tarefasRelacionadas.find(t => t.id === id)?.status !== 'concluida'
   )
   if (bloqueada) {
     toast.error("Tarefa bloqueada por dependências")
     return
   }
   ```
3. Se liberada, atualiza:
   ```sql
   UPDATE tarefas SET
     status = 'concluida',
     data_conclusao_real = NOW()
   WHERE id = ?
   ```
4. Dispara hook `onTarefaConcluida` que:
   - Verifica se outras tarefas dependem desta
   - Atualiza status delas de `bloqueada` → `pendente` (se todas dependências concluídas)
   - Recalcula progresso da subetapa:
     ```typescript
     progresso = (tarefas_concluidas / total_tarefas) * 100
     ```
5. Atualiza progresso da etapa (média das subetapas)
6. Refresh na UI

---

#### Fluxo 4: Filtrar Tarefas na Página `/tarefas`

1. Usuário acessa `/tarefas`
2. Carrega todas as tarefas:
   ```typescript
   const { data } = await supabase
     .from('tarefas')
     .select('*, subetapa:subetapas(nome, etapa:etapas(nome)), responsavel:users(nome)')
   ```
3. Renderiza `<TarefasTable>` com dados completos
4. Usuário aplica filtros (responsável, etapa, status, prioridade, data)
5. Filtros aplicados client-side em tempo real:
   ```typescript
   const filtradas = tarefas.filter(t =>
     (!filtros.responsavel || t.responsavel_id === filtros.responsavel) &&
     (!filtros.status || t.status === filtros.status) &&
     (!filtros.etapa || t.subetapa.etapa_id === filtros.etapa)
   )
   ```
6. Reordena conforme ordenação selecionada (data, prioridade, status)
7. Exibe métricas no topo (total filtrado, pendentes, concluídas, bloqueadas, atrasadas)

---

#### Fluxo 5: Upload de Anexo na Tarefa

1. Usuário abre página `/tarefas/[id]`
   1.1. Query carrega tarefa COM anexos (join):
   ```typescript
   const { data: tarefa } = await supabase
     .from('tarefas')
     .select(`
       *,
       subetapa:subetapas(nome, etapa:etapas(nome)),
       anexos:tarefas_anexos(*)
     `)
     .eq('id', tarefaId)
     .single()
   ```
2. Click em [Upload] na seção de anexos
3. Componente `<AnexosUpload>` abre file picker
4. Usuário seleciona arquivo
5. Upload para Supabase Storage:
   ```typescript
   const { data: upload } = await supabase.storage
     .from('tarefas-anexos')
     .upload(`${tarefaId}/${fileName}`, file)
   ```
6. Insere registro na tabela tarefas_anexos:
   ```typescript
   await supabase.from('tarefas_anexos').insert({
     tarefa_id: tarefaId,
     nome_arquivo: fileName,
     nome_original: file.name,
     tipo_arquivo: file.type,
     tamanho_bytes: file.size,
     storage_path: data.path,
     created_by: userId
   })
   ```
7. Atualiza UI com novo anexo na lista

---

#### Fluxo 6: Widget "Minhas Tarefas" no Dashboard

1. Usuário acessa `/dashboard`
2. Hook `useMinhasTarefas()` carrega:
   ```typescript
   const { data: tarefas } = await supabase
     .from('tarefas')
     .select('*, subetapa:subetapas(nome, etapa:etapas(nome))')
     .eq('responsavel_id', userId)
     .order('data_prevista')
   ```
3. Componente `<MinhasTarefasWidget>` agrupa tarefas:
   - Atrasadas: `data_prevista < hoje && status !== 'concluida'`
   - Em andamento: `status === 'em_andamento'`
   - Próximas: `data_prevista <= hoje + 7 dias && status === 'pendente'`
4. Carrega também subetapas onde é responsável:
   ```typescript
   const { data: subetapas } = await supabase
     .from('subetapas')
     .select('*, tarefas(count)')
     .eq('responsavel_id', userId)
   ```
5. Renderiza widget com contadores e quick actions
6. Click em [Ver] navega para `/tarefas/[id]`

### 3.5 Banco de Dados

#### Script SQL Completo

```sql
-- 1. REMOVER TABELA ANTIGA (mock data)
DROP TABLE IF EXISTS tarefas CASCADE;

-- 2. CRIAR TABELA SUBETAPAS
CREATE TABLE subetapas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etapa_id UUID NOT NULL REFERENCES etapas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'nao_iniciada',

  -- Datas
  data_inicio_prevista DATE,
  data_fim_prevista DATE,
  data_inicio_real DATE,
  data_fim_real DATE,

  -- Responsável
  responsavel_id UUID REFERENCES users(id),

  -- Organização e Progresso
  ordem INTEGER NOT NULL DEFAULT 0,
  progresso_percentual INTEGER DEFAULT 0,

  -- Orçamento
  orcamento_previsto DECIMAL(12,2),

  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Índices para subetapas
CREATE INDEX idx_subetapas_etapa_id ON subetapas(etapa_id);
CREATE INDEX idx_subetapas_responsavel_id ON subetapas(responsavel_id);
CREATE INDEX idx_subetapas_status ON subetapas(status);

-- 3. CRIAR TABELA TAREFAS (NOVA)
CREATE TABLE tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subetapa_id UUID NOT NULL REFERENCES subetapas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pendente',

  -- Datas
  data_prevista DATE,
  data_inicio_real TIMESTAMP,
  data_conclusao_real TIMESTAMP,

  -- Prioridade e Responsável
  prioridade TEXT DEFAULT 'media', -- 'baixa', 'media', 'alta', 'critica'
  responsavel_id UUID REFERENCES users(id),

  -- Dependências (sistema de travas)
  bloqueada_por UUID[] DEFAULT '{}',

  -- Tags
  tags TEXT[] DEFAULT '{}',

  -- Notas
  notas TEXT,

  -- Organização
  ordem INTEGER NOT NULL DEFAULT 0,

  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Índices para tarefas
CREATE INDEX idx_tarefas_subetapa_id ON tarefas(subetapa_id);
CREATE INDEX idx_tarefas_responsavel_id ON tarefas(responsavel_id);
CREATE INDEX idx_tarefas_status ON tarefas(status);
CREATE INDEX idx_tarefas_prioridade ON tarefas(prioridade);
CREATE INDEX idx_tarefas_data_prevista ON tarefas(data_prevista);
CREATE INDEX idx_tarefas_bloqueada_por ON tarefas USING GIN(bloqueada_por);
CREATE INDEX idx_tarefas_tags ON tarefas USING GIN(tags);

-- 4. CRIAR TABELA TAREFAS_ANEXOS
CREATE TABLE tarefas_anexos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarefa_id UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,

  -- Metadados do arquivo
  nome_arquivo TEXT NOT NULL,
  nome_original TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes BIGINT,
  storage_path TEXT NOT NULL,

  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Índices para tarefas_anexos
CREATE INDEX idx_tarefas_anexos_tarefa_id ON tarefas_anexos(tarefa_id);
CREATE INDEX idx_tarefas_anexos_created_by ON tarefas_anexos(created_by);

-- 5. CHECK CONSTRAINTS
ALTER TABLE subetapas ADD CONSTRAINT chk_subetapas_status
  CHECK (status IN ('nao_iniciada', 'em_andamento', 'pausada', 'concluida', 'cancelada'));

ALTER TABLE tarefas ADD CONSTRAINT chk_tarefas_status
  CHECK (status IN ('pendente', 'bloqueada', 'em_andamento', 'concluida', 'cancelada'));

ALTER TABLE tarefas ADD CONSTRAINT chk_tarefas_prioridade
  CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica'));

-- 6. FUNÇÃO: Atualizar progresso da subetapa quando tarefa muda
CREATE OR REPLACE FUNCTION atualizar_progresso_subetapa()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE subetapas
  SET progresso_percentual = (
    SELECT COALESCE(
      ROUND((COUNT(*) FILTER (WHERE status = 'concluida')::DECIMAL / COUNT(*)::DECIMAL) * 100),
      0
    )
    FROM tarefas
    WHERE subetapa_id = NEW.subetapa_id
  )
  WHERE id = NEW.subetapa_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_progresso_subetapa
AFTER INSERT OR UPDATE OF status OR DELETE ON tarefas
FOR EACH ROW
EXECUTE FUNCTION atualizar_progresso_subetapa();

-- 7. FUNÇÃO: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subetapas_updated_at
BEFORE UPDATE ON subetapas
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_tarefas_updated_at
BEFORE UPDATE ON tarefas
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at();

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE subetapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar
CREATE POLICY "Todos podem visualizar subetapas"
ON subetapas FOR SELECT
USING (true);

CREATE POLICY "Todos podem visualizar tarefas"
ON tarefas FOR SELECT
USING (true);

-- Apenas admins podem criar subetapas
CREATE POLICY "Admins podem criar subetapas"
ON subetapas FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Admins e responsável da etapa podem editar subetapas
CREATE POLICY "Admins e resp. etapa podem editar subetapas"
ON subetapas FOR UPDATE
USING (
  auth.jwt()->>'role' = 'admin' OR
  responsavel_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM etapas
    WHERE etapas.id = subetapas.etapa_id
    AND etapas.responsavel_id = auth.uid()
  )
);

-- Admins e resp. subetapa podem criar tarefas
CREATE POLICY "Admins e resp. subetapa podem criar tarefas"
ON tarefas FOR INSERT
WITH CHECK (
  auth.jwt()->>'role' = 'admin' OR
  EXISTS (
    SELECT 1 FROM subetapas
    WHERE subetapas.id = tarefas.subetapa_id
    AND subetapas.responsavel_id = auth.uid()
  )
);

-- Admins, resp. subetapa e resp. tarefa podem editar tarefas
CREATE POLICY "Admins, resp. subetapa e resp. tarefa podem editar"
ON tarefas FOR UPDATE
USING (
  auth.jwt()->>'role' = 'admin' OR
  responsavel_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM subetapas
    WHERE subetapas.id = tarefas.subetapa_id
    AND subetapas.responsavel_id = auth.uid()
  )
);

-- 9. RLS PARA TAREFAS_ANEXOS
ALTER TABLE tarefas_anexos ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar anexos de tarefas que podem ver
CREATE POLICY "Todos podem visualizar anexos"
ON tarefas_anexos FOR SELECT
USING (true);

-- Admins, resp. subetapa e resp. tarefa podem fazer upload
CREATE POLICY "Usuarios autorizados podem criar anexos"
ON tarefas_anexos FOR INSERT
WITH CHECK (
  auth.jwt()->>'role' = 'admin' OR
  EXISTS (
    SELECT 1 FROM tarefas t
    LEFT JOIN subetapas s ON s.id = t.subetapa_id
    WHERE t.id = tarefas_anexos.tarefa_id
    AND (
      t.responsavel_id = auth.uid() OR
      s.responsavel_id = auth.uid()
    )
  )
);

-- Admins, resp. subetapa, resp. tarefa e quem fez upload podem deletar
CREATE POLICY "Usuarios autorizados podem deletar anexos"
ON tarefas_anexos FOR DELETE
USING (
  auth.jwt()->>'role' = 'admin' OR
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM tarefas t
    LEFT JOIN subetapas s ON s.id = t.subetapa_id
    WHERE t.id = tarefas_anexos.tarefa_id
    AND (
      t.responsavel_id = auth.uid() OR
      s.responsavel_id = auth.uid()
    )
  )
);
```

**Resumo das tabelas:**
- `subetapas`: 16 campos
- `tarefas`: 16 campos (removido campo `anexos`)
- `tarefas_anexos`: 8 campos (nova tabela)
- 3 triggers automáticos
- 10 policies RLS (7 para tarefas/subetapas + 3 para tarefas_anexos)

**⚠️ Observação sobre RLS:** As policies acima usam `auth.jwt()->>'role'` para verificar se é admin. **Durante implementação, verificar se o projeto usa tabela `users` com coluna `role` ou outra estratégia** (pode ser necessário ajustar para algo como `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')`).

### 3.6 Storage e Policies

#### Script de Storage

```sql
-- 1. CRIAR BUCKET PARA ANEXOS DE TAREFAS
INSERT INTO storage.buckets (id, name, public)
VALUES ('tarefas-anexos', 'tarefas-anexos', false);

-- 2. POLICIES DE STORAGE

-- Todos autenticados podem ler anexos
CREATE POLICY "Usuarios podem visualizar anexos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tarefas-anexos' AND
  auth.role() = 'authenticated'
);

-- Admins, resp. subetapa e resp. tarefa podem fazer upload
CREATE POLICY "Usuarios autorizados podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tarefas-anexos' AND
  auth.role() = 'authenticated' AND
  (
    -- Verifica se o usuário é admin, responsável da subetapa ou responsável da tarefa
    -- O path deve ser: tarefas-anexos/{tarefa_id}/{arquivo}
    -- Validação será feita no frontend antes do upload
    true
  )
);

-- Admins, resp. subetapa e resp. tarefa podem deletar anexos
CREATE POLICY "Usuarios autorizados podem deletar anexos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tarefas-anexos' AND
  auth.role() = 'authenticated'
);
```

**Organização dos arquivos no storage:**
```
tarefas-anexos/
├── {tarefa_id_1}/
│   ├── arquivo1.pdf
│   ├── foto1.jpg
│   └── ...
├── {tarefa_id_2}/
│   └── ...
```

**Validação de permissão de upload:**
Será feita no frontend antes do upload, verificando se o usuário logado é:
- Admin, OU
- Responsável da subetapa, OU
- Responsável da tarefa

---

## 4. Decisões Importantes

1. **Migração**: Decidido remover tabela `tarefas` antiga (são dados de teste) e recomeçar com estrutura limpa de 3 níveis

2. **Dependências**: Implementar com array `bloqueada_por` (IDs das tarefas) ao invés de tabela junction. Mais simples e suficiente para o caso de uso.

3. **Progresso**: Calculado automaticamente via trigger SQL quando tarefa muda de status. Evita inconsistências.

4. **Anexos**: Tabela relacional `tarefas_anexos` ao invés de JSONB. Garante integridade referencial, auditoria completa (quem fez upload) e queries eficientes. Metadados estruturados (nome, tipo, tamanho) em campos separados.

5. **Permissões**:
   - Etapas: apenas admins
   - Subetapas: admin + responsável da etapa
   - Tarefas: admin + resp. subetapa + resp. tarefa (cada um com níveis diferentes de acesso)

6. **UI**: Combinar expansão inline + modal + página dedicada. Flexibilidade para usuário escolher nível de detalhe desejado.

7. **Prioridades**: 4 níveis (baixa, média, alta, crítica) com cores distintas. Suficiente para maioria dos casos.

8. **Status bloqueada**: Calculado dinamicamente no frontend, não gravado no banco. Status real é derivado de `status` + `bloqueada_por`.

9. **Arquitetura de Estado** (baseado em padrões do projeto):
   - **NÃO criar hooks customizados de CRUD** - O projeto não usa esse padrão
   - Queries diretas com `createClient()` dentro dos componentes
   - Estado local com `useState` e atualização otimista
   - Pattern: atualiza UI → salva no banco → toast de feedback

10. **Modais** (seguindo padrão existente em `nova-tarefa-dialog.tsx`):
   - Usar `Dialog` do shadcn/ui + `react-hook-form` + `zod`
   - Props: `open`, `onOpenChange`, `onSuccess`, `onDelete`
   - Callback `onSuccess` para refresh de dados no componente pai

11. **Upload de Anexos** (seguindo padrão em `upload-form.tsx`):
   - Interface `FileWithPreview` com preview e progress bar
   - Upload para Supabase Storage: `supabase.storage.from('tarefas-anexos').upload()`
   - Metadados salvos em tabela relacional `tarefas_anexos` com campos estruturados (nome, tipo, tamanho, path, created_by)

12. **Filtros** (seguindo padrão em `compras-filters.tsx`):
   - Componente separado (`tarefas-filters.tsx`)
   - Interface `TarefasFilters` com todos os filtros tipados
   - Função genérica `updateFilter<K>` para type-safety
   - Filtros aplicados client-side em tempo real

13. **Storage**: Bucket `tarefas-anexos` privado, com policies para autenticados

---

## 5. Checkpoints

#### Checkpoint 07/02/2026 - 16:00
**Status atual:** Proposta revisada após análise do código existente

**Melhorias aplicadas:**
1. ✅ Pesquisado padrões do projeto (modais, estado, upload, filtros)
2. ✅ Removidos hooks de CRUD (projeto não usa esse padrão)
3. ✅ Adicionado Storage bucket + policies
4. ✅ Ajustados fluxos de dados para usar queries diretas
5. ✅ Documentados todos os padrões a seguir

**Decisões confirmadas:**
- Seguir padrão de modais: Dialog + react-hook-form + zod + onSuccess callback
- Queries inline com `createClient()` (sem hooks customizados)
- Upload seguindo padrão `FileWithPreview` existente
- Filtros client-side com interface tipada

**Próximo passo:** Aguardando aprovação final para criar especificação técnica

---

**A proposta de implementação (agora alinhada com os padrões do projeto) está aprovada? Posso criar a especificação técnica?**

---

#### usuário:
