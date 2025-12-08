PRD-Toniezzer-Manager.md
# 📋 PRD - Toniezzer Manager v1.0 (MVP)

**Product Requirements Document**

---

## 📊 **INFORMAÇÕES DO DOCUMENTO**

| Campo | Valor |
|-------|-------|
| **Versão do PRD** | 1.0 MVP |
| **Última Atualização** | 08/12/2024 - MVP sem auth + Módulo de Compras |
| **Autor** | Claude (Anthropic) |
| **IA de Desenvolvimento** | Claude 4.5 Sonnet |
| **Status** | ✅ Aprovado para desenvolvimento |
| **Projeto** | Sistema de Gestão de Obra Residencial |
| **URL** | obra.toniezzer.com |

> ⚠️ **MVP:** Esta versão não possui sistema de login nem políticas de segurança (RLS). O app inicia diretamente no dashboard. Autenticação e permissões serão implementadas em versão futura.

---

## 🎯 **1. VISÃO GERAL DO PRODUTO**

### **1.1 Objetivo**

Criar um sistema web moderno e completo para **gestão integral de obras residenciais**, com foco em controle financeiro, cronograma, qualidade, comunicação centralizada e automação inteligente através de IA para reduzir trabalho manual e prevenir problemas.

### **1.2 Problema que Resolve**

#### **Dores do Proprietário (sem experiência em obras):**
- ❌ Risco de estourar orçamento (obra de R$ 5 milhões, 24 meses)
- ❌ Atrasos sem visibilidade das causas reais
- ❌ Dificuldade em acompanhar múltiplos prestadores simultaneamente
- ❌ Perda de documentos (notas fiscais, contratos, plantas)
- ❌ Falta de comunicação causando retrabalhos e "gambiarras"
- ❌ Sem histórico rastreável de decisões e mudanças
- ❌ Dificuldade em garantir qualidade (sem experiência técnica)
- ❌ Trabalho manual excessivo para lançar gastos e organizar informações

#### **Dores do Administrador de Obra:**
- ❌ Sobrecarga de tarefas administrativas manuais
- ❌ Dificuldade em comunicar status para o proprietário
- ❌ Falta de ferramentas para controlar qualidade sistematicamente
- ❌ Dificuldade em gerenciar múltiplas etapas e dependências

#### **Dores dos Prestadores:**
- ❌ Falta de visibilidade do que fazer (prioridades)
- ❌ Comunicação descentralizada (WhatsApp, ligações, sem registro)
- ❌ Dificuldade em comprovar conclusão de etapas

### **1.3 Solução Proposta**

✅ **Sistema web moderno e inteligente (Next.js + Supabase + IA) com:**

**Controle Financeiro:**
- Orçamento vs realizado em tempo real
- Alertas automáticos (80% e 100% por categoria)
- Projeção de gastos futuros (fluxo de caixa)
- Controle de parcelas e compromissos futuros
- Relatórios automáticos semanais

**Automação com IA:**
- 📧 Monitoramento de email (casa@toniezzer.com) com OCR de notas fiscais
- 📸 OCR de recibos via foto (mobile) com sugestão automática de lançamento
- 🎙️ Processamento de reuniões (Plaud) com extração de decisões, tarefas e gastos
- 🤖 Classificação inteligente de gastos por categoria
- 📊 Análise preditiva de atrasos e riscos

**Cronograma e Qualidade:**
- Timeline visual de etapas com status e dependências
- Fluxo de aprovação (Prestador → Admin Obra → Checklist Qualidade → Concluído)
- Recálculo automático de datas quando há atrasos
- Checklists de qualidade configuráveis por etapa
- Registro fotográfico obrigatório

**Comunicação:**
- Feed centralizado tipo timeline (substitui WhatsApp)
- @menções para notificar pessoas específicas
- Backlinks entre reuniões, decisões e lançamentos
- Histórico completo e rastreável

**Gestão de Documentos:**
- Galeria de fotos organizada por etapa/data
- Upload seguro de plantas, contratos, notas fiscais
- Versionamento de documentos
- Busca por tags e categorias

**Acesso Inteligente:**
- 📱 Mobile para prestadores (lançamentos rápidos)
- 💻 Desktop para análises e planejamento (proprietário/admin)
- 🔒 Permissões granulares por perfil de usuário
- 🌐 Acesso remoto para todos

### **1.4 Usuários-Alvo**

> ⚠️ **MVP:** Nesta versão, não há diferenciação de perfis. Todos os usuários têm acesso completo ao sistema.

| Perfil | Quantidade | Uso Principal | Plataforma |
|--------|------------|---------------|------------|
| **👤 Usuário** | 1+ | Acesso completo a todas funcionalidades | Desktop + Mobile |

**Versão Futura:** Sistema completo de perfis (Proprietário, Admin Obra, Arquiteto, Prestadores, Visualizadores) com permissões diferenciadas.

---

## 🏗️ **2. STACK TÉCNICO**

### **2.1 Frontend**

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 14+ (App Router) | Framework React full-stack, SSR, API routes |
| **TypeScript** | 5+ | Type safety, prevenção de erros |
| **Tailwind CSS** | 3+ | Estilização utilitária, responsiva |
| **shadcn/ui** | Latest | Componentes UI base (button, modal, table, etc) |
| **@dnd-kit** | Latest | Drag & drop (Kanban de emails, reordenação) |
| **date-fns** | Latest | Manipulação de datas (cronograma, prazos) |
| **Zod** | Latest | Validação de schemas e forms |
| **React Hook Form** | Latest | Gerenciamento de formulários |
| **Recharts** | Latest | Gráficos (orçamento, fluxo de caixa) |

### **2.2 Backend**

| Tecnologia | Propósito |
|------------|-----------|
| **Supabase Cloud** | Backend-as-a-Service (plano pago) |
| ├─ **PostgreSQL** | Banco de dados relacional |
| ├─ **Auth** | Autenticação (email/senha, magic link) |
| ├─ **Realtime** | Sincronização em tempo real (feed, notificações) |
| ├─ **Storage** | Armazenamento de arquivos (fotos, PDFs, plantas) |
| └─ **Edge Functions** | Lógica serverless (processamento IA, automações) |

**Buckets do Supabase Storage:**
- `documentos-privados` - Contratos, notas fiscais (RLS restrito)
- `plantas` - Plantas e projetos (RLS por perfil)
- `fotos-obra` - Fotos de progresso (públicas para usuários autenticados)
- `fotos-temp` - Upload temporário antes de aprovação

### **2.3 Integrações e APIs Externas**

| Serviço | Propósito | Implementação |
|---------|-----------|---------------|
| **Google Gemini 3** | LLM para IA (OCR, classificação, extração, análise) | Edge Function |
| **IMAP** | Monitoramento de casa@toniezzer.com | Edge Function (polling 15min) |
| **Plaud (manual)** | Import de resumos de reuniões (Markdown) | Upload + Edge Function |

**Nota:** O Gemini 3 substitui a necessidade de Google Vision API, pois aceita imagens diretamente e realiza OCR + análise em uma única chamada.

**Observação:** Integração bancária será manual (import de PDF/CSV) nesta versão por questões de segurança.

### **2.4 Ferramentas de Desenvolvimento**

- **Cursor + MCP**: Acesso direto ao Supabase durante desenvolvimento
- **Git**: Controle de versão
- **Vercel**: Deploy cloud (otimizado para Next.js)
- **Vercel Analytics**: Monitoramento de performance

### **2.5 Deploy e Infraestrutura**

| Componente | Onde | Observação |
|------------|------|------------|
| **Frontend + API Routes** | Vercel | Deploy automático via Git |
| **Banco de Dados** | Supabase Cloud | Plano pago (já contratado) |
| **Storage** | Supabase Storage | Mesmo cluster do banco |
| **Edge Functions** | Supabase | Deno runtime |
| **Domínio** | obra.toniezzer.com | Já registrado, configurar DNS |

**Ambiente:** Apenas **produção** (sem dev/staging separados).

---

## 📐 **3. ARQUITETURA DO SISTEMA**

### **3.1 Estrutura de Pastas (Next.js App Router)**

