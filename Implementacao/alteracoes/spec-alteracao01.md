# Especificação: Alteração 01 - Sistema de 3 níveis: Etapa → Subetapa → Tarefas

| Aspecto | Detalhe |
|---------|---------|
| Status | 🔵 Pronto para executar |
| Conversa | [alteracao01.md](./alteracao01.md) |
| Data criação | 07/02/2026 |
| Complexidade | 🔴 Alta |

**Status possíveis:**
- 🔵 Pronto para executar
- 🔴 Em execução
- 🟠 Aguardando testes
- 🟢 Concluído
- ❌ Cancelado

---

## 1. Resumo

Expandir o cronograma de 2 para 3 níveis hierárquicos (Etapa → Subetapa → Tarefas), criando nova página dedicada `/tarefas` com sistema de dependências, prioridades, tags, anexos e filtros avançados. Implementação seguindo 100% os padrões do projeto (queries diretas, sem hooks de CRUD, Dialog + react-hook-form).

---

## 2. O que será feito

### Banco de Dados
- [ ] Remover tabela `tarefas` antiga (mock data)
- [ ] Criar tabela `subetapas` (renomear conceito atual de "tarefa")
- [ ] Criar tabela `tarefas` (nova, com dependências/prioridades/tags)
- [ ] Criar tabela `tarefas_anexos` (metadados de arquivos)
- [ ] Criar triggers para atualizar progresso automaticamente
- [ ] Configurar RLS (Row Level Security) para todas as tabelas
- [ ] Criar bucket `tarefas-anexos` no Supabase Storage
- [ ] Configurar policies de storage

### Páginas
- [ ] Atualizar `/cronograma` para exibir 3 níveis hierárquicos
- [ ] Criar `/tarefas` (listagem com filtros e métricas)
- [ ] Criar `/tarefas/[id]` (página de detalhes individual)
- [ ] Adicionar widget "Minhas Tarefas" no dashboard

### Componentes - Cronograma
- [ ] Atualizar `cronograma-table.tsx` para 3 níveis
- [ ] Atualizar `cronograma-mobile.tsx` para 3 níveis
- [ ] Criar `nova-subetapa-dialog.tsx`
- [ ] Criar `editar-subetapa-dialog.tsx`
- [ ] Criar `subetapas-list.tsx`
- [ ] Remover `nova-tarefa-dialog.tsx` antigo
- [ ] Remover `tarefas-list.tsx` antigo

### Componentes - Tarefas (novos)
- [ ] Criar `nova-tarefa-dialog.tsx` (com dependências)
- [ ] Criar `editar-tarefa-dialog.tsx`
- [ ] Criar `tarefas-table.tsx`
- [ ] Criar `tarefas-filters.tsx`
- [ ] Criar `tarefa-detail.tsx`
- [ ] Criar `dependencias-selector.tsx`
- [ ] Criar `anexos-upload.tsx`
- [ ] Criar `notas-comentarios.tsx`

### Componentes - Dashboard
- [ ] Criar `minhas-tarefas-widget.tsx`

### Utils
- [ ] Criar `src/lib/utils/dependencias.ts` (detectar ciclos, calcular bloqueios)
- [ ] Criar `src/lib/utils/progresso.ts` (calcular progresso)

### Tipos
- [ ] Atualizar `database.ts` com tipos `Subetapa` e `Tarefa`

### Validação Final
- [ ] `npx tsc --noEmit` sem erros
- [ ] Testar criação de etapa → subetapa → tarefas
- [ ] Testar dependências entre tarefas
- [ ] Testar upload de anexos
- [ ] Testar filtros na página `/tarefas`
- [ ] Testar permissões (admin, responsável subetapa, responsável tarefa)

---

## 3. Proposta

### 📚 Padrões a Seguir

**IMPORTANTE:** Esta implementação DEVE seguir os padrões existentes do projeto:

