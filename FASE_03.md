FASE_03.md
# 🟣 FASE 3 - Automação com IA

**Status:** ⏳ Aguardando FASE 1 e 2  
**Duração Estimada:** 2-3 meses  
**Prioridade:** ALTA (reduz trabalho manual)

---

## 🎯 OBJETIVO DA FASE

Implementar automação inteligente com IA para reduzir drasticamente trabalho manual: OCR de recibos, processamento de emails com notas fiscais, e integração com Plaud para reuniões.

---

## 📦 ENTREGAS

### ✅ **Funcionalidade #17 - OCR de Recibos via Foto/Upload**
- Interface mobile para foto
- Upload desktop
- OCR + Classificação com **Gemini 3** (uma única chamada!)
- Formulário pré-preenchido para revisão

### ✅ **Funcionalidade #16 - Automação de Email + Notas Fiscais**
- Polling IMAP a cada 15 minutos
- OCR de PDFs/imagens
- Parser de NF-e (XML)
- Kanban 3 colunas
- Aprovação de lançamentos sugeridos

### ✅ **Funcionalidade #15 - IA + Plaud (Reuniões)**
- Upload de Markdown do Plaud
- Parser estruturado
- Extração de action items
- Criação automática de lançamentos
- Backlinks

---

## 🔗 DEPENDÊNCIAS

### **Requer de FASE 1:**
- ✅ Tabela `compras` (para criar compras automaticamente via IA)
- ✅ Tabela `gastos` (para criar parcelas/lançamentos automáticos)
- ✅ Tabela `categorias` (para classificação IA)
- ✅ Tabela `fornecedores` (para vincular/criar)
- ✅ Supabase Storage (bucket `fotos-temp`, `documentos`)
- ✅ Sistema de aprovação de gastos
- ✅ Módulo de Compras funcional (para vincular lançamentos via `compra_id`)

### **Requer de FASE 2:**
- ✅ Tabela `feed_comunicacao` (para backlinks de reuniões)
- ✅ Sistema de notificações (para avisar sobre emails/OCR)

> 📝 **Nota:** Com o módulo de Compras implementado, a automação IA pode criar compras completas (com parcelas) ao invés de lançamentos avulsos.

---

## 🗄️ BANCO DE DADOS - TABELAS A CRIAR

### **Migration 009: Emails e Reuniões**

```sql
-- Tabela emails_monitorados
CREATE TABLE emails_monitorados (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id_externo text UNIQUE NOT NULL,
  remetente text NOT NULL,
  remetente_nome text,
  assunto text NOT NULL,
  corpo text,
  data_recebimento timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN (
    'nao_processado', 'processando', 'aguardando_revisao', 
    'processado', 'erro', 'ignorado'
  )),
  anexos jsonb,
  dados_extraidos jsonb,
  gasto_sugerido_id uuid REFERENCES gastos(id),
  erro_mensagem text,
  processado_em timestamptz,
  processado_por uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_emails_status ON emails_monitorados(status);
CREATE INDEX idx_emails_data_recebimento ON emails_monitorados(data_recebimento DESC);
CREATE INDEX idx_emails_remetente ON emails_monitorados(remetente);

ALTER TABLE emails_monitorados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emails_select_admin" ON emails_monitorados FOR SELECT TO authenticated USING (
  (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra')
);

-- Tabela reunioes
CREATE TABLE reunioes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo text NOT NULL,
  data_reuniao date NOT NULL,
  participantes text[],
  resumo_markdown text NOT NULL,
  arquivo_original_url text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reunioes_data ON reunioes(data_reuniao DESC);
CREATE INDEX idx_reunioes_created_by ON reunioes(created_by);

ALTER TABLE reunioes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reunioes_select_all" ON reunioes FOR SELECT TO authenticated USING (true);
CREATE POLICY "reunioes_insert_admin" ON reunioes FOR INSERT TO authenticated WITH CHECK (
  (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra')
);

-- Tabela reunioes_acoes
CREATE TABLE reunioes_acoes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reuniao_id uuid NOT NULL REFERENCES reunioes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('decisao', 'tarefa', 'gasto', 'problema', 'mudanca_escopo')),
  descricao text NOT NULL,
  responsavel_id uuid REFERENCES users(id),
  prazo date,
  valor decimal,
  categoria_id uuid REFERENCES categorias(id),
  etapa_id uuid REFERENCES etapas(id),
  status text NOT NULL CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  gasto_criado_id uuid REFERENCES gastos(id),
  feed_criado_id uuid REFERENCES feed_comunicacao(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_acoes_reuniao ON reunioes_acoes(reuniao_id);
CREATE INDEX idx_acoes_responsavel ON reunioes_acoes(responsavel_id);
CREATE INDEX idx_acoes_status ON reunioes_acoes(status);

ALTER TABLE reunioes_acoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acoes_select_all" ON reunioes_acoes FOR SELECT TO authenticated USING (true);
```