```
toniezzer-manager/
├── app/
│   ├── (auth)/                         # Layout de autenticação
│   │   ├── login/
│   │   │   └── page.tsx               # Página de login
│   │   ├── register/
│   │   │   └── page.tsx               # Registro de usuários
│   │   └── layout.tsx                 # Layout auth (sem sidebar)
│   │
│   ├── (dashboard)/                    # Layout principal (após login)
│   │   ├── layout.tsx                 # Header, sidebar, notificações
│   │   │
│   │   ├── page.tsx                   # Dashboard principal (overview)
│   │   │
│   │   ├── compras/                    # FASE 1 - Módulo de Compras
│   │   │   ├── page.tsx              # Lista de compras com filtros
│   │   │   ├── nova/
│   │   │   │   └── page.tsx          # Nova compra + geração de parcelas
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detalhes + pagamento de parcelas
│   │   │
│   │   ├── financeiro/                # FASE 1
│   │   │   ├── page.tsx              # Visão geral financeira
│   │   │   ├── lancamentos/
│   │   │   │   ├── page.tsx          # Lista de parcelas/lançamentos
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Detalhes do lançamento
│   │   │   ├── orcamento/
│   │   │   │   └── page.tsx          # Configurar orçamento por categoria
│   │   │   └── fluxo-caixa/
│   │   │       └── page.tsx          # Projeção fluxo de caixa
│   │   │
│   │   ├── cronograma/                # FASE 1
│   │   │   ├── page.tsx              # Timeline de etapas
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Detalhes da etapa
│   │   │   └── dependencias/
│   │   │       └── page.tsx          # Configurar dependências
│   │   │
│   │   ├── documentos/                # FASE 1
│   │   │   ├── page.tsx              # Galeria e lista de documentos
│   │   │   ├── fotos/
│   │   │   │   └── page.tsx          # Galeria de fotos
│   │   │   └── plantas/
│   │   │       └── page.tsx          # Plantas e projetos
│   │   │
│   │   ├── comunicacao/               # FASE 2
│   │   │   └── page.tsx              # Feed centralizado
│   │   │
│   │   ├── fornecedores/              # FASE 2
│   │   │   ├── page.tsx              # Lista de fornecedores
│   │   │   ├── novo/
│   │   │   │   └── page.tsx          # Cadastrar fornecedor
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detalhes e avaliação
│   │   │
│   │   ├── emails/                    # FASE 3 (Automação IA)
│   │   │   ├── page.tsx              # Kanban de emails (3 colunas)
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detalhes do email + aprovação
│   │   │
│   │   ├── reunioes/                  # FASE 3 (Automação IA)
│   │   │   ├── page.tsx              # Lista de reuniões
│   │   │   ├── nova/
│   │   │   │   └── page.tsx          # Upload Plaud markdown
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Resumo + action items + backlinks
│   │   │
│   │   ├── compras/                   # FASE 4
│   │   │   └── page.tsx              # Gestão de materiais
│   │   │
│   │   ├── qualidade/                 # FASE 4
│   │   │   ├── page.tsx              # Checklists e templates
│   │   │   └── [etapa_id]/
│   │   │       └── page.tsx          # Checklist de etapa específica
│   │   │
│   │   ├── relatorios/                # FASE 4
│   │   │   ├── page.tsx              # Lista de relatórios
│   │   │   └── [tipo]/
│   │   │       └── page.tsx          # Relatório específico
│   │   │
│   │   ├── mudancas/                  # FASE 5 (Change Orders)
│   │   │   ├── page.tsx              # Lista de mudanças de escopo
│   │   │   ├── nova/
│   │   │   │   └── page.tsx          # Solicitar mudança
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detalhes e aprovação
│   │   │
│   │   └── configuracoes/             # Todas as fases
│   │       ├── page.tsx              # Overview de configurações
│   │       ├── categorias/
│   │       │   └── page.tsx          # Gerenciar categorias de gastos
│   │       ├── status/
│   │       │   └── page.tsx          # Gerenciar status de etapas
│   │       ├── prestadores/
│   │       │   └── page.tsx          # Tipos de prestadores
│   │       ├── usuarios/
│   │       │   └── page.tsx          # Gerenciar usuários e permissões
│   │       └── integrações/
│   │           └── page.tsx          # Config de APIs (Gemini, IMAP, etc)
│   │
│   └── api/                            # API routes (se necessário)
│       ├── upload/
│       │   └── route.ts               # Upload direto para Supabase Storage
│       └── webhooks/
│           └── route.ts               # Webhooks externos
│
├── components/
│   ├── ui/                             # Componentes base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── modal.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── table.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── calendar.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── features/                       # Componentes de funcionalidades
│   │   ├── compras/
│   │   │   ├── compra-form.tsx       # Formulário de nova compra
│   │   │   ├── compra-card.tsx       # Card de resumo de compra
│   │   │   ├── compras-list.tsx      # Lista com filtros e resumo
│   │   │   ├── compras-table.tsx     # Tabela de compras
│   │   │   ├── compras-filters.tsx   # Filtros avançados
│   │   │   ├── parcelas-preview.tsx  # Preview de parcelas antes de criar
│   │   │   └── parcelas-table.tsx    # Tabela de parcelas com ações
│   │   │
│   │   ├── financeiro/
│   │   │   ├── lancamentos-list.tsx  # Lista de lançamentos com filtros
│   │   │   ├── lancamentos-table.tsx # Tabela de lançamentos
│   │   │   ├── lancamentos-filters.tsx # Filtros avançados
│   │   │   ├── orcamento-editor.tsx
│   │   │   ├── gastos-chart.tsx
│   │   │   └── fluxo-caixa-chart.tsx
│   │   │
│   │   ├── cronograma/
│   │   │   ├── timeline.tsx
│   │   │   ├── etapa-card.tsx
│   │   │   ├── dependencias-graph.tsx
│   │   │   └── progresso-bar.tsx
│   │   │
│   │   ├── comunicacao/
│   │   │   ├── feed-item.tsx
│   │   │   ├── comentario.tsx
│   │   │   ├── mencoes-input.tsx
│   │   │   └── filtros-feed.tsx
│   │   │
│   │   ├── documentos/
│   │   │   ├── galeria-fotos.tsx
│   │   │   ├── upload-area.tsx
│   │   │   ├── preview-pdf.tsx
│   │   │   └── versionamento.tsx
│   │   │
│   │   ├── emails/
│   │   │   ├── kanban-emails.tsx
│   │   │   ├── email-card.tsx
│   │   │   ├── preview-ocr.tsx
│   │   │   └── form-aprovacao.tsx
│   │   │
│   │   ├── reunioes/
│   │   │   ├── resumo-viewer.tsx
│   │   │   ├── action-items-list.tsx
│   │   │   ├── backlinks.tsx
│   │   │   └── upload-plaud.tsx
│   │   │
│   │   └── qualidade/
│   │       ├── checklist-form.tsx
│   │       ├── template-builder.tsx
│   │       └── foto-obrigatoria.tsx
│   │
│   └── layout/
│       ├── header.tsx
│       ├── sidebar.tsx
│       ├── notificacoes.tsx
│       ├── mobile-nav.tsx
│       └── perfil-dropdown.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Cliente browser
│   │   ├── server.ts                  # Cliente server
│   │   ├── middleware.ts              # Auth middleware
│   │   └── storage.ts                 # Helpers para Storage
│   │
│   ├── types/
│   │   ├── database.ts                # Tipos gerados do Supabase
│   │   ├── user.ts                    # Tipos de usuários e permissões
│   │   └── entities.ts                # Entidades de negócio
│   │
│   ├── utils/
│   │   ├── helpers.ts                 # Funções utilitárias gerais
│   │   ├── validators.ts              # Validações com Zod
│   │   ├── formatters.ts              # Formatação de datas, moeda
│   │   └── permissions.ts             # Lógica de permissões
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── use-financeiro.ts         # Dados financeiros
│   │   ├── use-cronograma.ts         # Etapas e cronograma
│   │   ├── use-fornecedores.ts       # Fornecedores
│   │   ├── use-realtime.ts           # Sincronização real-time
│   │   ├── use-user.ts               # Usuário logado
│   │   └── use-permissions.ts        # Verificar permissões
│   │
│   └── ai/                             # Módulos de IA
│       ├── gemini-client.ts          # Cliente Gemini
│       ├── ocr-processor.ts          # Processamento OCR
│       ├── email-classifier.ts       # Classificação de emails
│       ├── plaud-parser.ts           # Parser de Markdown do Plaud
│       └── predictions.ts            # Análises preditivas
│
├── supabase/
│   ├── functions/                      # Edge Functions
│   │   ├── process-email/
│   │   │   └── index.ts              # Polling IMAP + OCR
│   │   ├── process-ocr/
│   │   │   └── index.ts              # OCR de recibo via foto
│   │   ├── process-plaud/
│   │   │   └── index.ts              # Parser Plaud + extração IA
│   │   ├── generate-report/
│   │   │   └── index.ts              # Gerar PDF de relatório
│   │   └── recalculate-dates/
│   │       └── index.ts              # Recalcular datas de etapas
│   │
│   └── migrations/                     # Migrations SQL
│       ├── 001_initial_schema.sql
│       ├── 002_add_rls_policies.sql
│       ├── 003_add_triggers.sql
│       └── ...
│
├── public/
│   ├── icons/
│   │   ├── favicon.ico
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   ├── manifest.json                   # PWA manifest
│   └── robots.txt
│
├── styles/
│   └── globals.css
│
├── .env.local                          # Variáveis de ambiente
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

### **3.2 Princípios Arquiteturais**

**1. Manutenibilidade em Primeiro Lugar**
- ✅ Separação clara de concerns (UI / lógica / dados)
- ✅ Componentes pequenos e focados (< 250 linhas)
- ✅ Hooks customizados para lógica reutilizável
- ✅ Tipos TypeScript centralizados e gerados do Supabase

**2. Código Autodocumentado**
- ✅ Nomes descritivos de variáveis/funções
- ✅ Interfaces explícitas com TypeScript
- ✅ Comentários JSDoc onde necessário
- ✅ README em cada pasta de funcionalidade

**3. Componentização Inteligente**
- ✅ Componentes UI puros (sem lógica de negócio)
- ✅ Componentes de feature com lógica isolada
- ✅ Props tipadas rigorosamente
- ✅ Composição > herança

**4. Gerenciamento de Estado**
- ✅ Server state: Hooks do Supabase + React Query
- ✅ UI state: useState/useReducer local
- ✅ Estado global MÍNIMO (só autenticação e permissões)
- ✅ Realtime para sincronização automática

**5. Segurança**
- ✅ RLS (Row Level Security) rigoroso no Supabase
- ✅ Validação de inputs no cliente E servidor
- ✅ Sanitização de dados antes de exibir
- ✅ HTTPS obrigatório (Vercel + Supabase)

**6. Performance**
- ✅ SSR onde apropriado (SEO, first load)
- ✅ Lazy loading de componentes pesados
- ✅ Otimização de imagens (Next.js Image)
- ✅ Paginação/virtualização de listas grandes
- ✅ Índices apropriados no PostgreSQL

**7. Responsividade**
- ✅ Mobile-first para prestadores
- ✅ Desktop-optimized para análises
- ✅ Breakpoints consistentes (Tailwind)
- ✅ Touch-friendly (botões grandes, espaçamento adequado)

---

## 🗄️ **4. MODELO DE DADOS (SUPABASE / POSTGRESQL)**

### **Convenções Gerais:**
- IDs: `uuid` (gerado pelo Supabase)
- Timestamps: `timestamptz` (timezone-aware)
- Soft delete: usar coluna `deleted_at` (nullable)
- Audit: `created_at`, `updated_at`, `created_by`, `updated_by`
- Enums: usar `text` com `CHECK` constraints

> ⚠️ **MVP:** RLS desabilitado nesta versão. Será implementado em versão futura com autenticação.

---

### **4.1 Tabela: `users`**

> ⚠️ **MVP:** Tabela simplificada sem autenticação.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | ID do usuário |
| `nome_completo` | text | NOT NULL | Nome completo |
| `telefone` | text | NULL | Telefone de contato |
| `especialidade` | text | NULL | Especialidade (ex: pedreiro, eletricista) |
| `avatar_url` | text | NULL | URL do avatar (Supabase Storage) |
| `ativo` | boolean | DEFAULT true | Usuário ativo/inativo |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_users_ativo` ON `ativo`

---

### **4.2 Tabela: `categorias` (categorias de gastos)**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID da categoria |
| `nome` | text | NOT NULL, UNIQUE | Nome da categoria |
| `cor` | text | NOT NULL | Cor em hex (#FF5733) |
| `icone` | text | NULL | Nome do ícone (opcional) |
| `ordem` | integer | NOT NULL, DEFAULT 0 | Ordem de exibição |
| `orcamento` | decimal | NULL | Orçamento planejado para esta categoria |
| `ativo` | boolean | DEFAULT true | Categoria ativa |
| `created_by` | uuid | FK(users.id) | Criado por |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_categorias_ativo` ON `ativo`
- `idx_categorias_ordem` ON `ordem`

> ⚠️ **MVP:** Sem RLS - acesso livre a todas as categorias.

---

### **4.3 Tabela: `subcategorias`**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID da subcategoria |
| `categoria_id` | uuid | FK(categorias.id) ON DELETE CASCADE | Categoria pai |
| `nome` | text | NOT NULL | Nome da subcategoria |
| `ativo` | boolean | DEFAULT true | Subcategoria ativa |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_subcategorias_categoria` ON `categoria_id`
- `idx_subcategorias_ativo` ON `ativo`

---

### **4.4 Tabela: `centros_custo`**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID do centro de custo |
| `nome` | text | NOT NULL, UNIQUE | Nome do centro de custo |
| `codigo` | text | NULL | Código contábil (opcional) |
| `descricao` | text | NULL | Descrição |
| `ativo` | boolean | DEFAULT true | Centro de custo ativo |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_centros_custo_ativo` ON `ativo`
- `idx_centros_custo_codigo` ON `codigo`

**Observação:** Centros de custo são opcionais. Se não forem necessários inicialmente, podem ser ignorados. Os campos `categoria_id` e `etapa_relacionada_id` já fornecem boa granularidade de controle.

---

### **4.5 Tabela: `fornecedores`**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID do fornecedor |
| `nome` | text | NOT NULL | Nome do fornecedor |
| `cnpj_cpf` | text | NULL | CNPJ ou CPF |
| `email` | text | NULL | Email de contato |
| `telefone` | text | NULL | Telefone |
| `endereco` | text | NULL | Endereço completo |
| `tipo` | text | NULL | Tipo: fornecedor_material, prestador_servico |
| `especialidade` | text | NULL | Especialidade (se prestador) |
| `avaliacao` | integer | NULL, CHECK (avaliacao >= 1 AND avaliacao <= 5) | Avaliação 1-5 estrelas |
| `comentario_avaliacao` | text | NULL | Comentário sobre avaliação |
| `ativo` | boolean | DEFAULT true | Fornecedor ativo |
| `created_by` | uuid | FK(users.id) | Criado por |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_fornecedores_nome` ON `nome`
- `idx_fornecedores_tipo` ON `tipo`
- `idx_fornecedores_ativo` ON `ativo`

---

### **4.5 Tabela: `etapas` (etapas do cronograma)**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID da etapa |
| `nome` | text | NOT NULL | Nome da etapa |
| `descricao` | text | NULL | Descrição detalhada |
| `status` | text | NOT NULL, CHECK | **Ver enum abaixo** |
| `data_inicio_prevista` | date | NULL | Data prevista de início |
| `data_fim_prevista` | date | NULL | Data prevista de término |
| `data_inicio_real` | date | NULL | Data real de início |
| `data_fim_real` | date | NULL | Data real de término |
| `responsavel_id` | uuid | FK(users.id), NULL | Responsável pela etapa |
| `progresso_percentual` | integer | DEFAULT 0, CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100) | Progresso 0-100% |
| `progresso_manual` | boolean | DEFAULT false | Se foi editado manualmente |
| `ordem` | integer | NOT NULL | Ordem de exibição |
| `created_by` | uuid | FK(users.id) | Criado por |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Enum de Status:**
```sql
CHECK (status IN (
  'nao_iniciada',
  'em_andamento',
  'aguardando_aprovacao',  -- Prestador solicitou conclusão
  'aguardando_qualidade',  -- Admin aprovou, aguarda checklist
  'em_retrabalho',         -- Checklist reprovou
  'pausada',
  'atrasada',              -- Calculado automaticamente
  'concluida'
))
```