| Aspecto | Padrão Obrigatório |
|---------|-------------------|
| **Modais** | `Dialog` shadcn/ui + `react-hook-form` + `zod`. Props: `open`, `onOpenChange`, `onSuccess`, `onDelete` |
| **Estado** | `useState` manual. Queries diretas com `createClient()`. NÃO criar hooks de CRUD |
| **Refresh** | Callback `onSuccess` + atualização otimista + toast |
| **Upload** | Interface `FileWithPreview` + `supabase.storage.from('bucket').upload()` |
| **Filtros** | Componente separado, interface tipada, função `updateFilter` genérica, client-side |
| **Drag & Drop** | `@dnd-kit` com estado otimista |

**Referências:**
- Modal: `nova-tarefa-dialog.tsx` (linha 129)
- Tabela: `cronograma-table.tsx` (linha 651)
- Filtros: `compras-filters.tsx` (linha 76)
- Upload: `upload-form.tsx` (linha 38)

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

---

## 4. Implementação Técnica

### 4.1 Banco de Dados

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

**⚠️ Observação sobre RLS:** As policies acima usam `auth.jwt()->>'role'` para verificar se é admin. **Durante implementação, verificar se o projeto usa tabela `users` com coluna `role` ou outra estratégia** (pode ser necessário ajustar para algo como `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')`).

#### Storage e Policies

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
  auth.role() = 'authenticated'
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

**Resumo:**
- `subetapas`: 16 campos
- `tarefas`: 16 campos (removido campo `anexos`)
- `tarefas_anexos`: 8 campos (nova tabela)
- 3 triggers automáticos
- 10 policies RLS (7 para tarefas/subetapas + 3 para tarefas_anexos)
- 1 bucket storage + 3 policies

### 4.2 Arquivos a Modificar/Criar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| **TIPOS TYPESCRIPT** |
| MODIFICAR | `toniezzer-manager/src/lib/types/database.ts` | Adicionar tipos `Subetapa`, `Tarefa` e `TarefaAnexo` gerados pelo Supabase |
| **PÁGINAS** |
| MODIFICAR | `toniezzer-manager/src/app/(dashboard)/cronograma/page.tsx` | Atualizar para carregar 3 níveis (etapas → subetapas → tarefas) |
| CRIAR | `toniezzer-manager/src/app/(dashboard)/tarefas/page.tsx` | Nova página com tabela de todas as tarefas + filtros |
| CRIAR | `toniezzer-manager/src/app/(dashboard)/tarefas/[id]/page.tsx` | Página dedicada de detalhes da tarefa |
| MODIFICAR | `toniezzer-manager/src/app/(dashboard)/dashboard/page.tsx` | Adicionar widget "Minhas Tarefas" |
| **COMPONENTES - CRONOGRAMA** |
| MODIFICAR | `toniezzer-manager/src/components/features/cronograma/cronograma-table.tsx` | Adicionar nível de subetapas (3 níveis hierárquicos) |
| MODIFICAR | `toniezzer-manager/src/components/features/cronograma/cronograma-mobile.tsx` | Adaptar para 3 níveis no mobile |
| DELETAR | `toniezzer-manager/src/components/features/cronograma/nova-tarefa-dialog.tsx` | Remover (antigo, será substituído) |
| DELETAR | `toniezzer-manager/src/components/features/cronograma/tarefas-list.tsx` | Remover (antigo) |
| CRIAR | `toniezzer-manager/src/components/features/cronograma/nova-subetapa-dialog.tsx` | Dialog para criar subetapa |
| CRIAR | `toniezzer-manager/src/components/features/cronograma/editar-subetapa-dialog.tsx` | Dialog para editar subetapa |
| CRIAR | `toniezzer-manager/src/components/features/cronograma/subetapas-list.tsx` | Lista de subetapas dentro de uma etapa |
| **COMPONENTES - TAREFAS** |
| CRIAR | `toniezzer-manager/src/components/features/tarefas/nova-tarefa-dialog.tsx` | Dialog para criar tarefa (com dependências) |
| CRIAR | `toniezzer-manager/src/components/features/tarefas/editar-tarefa-dialog.tsx` | Dialog para editar tarefa |
| CRIAR | `toniezzer-manager/src/components/features/tarefas/tarefas-table.tsx` | Tabela de tarefas com filtros |
| CRIAR | `toniezzer-manager/src/components/features/tarefas/tarefas-filters.tsx` | Componente de filtros avançados |
| CRIAR | `toniezzer-manager/src/components/features/tarefas/tarefa-detail.tsx` | Componente de detalhes completos da tarefa |
| CRIAR | `toniezzer-manager/src/components/features/tarefas/dependencias-selector.tsx` | Multi-select de dependências |
| CRIAR | `toniezzer-manager/src/components/features/tarefas/anexos-upload.tsx` | Upload de anexos |
| CRIAR | `toniezzer-manager/src/components/features/tarefas/notas-comentarios.tsx` | Sistema de notas/comentários |
| **COMPONENTES - DASHBOARD** |
| CRIAR | `toniezzer-manager/src/components/features/dashboard/minhas-tarefas-widget.tsx` | Widget de tarefas do usuário |
| **UTILS** |
| CRIAR | `toniezzer-manager/src/lib/utils/dependencias.ts` | Funções auxiliares (detectar ciclo, calcular bloqueios) |
| CRIAR | `toniezzer-manager/src/lib/utils/progresso.ts` | Calcular progresso de subetapas/etapas |

