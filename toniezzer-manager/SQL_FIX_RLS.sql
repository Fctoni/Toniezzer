-- =====================================================
-- CORRECAO: Ajustar RLS para funcionamento correto
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- OPCAO 1: Desabilitar RLS temporariamente na tabela users
-- (mais simples, funciona para MVP)
-- =====================================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- OU OPCAO 2: Criar politicas mais permissivas
-- (se preferir manter RLS habilitado)
-- =====================================================

-- Descomente abaixo se quiser manter RLS:

/*
-- Permitir SELECT para qualquer um (mesmo anon)
DROP POLICY IF EXISTS "Usuarios visiveis para autenticados" ON public.users;
DROP POLICY IF EXISTS "Usuarios visiveis para todos" ON public.users;
CREATE POLICY "Usuarios visiveis para todos"
  ON public.users FOR SELECT
  USING (true);

-- Permitir INSERT para service_role (API)
DROP POLICY IF EXISTS "Admins podem inserir usuarios" ON public.users;
DROP POLICY IF EXISTS "Service role pode inserir" ON public.users;
CREATE POLICY "Service role pode inserir"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- Permitir UPDATE para service_role e proprio usuario
DROP POLICY IF EXISTS "Usuarios atualizam proprio perfil" ON public.users;
DROP POLICY IF EXISTS "Permitir updates" ON public.users;
CREATE POLICY "Permitir updates"
  ON public.users FOR UPDATE
  USING (true)
  WITH CHECK (true);
*/

-- =====================================================
-- VERIFICAR: Checar se RLS esta desabilitado
-- =====================================================

SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Deve retornar rowsecurity = false