**Índices:**
- `idx_etapas_status` ON `status`
- `idx_etapas_responsavel` ON `responsavel_id`
- `idx_etapas_datas` ON `data_inicio_prevista`, `data_fim_prevista`
- `idx_etapas_ordem` ON `ordem`

**Trigger:**
- `trigger_update_status_atrasada`: Verifica diariamente se etapas estão atrasadas

---

### **4.6 Tabela: `etapas_dependencias`**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID da dependência |
| `etapa_id` | uuid | FK(etapas.id) ON DELETE CASCADE | Etapa que depende |
| `depende_de_etapa_id` | uuid | FK(etapas.id) ON DELETE CASCADE | Etapa da qual depende |
| `tipo` | text | NOT NULL, CHECK | obrigatoria ou recomendada |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |

**Constraints:**
```sql
CHECK (tipo IN ('obrigatoria', 'recomendada'))
CHECK (etapa_id != depende_de_etapa_id) -- Não pode depender de si mesma
UNIQUE (etapa_id, depende_de_etapa_id) -- Sem duplicatas
```

**Índices:**
- `idx_dependencias_etapa` ON `etapa_id`
- `idx_dependencias_depende` ON `depende_de_etapa_id`

---

### **4.7 Tabela: `compras` (compras parceladas)**

> ✅ **Implementado na FASE 1** - Módulo central de gestão financeira

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID da compra |
| `descricao` | text | NOT NULL | Descrição da compra |
| `valor_total` | decimal | NOT NULL, CHECK (valor_total > 0) | Valor total em reais |
| `data_compra` | date | NOT NULL | Data da compra |
| `fornecedor_id` | uuid | FK(fornecedores.id), NOT NULL | Fornecedor |
| `categoria_id` | uuid | FK(categorias.id), NOT NULL | Categoria |
| `subcategoria_id` | uuid | FK(subcategorias.id), NULL | Subcategoria (opcional) |
| `etapa_relacionada_id` | uuid | FK(etapas.id), NULL | Etapa relacionada |
| `centro_custo_id` | uuid | FK(centros_custo.id), NULL | Centro de custo (opcional) |
| `forma_pagamento` | text | NOT NULL, CHECK | dinheiro, pix, cartao, boleto, cheque |
| `parcelas` | integer | DEFAULT 1, CHECK (parcelas >= 1) | Número de parcelas |
| `data_primeira_parcela` | date | NOT NULL | Data de vencimento da 1ª parcela |
| `nota_fiscal_url` | text | NULL | URL da nota fiscal (Supabase Storage) |
| `nota_fiscal_numero` | text | NULL | Número da NF-e |
| `status` | text | NOT NULL, DEFAULT 'ativa', CHECK | ativa, quitada, cancelada |
| `valor_pago` | decimal | DEFAULT 0 | Valor já pago |
| `parcelas_pagas` | integer | DEFAULT 0 | Quantidade de parcelas pagas |
| `observacoes` | text | NULL | Observações adicionais |
| `criado_por` | uuid | FK(users.id), NULL | Quem criou |
| `criado_via` | text | NOT NULL, DEFAULT 'manual', CHECK | manual, email, ocr, plaud |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Constraints:**
```sql
CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'boleto', 'cheque'))
CHECK (status IN ('ativa', 'quitada', 'cancelada'))
CHECK (criado_via IN ('manual', 'email', 'ocr', 'plaud'))
```

**Índices:**
- `idx_compras_data` ON `data_compra`
- `idx_compras_fornecedor` ON `fornecedor_id`
- `idx_compras_categoria` ON `categoria_id`
- `idx_compras_status` ON `status`
- `idx_compras_criado_por` ON `criado_por`

**Trigger:**
- `trigger_atualiza_compra_ao_pagar`: Atualiza `valor_pago`, `parcelas_pagas` e `status` quando parcela é marcada como paga

---

### **4.8 Tabela: `gastos` (parcelas/lançamentos financeiros)**

> 📝 **Nota:** A partir da implementação do módulo de Compras, os gastos são criados automaticamente como parcelas vinculadas a uma compra via `compra_id`.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID do gasto |
| `descricao` | text | NOT NULL | Descrição do gasto |
| `valor` | decimal | NOT NULL, CHECK (valor > 0) | Valor em reais |
| `data` | date | NOT NULL | Data de vencimento |
| `categoria_id` | uuid | FK(categorias.id), NOT NULL | Categoria |
| `subcategoria_id` | uuid | FK(subcategorias.id), NULL | Subcategoria (opcional) |
| `fornecedor_id` | uuid | FK(fornecedores.id), NULL | Fornecedor |
| `forma_pagamento` | text | NOT NULL, CHECK | dinheiro, pix, cartao, boleto, cheque |
| `parcelas` | integer | DEFAULT 1, CHECK (parcelas >= 1) | Número total de parcelas |
| `parcela_atual` | integer | NULL, CHECK (parcela_atual >= 1 AND parcela_atual <= parcelas) | Número desta parcela |
| `nota_fiscal_url` | text | NULL | URL da nota fiscal (Supabase Storage) |
| `nota_fiscal_numero` | text | NULL | Número da NF-e |
| `etapa_relacionada_id` | uuid | FK(etapas.id), NULL | Etapa relacionada |
| `centro_custo_id` | uuid | FK(centros_custo.id), NULL | Centro de custo (opcional) |
| `status` | text | NOT NULL, CHECK | pendente_aprovacao, aprovado, rejeitado |
| `aprovado_por` | uuid | FK(users.id), NULL | Quem aprovou |
| `aprovado_em` | timestamptz | NULL | Data de aprovação |
| `criado_por` | uuid | FK(users.id), NULL | Quem criou |
| `criado_via` | text | NOT NULL, CHECK | manual, email, ocr, bancario |
| `observacoes` | text | NULL | Observações adicionais |
| `compra_id` | uuid | FK(compras.id), NULL | **Compra relacionada (vincula parcela à compra)** |
| `pago` | boolean | DEFAULT false | **Se a parcela foi paga** |
| `pago_em` | timestamptz | NULL | **Data em que foi pago** |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Constraints:**
```sql
CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'boleto', 'cheque'))
CHECK (status IN ('pendente_aprovacao', 'aprovado', 'rejeitado'))
CHECK (criado_via IN ('manual', 'email', 'ocr', 'bancario'))
```

**Índices:**
- `idx_gastos_data` ON `data`
- `idx_gastos_categoria` ON `categoria_id`
- `idx_gastos_fornecedor` ON `fornecedor_id`
- `idx_gastos_etapa` ON `etapa_relacionada_id`
- `idx_gastos_centro_custo` ON `centro_custo_id`
- `idx_gastos_status` ON `status`
- `idx_gastos_criado_por` ON `criado_por`
- `idx_gastos_compra` ON `compra_id`
- `idx_gastos_pago` ON `pago`

**Trigger:**
- `trigger_atualiza_compra`: Ao marcar `pago = true`, atualiza a compra relacionada

---

### **4.10 Tabela: `documentos`**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID do documento |
| `nome` | text | NOT NULL | Nome do arquivo |
| `tipo` | text | NOT NULL, CHECK | foto, planta, contrato, nota_fiscal, outro |
| `url` | text | NOT NULL | URL no Supabase Storage |
| `tamanho_bytes` | bigint | NULL | Tamanho do arquivo |
| `mime_type` | text | NULL | Tipo MIME |
| `etapa_relacionada_id` | uuid | FK(etapas.id), NULL | Etapa relacionada |
| `gasto_relacionado_id` | uuid | FK(gastos.id), NULL | Gasto relacionado |
| `versao` | integer | DEFAULT 1 | Versão do documento |
| `documento_pai_id` | uuid | FK(documentos.id), NULL | Se for versão de outro doc |
| `tags` | text[] | NULL | Tags para busca |
| `created_by` | uuid | FK(users.id), NOT NULL | Quem fez upload |
| `created_at` | timestamptz | DEFAULT now() | Data de upload |

**Constraints:**
```sql
CHECK (tipo IN ('foto', 'planta', 'contrato', 'nota_fiscal', 'outro'))
```

**Índices:**
- `idx_documentos_tipo` ON `tipo`
- `idx_documentos_etapa` ON `etapa_relacionada_id`
- `idx_documentos_gasto` ON `gasto_relacionado_id`
- `idx_documentos_tags` ON `tags` USING GIN
- `idx_documentos_created_at` ON `created_at`

---

### **4.11 Tabela: `feed_comunicacao` (feed centralizado)**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID do post |
| `tipo` | text | NOT NULL, CHECK | post, decisao, alerta, sistema |
| `conteudo` | text | NOT NULL | Conteúdo do post |
| `autor_id` | uuid | FK(users.id), NOT NULL | Autor |
| `etapa_relacionada_id` | uuid | FK(etapas.id), NULL | Etapa relacionada |
| `gasto_relacionado_id` | uuid | FK(gastos.id), NULL | Gasto relacionado |
| `reuniao_relacionada_id` | uuid | FK(reunioes.id), NULL | Reunião relacionada |
| `mencoes` | uuid[] | NULL | Array de user_ids mencionados |
| `anexos` | jsonb | NULL | [{tipo, url, nome}] |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |
| `editado` | boolean | DEFAULT false | Se foi editado |

**Constraints:**
```sql
CHECK (tipo IN ('post', 'decisao', 'alerta', 'sistema'))
```

