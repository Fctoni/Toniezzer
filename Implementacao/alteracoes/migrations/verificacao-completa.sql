-- ============================================================================
-- VERIFICAÇÃO COMPLETA - ALTERAÇÃO 01
-- Data: 07/02/2026
-- Descrição: Verifica se tudo foi criado corretamente
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR TABELAS E COLUNAS
-- ============================================================================

SELECT '=== VERIFICAÇÃO 1: TABELAS E COLUNAS ===' AS secao;

-- Listar todas as colunas da tabela subetapas
SELECT
  'subetapas' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subetapas'
ORDER BY ordinal_position;

-- Listar todas as colunas da tabela tarefas
SELECT
  'tarefas' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tarefas'
ORDER BY ordinal_position;

-- Listar todas as colunas da tabela tarefas_anexos
SELECT
  'tarefas_anexos' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tarefas_anexos'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. VERIFICAR ÍNDICES
-- ============================================================================

SELECT '=== VERIFICAÇÃO 2: ÍNDICES ===' AS secao;

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('subetapas', 'tarefas', 'tarefas_anexos')
ORDER BY tablename, indexname;

-- ============================================================================
-- 3. VERIFICAR CONSTRAINTS
-- ============================================================================

SELECT '=== VERIFICAÇÃO 3: CONSTRAINTS ===' AS secao;

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('subetapas', 'tarefas', 'tarefas_anexos')
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================================================
-- 4. VERIFICAR FOREIGN KEYS
-- ============================================================================

SELECT '=== VERIFICAÇÃO 4: FOREIGN KEYS ===' AS secao;

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('subetapas', 'tarefas', 'tarefas_anexos')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 5. VERIFICAR TRIGGERS
-- ============================================================================

SELECT '=== VERIFICAÇÃO 5: TRIGGERS ===' AS secao;

SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('subetapas', 'tarefas', 'tarefas_anexos')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 6. VERIFICAR FUNÇÕES DOS TRIGGERS
-- ============================================================================

SELECT '=== VERIFICAÇÃO 6: FUNÇÕES DOS TRIGGERS ===' AS secao;

SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('atualizar_progresso_subetapa', 'atualizar_updated_at')
ORDER BY routine_name;

-- ============================================================================
-- 7. VERIFICAR RLS (Row Level Security)
-- ============================================================================

SELECT '=== VERIFICAÇÃO 7: RLS ATIVADO ===' AS secao;

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('subetapas', 'tarefas', 'tarefas_anexos');

-- ============================================================================
-- 8. VERIFICAR POLICIES RLS
-- ============================================================================

SELECT '=== VERIFICAÇÃO 8: RLS POLICIES ===' AS secao;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('subetapas', 'tarefas', 'tarefas_anexos')
ORDER BY tablename, policyname;

-- ============================================================================
-- 9. VERIFICAR STORAGE BUCKETS
-- ============================================================================

SELECT '=== VERIFICAÇÃO 9: STORAGE BUCKETS ===' AS secao;

SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'tarefas-anexos';

-- ============================================================================
-- 10. VERIFICAR STORAGE POLICIES
-- ============================================================================

SELECT '=== VERIFICAÇÃO 10: STORAGE POLICIES ===' AS secao;

SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual LIKE '%tarefas-anexos%'
    OR with_check LIKE '%tarefas-anexos%'
  )
ORDER BY policyname;

-- ============================================================================
-- 11. RESUMO: CONTAGEM DE OBJETOS CRIADOS
-- ============================================================================

SELECT '=== RESUMO: CONTAGEM DE OBJETOS ===' AS secao;

-- Contagem de tabelas
SELECT
  'Tabelas criadas' as tipo,
  COUNT(*) as quantidade
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('subetapas', 'tarefas', 'tarefas_anexos')

UNION ALL

-- Contagem de índices
SELECT
  'Índices criados' as tipo,
  COUNT(*) as quantidade
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('subetapas', 'tarefas', 'tarefas_anexos')

UNION ALL

-- Contagem de triggers
SELECT
  'Triggers criados' as tipo,
  COUNT(DISTINCT trigger_name) as quantidade
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('subetapas', 'tarefas', 'tarefas_anexos')

UNION ALL

-- Contagem de RLS policies
SELECT
  'RLS Policies criadas' as tipo,
  COUNT(*) as quantidade
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('subetapas', 'tarefas', 'tarefas_anexos')

UNION ALL

-- Contagem de storage buckets
SELECT
  'Storage Buckets criados' as tipo,
  COUNT(*) as quantidade
FROM storage.buckets
WHERE name = 'tarefas-anexos'

UNION ALL

-- Contagem de storage policies
SELECT
  'Storage Policies criadas' as tipo,
  COUNT(*) as quantidade
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual LIKE '%tarefas-anexos%'
    OR with_check LIKE '%tarefas-anexos%'
  );

-- ============================================================================
-- 12. CHECKLIST FINAL
-- ============================================================================

SELECT '=== CHECKLIST FINAL ===' AS secao;

SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('subetapas', 'tarefas', 'tarefas_anexos')) = 3
    THEN '✅'
    ELSE '❌'
  END || ' 3 tabelas criadas' as item
UNION ALL
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('subetapas', 'tarefas', 'tarefas_anexos')) >= 13
    THEN '✅'
    ELSE '❌'
  END || ' Pelo menos 13 índices criados'
UNION ALL
SELECT
  CASE
    WHEN (SELECT COUNT(DISTINCT trigger_name) FROM information_schema.triggers WHERE trigger_schema = 'public' AND event_object_table IN ('subetapas', 'tarefas', 'tarefas_anexos')) >= 3
    THEN '✅'
    ELSE '❌'
  END || ' Pelo menos 3 triggers criados'
UNION ALL
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('subetapas', 'tarefas', 'tarefas_anexos')) = 9
    THEN '✅'
    ELSE '❌'
  END || ' 9 RLS policies criadas'
UNION ALL
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM storage.buckets WHERE name = 'tarefas-anexos') = 1
    THEN '✅'
    ELSE '❌'
  END || ' Bucket tarefas-anexos criado'
UNION ALL
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND (qual LIKE '%tarefas-anexos%' OR with_check LIKE '%tarefas-anexos%')) = 3
    THEN '✅'
    ELSE '❌'
  END || ' 3 storage policies criadas';