**Total:** ~31 arquivos (10 modificar, 2 deletar, 19 criar) + 1 storage bucket

**⚠️ IMPORTANTE:** Seguindo o padrão do projeto, **NÃO serão criados hooks de CRUD**. As queries serão feitas diretamente nos componentes usando `createClient()`, conforme padrão existente em `cronograma-table.tsx`.

### 4.3 Fluxo de Dados

#### Fluxo 1: Carregar Cronograma (3 níveis)

1. Usuário acessa `/cronograma`
2. `page.tsx` executa queries Supabase (paralelas):
   ```typescript
   const { data: etapas } = await supabase.from('etapas').select('*').order('ordem')
   const { data: subetapas } = await supabase.from('subetapas').select('*').order('ordem')
   const { data: tarefas } = await supabase.from('tarefas').select('*').order('ordem')
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
4. Para cada tarefa, calcula se está bloqueada verificando `bloqueada_por` array
5. Passa dados para `<CronogramaTable>` que renderiza 3 níveis com drag & drop
6. Componente calcula progresso de cada subetapa/etapa automaticamente

---

#### Fluxo 2: Criar Tarefa com Dependências

1. Admin/Resp.Subetapa click em [+ Tarefa]
2. Abre `<NovaTarefaDialog>` (seguindo padrão `nova-tarefa-dialog.tsx`)
3. Dialog carrega lista de tarefas da mesma subetapa para multi-select
4. Usuário preenche: nome, descrição, responsável, prioridade, data, dependências (array de IDs)
5. Ao salvar, valida se não há ciclo usando `detectarCiclo()` da util:
   ```typescript
   if (detectarCiclo(novaTarefaId, dependencias)) {
     toast.error("Dependência circular detectada")
     return
   }
   ```
6. Se válido, insere em `tarefas` com `createClient()`:
   ```typescript
   await supabase.from('tarefas').insert({
     nome, subetapa_id, bloqueada_por, ...
   })
   ```
7. Chama callback `onSuccess()` para componente pai atualizar
8. Componente pai recarrega dados (queries diretas)

---

#### Fluxo 3: Marcar Tarefa como Concluída

1. Usuário altera status para "concluída" no dropdown
2. Sistema valida se tarefa não está bloqueada (client-side):
   ```typescript
   const bloqueada = tarefa.bloqueada_por.some(id =>
     tarefasRelacionadas.find(t => t.id === id)?.status !== 'concluida'
   )
   if (bloqueada) {
     toast.error("Tarefa bloqueada por dependências")
     return
   }
   ```
3. Se liberada, atualiza com estado otimista:
   ```typescript
   // Atualiza UI primeiro
   setTarefas(prev => prev.map(t => t.id === id ? {...t, status: 'concluida'} : t))

   // Depois salva no banco
   await supabase.from('tarefas').update({
     status: 'concluida',
     data_conclusao_real: new Date()
   }).eq('id', tarefaId)

   toast.success("Tarefa concluída!")
   ```
4. Trigger SQL `atualizar_progresso_subetapa` recalcula progresso automaticamente
5. Componente verifica se outras tarefas dependem desta e atualiza UI se necessário

---

#### Fluxo 4: Filtrar Tarefas na Página `/tarefas`

1. Usuário acessa `/tarefas`
2. `page.tsx` carrega todas as tarefas com joins:
   ```typescript
   const { data } = await supabase
     .from('tarefas')
     .select('*, subetapa:subetapas(nome, etapa:etapas(nome)), responsavel:users(nome)')
   ```
3. Renderiza `<TarefasTable>` e `<TarefasFilters>` (padrão `compras-filters.tsx`)
4. Usuário aplica filtros (responsável, etapa, status, prioridade, data)
5. Filtros aplicados client-side em tempo real:
   ```typescript
   const filtradas = tarefas.filter(t =>
     (!filtros.responsavel || t.responsavel_id === filtros.responsavel) &&
     (!filtros.status || t.status === filtros.status) &&
     (!filtros.etapa || t.subetapa.etapa_id === filtros.etapa)
   )
   ```
6. Reordena conforme ordenação selecionada
7. Exibe métricas calculadas (total filtrado, pendentes, concluídas, bloqueadas, atrasadas)

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
3. Componente `<AnexosUpload>` (padrão `upload-form.tsx`) abre file picker
4. Usuário seleciona arquivo
5. Upload para Supabase Storage com preview:
   ```typescript
   const { data } = await supabase.storage
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
2. `page.tsx` carrega tarefas do usuário:
   ```typescript
   const { data: tarefas } = await supabase
     .from('tarefas')
     .select('*, subetapa:subetapas(nome, etapa:etapas(nome))')
     .eq('responsavel_id', userId)
     .order('data_prevista')
   ```