**Índices:**
- `idx_feed_created_at` ON `created_at` DESC
- `idx_feed_autor` ON `autor_id`
- `idx_feed_etapa` ON `etapa_relacionada_id`
- `idx_feed_mencoes` ON `mencoes` USING GIN

**Trigger:**
- `trigger_notifica_mencoes`: Cria notificação para usuários mencionados

---

### **4.12 Tabela: `feed_comentarios`**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID do comentário |
| `feed_id` | uuid | FK(feed_comunicacao.id) ON DELETE CASCADE | Post relacionado |
| `conteudo` | text | NOT NULL | Conteúdo do comentário |
| `autor_id` | uuid | FK(users.id), NOT NULL | Autor |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |
| `editado` | boolean | DEFAULT false | Se foi editado |

**Índices:**
- `idx_comentarios_feed` ON `feed_id`
- `idx_comentarios_created_at` ON `created_at`

---

### **4.13 Tabela: `reunioes`**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID da reunião |
| `titulo` | text | NOT NULL | Título da reunião |
| `data_reuniao` | date | NOT NULL | Data da reunião |
| `participantes` | text[] | NULL | Array de nomes dos participantes |
| `resumo_markdown` | text | NOT NULL | Resumo completo (formato Plaud) |
| `arquivo_original_url` | text | NULL | URL do arquivo original (Storage) |
| `created_by` | uuid | FK(users.id), NOT NULL | Quem fez upload |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |

**Índices:**
- `idx_reunioes_data` ON `data_reuniao` DESC
- `idx_reunioes_created_by` ON `created_by`

---

### **4.14 Tabela: `reunioes_acoes` (action items extraídos)**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID da ação |
| `reuniao_id` | uuid | FK(reunioes.id) ON DELETE CASCADE | Reunião relacionada |
| `tipo` | text | NOT NULL, CHECK | decisao, tarefa, gasto, problema, mudanca_escopo |
| `descricao` | text | NOT NULL | Descrição da ação |
| `responsavel_id` | uuid | FK(users.id), NULL | Responsável |
| `prazo` | date | NULL | Prazo (se aplicável) |
| `valor` | decimal | NULL | Valor (se for gasto) |
| `categoria_id` | uuid | FK(categorias.id), NULL | Categoria (se for gasto) |
| `etapa_id` | uuid | FK(etapas.id), NULL | Etapa relacionada |
| `status` | text | NOT NULL, CHECK | pendente, em_andamento, concluido, cancelado |
| `gasto_criado_id` | uuid | FK(gastos.id), NULL | Backlink para gasto gerado |
| `feed_criado_id` | uuid | FK(feed_comunicacao.id), NULL | Backlink para post gerado |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Constraints:**
```sql
CHECK (tipo IN ('decisao', 'tarefa', 'gasto', 'problema', 'mudanca_escopo'))
CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado'))
```

**Índices:**
- `idx_acoes_reuniao` ON `reuniao_id`
- `idx_acoes_responsavel` ON `responsavel_id`
- `idx_acoes_status` ON `status`
- `idx_acoes_prazo` ON `prazo`

---

### **4.15 Tabela: `emails_monitorados`**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID interno |
| `email_id_externo` | text | UNIQUE, NOT NULL | ID do email no servidor IMAP |
| `remetente` | text | NOT NULL | Email do remetente |
| `remetente_nome` | text | NULL | Nome do remetente |
| `assunto` | text | NOT NULL | Assunto do email |
| `corpo` | text | NULL | Corpo do email |
| `data_recebimento` | timestamptz | NOT NULL | Data de recebimento |
| `status` | text | NOT NULL, CHECK | **Ver enum abaixo** |
| `anexos` | jsonb | NULL | [{nome, url_storage, tipo, tamanho}] |
| `dados_extraidos` | jsonb | NULL | Resultado do OCR/parser |
| `gasto_sugerido_id` | uuid | FK(gastos.id), NULL | Gasto sugerido pela IA |
| `erro_mensagem` | text | NULL | Mensagem de erro (se houver) |
| `processado_em` | timestamptz | NULL | Data de processamento |
| `processado_por` | uuid | FK(users.id), NULL | Quem aprovou/rejeitou |
| `created_at` | timestamptz | DEFAULT now() | Data de importação |

**Enum de Status:**
```sql
CHECK (status IN (
  'nao_processado',
  'processando',
  'aguardando_revisao',  -- IA sugeriu lançamento
  'processado',          -- Aprovado e lançamento criado
  'erro',                -- Erro no processamento
  'ignorado'             -- Usuário optou por ignorar
))
```

**Índices:**
- `idx_emails_status` ON `status`
- `idx_emails_data_recebimento` ON `data_recebimento` DESC
- `idx_emails_remetente` ON `remetente`

---

### **4.16 Tabela: `checklists_qualidade`**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID do checklist |
| `etapa_id` | uuid | FK(etapas.id) ON DELETE CASCADE | Etapa relacionada |
| `nome` | text | NOT NULL | Nome do checklist |
| `itens` | jsonb | NOT NULL | [{descricao, tipo, obrigatorio, valor_esperado}] |
| `preenchido_por` | uuid | FK(users.id), NULL | Quem preencheu |
| `preenchido_em` | timestamptz | NULL | Data de preenchimento |
| `resultados` | jsonb | NULL | [{item_id, conforme, obs, foto_url}] |
| `aprovado` | boolean | NULL | Se passou no checklist |
| `observacoes` | text | NULL | Observações gerais |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |

**Índices:**
- `idx_checklists_etapa` ON `etapa_id`
- `idx_checklists_preenchido_por` ON `preenchido_por`

---

### **4.17 Tabela: `notificacoes`**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID da notificação |
| `usuario_id` | uuid | FK(users.id) ON DELETE CASCADE | Destinatário |
| `tipo` | text | NOT NULL, CHECK | **Ver enum abaixo** |
| `titulo` | text | NOT NULL | Título da notificação |
| `mensagem` | text | NOT NULL | Mensagem |
| `link` | text | NULL | Link para ir ao clicar |
| `lida` | boolean | DEFAULT false | Se foi lida |
| `lida_em` | timestamptz | NULL | Data de leitura |
| `origem_id` | uuid | NULL | ID do objeto origem (genérico) |
| `origem_tipo` | text | NULL | Tipo do objeto origem |
| `created_at` | timestamptz | DEFAULT now() | Data de criação |

**Enum de Tipo:**
```sql
CHECK (tipo IN (
  'orcamento_80',         -- Categoria atingiu 80% do orçamento
  'orcamento_100',        -- Categoria atingiu 100% do orçamento
  'etapa_atrasada',       -- Etapa atrasou
  'etapa_aguardando',     -- Etapa aguardando sua aprovação
  'mencao',               -- Você foi mencionado no feed
  'gasto_aprovacao',      -- Gasto aguardando sua aprovação
  'mudanca_escopo',       -- Nova mudança de escopo
  'email_novo',           -- Novo email para revisar
  'tarefa_atribuida',     -- Nova tarefa atribuída
  'sistema'               -- Notificação do sistema
))
```

**Índices:**
- `idx_notificacoes_usuario` ON `usuario_id`
- `idx_notificacoes_lida` ON `lida`
- `idx_notificacoes_created_at` ON `created_at` DESC

---

### **4.18 Tabela: `mudancas_escopo` (Change Orders)**

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK | ID da mudança |
| `numero` | integer | UNIQUE, NOT NULL | Número sequencial da mudança |
| `titulo` | text | NOT NULL | Título da mudança |
| `descricao` | text | NOT NULL | Descrição detalhada |
| `justificativa` | text | NULL | Justificativa |
| `impacto_custo` | decimal | NULL | Impacto estimado no custo |
| `impacto_prazo_dias` | integer | NULL | Impacto em dias no prazo |
| `etapas_afetadas` | uuid[] | NULL | Array de etapa_ids |
| `status` | text | NOT NULL, CHECK | rascunho, aguardando_aprovacao, aprovada, rejeitada, cancelada |
| `solicitado_por` | uuid | FK(users.id), NOT NULL | Quem solicitou |
| `aprovado_por` | uuid | FK(users.id), NULL | Quem aprovou/rejeitou |
| `aprovado_em` | timestamptz | NULL | Data de aprovação/rejeição |
| `observacoes_aprovacao` | text | NULL | Observações do aprovador |
| `created_at` | timestamptz | DEFAULT now() | Data de solicitação |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Constraints:**
```sql
CHECK (status IN ('rascunho', 'aguardando_aprovacao', 'aprovada', 'rejeitada', 'cancelada'))
```

**Índices:**
- `idx_mudancas_status` ON `status`
- `idx_mudancas_solicitado_por` ON `solicitado_por`
- `idx_mudancas_numero` ON `numero`

**Trigger:**
- `trigger_gera_numero`: Gera número sequencial automaticamente

---

### **4.19 Tabela: `configuracoes_sistema`**

Tabela genérica para configurações globais (chave-valor).

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `chave` | text | PK | Chave da configuração |
| `valor` | jsonb | NOT NULL | Valor (pode ser object, array, string, etc) |
| `descricao` | text | NULL | Descrição da configuração |
| `updated_by` | uuid | FK(users.id), NOT NULL | Quem atualizou |
| `updated_at` | timestamptz | DEFAULT now() | Última atualização |

**Exemplos de configurações:**
- `gemini_api_key` - API key do Google Gemini
- `email_imap_config` - {host, port, user, password}
- `orcamento_total` - Orçamento total da obra
- `data_inicio_obra` - Data de início prevista
- `data_fim_obra` - Data de término prevista

---

## 📋 **5. ESPECIFICAÇÃO DETALHADA DAS FUNCIONALIDADES**

### **Organização por Fases de Implementação**

As funcionalidades estão organizadas em 5 fases conforme aprovado:
- **FASE 1**: Core Essencial (Financeiro, Cronograma, Documentos) - *MVP sem auth*
- **FASE 2**: Comunicação (Feed, Fornecedores, Alertas)
- **FASE 3**: Automação IA (OCR, Email, Plaud)
- **FASE 4**: Qualidade e Relatórios (Checklists, Relatórios, Compras)
- **FASE 5**: Avançado (Change Orders, Bancário, IA Preditiva)

---

## 🔐 **Sistema de Permissões (VERSÃO FUTURA)**

> ⚠️ **MVP:** Esta funcionalidade não está implementada no MVP. O sistema inicia diretamente no dashboard sem autenticação.

**Planejado para versão futura:**
- Sistema completo de autenticação com Supabase Auth
- 5 perfis de usuário (Admin Sistema, Admin Obra, Arquiteto, Prestador, Visualizador)
- RLS (Row Level Security) para controle de acesso a nível de banco
- Middleware de autenticação em rotas protegidas

---

## 💰 **FASE 1 - FUNCIONALIDADE #1: Gestão Financeira Macro**

### **5.6 Visão Geral**

Sistema completo de controle financeiro com orçamento por categoria, alertas automáticos, projeção de fluxo de caixa e controle de parcelas.

### **5.7 Componentes Principais**

#### **5.7.1 Dashboard Financeiro**

**Rota:** `/financeiro`

**Componentes:**
- **Card de Resumo:** Orçado x Realizado x Projetado
- **Gráfico de Pizza:** Distribuição por categoria
- **Gráfico de Barras:** Progresso por categoria (0-100%)
- **Timeline:** Gastos ao longo do tempo
- **Alertas:** Categorias próximas ou acima do orçamento

