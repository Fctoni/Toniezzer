-- =====================================================
-- MIGRACAO: Adicionar autenticacao ao Toniezzer Manager
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- ETAPA 1: Adicionar colunas email e role na tabela users
-- =====================================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'viewer' 
  CHECK (role IN ('admin', 'editor', 'viewer'));

-- Criar indice para busca por email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ETAPA 2: Habilitar RLS (Row Level Security) se ainda nao estiver
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politica: usuarios autenticados podem ver todos os usuarios
DROP POLICY IF EXISTS "Usuarios visiveis para autenticados" ON public.users;
CREATE POLICY "Usuarios visiveis para autenticados"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Politica: apenas admins podem inserir novos usuarios
DROP POLICY IF EXISTS "Admins podem inserir usuarios" ON public.users;
CREATE POLICY "Admins podem inserir usuarios"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = auth.jwt()->>'email' 
      AND role = 'admin'
    )
  );

-- Politica: usuarios podem atualizar apenas seu proprio perfil (campos nao-sensiveis)
DROP POLICY IF EXISTS "Usuarios atualizam proprio perfil" ON public.users;
CREATE POLICY "Usuarios atualizam proprio perfil"
  ON public.users FOR UPDATE
  TO authenticated
  USING (email = auth.jwt()->>'email')
  WITH CHECK (email = auth.jwt()->>'email');

-- ETAPA 3: (OPCIONAL) Trigger para criar perfil automaticamente
-- =====================================================
-- Descomente se quiser criar perfil automatico ao cadastrar usuario no Auth

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome_completo, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'viewer'
  )
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/

-- =====================================================
-- ETAPA 4: VINCULAR USUARIOS EXISTENTES (MANUAL)
-- =====================================================
-- Apos criar usuarios no Supabase Auth Dashboard, execute:
--
-- UPDATE public.users 
-- SET email = 'email@exemplo.com', role = 'admin'
-- WHERE nome_completo = 'Nome do Usuario';
--
-- Repita para cada usuario que precisa de acesso.

-- =====================================================
-- VERIFICACAO: Conferir estrutura apos migracao
-- =====================================================

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public';
