FASE_01.md
# 🔵 FASE 1 - Core Essencial

**Status:** 🚀 Pronto para iniciar  
**Duração Estimada:** 2-3 meses  
**Prioridade:** CRÍTICA

---

## 🎯 OBJETIVO DA FASE

Implementar a fundação completa do sistema: autenticação, permissões, gestão financeira, cronograma e documentação visual. Esta é a base sobre a qual todas as outras fases serão construídas.

---

## 📦 ENTREGAS

### ✅ **1. Setup Inicial do Projeto**
- Criar repositório Git
- Configurar Next.js 14 com App Router + TypeScript
- Configurar Tailwind CSS + shadcn/ui
- Conectar Supabase Cloud
- Configurar Vercel para deploy
- Configurar environment variables

### ✅ **2. Funcionalidade #6 - Sistema de Permissões**
- Implementar autenticação (Supabase Auth)
- Criar 5 perfis de usuário
- Implementar RLS policies
- Middleware de autenticação
- Hook customizado `use-permissions`

### ✅ **3. Funcionalidade #1 - Gestão Financeira Macro**
- Dashboard financeiro
- Lançamento de gastos (manual)
- Sistema de parcelas
- Orçamento por categoria
- Fluxo de caixa projetado
- Alertas 80% e 100%

### ✅ **4. Funcionalidade #2 - Cronograma Visual de Etapas**
- Timeline de etapas (Gantt simplificado)
- Fluxo de aprovação (6 estados)
- Dependências entre etapas
- Recálculo automático de datas

### ✅ **5. Funcionalidade #4 - Documentação Visual**
- Configurar 4 buckets do Supabase Storage
- Galeria de fotos
- Upload de plantas e contratos
- Versionamento de documentos

---

## 🗄️ BANCO DE DADOS - TABELAS A CRIAR

### **Migrations SQL (criar nesta ordem):**

