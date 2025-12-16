# Configuracao de Autenticacao - Toniezzer Manager

## Resumo das Mudancas

Foi implementado um sistema de autenticacao usando **Supabase Auth**. Agora o sistema:
- Exige login para acessar qualquer pagina
- Redireciona usuarios nao autenticados para `/login`
- Vincula o usuario logado ao perfil na tabela `users`

---

## Passo a Passo para Ativar

### 1. Executar Migracao SQL no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Va em **SQL Editor**
4. Cole e execute o conteudo do arquivo `SQL_AUTH_MIGRATION.sql`

Isso vai:
- Adicionar colunas `email` e `role` na tabela `users`
- Configurar politicas de seguranca (RLS)

### 2. Criar Usuario no Supabase Auth

1. No Supabase Dashboard, va em **Authentication** > **Users**
2. Clique em **Add user** > **Create new user**
3. Preencha:
   - **Email**: seu email
   - **Password**: uma senha segura
   - **Auto Confirm User**: marcado (para nao precisar confirmar email)
4. Clique em **Create user**

### 3. Vincular Usuario Auth ao Perfil

Execute este SQL no Supabase (substituindo os valores):

```sql
-- Vincular seu usuario do Auth ao perfil existente
UPDATE public.users 
SET 
  email = 'SEU_EMAIL_AQUI',
  role = 'admin'
WHERE nome_completo = 'SEU_NOME_NO_SISTEMA';

-- OU se precisar criar um novo usuario:
INSERT INTO public.users (email, nome_completo, role, ativo)
VALUES ('SEU_EMAIL_AQUI', 'Seu Nome', 'admin', true);
```

### 4. Configurar URLs de Redirect (Producao)

No Supabase Dashboard:
1. Va em **Authentication** > **URL Configuration**
2. Em **Site URL**, coloque a URL do seu site em producao
3. Em **Redirect URLs**, adicione:
   - `https://seu-dominio.com/auth/callback`
   - `http://localhost:3000/auth/callback` (para dev)

---

## Estrutura de Roles

| Role | Permissoes |
|------|------------|
| `admin` | Acesso total - gerenciar usuarios, ver financeiro |
| `editor` | Criar/editar dados |
| `viewer` | Apenas visualizar |

---

## Arquivos Criados/Modificados

### Novos arquivos:
- `src/proxy.ts` - Protege rotas (Next.js 16 usa proxy ao inves de middleware)
- `src/lib/supabase/proxy.ts` - Helper de autenticacao
- `src/app/(auth)/login/page.tsx` - Pagina de login
- `src/app/(auth)/layout.tsx` - Layout para paginas de auth
- `src/app/auth/callback/route.ts` - Callback do OAuth
- `SQL_AUTH_MIGRATION.sql` - Script SQL para migracao

### Arquivos modificados:
- `src/lib/hooks/use-current-user.tsx` - Agora usa auth real
- `src/lib/types/database.ts` - Novos campos email e role
- `src/components/layout/header.tsx` - Menu de usuario com logout

---

## Testando Localmente

1. Execute a migracao SQL
2. Crie um usuario no Supabase Auth
3. Vincule ao perfil
4. Rode o projeto: `npm run dev`
5. Acesse `http://localhost:3000` - sera redirecionado para login
6. Faca login com email/senha
7. Sera redirecionado para o dashboard

---

## Troubleshooting

### "Email ou senha incorretos"
- Verifique se o email esta correto
- Verifique se o usuario foi criado no Supabase Auth
- Se usou "Confirm email", verifique se confirmou

### Usuario logado mas "Usuario nao encontrado"
- Verifique se o email do Auth esta vinculado a um registro na tabela `users`
- Execute: `SELECT * FROM public.users WHERE email = 'seu@email.com'`

### Redirect infinito
- Verifique se as variaveis de ambiente estao corretas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Gestao de Usuarios (Admin)

Para que admins possam criar/editar usuarios pelo sistema, adicione a variavel de ambiente:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**IMPORTANTE**: A `service_role` key tem acesso total ao banco. NUNCA exponha no frontend.

Para encontrar a key:
1. Supabase Dashboard > Settings > API
2. Copie a `service_role` key (nao a `anon` key)

### Funcionalidades disponiveis em /configuracoes/usuarios:
- Criar novos usuarios (email + senha + role)
- Editar informacoes de usuarios
- Alterar senha de usuarios
- Ativar/Desativar usuarios
