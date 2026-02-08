-- ============================================================================
-- ALTERAÇÃO 01: Storage Policies para Anexos de Tarefas
-- Data: 07/02/2026
-- Descrição: Configurar bucket e policies para anexos de tarefas
-- ============================================================================

-- ⚠️ ATENÇÃO: Execute este script APÓS criar o bucket 'tarefas-anexos' na interface do Supabase

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- 1. CRIAR BUCKET (via interface do Supabase Storage)
-- Nome: tarefas-anexos
-- Público: false
-- Estrutura: {tarefa_id}/{arquivo}

-- 2. POLICIES DE STORAGE

-- Todos autenticados podem visualizar anexos
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

-- ============================================================================
-- INSTRUÇÕES DE USO
-- ============================================================================

-- 1. Acesse: Supabase Dashboard → Storage → Buckets
-- 2. Clique em "New bucket"
-- 3. Configurações:
--    - Name: tarefas-anexos
--    - Public: false (desabilitar)
--    - Allowed MIME types: (deixar em branco ou especificar tipos permitidos)
--    - File size limit: (definir limite apropriado, ex: 10MB)
-- 4. Após criar o bucket, execute este script no SQL Editor
-- 5. Testar upload pela aplicação