#### **Migration 001: Schema Base + Auth**
```sql
-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Habilitar RLS em auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Tabela users (extensão)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo text NOT NULL,
  telefone text,
  perfil text NOT NULL CHECK (perfil IN ('admin_sistema', 'admin_obra', 'arquiteto', 'prestador', 'visualizador')),
  especialidade text,
  avatar_url text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_users_perfil ON users(perfil);
CREATE INDEX idx_users_ativo ON users(ativo);

-- RLS Policies para users
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_authenticated" ON users FOR SELECT USING (
  (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra')
);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_update_admin" ON users FOR UPDATE USING (
  (SELECT perfil FROM users WHERE id = auth.uid()) = 'admin_sistema'
);

-- Function para criar user profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, nome_completo, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'visualizador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### **Migration 002: Categorias e Fornecedores**
```sql
-- Tabela categorias
CREATE TABLE categorias (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL UNIQUE,
  cor text NOT NULL,
  icone text,
  ordem integer NOT NULL DEFAULT 0,
  orcamento decimal,
  ativo boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_categorias_ativo ON categorias(ativo);
CREATE INDEX idx_categorias_ordem ON categorias(ordem);

-- RLS para categorias
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias_select_all" ON categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias_insert_admin" ON categorias FOR INSERT TO authenticated WITH CHECK (
  (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra')
);

-- Tabela subcategorias
CREATE TABLE subcategorias (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id uuid NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subcategorias_categoria ON subcategorias(categoria_id);
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcategorias_select_all" ON subcategorias FOR SELECT TO authenticated USING (true);

-- Tabela centros_custo (opcional)
CREATE TABLE centros_custo (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL UNIQUE,
  codigo text,
  descricao text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "centros_custo_select_all" ON centros_custo FOR SELECT TO authenticated USING (true);

-- Tabela fornecedores
CREATE TABLE fornecedores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  cnpj_cpf text,
  email text,
  telefone text,
  endereco text,
  tipo text,
  especialidade text,
  avaliacao integer CHECK (avaliacao >= 1 AND avaliacao <= 5),
  comentario_avaliacao text,
  ativo boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX idx_fornecedores_ativo ON fornecedores(ativo);

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fornecedores_select_all" ON fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "fornecedores_insert_admin" ON fornecedores FOR INSERT TO authenticated WITH CHECK (
  (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra')
);
```

#### **Migration 003: Etapas e Dependências**
```sql
-- Tabela etapas
CREATE TABLE etapas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  descricao text,
  status text NOT NULL CHECK (status IN (
    'nao_iniciada', 'em_andamento', 'aguardando_aprovacao', 
    'aguardando_qualidade', 'em_retrabalho', 'pausada', 'atrasada', 'concluida'
  )),
  data_inicio_prevista date,
  data_fim_prevista date,
  data_inicio_real date,
  data_fim_real date,
  responsavel_id uuid REFERENCES users(id),
  progresso_percentual integer DEFAULT 0 CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100),
  progresso_manual boolean DEFAULT false,
  ordem integer NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_etapas_status ON etapas(status);
CREATE INDEX idx_etapas_responsavel ON etapas(responsavel_id);
CREATE INDEX idx_etapas_datas ON etapas(data_inicio_prevista, data_fim_prevista);

ALTER TABLE etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "etapas_select_all" ON etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY "etapas_insert_admin" ON etapas FOR INSERT TO authenticated WITH CHECK (
  (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra')
);

-- Tabela etapas_dependencias
CREATE TABLE etapas_dependencias (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  etapa_id uuid NOT NULL REFERENCES etapas(id) ON DELETE CASCADE,
  depende_de_etapa_id uuid NOT NULL REFERENCES etapas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('obrigatoria', 'recomendada')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(etapa_id, depende_de_etapa_id),
  CHECK (etapa_id != depende_de_etapa_id)
);

CREATE INDEX idx_dependencias_etapa ON etapas_dependencias(etapa_id);
CREATE INDEX idx_dependencias_depende ON etapas_dependencias(depende_de_etapa_id);

ALTER TABLE etapas_dependencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dependencias_select_all" ON etapas_dependencias FOR SELECT TO authenticated USING (true);
```

#### **Migration 004: Gastos**
```sql
CREATE TABLE gastos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao text NOT NULL,
  valor decimal NOT NULL CHECK (valor > 0),
  data date NOT NULL,
  categoria_id uuid NOT NULL REFERENCES categorias(id),
  subcategoria_id uuid REFERENCES subcategorias(id),
  fornecedor_id uuid REFERENCES fornecedores(id),
  forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'boleto', 'cheque')),
  parcelas integer DEFAULT 1 CHECK (parcelas >= 1),
  parcela_atual integer CHECK (parcela_atual >= 1 AND parcela_atual <= parcelas),
  nota_fiscal_url text,
  nota_fiscal_numero text,
  etapa_relacionada_id uuid REFERENCES etapas(id),
  centro_custo_id uuid REFERENCES centros_custo(id),
  status text NOT NULL CHECK (status IN ('pendente_aprovacao', 'aprovado', 'rejeitado')),
  aprovado_por uuid REFERENCES users(id),
  aprovado_em timestamptz,
  criado_por uuid NOT NULL REFERENCES users(id),
  criado_via text NOT NULL CHECK (criado_via IN ('manual', 'email', 'ocr', 'bancario')),
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_gastos_data ON gastos(data);
CREATE INDEX idx_gastos_categoria ON gastos(categoria_id);
CREATE INDEX idx_gastos_etapa ON gastos(etapa_relacionada_id);
CREATE INDEX idx_gastos_status ON gastos(status);

ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- RLS complexo para gastos (ver PRD seção 5.1.4)
CREATE POLICY "gastos_select_admin" ON gastos FOR SELECT TO authenticated USING (
  (SELECT perfil FROM users WHERE id = auth.uid()) = 'admin_sistema'
);

CREATE POLICY "gastos_select_admin_obra" ON gastos FOR SELECT TO authenticated USING (
  (SELECT perfil FROM users WHERE id = auth.uid()) = 'admin_obra'
  AND (
    etapa_relacionada_id IN (SELECT id FROM etapas WHERE responsavel_id = auth.uid())
    OR etapa_relacionada_id IS NULL
  )
);

CREATE POLICY "gastos_insert_admin" ON gastos FOR INSERT TO authenticated WITH CHECK (
  (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra')
);
```

#### **Migration 005: Documentos e Storage**
```sql
CREATE TABLE documentos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('foto', 'planta', 'contrato', 'nota_fiscal', 'outro')),
  url text NOT NULL,
  tamanho_bytes bigint,
  mime_type text,
  etapa_relacionada_id uuid REFERENCES etapas(id),
  gasto_relacionado_id uuid REFERENCES gastos(id),
  versao integer DEFAULT 1,
  documento_pai_id uuid REFERENCES documentos(id),
  tags text[],
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_documentos_tipo ON documentos(tipo);
CREATE INDEX idx_documentos_etapa ON documentos(etapa_relacionada_id);
CREATE INDEX idx_documentos_tags ON documentos USING GIN(tags);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documentos_select_authenticated" ON documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "documentos_insert_authenticated" ON documentos FOR INSERT TO authenticated WITH CHECK (true);
```

#### **Migration 006: Notificações**
```sql
CREATE TABLE notificacoes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN (
    'orcamento_80', 'orcamento_100', 'etapa_atrasada', 'etapa_aguardando',
    'mencao', 'gasto_aprovacao', 'mudanca_escopo', 'email_novo', 'tarefa_atribuida', 'sistema'
  )),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  link text,
  lida boolean DEFAULT false,
  lida_em timestamptz,
  origem_id uuid,
  origem_tipo text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_created_at ON notificacoes(created_at DESC);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notificacoes_select_own" ON notificacoes FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "notificacoes_update_own" ON notificacoes FOR UPDATE TO authenticated USING (usuario_id = auth.uid());
```

#### **Migration 007: Triggers e Functions**
```sql
-- Trigger para alertas de orçamento
CREATE OR REPLACE FUNCTION check_budget_alert()
RETURNS trigger AS $$
DECLARE
  cat_orcamento decimal;
  cat_realizado decimal;
  cat_percentual decimal;
  cat_nome text;
BEGIN
  -- Buscar orçamento da categoria
  SELECT orcamento, nome INTO cat_orcamento, cat_nome
  FROM categorias WHERE id = NEW.categoria_id;
  
  IF cat_orcamento IS NOT NULL THEN
    -- Calcular realizado
    SELECT COALESCE(SUM(valor), 0) INTO cat_realizado
    FROM gastos
    WHERE categoria_id = NEW.categoria_id AND status = 'aprovado';
    
    cat_percentual := (cat_realizado / cat_orcamento) * 100;
    
    -- Alertar em 80%
    IF cat_percentual >= 80 AND cat_percentual < 100 THEN
      INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, origem_id)
      SELECT id, 'orcamento_80', 
             'Atenção: Orçamento em 80%',
             'A categoria ' || cat_nome || ' atingiu ' || ROUND(cat_percentual, 0) || '% do orçamento.',
             NEW.categoria_id
      FROM users WHERE perfil IN ('admin_sistema', 'admin_obra');
    END IF;
    
    -- Alertar em 100%
    IF cat_percentual >= 100 THEN
      INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, origem_id)
      SELECT id, 'orcamento_100',
             'Alerta: Orçamento atingido!',
             'A categoria ' || cat_nome || ' atingiu ' || ROUND(cat_percentual, 0) || '% do orçamento.',
             NEW.categoria_id
      FROM users WHERE perfil IN ('admin_sistema', 'admin_obra');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_budget_alert
  AFTER INSERT OR UPDATE ON gastos
  FOR EACH ROW
  WHEN (NEW.status = 'aprovado')
  EXECUTE FUNCTION check_budget_alert();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_etapas_updated_at BEFORE UPDATE ON etapas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gastos_updated_at BEFORE UPDATE ON gastos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🌐 APIS / JOBS (SERVER RUNTIME – NODE)