---

## 🌐 APIS / JOBS (SERVER RUNTIME – NODE)

### **API/Job 4: process-email**

**Arquivo sugerido:** `app/api/jobs/process-email/route.ts` (Next.js server)

Ver código completo no **PRD seção 5.14-5.15** (linhas ~1700-1900).

**Principais responsabilidades:**
1. Conectar via IMAP em casa@toniezzer.com
2. Buscar emails não lidos
3. Fazer upload de anexos para Storage
4. Se XML: parser de NF-e brasileiro
5. Se PDF/imagem: **OCR com Gemini 3** (envia imagem diretamente)
6. Se sem anexo: tentar extrair do corpo
7. Classificar categoria com Gemini 3
8. Criar gasto sugerido (status: pendente_aprovacao)
9. Atualizar emails_monitorados com status
10. Notificar Admin Sistema e Admin Obra

**Agendamento:** use cron do provedor (ex: Vercel Cron) chamando a rota com runtime Node e timeout maior.

### **API 5: process-ocr**

**Arquivo sugerido:** `app/api/ocr/route.ts`

Ver código completo no **PRD seção 5.17-5.18** (linhas ~2100-2300).

**Principais responsabilidades:**
1. Receber image_url do Storage
2. Download da imagem
3. Enviar imagem para **Gemini 3** (OCR + análise em uma única chamada!)
4. Extrair: fornecedor, valor, data, descrição, forma_pagamento
5. Buscar categoria_id no banco
6. Retornar JSON com dados + confiança

**Trigger:** HTTP (chamada do frontend), executando em server runtime.

### **API 6: process-plaud**

**Arquivo sugerido:** `app/api/plaud/route.ts`

Ver código completo no **PRD seção 5.20-5.22** (linhas ~2500-2700).

**Principais responsabilidades:**
1. Receber markdown + reuniao_id
2. Parser estruturado (regex ou lib markdown)
3. Extrair seções:
   - Decisões → criar post no feed
   - Action Items → criar reunioes_acoes + notificar
   - Gastos → criar gastos sugeridos
   - Mudanças de Escopo → criar mudancas_escopo
4. Criar backlinks
5. Retornar lista de itens criados

**Trigger:** HTTP (chamada do frontend após upload), executando em server runtime.

---

## 📱 COMPONENTES FRONTEND

### **Rotas a Criar:**

```
app/(dashboard)/
├── emails/
│   ├── page.tsx             # Kanban 3 colunas
│   └── [id]/page.tsx        # Detalhes email + aprovação
├── reunioes/
│   ├── page.tsx             # Lista de reuniões
│   ├── nova/page.tsx        # Upload Plaud markdown
│   └── [id]/page.tsx        # Resumo + action items
└── financeiro/lancamentos/
    └── foto/page.tsx        # OCR de recibo via foto

components/features/
├── emails/
│   ├── kanban-emails.tsx    # Kanban DnD
│   ├── email-card.tsx       # Card de email
│   ├── preview-ocr.tsx      # Preview dados extraídos
│   └── form-aprovacao.tsx   # Form para aprovar/editar
├── reunioes/
│   ├── resumo-viewer.tsx    # Renderizar markdown
│   ├── action-items-list.tsx
│   ├── backlinks.tsx
│   └── upload-plaud.tsx
└── ocr/
    ├── camera-capture.tsx   # Captura mobile
    └── ocr-preview.tsx      # Preview pré-preenchido
```