**Métricas:**
```typescript
{
  orcado_total: 5_000_000,
  realizado_total: 1_250_000,
  projetado_total: 4_800_000, // baseado em parcelas futuras
  percentual_executado: 25,
  categorias_alerta_80: ['Fundação', 'Estrutura'],
  categorias_alerta_100: [],
  economia: 200_000, // orçado - projetado
}
```

#### **5.7.2 Módulo de Compras (Lançamento Principal)**

> ✅ **Implementado na FASE 1** - Fluxo principal de lançamentos financeiros

**Rota:** `/compras/nova`

O módulo de Compras é o ponto central para lançar gastos no sistema. Ao criar uma compra, o sistema gera automaticamente as parcelas (lançamentos) na tabela `gastos`.

**Formulário de Nova Compra:**
- **Informações da Compra:**
  - Descrição (text, obrigatório)
  - Valor Total (decimal com máscara monetária, obrigatório)
  - Data da Compra (date, obrigatório)
  - Fornecedor (select, obrigatório)
  - Categoria (select, obrigatório)
  - Etapa Relacionada (select, opcional)

- **Pagamento:**
  - Forma de Pagamento (select: pix, dinheiro, cartão, boleto, cheque)
  - Número de Parcelas (select: 1x a 12x)
  - Data da 1ª Parcela (date, obrigatório)

- **Nota Fiscal (opcional):**
  - Upload de arquivo (PDF, JPG, PNG, WebP - máx. 10MB)
  - Número da NF

- **Preview de Parcelas:**
  - Tabela mostrando: Parcela, Vencimento, Valor
  - Cálculo automático de datas (mensal)
  - Arredondamento correto (diferença na última parcela)

**Validações (Zod):**
```typescript
const compraSchema = z.object({
  descricao: z.string().min(3, "Mínimo 3 caracteres"),
  valor_total: z.string().min(1, "Valor é obrigatório"),
  data_compra: z.date({ required_error: "Data da compra é obrigatória" }),
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
  categoria_id: z.string().min(1, "Categoria é obrigatória"),
  etapa_relacionada_id: z.string().optional(),
  forma_pagamento: z.enum(["dinheiro", "pix", "cartao", "boleto", "cheque"]),
  parcelas: z.string().default("1"),
  data_primeira_parcela: z.date({ required_error: "Data da 1ª parcela é obrigatória" }),
  nota_fiscal_numero: z.string().optional(),
  observacoes: z.string().optional(),
});
```

**Fluxo de Criação de Compra:**
```
1. Usuário preenche formulário de compra
   ↓
2. Preview mostra parcelas calculadas
   ↓
3. Usuário confirma
   ↓
4. Sistema cria registro em `compras`
   ↓
5. Sistema cria N registros em `gastos` (parcelas):
   - compra_id = ID da compra criada
   - parcela_atual = 1, 2, 3, ..., N
   - data = incrementada mensalmente a partir de data_primeira_parcela
   - status = 'aprovado'
   - pago = false
   ↓
6. Redireciona para lista de compras
```

**Pagamento de Parcelas:**

**Rota:** `/compras/[id]`

Na página de detalhes da compra, usuário pode:
1. Ver todas as parcelas com status (Pago/Pendente)
2. Marcar parcela como paga (com data retroativa opcional)
3. Sistema atualiza:
   - `gastos.pago = true`
   - `gastos.pago_em = data selecionada`
   - `compras.valor_pago += valor_parcela`
   - `compras.parcelas_pagas += 1`
   - Se todas pagas: `compras.status = 'quitada'`

#### **5.7.2.1 Lista de Lançamentos (Parcelas)**

**Rota:** `/financeiro/lancamentos`

Exibe todas as parcelas (gastos) com filtros avançados:
- Busca (descrição, NF, fornecedor, categoria)
- Status de pagamento (Pago/Pendente)
- Fornecedor
- Categoria
- Período de vencimento
- Origem (Compra ou Avulso)

**Colunas da tabela:**
- Data (vencimento)
- Descrição
- Origem (link para compra ou "Avulso")
- Categoria
- Valor
- Pagamento (badge Pago/Pendente)
- Ações

#### **5.7.3 Lista de Lançamentos**

**Rota:** `/financeiro/lancamentos`

**Filtros:**
- Data (range: início - fim)
- Categoria
- Fornecedor
- Status (pendente, aprovado, rejeitado)
- Etapa
- Forma de pagamento
- Busca por descrição

**Tabela:**
| Data | Descrição | Categoria | Fornecedor | Valor | Status | Ações |
|------|-----------|-----------|------------|-------|--------|-------|
| 15/12 | Cimento | Fundação | ABC | R$ 5.430 | Aprovado | Ver, Editar, NF |

**Ações:**
- **Ver:** Modal com detalhes completos + histórico
- **Editar:** Só Admin Sistema (se aprovado) ou quem criou (se pendente)
- **Download NF:** Abre PDF da nota fiscal
- **Deletar:** Soft delete (só Admin Sistema)

#### **5.7.4 Orçamento por Categoria**

**Rota:** `/financeiro/orcamento`

**Interface:**
- Tabela editável inline
- Coluna: Categoria | Orçado | Realizado | Projetado | % | Status
- Status: 🟢 OK | 🟡 80% | 🔴 100%+
- Botão "Salvar Alterações"
- Input de "Orçamento Total" no topo

**Cálculos:**
- **Realizado:** SUM(gastos.valor) WHERE status = 'aprovado' AND categoria_id = X
- **Projetado:** Realizado + SUM(parcelas futuras) WHERE parcela_atual <= parcelas
- **%:** (Projetado / Orçado) * 100

**Alertas Automáticos:**
- Trigger no banco após INSERT/UPDATE em `gastos`
- Se categoria atingir 80%: criar notificação `orcamento_80`
- Se categoria atingir 100%: criar notificação `orcamento_100`

#### **5.7.5 Fluxo de Caixa Projetado**

**Rota:** `/financeiro/fluxo-caixa`

**Visualização:**
- Gráfico de linhas (próximos 12 meses)
- Eixo X: Mês
- Eixo Y: Valor acumulado
- 3 linhas:
  - 🔵 Realizado (histórico)
  - 🟢 Projetado (baseado em parcelas + tendência)
  - 🔴 Orçado (distribuição estimada)

**Tabela Detalhada:**
| Mês | Gastos Confirmados | Parcelas Pendentes | Projetado | Acumulado |
|-----|--------------------|--------------------|-----------|-----------|
| Dez/24 | R$ 150k | R$ 80k | R$ 230k | R$ 1.250k |
| Jan/25 | - | R$ 120k | R$ 120k | R$ 1.370k |

**Exportação:**
- Botão "Exportar CSV"
- Botão "Gerar Relatório PDF"

---

## 📅 **FASE 1 - FUNCIONALIDADE #2: Cronograma Visual de Etapas**

### **5.8 Visão Geral**

Timeline visual de etapas com status, dependências, responsáveis, datas previstas vs reais, e recálculo automático de atrasos.

### **5.9 Componentes Principais**

#### **5.9.1 Timeline de Etapas**

**Rota:** `/cronograma`

**Layout:**
- Vista de Gantt simplificada
- Cada etapa = barra horizontal
- Cor da barra baseada em status:
  - 🔵 Não Iniciada
  - 🟡 Em Andamento
  - 🟠 Aguardando Aprovação
  - 🟣 Aguardando Qualidade
  - 🔴 Atrasada
  - 🔄 Em Retrabalho
  - ⏸️ Pausada
  - ✅ Concluída

**Informações por Etapa:**
- Nome
- Responsável (avatar + nome)
- Datas: Previsto vs Real
- Progresso % (barra de progresso)
- Ícone de dependência (se houver)

**Interações:**
- **Clicar na etapa:** Abre modal com detalhes
- **Arrastar barra:** Ajusta datas (se permitido)
- **Hover:** Tooltip com informações

#### **5.9.2 Fluxo de Aprovação de Etapa**

**Estados Possíveis:**

```
Não Iniciada
    ↓ [Prestador clica "Iniciar Etapa"]
Em Andamento
    ↓ [Prestador clica "Solicitar Conclusão" + upload de fotos]
Aguardando Aprovação
    ↓ [Admin Obra revisa]
    ├─ Aprova → Aguardando Qualidade
    └─ Reprova → Em Retrabalho
Aguardando Qualidade
    ↓ [Admin Obra preenche checklist + fotos]
    ├─ Passou → Concluída ✅
    └─ Não passou → Em Retrabalho
Em Retrabalho
    ↓ [Prestador corrige]
    → volta para "Em Andamento"
```

**Exemplo de Interface para Prestador:**

Etapa: "Fundação - Escavação"  
Status: Em Andamento (50%)

[Botão: Solicitar Conclusão]
↓ Modal abre:
- "Confirme que a etapa está pronta para revisão"
- Upload obrigatório: Mínimo 3 fotos
- Comentário (opcional)
- [Botão: Confirmar e Solicitar]

**Notificações Criadas:**
- Prestador: "Solicitação enviada! Aguarde revisão do Admin da Obra."
- Admin Obra: "Nova etapa aguardando sua aprovação: Fundação - Escavação"

#### **5.9.3 Dependências entre Etapas**

**Rota:** `/cronograma/dependencias`

**Interface:**
- Grafo visual (nodes + edges)
- Cada node = etapa
- Cada edge = dependência
  - Linha sólida: obrigatória
  - Linha tracejada: recomendada

**Regra de Validação:**
- Sistema AVISA mas NÃO BLOQUEIA
- Se tentar iniciar "Alvenaria" sem concluir "Fundação":
  - Toast: ⚠️ "Atenção: A etapa 'Fundação' ainda não foi concluída. Deseja iniciar mesmo assim?"
  - [Cancelar] [Iniciar Mesmo Assim]

**Recálculo Automático de Datas:**

Quando etapa atrasa:
1. Trigger detecta `data_fim_real > data_fim_prevista`
2. Calcula dias de atraso: `diff_days`
3. Para TODAS etapas dependentes:
   - `data_inicio_prevista += diff_days`
   - `data_fim_prevista += diff_days`
4. Cria notificação para responsáveis afetados

**Edge Function:** `recalculate-dates`

---

## 📂 **FASE 1 - FUNCIONALIDADE #4: Documentação Visual**

### **5.10 Visão Geral**

Sistema de upload, organização e busca de documentos (fotos, plantas, contratos, notas fiscais) com versionamento e integração com Supabase Storage.

### **5.11 Supabase Storage - Buckets**

**Configuração de Buckets:**