3. Componente `<MinhasTarefasWidget>` agrupa:
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

### 4.4 Dependências Externas

- [ ] Criar bucket `tarefas-anexos` no Supabase Storage
- [ ] Configurar policies de storage (SELECT, INSERT, DELETE)
- [ ] Gerar tipos TypeScript atualizados do Supabase (após criar tabelas)
- [ ] Verificar sintaxe RLS para verificação de admin (ajustar se necessário)

**Comandos:**
```bash
# Após rodar migrations no banco:
npx supabase gen types typescript --project-id [PROJECT_ID] > src/lib/types/database-new.ts
```


### 4.5 Decisões de Design e Justificativas

*(Documenta o PORQUÊ das escolhas arquiteturais e técnicas)*

- **3 níveis hierárquicos (Etapa → Subetapa → Tarefas):** A hierarquia de 2 níveis atual (Etapa → Tarefas) não permite agrupamento lógico de tarefas relacionadas. Subetapas funcionam como "pacotes de trabalho" que facilitam delegação e acompanhamento. Exemplo: Etapa "Serviços Preliminares" → Subetapa "Base da caixa" → Tarefas específicas (comprar concreto, marcar empilhadeira).

- **Sistema de dependências via array `bloqueada_por`:** Ao invés de criar tabela many-to-many (`tarefas_dependencias`), optou-se por array de UUIDs para simplicidade. Validação de ciclos é feita client-side. Alternativas consideradas: tabela relacional (descartada por overhead), flag booleana simples (descartada por não identificar QUAIS tarefas bloqueiam).

- **Página dedicada `/tarefas` separada do cronograma:** Cronograma é visão hierárquica/temporal; `/tarefas` é visão flat/filtrada. Responsáveis precisam ver "minhas tarefas" de todas as etapas em um só lugar, com filtros avançados. Manter tudo no cronograma tornaria a página muito complexa.

