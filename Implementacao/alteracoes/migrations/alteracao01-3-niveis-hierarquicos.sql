-- ============================================================================
-- ALTERAÇÃO 01: Sistema de 3 níveis - Etapa → Subetapa → Tarefas
-- Data: 07/02/2026
-- Descrição: Expandir cronograma para 3 níveis hierárquicos com dependências
-- ============================================================================

-- ============================================================================
-- PARTE 1: REMOÇÃO DE TABELA ANTIGA
-- ============================================================================

-- 1. REMOVER TABELA ANTIGA (mock data)
DROP TABLE IF EXISTS tarefas CASCADE;

-- ============================================================================
-- PARTE 2: CRIAÇÃO DE TABELAS
-- ============================================================================

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

-- ============================================================================
-- PARTE 3: CONSTRAINTS
-- ============================================================================

-- 5. CHECK CONSTRAINTS
ALTER TABLE subetapas ADD CONSTRAINT chk_subetapas_status
  CHECK (status IN ('nao_iniciada', 'em_andamento', 'pausada', 'concluida', 'cancelada'));

ALTER TABLE tarefas ADD CONSTRAINT chk_tarefas_status
  CHECK (status IN ('pendente', 'bloqueada', 'em_andamento', 'concluida', 'cancelada'));

ALTER TABLE tarefas ADD CONSTRAINT chk_tarefas_prioridade
  CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica'));

-- ============================================================================
-- PARTE 4: TRIGGERS
-- ============================================================================

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

-- ============================================================================
-- PARTE 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

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
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins e responsável da etapa podem editar subetapas
CREATE POLICY "Admins e resp. etapa podem editar subetapas"
ON subetapas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ) OR
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
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ) OR
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
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ) OR
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
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ) OR
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
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ) OR
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

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- NOTAS:
-- 1. Este script deve ser executado no Supabase SQL Editor
-- 2. Após execução, criar bucket 'tarefas-anexos' via interface do Supabase
-- 3. Executar script de storage policies (arquivo separado)
-- 4. Regenerar tipos TypeScript com: npx supabase gen types typescript