```typescript
// 1. documentos-privados (PRIVADO)
{
  id: 'documentos-privados',
  name: 'Documentos Privados',
  public: false,
  fileSizeLimit: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['application/pdf', 'image/*'],
}

// RLS Policy:
CREATE POLICY "documentos_privados_select" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documentos-privados'
  AND (
    (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra')
  )
);

// 2. plantas (SEMI-PRIVADO)
{
  id: 'plantas',
  name: 'Plantas e Projetos',
  public: false,
  fileSizeLimit: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: ['application/pdf', 'image/*', 'application/dwg'],
}

// RLS: Admin Sistema, Admin Obra, Arquiteto podem ver

// 3. fotos-obra (RESTRITO)
{
  id: 'fotos-obra',
  name: 'Fotos de Progresso',
  public: false,
  fileSizeLimit: 5 * 1024 * 1024, // 5MB por foto
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
}

// RLS: Todos usuários autenticados podem ver
// Otimização: Transformação automática (resize, compress)

// 4. fotos-temp (TEMPORÁRIO)
{
  id: 'fotos-temp',
  name: 'Temporário (Upload OCR)',
  public: false,
  fileSizeLimit: 10 * 1024 * 1024,
  allowedMimeTypes: ['image/*', 'application/pdf'],
}

// RLS: Todos autenticados podem upload
// Limpeza automática: deletar após 24h
```

### **5.12 Galeria de Fotos**

**Rota:** `/documentos/fotos`

**Layout:**
- Grid responsivo (3-4 colunas desktop, 2 mobile)
- Cada card de foto:
  - Thumbnail otimizado (200x200)
  - Data do upload
  - Etapa relacionada (badge)
  - Quem fez upload (avatar pequeno)
  - Botão de ações (...)

**Filtros:**
- Por etapa
- Por data (range)
- Por quem fez upload
- Por tipo de foto (antes/depois, progresso, problema)

**Ações:**
- **Visualizar:** Modal lightbox com imagem full + metadata
- **Download:** Download original
- **Editar:** Alterar etapa relacionada, adicionar tags
- **Deletar:** Soft delete (24h para desfazer)

**Upload:**
- Drag & drop area
- Seleção múltipla
- Preview antes de confirmar
- Selecionar etapa relacionada (dropdown)
- Progress bar por arquivo

### **5.13 Upload de Plantas e Contratos**

**Rota:** `/documentos/plantas`

**Funcionalidades:**
- Upload de PDFs grandes (até 50MB)
- Versionamento automático
  - v1, v2, v3...
  - Ao fazer upload de planta com mesmo nome: cria nova versão
- Preview de PDF inline (iframe ou react-pdf)
- Download de versão específica
- Comparação visual entre versões (side-by-side)

**Metadata:**
- Nome do arquivo
- Versão atual
- Data de cada versão
- Quem fez upload de cada versão
- Tags personalizadas

---

## 🤖 **FASE 3 - FUNCIONALIDADE #16: Automação de Email + Notas Fiscais**

### **5.14 Visão Geral**

Sistema automatizado que monitora o email `casa@toniezzer.com` via IMAP, extrai dados de notas fiscais (PDF/XML) usando OCR e IA, e sugere lançamentos financeiros automáticos com aprovação humana.

### **5.15 Arquitetura**

**Edge Function:** `process-email` (polling a cada 15 minutos)

```typescript
// supabase/functions/process-email/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import * as imap from 'npm:imap'
import { GoogleAIFileManager, GoogleGenerativeAI } from '@google/generative-ai'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )
  
  // 1. Conectar via IMAP
  const config = await supabase
    .from('configuracoes_sistema')
    .select('valor')
    .eq('chave', 'email_imap_config')
    .single()
  
  const connection = new imap({
    user: config.valor.user,
    password: config.valor.password,
    host: config.valor.host,
    port: config.valor.port,
    tls: true
  })
  
  // 2. Buscar emails não processados
  connection.once('ready', () => {
    connection.openBox('INBOX', false, async () => {
      const search = connection.search(['UNSEEN'], async (err, results) => {
        for (const uid of results) {
          // 3. Fetch email
          const email = await fetchEmail(connection, uid)
          
          // 4. Salvar no banco
          const { data: emailRecord } = await supabase
            .from('emails_monitorados')
            .insert({
              email_id_externo: email.id,
              remetente: email.from,
              assunto: email.subject,
              corpo: email.body,
              data_recebimento: email.date,
              status: 'processando'
            })
            .select()
            .single()
          
          // 5. Processar anexos
          if (email.attachments.length > 0) {
            for (const attachment of email.attachments) {
              // Upload para Supabase Storage
              const { data: fileData } = await supabase.storage
                .from('fotos-temp')
                .upload(`emails/${emailRecord.id}/${attachment.name}`, attachment.buffer)
              
              // 6. Detectar tipo
              if (attachment.name.endsWith('.xml')) {
                // Parser de NF-e
                const dados = await parseNFe(attachment.buffer)
                await processarDadosExtraidos(supabase, emailRecord.id, dados)
              } else if (attachment.contentType.startsWith('image') || attachment.name.endsWith('.pdf')) {
                // OCR com Gemini 3
                const dados = await processarOCR(fileData.path)
                await processarDadosExtraidos(supabase, emailRecord.id, dados)
              }
            }
          } else {
            // 7. Tentar extrair do corpo do email
            const dados = await extrairDoCorp(email.body)
            if (dados) {
              await processarDadosExtraidos(supabase, emailRecord.id, dados)
            } else {
              // Marcar como erro
              await supabase
                .from('emails_monitorados')
                .update({
                  status: 'erro',
                  erro_mensagem: 'Nenhum anexo encontrado e não foi possível extrair dados do corpo'
                })
                .eq('id', emailRecord.id)
            }
          }
        }
      })
    })
  })
  
  return new Response(JSON.stringify({ processed: results.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

async function processarOCR(imageBuffer: ArrayBuffer) {
  // Gemini 3 - OCR + Análise em uma única chamada
  const gemini = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY'))
  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' })
  
  // Converter imagem para base64
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
  
  const prompt = `
    Analise esta imagem de nota fiscal/recibo e extraia as informações.
    
    Retorne APENAS um JSON válido com a estrutura:
    {
      "fornecedor": "Nome do fornecedor",
      "cnpj": "CNPJ se visível",
      "valor": 1234.56,
      "data": "2024-12-15",
      "numero_nf": "123456",
      "itens": ["item 1", "item 2"],
      "categoria_sugerida": "Fundação",
      "confianca": 0.95
    }
    
    Se não conseguir extrair algum campo, use null.
  `
  
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    }
  ])
  
  return JSON.parse(result.response.text())
}

async function processarDadosExtraidos(supabase, emailId, dados) {
  // 1. Criar gasto sugerido (pendente de aprovação)
  const { data: gasto } = await supabase
    .from('gastos')
    .insert({
      descricao: `${dados.fornecedor} - NF ${dados.numero_nf}`,
      valor: dados.valor,
      data: dados.data,
      categoria_id: await categorizarComIA(supabase, dados),
      fornecedor_id: await buscarOuCriarFornecedor(supabase, dados.fornecedor, dados.cnpj),
      nota_fiscal_numero: dados.numero_nf,
      status: 'pendente_aprovacao',
      criado_via: 'email',
      observacoes: `Confiança da IA: ${(dados.confianca * 100).toFixed(0)}%`
    })
    .select()
    .single()
  
  // 2. Atualizar email
  await supabase
    .from('emails_monitorados')
    .update({
      status: 'aguardando_revisao',
      dados_extraidos: dados,
      gasto_sugerido_id: gasto.id,
      processado_em: new Date().toISOString()
    })
    .eq('id', emailId)
  
  // 3. Criar notificações
  const admins = await supabase
    .from('users')
    .select('id')
    .in('perfil', ['admin_sistema', 'admin_obra'])
  
  for (const admin of admins.data) {
    await supabase.from('notificacoes').insert({
      usuario_id: admin.id,
      tipo: 'email_novo',
      titulo: 'Novo email para revisar',
      mensagem: `Email de ${dados.fornecedor} com nota fiscal de R$ ${dados.valor.toLocaleString('pt-BR')}`,
      link: `/emails/${emailId}`
    })
  }
}

async function categorizarComIA(supabase, dados) {
  // Buscar categorias existentes
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome')
    .eq('ativo', true)
  
  // Se dados já tem categoria_sugerida, tentar match
  if (dados.categoria_sugerida) {
    const match = categorias.find(c => 
      c.nome.toLowerCase().includes(dados.categoria_sugerida.toLowerCase())
    )
    if (match) return match.id
  }
  
  // Caso contrário, Gemini classifica baseado nos itens
  const gemini = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY'))
  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' })
  
  const prompt = `
    Dado os seguintes itens de uma nota fiscal de obra:
    ${dados.itens.join(', ')}
    
    E as seguintes categorias disponíveis:
    ${categorias.map(c => c.nome).join(', ')}
    
    Qual categoria melhor se encaixa? Retorne APENAS o nome exato da categoria.
  `
  
  const result = await model.generateContent(prompt)
  const categoriaNome = result.response.text().trim()
  
  const categoria = categorias.find(c => c.nome === categoriaNome)
  return categoria?.id || categorias[0].id // fallback para primeira
}
```

### **5.16 Interface - Kanban de Emails**

**Rota:** `/emails`

**Layout:** 3 colunas (estilo Trello)

```
┌─────────────────┬──────────────────────┬─────────────────┐
│ Não Processados │ Aguardando Revisão   │ Processados     │
│                 │                      │                 │
│ [ Email Card ]  │ [ Email Card ]       │ [ Email Card ]  │
│ [ Email Card ]  │ [ Email Card ]       │                 │
│                 │                      │                 │
└─────────────────┴──────────────────────┴─────────────────┘
```

**Email Card:**
```
┌────────────────────────────────────────┐
│ ⚠️ Aguardando Revisão                   │
│                                        │
│ De: Cimento ABC Ltda                   │
│ Assunto: NF-e 1234 - Pagamento        │
│                                        │
│ 💰 R$ 5.430,00                         │
│ 📋 Fundação (95% confiança)            │
│ 📎 2 anexos                            │
│                                        │
│ 📅 Recebido: 15/12/2024 14:30         │
│                                        │
│ [Revisar] [Ignorar] [Ver Email]       │
└────────────────────────────────────────┘
```

**Ao clicar "Revisar":**

Modal abre com 2 colunas:

```
┌────────────────────┬─────────────────────┐
│ Email Original     │ Dados Extraídos     │
│                    │ (editável)          │
│ [Preview do email] │                     │
│ [Anexos]           │ Fornecedor: [____]  │
│                    │ Valor: [____]       │
│                    │ Data: [____]        │
│                    │ Categoria: [____]   │
│                    │ Subcategoria: [__]  │
│                    │ NF: [____]          │
│                    │ Etapa: [____]       │
│                    │ Obs: [____]         │
│                    │                     │
│                    │ [Aprovar] [Rejeitar]│
└────────────────────┴─────────────────────┘
```

---

## 📸 **FASE 3 - FUNCIONALIDADE #17: OCR de Recibos via Foto/Upload**

### **5.17 Visão Geral**

Permitir que colaboradores tirem foto de recibos manuais (não eletrônicos) direto do celular ou façam upload, com extração automática de dados via OCR + IA.

### **5.18 Interface Mobile**

**Rota:** `/financeiro/lancamentos/foto`

**Fluxo:**
1. Usuário clica botão flutuante "📷 Foto de Recibo"
2. Opções:
   - 📷 Tirar Foto
   - 📁 Upload de Arquivo
3. Se tirar foto:
   - Abre câmera nativa
   - Captura foto
   - Preview com botão "Usar Esta" ou "Tirar Novamente"
4. Envia foto para Edge Function
5. Loading: "Processando recibo..."
6. Edge Function retorna dados extraídos
7. Mostra formulário PRÉ-PREENCHIDO para revisão
8. Usuário confirma ou ajusta
9. Cria lançamento