### **API/Job 1: recalculate-dates**

**Arquivo sugerido:** `app/api/jobs/recalculate-dates/route.ts` (Next.js server + cron do provedor)

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { etapa_id } = await req.json()
    const supabaseClient = createClient(
      process.env.SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    )

    const { data: etapa } = await supabaseClient
      .from('etapas')
      .select('*')
      .eq('id', etapa_id)
      .single()
    if (!etapa || !etapa.data_fim_real || !etapa.data_fim_prevista) {
      return NextResponse.json({ error: 'Etapa não encontrada ou sem datas' }, { status: 400 })
    }

    const diff_days = Math.ceil(
      (new Date(etapa.data_fim_real).getTime() - new Date(etapa.data_fim_prevista).getTime()) /
      (1000 * 60 * 60 * 24)
    )
    if (diff_days <= 0) {
      return NextResponse.json({ message: 'Etapa não está atrasada' }, { status: 200 })
    }

    const { data: dependentes } = await supabaseClient
      .from('etapas_dependencias')
      .select('etapa_id')
      .eq('depende_de_etapa_id', etapa_id)

    for (const dep of dependentes || []) {
      const { data: etapaDep } = await supabaseClient
        .from('etapas')
        .select('*')
        .eq('id', dep.etapa_id)
        .single()
      if (etapaDep) {
        const novaDataInicio = new Date(etapaDep.data_inicio_prevista)
        novaDataInicio.setDate(novaDataInicio.getDate() + diff_days)

        const novaDataFim = new Date(etapaDep.data_fim_prevista)
        novaDataFim.setDate(novaDataFim.getDate() + diff_days)

        await supabaseClient
          .from('etapas')
          .update({
            data_inicio_prevista: novaDataInicio.toISOString().split('T')[0],
            data_fim_prevista: novaDataFim.toISOString().split('T')[0]
          })
          .eq('id', dep.etapa_id)

        if (etapaDep.responsavel_id) {
          await supabaseClient.from('notificacoes').insert({
            usuario_id: etapaDep.responsavel_id,
            tipo: 'sistema',
            titulo: 'Datas recalculadas',
            mensagem: `A etapa "${etapaDep.nome}" teve suas datas ajustadas em ${diff_days} dias devido a atraso em etapa dependente.`,
            link: `/cronograma/${dep.etapa_id}`
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      ajustadas: dependentes?.length || 0,
      dias: diff_days
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### **API/Job 2: cleanup-temp-files**

**Arquivo sugerido:** `app/api/jobs/cleanup-temp-files/route.ts` (Next.js server + cron do provedor)

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabaseClient = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  )

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: files, error } = await supabaseClient.storage
    .from('fotos-temp')
    .list()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let deletedCount = 0
  for (const file of files || []) {
    if (new Date(file.created_at) < new Date(oneDayAgo)) {
      await supabaseClient.storage.from('fotos-temp').remove([file.name])
      deletedCount++
    }
  }

  return NextResponse.json({ success: true, deleted: deletedCount })
}
```

---

## 📱 COMPONENTES FRONTEND

### **Estrutura de Pastas (parcial para FASE 1)**

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx                    # Dashboard overview
│   ├── financeiro/
│   │   ├── page.tsx               # Dashboard financeiro
│   │   ├── lancamentos/
│   │   │   ├── page.tsx          # Lista
│   │   │   └── novo/page.tsx     # Novo lançamento
│   │   ├── orcamento/page.tsx    # Configurar orçamento
│   │   └── fluxo-caixa/page.tsx  # Fluxo de caixa
│   ├── cronograma/
│   │   ├── page.tsx               # Timeline
│   │   └── [id]/page.tsx         # Detalhes etapa
│   ├── documentos/
│   │   ├── page.tsx               # Galeria
│   │   └── fotos/page.tsx        # Fotos
│   └── configuracoes/
│       ├── categorias/page.tsx
│       └── usuarios/page.tsx

components/
├── ui/                            # shadcn/ui base
└── features/
    ├── financeiro/
    ├── cronograma/
    └── documentos/
```

---

## ✅ CHECKLIST DE TESTES MANUAIS

### **Setup e Auth**
- [ ] Criar novo usuário (register)
- [ ] Login com email/senha
- [ ] Logout
- [ ] Recuperar senha
- [ ] Criar usuários com cada perfil (5 perfis)

### **Permissões**
- [ ] Logar como Admin Sistema → ver tudo
- [ ] Logar como Admin Obra → ver só financeiro das suas etapas
- [ ] Logar como Prestador → ver só suas etapas e pagamentos
- [ ] Logar como Visualizador → não ter acesso a financeiro

### **Financeiro**
- [ ] Criar categoria + orçamento
- [ ] Lançar gasto manual simples
- [ ] Lançar gasto parcelado (10x) → verificar criação de 10 registros
- [ ] Atingir 80% de categoria → verificar notificação
- [ ] Atingir 100% → verificar notificação
- [ ] Ver dashboard financeiro com gráficos
- [ ] Ver fluxo de caixa projetado

### **Cronograma**
- [ ] Criar etapa
- [ ] Definir dependência entre etapas
- [ ] Prestador: solicitar conclusão de etapa
- [ ] Admin Obra: aprovar etapa
- [ ] Marcar etapa como atrasada → verificar recálculo de dependentes
- [ ] Ver timeline visual

### **Documentos**
- [ ] Upload de foto (etapa relacionada)
- [ ] Upload de planta (PDF)
- [ ] Visualizar galeria
- [ ] Download de documento
- [ ] Criar versão de documento (v2)

---

## 🎯 CRITÉRIOS DE CONCLUSÃO

Para considerar FASE 1 completa:

- ✅ Todas 7 migrations executadas sem erros
- ✅ 2 APIs/Jobs server deployados
- ✅ Todos testes manuais passando
- ✅ Deploy em produção (Vercel + Supabase)
- ✅ RLS testado para cada perfil
- ✅ Zero erros de linter/TypeScript
- ✅ Aprovação do proprietário

---

## 📚 REFERÊNCIAS

- **PRD Completo:** `../PRD-Toniezzer-Manager.md` (seções 4, 5.1-5.13)
- **Resumo de Decisões:** `../resumo.md`
- **Plano Geral:** `plano de implementacao.md`

---

## ➡️ PRÓXIMA FASE

Após concluir FASE 1 → **[FASE_02.md](./FASE_02.md)** (Comunicação)

---

**Criado em:** 06/12/2024  
**Autor:** Claude (Anthropic)