---

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### **1. Configurar Secrets no ambiente server**

Definir variáveis de ambiente no provedor de deploy (ex: Vercel) para as rotas server. Manter configs de app no Supabase (tabelas de config).

```bash
# Email IMAP (Umbler)
EMAIL_IMAP_HOST=imap.umbler.com
EMAIL_IMAP_PORT=993
EMAIL_IMAP_USER=casa@toniezzer.com
EMAIL_IMAP_PASSWORD=<senha_do_email>

# Gemini API
GEMINI_API_KEY=<sua_api_key>
```

**Nota:** As configurações de email (host, porta, usuário) também ficam editáveis na aba **Configurações** do app. A senha permanece apenas nos Secrets do Supabase por segurança.

---

### **2. Template do Plaud**

**Configurar no app Plaud (Configurações → AI Settings → Template):**

```markdown
# Reunião: [TÍTULO]
Data: [DATA]

## Participantes
- [NOME 1]
- [NOME 2]

## Decisões
- [DECISÃO 1]
- [DECISÃO 2]

## Action Items
- [ ] [RESPONSÁVEL] - [TAREFA] - Prazo: [DATA]

## Gastos Mencionados
- R$ [VALOR] - [DESCRIÇÃO] - Categoria: [CATEGORIA]

## Problemas Identificados
- [PROBLEMA 1]

## Mudanças de Escopo
- [MUDANÇA] - Impacto: R$ [VALOR] / [DIAS] dias
```

---

## ✅ CHECKLIST DE TESTES MANUAIS

### **OCR de Recibos**
- [ ] Tirar foto de recibo (mobile)
- [ ] Verificar extração de dados
- [ ] Ajustar campos se necessário
- [ ] Aprovar e criar lançamento
- [ ] Testar com recibo de baixa qualidade → verificar erro

### **Email Automação**
- [ ] Enviar email para casa@toniezzer.com com NF-e (XML) anexa
- [ ] Aguardar 15 min → verificar se apareceu no Kanban
- [ ] Enviar email com PDF de nota fiscal
- [ ] Verificar OCR e extração
- [ ] Aprovar sugestão → verificar criação de gasto
- [ ] Editar campos antes de aprovar
- [ ] Rejeitar sugestão → mover para "Ignorado"
- [ ] Enviar email sem anexo (só texto) → verificar tentativa de extração

### **Plaud + Reuniões**
- [ ] Fazer upload de Markdown do Plaud
- [ ] Verificar criação de reunião
- [ ] Verificar criação de action items
- [ ] Verificar criação de gastos sugeridos (se houver)
- [ ] Clicar em backlink → abrir reunião
- [ ] Marcar action item como concluído

---

## 🎯 CRITÉRIOS DE CONCLUSÃO

- ✅ Migration 009 executada
- ✅ 3 APIs/Jobs server deployados e testados
- ✅ Configurações de APIs (IMAP, Gemini 3) funcionando
- ✅ Kanban de emails funcional
- ✅ OCR mobile funcional
- ✅ Plaud parser funcional
- ✅ Todos testes manuais passando
- ✅ Deploy em produção
- ✅ Aprovação do proprietário

---

## 📚 REFERÊNCIAS

- **PRD:** Seções 5.14-5.22 (Automação IA)
- **FASE anterior:** [FASE_02.md](./FASE_02.md)
- **Próxima FASE:** [FASE_04.md](./FASE_04.md)

---

## ➡️ PRÓXIMA FASE

Após concluir FASE 3 → **[FASE_04.md](./FASE_04.md)** (Qualidade e Relatórios)

---

**Criado em:** 06/12/2024  
**Autor:** Claude (Anthropic)