**Edge Function:** `process-ocr`

```typescript
// supabase/functions/process-ocr/index.ts
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

serve(async (req) => {
  const { image_url } = await req.json()
  
  const supabase = createClient(...)
  
  // 1. Download da imagem do Storage
  const { data: imageData } = await supabase.storage
    .from('fotos-temp')
    .download(image_url)
  
  // 2. Converter para base64
  const arrayBuffer = await imageData.arrayBuffer()
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
  
  // 3. OCR + Análise com Gemini 3 (uma única chamada!)
  const gemini = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY'))
  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' })
  
  const prompt = `
    Analise esta imagem de recibo/nota fiscal e extraia as informações.
    
    Retorne APENAS um JSON válido:
    {
      "fornecedor": "Nome do estabelecimento",
      "valor": 123.45,
      "data": "2024-12-15",
      "descricao": "Descrição do serviço/produto",
      "forma_pagamento": "dinheiro|pix|cartao",
      "categoria_sugerida": "Nome da categoria",
      "confianca": 0.85
    }
    
    Se não conseguir extrair algum campo, use null.
  `
  
  const aiResult = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    }
  ])
  
  const dados = JSON.parse(aiResult.response.text())
  
  // 4. Buscar categoria no banco
  const categoria_id = await categorizarComIA(supabase, dados)
  
  return new Response(JSON.stringify({
    ...dados,
    categoria_id,
    image_url
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### **5.19 Tratamento de Erros**

**Cenários:**
1. **OCR não detectou texto:** 
   - Mensagem: "Não conseguimos ler o recibo. Certifique-se de que a foto está nítida e bem iluminada."
   - Botão: "Tentar Novamente" ou "Lançar Manualmente"

2. **IA não conseguiu extrair dados:**
   - Mensagem: "Detectamos texto, mas não conseguimos identificar os dados. Você pode preencher manualmente."
   - Mostra formulário vazio com texto detectado em "Observações"

3. **Confiança baixa (< 70%):**
   - Badge: ⚠️ "Verificação recomendada"
   - Destacar campos com baixa confiança

---

## 🎙️ **FASE 3 - FUNCIONALIDADE #15: IA + Plaud - Processamento de Reuniões**

### **5.20 Visão Geral**

Importar resumos de reuniões do Plaud (Markdown estruturado), processar com IA para extrair decisões/tarefas/gastos, e criar lançamentos automáticos com backlinks.

### **5.21 Template Customizado do Plaud**

**IMPORTANTE:** O Plaud permite configurar template de saída. Vamos criar um template específico para garantir parsing confiável.

**Template Plaud (configurar no app):**

```markdown
# Reunião: [TÍTULO]
Data: [DATA]

## Participantes
- [NOME 1]
- [NOME 2]
- [...]

## Decisões
- [DECISÃO 1]
- [DECISÃO 2]

## Action Items
- [ ] [RESPONSÁVEL] - [TAREFA] - Prazo: [DATA]
- [ ] [RESPONSÁVEL] - [TAREFA] - Prazo: [DATA]

## Gastos Mencionados
- R$ [VALOR] - [DESCRIÇÃO] - Categoria: [CATEGORIA]

## Problemas Identificados
- [PROBLEMA 1]
- [PROBLEMA 2]

## Mudanças de Escopo
- [MUDANÇA 1] - Impacto: R$ [VALOR] / [DIAS] dias
```

### **5.22 Interface de Upload**

**Rota:** `/reunioes/nova`

**Formulário:**
1. Título da Reunião (text)
2. Data da Reunião (date)
3. Upload do Arquivo Markdown (drag & drop)
   - Aceita `.md` ou `.txt`
4. Preview do conteúdo (textarea read-only)
5. [Botão: Processar com IA]

**Processamento:**
1. Upload do arquivo para Storage
2. Edge Function `process-plaud` recebe
3. Parser extrai seções estruturadas
4. IA valida e enriquece dados
5. Cria registros em:
   - `reunioes`
   - `reunioes_acoes`
   - `feed_comunicacao` (decisões)
   - `gastos` (se houver valores, status = pendente)
   - `mudancas_escopo` (se houver)
6. Retorna lista de itens criados com backlinks

**Edge Function:** `process-plaud`

```typescript
// supabase/functions/process-plaud/index.ts

