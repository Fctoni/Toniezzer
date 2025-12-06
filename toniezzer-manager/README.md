# Toniezzer Manager

Sistema de gestao integral de obras residenciais.

## Stack Tecnico

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI Components:** shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Deploy:** Vercel

## Setup Local

### Pre-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase (https://supabase.com)

### Instalacao

1. Clone o repositorio:
```bash
git clone <repo-url>
cd toniezzer-manager
```

2. Instale as dependencias:
```bash
npm install
```

3. Configure as variaveis de ambiente:
```bash
cp env.example .env.local
```

4. Edite `.env.local` com suas credenciais do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

5. Execute as migrations no Supabase (ver pasta `supabase/migrations/`)

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

7. Acesse http://localhost:3000

## Estrutura do Projeto

```
toniezzer-manager/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Paginas de autenticacao
│   ├── (dashboard)/       # Paginas protegidas
│   └── api/               # API Routes
├── components/
│   ├── ui/                # Componentes base (shadcn/ui)
│   ├── features/          # Componentes de funcionalidades
│   └── layout/            # Componentes de layout
├── lib/
│   ├── supabase/          # Clientes Supabase
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript types
│   └── utils/             # Utilitarios
├── supabase/
│   ├── migrations/        # SQL migrations
│   └── functions/         # Edge Functions
└── public/                # Assets estaticos
```

## Scripts

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de producao
- `npm run start` - Servidor de producao
- `npm run lint` - Verificar linting
- `npm run type-check` - Verificar tipos TypeScript

## Documentacao

- [PRD Completo](../PRD-Toniezzer-Manager.md)
- [Plano de Implementacao](../Implementacao/plano%20de%20implementacao.md)
- [Fase 1 - Core Essencial](../Implementacao/FASE_01.md)

## Licenca

Proprietary - Todos os direitos reservados.