- **Anexos em tabela relacional `tarefas_anexos`:** Ao invés de JSONB, usa-se tabela separada para garantir integridade referencial (CASCADE automático ao deletar tarefa), auditoria completa (quem fez upload via `created_by`), queries eficientes via índices, e metadados estruturados (nome, tipo, tamanho) em campos separados. Escalável sem limites. Storage usa estrutura `tarefas-anexos/{tarefa_id}/{arquivo}`.

- **Tags como array TEXT[] ao invés de tabela `tags`:** Tags são informais e não precisam de normalização. Não há CRUD de tags centralizado. Usuários digitam livremente. Autocomplete client-side pode ser adicionado depois. Alternativa many-to-many foi considerada mas descartada por over-engineering.

- **SEM hooks de CRUD (padrão do projeto):** Seguindo padrão estabelecido em `cronograma-table.tsx`, queries são feitas diretamente com `createClient()` nos componentes. Estado gerenciado com `useState` manual. Atualização via callbacks `onSuccess()`. Hooks seriam abstrações desnecessárias para operações simples.

- **Prioridades como TEXT com CHECK constraint:** Ao invés de ENUM, usa TEXT + CHECK para flexibilidade (fácil adicionar nova prioridade sem migration). Valores: `baixa`, `media`, `alta`, `critica`. Frontend mapeia para cores via objeto de configuração.

- **Triggers automáticos para progresso:** Progresso de subetapas é calculado automaticamente via trigger ao alterar status de tarefas. Evita dessincronia e economiza queries. Alternativa de calcular client-side foi descartada por risco de divergência.

- **Permissões em 3 níveis (Admin > Resp.Subetapa > Resp.Tarefa):** Admin pode tudo. Responsável da subetapa pode criar/editar tarefas dentro dela. Responsável da tarefa pode alterar status/descrição/anexos da própria tarefa. Implementado via RLS policies. Outros usuários só visualizam.




---

## 5. Execução

*(Seção preenchida pelo Executor durante implementação)*

### 5.1 Progresso

- [ ] Banco de dados - Tabela `subetapas` criada
- [ ] Banco de dados - Tabela `tarefas` criada
- [ ] Banco de dados - Triggers configurados
- [ ] Banco de dados - RLS configurado
- [ ] Storage - Bucket `tarefas-anexos` criado
- [ ] Storage - Policies configuradas
- [ ] Tipos - `database.ts` atualizado
- [ ] Utils - `dependencias.ts` criado
- [ ] Utils - `progresso.ts` criado
- [ ] Componentes - Cronograma atualizado (3 níveis)
- [ ] Componentes - Dialogs de subetapa criados
- [ ] Componentes - Página `/tarefas` criada
- [ ] Componentes - Página `/tarefas/[id]` criada
- [ ] Componentes - Filtros de tarefas criados
- [ ] Componentes - Upload de anexos criado
- [ ] Componentes - Widget dashboard criado
- [ ] TypeScript sem erros (`npx tsc --noEmit`)
- [ ] Testado manualmente - Criar etapa → subetapa → tarefa
- [ ] Testado manualmente - Dependências entre tarefas
- [ ] Testado manualmente - Upload de anexos
- [ ] Testado manualmente - Filtros
- [ ] Testado manualmente - Permissões

### 5.2 Notas de Implementação

*(Preenchido durante execução)*

### 5.3 Conversa de Execução

*(Problemas encontrados durante execução, soluções propostas)*

---

## 6. Validação Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente - Criar hierarquia completa
- [ ] Funcionalidade testada manualmente - Sistema de dependências
- [ ] Funcionalidade testada manualmente - Upload de anexos
- [ ] Funcionalidade testada manualmente - Filtros e busca
- [ ] Funcionalidade testada manualmente - Permissões (admin/resp.subetapa/resp.tarefa)
- [ ] PRD atualizado (via PRD-editor)