serve(async (req) => {
  const { markdown, reuniao_id } = await req.json()
  
  const supabase = createClient(...)
  
  // 1. Parser estruturado (regex ou biblioteca markdown)
  const parsed = parseMarkdown(markdown)
  
  // 2. Processar cada seção
  for (const decisao of parsed.decisoes) {
    // Criar post no feed
    const { data: feedPost } = await supabase
      .from('feed_comunicacao')
      .insert({
        tipo: 'decisao',
        conteudo: decisao,
        reuniao_relacionada_id: reuniao_id,
        autor_id: (await supabase.auth.getUser()).data.user.id
      })
      .select()
      .single()
    
    // Criar ação
    await supabase.from('reunioes_acoes').insert({
      reuniao_id,
      tipo: 'decisao',
      descricao: decisao,
      status: 'concluido',
      feed_criado_id: feedPost.id
    })
  }
  
  for (const actionItem of parsed.actionItems) {
    // Extrair responsável
    const responsavel = await buscarUsuarioPorNome(supabase, actionItem.responsavel)
    
    // Criar ação
    await supabase.from('reunioes_acoes').insert({
      reuniao_id,
      tipo: 'tarefa',
      descricao: actionItem.tarefa,
      responsavel_id: responsavel?.id,
      prazo: actionItem.prazo,
      status: 'pendente'
    })
    
    // Notificar responsável
    if (responsavel) {
      await supabase.from('notificacoes').insert({
        usuario_id: responsavel.id,
        tipo: 'tarefa_atribuida',
        titulo: 'Nova tarefa atribuída',
        mensagem: actionItem.tarefa,
        link: `/reunioes/${reuniao_id}`
      })
    }
  }
  
  for (const gasto of parsed.gastos) {
    // Criar gasto sugerido
    const { data: gastoRecord } = await supabase
      .from('gastos')
      .insert({
        descricao: gasto.descricao,
        valor: gasto.valor,
        data: parsed.data_reuniao,
        categoria_id: await categorizarComIA(supabase, { categoria_sugerida: gasto.categoria }),
        status: 'pendente_aprovacao',
        criado_via: 'plaud'
      })
      .select()
      .single()
    
    // Backlink
    await supabase.from('reunioes_acoes').insert({
      reuniao_id,
      tipo: 'gasto',
      descricao: gasto.descricao,
      valor: gasto.valor,
      status: 'pendente',
      gasto_criado_id: gastoRecord.id
    })
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### **5.23 Visualização da Reunião**

**Rota:** `/reunioes/[id]`

**Layout:**

```
┌────────────────────────────────────────────────┐
│ Reunião: Alinhamento Semanal Obra             │
│ 📅 15/12/2024 | 👥 João, Maria, Pedro          │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 📝 Resumo Completo                             │
│ [Markdown renderizado]                         │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ ✅ Action Items (3)                            │
│                                                │
│ [ ] João - Comprar cimento até 20/12          │
│ [ ] Maria - Revisar planta elétrica até 18/12 │
│ [✓] Pedro - Aprovar orçamento (Concluído)     │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 💰 Gastos Criados (2)                          │
│                                                │
│ R$ 15.000 - Porcelanato sala                  │
│ → [Ver Lançamento #243] (Aguardando Aprovação)│
│                                                │
│ R$ 8.500 - Tomadas extras                     │
│ → [Ver Lançamento #244] (Aprovado)            │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 🔄 Mudanças de Escopo (1)                      │
│                                                │
│ Trocar piso da sala por porcelanato           │
│ → [Ver Mudança #12] (Aguardando Aprovação)    │
└────────────────────────────────────────────────┘
```

**Backlinks:** Ao clicar em qualquer item, abre o detalhe E mostra "Origem: Reunião Alinhamento Semanal Obra (15/12)".

---

## ⚡ **6. EDGE FUNCTIONS - ESPECIFICAÇÃO COMPLETA**

### **6.1 Lista de Edge Functions**

| Nome | Trigger | Propósito | Complexidade |
|------|---------|-----------|--------------|
| `process-email` | Cron (15 min) | Polling IMAP, OCR de NFs, classificação IA | Alta |
| `process-ocr` | HTTP (webhook) | OCR de recibo via foto | Média |
| `process-plaud` | HTTP (webhook) | Parser de Markdown + extração IA | Média |
| `generate-report` | HTTP (webhook) | Gerar PDF de relatório | Média |
| `recalculate-dates` | Database Trigger | Recalcular datas de etapas após atraso | Baixa |
| `check-budget-alerts` | Database Trigger | Verificar alertas de orçamento | Baixa |
| `cleanup-temp-files` | Cron (diário) | Deletar arquivos temporários (>24h) | Baixa |

### **6.2 Configuração de Secrets**

**No Supabase Dashboard → Edge Functions → Secrets:**

```bash
# IA - Gemini 3 (OCR + classificação)
GEMINI_API_KEY=AIza...

# Email IMAP (Umbler)
EMAIL_IMAP_HOST=imap.umbler.com
EMAIL_IMAP_PORT=993
EMAIL_IMAP_USER=casa@toniezzer.com
EMAIL_IMAP_PASSWORD=<senha do email>
```

**Nota:** As configurações de email (host, porta, usuário) também ficam editáveis na aba **Configurações** do app. A senha permanece apenas nos Secrets por segurança.

### **6.3 Cron Jobs (Scheduled Functions)**

**No arquivo `supabase/functions/_shared/cron.ts`:**

```typescript
// Configurar no Supabase Dashboard:
// Settings → Edge Functions → Cron Jobs

// 1. process-email: */15 * * * * (a cada 15 minutos)
// 2. cleanup-temp-files: 0 3 * * * (todo dia às 3h)
// 3. check-overdue-etapas: 0 8 * * * (todo dia às 8h)
```

---

## 🚀 **7. DEPLOY E CI/CD**

### **7.1 Estratégia de Deploy**

**Ferramentas:**
- **Frontend + API Routes:** Vercel (deploy automático via Git)
- **Banco + Storage + Edge Functions:** Supabase Cloud
- **Domínio:** obra.toniezzer.com → Vercel DNS

### **7.2 Configuração Vercel**

**1. Conectar Repositório Git**
```bash
# No terminal local
git init
git add .
git commit -m "v1.0: Initial commit"
git branch -M main
git remote add origin https://github.com/toniezzer/obra-manager.git
git push -u origin main
```

**2. Importar Projeto no Vercel**
- Dashboard → New Project
- Import Git Repository
- Selecionar repositório

**3. Environment Variables (Vercel)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh... (usado em API routes server-side)
GEMINI_API_KEY=AIza...
```

**4. Build Settings**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "devCommand": "npm run dev"
}
```

**5. Configurar Domínio**
- Settings → Domains
- Adicionar `obra.toniezzer.com`
- Configurar DNS (A record ou CNAME)

### **7.3 Migrations do Supabase**

**Fluxo:**
1. Desenvolver migrations localmente em `supabase/migrations/`
2. Testar localmente: `supabase db reset`
3. Deploy para produção:
```bash
supabase db push
```

**Boas Práticas:**
- Migrations SEMPRE incrementais (nunca DROP TABLE em prod)
- Usar transações
- Testar rollback
- Backup antes de migrations grandes

### **7.4 CI/CD Pipeline (GitHub Actions)**

**Arquivo:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
  
  deploy-vercel:
    needs: lint-and-type-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
  
  deploy-supabase-functions:
    needs: lint-and-type-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: |
          supabase functions deploy process-email --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase functions deploy process-ocr --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase functions deploy process-plaud --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## 🔒 **8. SEGURANÇA**

> ⚠️ **MVP:** Esta versão não possui autenticação nem RLS. Itens de segurança relacionados a auth serão implementados em versão futura.

### **8.1 Checklist de Segurança**

**Autenticação (VERSÃO FUTURA):**
- ⏳ Supabase Auth (email/senha)
- ⏳ Rate limiting em endpoints de login
- ⏳ Força de senha mínima
- ⏳ Email de verificação obrigatório

**Autorização (VERSÃO FUTURA):**
- ⏳ RLS habilitado em TODAS as tabelas
- ⏳ Políticas testadas para cada perfil
- ⏳ Middleware de autenticação em rotas privadas

**Dados Sensíveis:**
- ✅ Senhas NUNCA armazenadas (Supabase Auth cuida)
- ✅ API keys em variáveis de ambiente (não no código)
- ✅ Secrets do Supabase Edge Functions separados
- ✅ HTTPS obrigatório (Vercel + Supabase)

**Upload de Arquivos:**
- ✅ Validação de tamanho máximo (5-50MB conforme bucket)
- ✅ Validação de tipo MIME
- ✅ Scan de vírus (opcional, usar ClamAV)
- ✅ Sanitização de nomes de arquivo

**SQL Injection:**
- ✅ Usar SEMPRE queries parametrizadas
- ✅ NUNCA concatenar SQL com input de usuário
- ✅ ORM/query builder do Supabase protege automaticamente

**XSS (Cross-Site Scripting):**
- ✅ React escapa automaticamente
- ✅ Sanitizar HTML se usar `dangerouslySetInnerHTML`
- ✅ CSP (Content Security Policy) headers no Vercel

**CSRF (Cross-Site Request Forgery):**
- ✅ Tokens CSRF em forms críticos
- ✅ SameSite cookies
- ✅ Verificar origin em API routes

### **8.2 Configuração de Headers de Segurança (Vercel)**

**Arquivo:** `next.config.js`

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              font-src 'self' data:;
              connect-src 'self' https://*.supabase.co;
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      }
    ]
  }
}
```

---

## ✅ **9. TESTES E VALIDAÇÃO**

### **9.1 Estratégia de Testes**

**Não vamos implementar testes unitários/integração nesta versão** (conforme decisão: só produção, desenvolvido por IA).

**MAS: Testes manuais obrigatórios antes de usar em produção:**

#### **9.1.1 Checklist de Testes Manuais**

**FASE 1 - Core Essencial:**
- [ ] **Auth:** Criar usuário, login, logout, recuperar senha
- [ ] **Permissões:** Testar cada perfil (admin, prestador, visualizador) e verificar visibilidade
- [ ] **Financeiro:** Lançar gasto manual, editar, aprovar, ver dashboard
- [ ] **Parcelas:** Criar gasto parcelado, verificar se criou N lançamentos
- [ ] **Orçamento:** Configurar orçamento, ultrapassar 80%, verificar alerta
- [ ] **Cronograma:** Criar etapa, definir datas, dependências
- [ ] **Aprovação Etapa:** Prestador solicita → Admin aprova → Checklist → Concluir
- [ ] **Atraso:** Marcar etapa como atrasada, verificar recálculo de dependentes
- [ ] **Upload:** Fazer upload de foto, planta, contrato, NF
- [ ] **Storage:** Verificar RLS (usuário X não vê documento de usuário Y)

**FASE 2 - Comunicação:**
- [ ] **Feed:** Postar, @mencionar, verificar notificação
- [ ] **Fornecedores:** Cadastrar, avaliar, vincular a gasto
- [ ] **Alertas:** Verificar notificações in-app funcionando

**FASE 3 - Automação IA:**
- [ ] **Email:** Enviar email de teste para casa@toniezzer.com com NF anexa
- [ ] **Email:** Verificar se apareceu no Kanban "Aguardando Revisão"
- [ ] **Email:** Aprovar sugestão, verificar se criou gasto
- [ ] **OCR:** Tirar foto de recibo, verificar extração, ajustar, aprovar
- [ ] **Plaud:** Fazer upload de Markdown, verificar criação de action items

**FASE 4 - Qualidade:**
- [ ] **Checklist:** Criar template, preencher, aprovar/reprovar etapa
- [ ] **Relatórios:** Gerar relatório PDF, verificar dados

**FASE 5 - Avançado:**
- [ ] **Change Order:** Solicitar mudança, aprovar, verificar impacto

### **9.2 Testes de Carga (Opcional)**

**Se a obra crescer muito (>50 usuários):**
- Usar `k6` ou `artillery` para simular carga
- Testar endpoints críticos: `/financeiro`, `/cronograma`, `/feed`
- Monitorar Vercel Analytics e Supabase Dashboard

---

## 📈 **10. MONITORAMENTO E OBSERVABILIDADE**

### **10.1 Ferramentas**

**Frontend:**
- **Vercel Analytics:** Automático (performance, Web Vitals)
- **Vercel Speed Insights:** Detecta slow queries

**Backend:**
- **Supabase Dashboard:** Métricas de banco (queries lentas, conexões)
- **Supabase Logs:** Logs de Edge Functions em tempo real

**Erros:**
- **Sentry (opcional):** Captura de erros em produção
```bash
npm install @sentry/nextjs
```

### **10.2 Alertas Críticos**

**Configurar alertas no Supabase:**
1. **Database:** CPU > 80% por 5 minutos
2. **Storage:** 80% do plano usado
3. **Edge Functions:** Taxa de erro > 5%
4. **Auth:** Tentativas de login falhas > 10 em 1 minuto (possível ataque)

**Configurar alertas no Vercel:**
1. **Build Failed:** Notificar por email
2. **Deploy Failed:** Notificar por email
3. **Function Timeout:** Edge/API route excedendo tempo

---

## 🎯 **11. ROADMAP E PRÓXIMOS PASSOS**

### **11.1 Ordem de Implementação (Aprovada)**

#### **FASE 1 - Core Essencial MVP (2-3 meses de desenvolvimento IA)**
1. ✅ Setup inicial (Next.js + Supabase + Vercel)
2. ⏳ ~~Auth e Permissões~~ *(movido para versão futura)*
3. ✅ Gestão Financeira (#1)
4. ✅ Cronograma de Etapas (#2)
5. ✅ Documentação Visual (#4) + Supabase Storage
6. ✅ **Módulo de Compras** *(implementado - gestão de compras parceladas)*

> ⚠️ **MVP:** O sistema inicia direto no dashboard, sem login.

#### **FASE 2 - Comunicação (1-2 meses)**
7. Feed de Comunicação (#3)
8. Gestão de Fornecedores (#5)
9. Alertas Inteligentes (#8)

#### **FASE 3 - Automação IA (2-3 meses)**
10. OCR de Recibos (#17)
11. Email + Notas Fiscais (#16)
12. Plaud + Reuniões (#15)

#### **FASE 4 - Qualidade e Relatórios (1-2 meses)**
13. Checklist de Qualidade (#7)
14. Relatórios Automáticos (#9)
15. ~~Gestão de Compras (#10)~~ *(movido para FASE 1)*
16. Gestão de Materiais (comparativo de fornecedores, controle de estoque)

#### **FASE 5 - Avançado (1-2 meses)**
17. Change Orders (#13)
18. Integração Bancária (#11) - manual primeiro, depois automática
19. IA Preditiva (#14)

**FUNCIONALIDADE OPCIONAL (avaliar depois):**
18. BIM Viewer Simplificado (#12) - complexidade alta, valor incerto

**Prazo Total Estimado:** 8-12 meses (com desenvolvimento por IA acelerado)

### **11.2 Critérios de Sucesso**

**Objetivos Mensuráveis:**
- ✅ Obra concluída dentro do orçamento de R$ 5 milhões (margem ±5%)
- ✅ Atrasos reduzidos em 30% vs. média do mercado
- ✅ 0 documentos perdidos
- ✅ 100% de rastreabilidade de decisões
- ✅ 80% de redução em trabalho manual administrativo
- ✅ 90% de satisfação dos usuários (pesquisa pós-implementação)

**Métricas Operacionais:**
- Tempo médio de lançamento de gasto: < 2 minutos
- Taxa de aceitação de sugestões da IA: > 70%
- Uptime do sistema: > 99.5%
- Tempo de resposta do dashboard: < 1 segundo

---

## 📚 **12. DOCUMENTAÇÃO ADICIONAL**

### **12.1 Documentos a Criar Durante Implementação**

1. **Manual do Usuário** (por perfil)
   - `manual-admin-sistema.md`
   - `manual-admin-obra.md`
   - `manual-prestador.md`

2. **Guias Técnicos**
   - `guia-deploy.md`
   - `guia-migrações.md`
   - `guia-edge-functions.md`
   - `guia-troubleshooting.md`

3. **APIs Internas**
   - `api-reference.md` (documentar API routes customizadas)

4. **Changelog**
   - `CHANGELOG.md` (versionar alterações)

### **12.2 Convenções de Código**

**Commits:**
- Formato: `v[versão]-[etapa]: [Descrição em inglês ou PT-BR sem acentos]`
- Exemplo: `v1.0-fase-1: Add financial dashboard with budget alerts`

**Branches:**
- `main` - produção
- `feature/nome-da-feature` - desenvolvimento de features

**Pull Requests:**
- Título descritivo
- Checklist de itens implementados
- Screenshots (se houver mudanças visuais)

---

## 🎉 **13. CONCLUSÃO**

Este PRD define um sistema completo, robusto e moderno para gestão de obras residenciais, com foco especial em:

1. **Automação Inteligente:** Redução drástica de trabalho manual através de IA
2. **Controle Financeiro Rigoroso:** Orçamento, alertas, projeções e fluxo de caixa
3. **Qualidade Garantida:** Checklists, aprovações e rastreabilidade
4. **Comunicação Centralizada:** Fim do caos do WhatsApp, tudo documentado

> ⚠️ **MVP:** Esta versão inicial não possui autenticação nem RLS. Segurança completa será implementada em versão futura.

**Stack Validada:**
- ✅ Next.js 14 + TypeScript + Tailwind + shadcn/ui (frontend)
- ✅ Supabase Cloud (backend completo)
- ✅ Vercel (deploy otimizado)
- ✅ Google Gemini 3 (automação IA - OCR + classificação + análise)

**Escopo MVP:**
- ✅ Funcionalidades core (Financeiro, Cronograma, Documentos)
- ⏳ Autenticação e permissões (versão futura)
- ⏳ RLS no banco de dados (versão futura)

**Próximo Passo:** Iniciar implementação da FASE 1 MVP (Core Essencial sem auth)!

---

**FIM DO PRD - Toniezzer Manager v1.0 MVP**

*Documento criado em: 06/12/2024*  
*Atualizado em: 08/12/2024 (MVP sem auth + Módulo de Compras implementado)*  
*Autor: Claude 4.5 Sonnet (Anthropic)*  
*Status: ✅ Aprovado para desenvolvimento*

