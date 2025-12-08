# 📋 PLANO DE IMPLEMENTAÇÃO - FASE 3: Automação com IA

**Projeto:** Toniezzer Manager  
**Fase:** 3 - Automação com IA  
**Data:** 08/12/2024  
**Duração Estimada:** 2-3 semanas  
**Status:** 🔵 Pronto para iniciar

---

## 🎯 OBJETIVO DA FASE 3

Implementar **automação inteligente** para reduzir trabalho manual no lançamento de gastos através de:

1. **OCR de Recibos** - Tirar foto de recibos e extrair dados automaticamente
2. **Monitoramento de Email** - Capturar notas fiscais enviadas para `casa@toniezzer.com`
3. **Processamento de Reuniões (Plaud)** - Extrair decisões, tarefas e gastos de transcrições

---

## 📊 RESUMO TÉCNICO

| Item | Quantidade | Detalhes |
|------|------------|----------|
| **Novas Tabelas** | 4 | emails_monitorados, reunioes, reunioes_acoes, configuracoes_sistema |
| **Edge Functions** | 3 | process-ocr, process-email, process-plaud |
| **Novas Páginas** | 6 | /emails, /emails/[id], /reunioes, /reunioes/nova, /reunioes/[id], OCR mobile |
| **Novos Componentes** | 10+ | Kanban, cards, forms, previews |
| **Integrações** | 2 | Google Gemini API, IMAP |

---

## 🔧 PRÉ-REQUISITOS

### **1. Google Gemini API Key** ✅ CONFIGURADO
- **API Key:** `AIzaSyAMXHA5c036cagXV2HruevpTCamENy8Vzg`
- **Modelo Principal:** `gemini-3-pro` (mais recente e avançado)
- **Modelo Fallback:** `gemini-3-flash` (versão rápida do Gemini 3)
- **Console:** https://aistudio.google.com/

> 💡 **Por que Gemini 3:**
> - Raciocínio avançado (nível PhD)
> - Compreensão multimodal superior (texto, imagem, áudio, vídeo)
> - OCR nativo de alta precisão
> - Melhor extração de dados estruturados

### **2. Credenciais IMAP** ✅ CONFIGURADO
| Configuração | Valor |
|--------------|-------|
| **Servidor** | `imap.umbler.com` |
| **Porta** | `993` (SSL ativado) |
| **Usuário** | `casa@toniezzer.com` |
| **Senha** | `#1Soeuseitoniezzer` |
| **Protocolo** | IMAP com SSL/TLS |

### **3. Template Plaud** (para reuniões)
- Configurar template customizado no app do Plaud
- Garantir que exportações saiam em Markdown estruturado

---

## 📦 ORDEM DE IMPLEMENTAÇÃO

### **ETAPA 1: Infraestrutura Base** (Dia 1-2)
> Setup inicial que todas as funcionalidades precisam

```
1.1 Criar tabela `configuracoes_sistema`
1.2 Criar storage bucket `fotos-temp`
1.3 Configurar secrets no Supabase Edge Functions
1.4 Atualizar types do TypeScript
```

### **ETAPA 2: OCR de Recibos** (Dia 3-5)
> Funcionalidade mais simples, entrega valor imediato

```
2.1 Criar Edge Function `process-ocr`
2.2 Criar página de upload/câmera
2.3 Criar componente de preview OCR
2.4 Criar formulário pré-preenchido
2.5 Integrar com fluxo de gastos existente
```

### **ETAPA 3: Processamento de Reuniões (Plaud)** (Dia 6-9)
> Complexidade média, não depende de IMAP

```
3.1 Criar tabelas `reunioes` e `reunioes_acoes`
3.2 Criar Edge Function `process-plaud`
3.3 Criar páginas de reuniões (/reunioes, /reunioes/nova, /reunioes/[id])
3.4 Criar componentes (upload, viewer, action items, backlinks)
3.5 Integrar com feed de comunicação (backlinks)
```

### **ETAPA 4: Monitoramento de Email** (Dia 10-14)
> Mais complexa, requer polling e IMAP

```
4.1 Criar tabela `emails_monitorados`
4.2 Criar Edge Function `process-email`
4.3 Configurar Cron job (polling 15min)
4.4 Criar páginas de email (/emails, /emails/[id])
4.5 Criar Kanban de emails
4.6 Criar fluxo de aprovação/rejeição
```

### **ETAPA 5: Testes e Refinamentos** (Dia 15-17)
```
5.1 Testar OCR com diferentes tipos de recibo
5.2 Testar parsing de Markdown do Plaud
5.3 Testar polling de email
5.4 Ajustar prompts do Gemini conforme necessário
5.5 Verificar backlinks e integrações
```

---

## 🗄️ MIGRATIONS (SQL)

### **Migration 1: configuracoes_sistema**
```sql
-- 013_configuracoes_sistema.sql
CREATE TABLE configuracoes_sistema (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir configurações iniciais
INSERT INTO configuracoes_sistema (chave, valor, descricao) VALUES
('gemini_api_key', '"AIzaSyAMXHA5c036cagXV2HruevpTCamENy8Vzg"', 'API Key do Google Gemini'),
('email_imap_config', '{"host": "imap.umbler.com", "port": 993, "user": "casa@toniezzer.com", "password": "#1Soeuseitoniezzer", "tls": true}', 'Configurações IMAP (Umbler)'),
('ocr_confianca_minima', '0.7', 'Confiança mínima para aceitar OCR automaticamente');
```

> 💡 **Nota:** A API key e senha do email também serão configuradas nos Secrets do Supabase Edge Functions para maior segurança.

### **Migration 2: emails_monitorados**
```sql
-- 014_emails_monitorados.sql
CREATE TABLE emails_monitorados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id_externo TEXT UNIQUE NOT NULL,
  remetente TEXT NOT NULL,
  remetente_nome TEXT,
  assunto TEXT NOT NULL,
  corpo TEXT,
  data_recebimento TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'nao_processado' CHECK (status IN (
    'nao_processado',
    'processando',
    'aguardando_revisao',
    'processado',
    'erro',
    'ignorado'
  )),
  anexos JSONB,
  dados_extraidos JSONB,
  gasto_sugerido_id UUID REFERENCES gastos(id),
  compra_sugerida_id UUID REFERENCES compras(id),
  erro_mensagem TEXT,
  processado_em TIMESTAMPTZ,
  processado_por UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_emails_status ON emails_monitorados(status);
CREATE INDEX idx_emails_data_recebimento ON emails_monitorados(data_recebimento DESC);
CREATE INDEX idx_emails_remetente ON emails_monitorados(remetente);
```

### **Migration 3: reunioes e reunioes_acoes**
```sql
-- 015_reunioes.sql
CREATE TABLE reunioes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  data_reuniao DATE NOT NULL,
  participantes TEXT[],
  resumo_markdown TEXT NOT NULL,
  arquivo_original_url TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reunioes_acoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reuniao_id UUID REFERENCES reunioes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('decisao', 'tarefa', 'gasto', 'problema', 'mudanca_escopo')),
  descricao TEXT NOT NULL,
  responsavel_id UUID REFERENCES users(id),
  prazo DATE,
  valor DECIMAL,
  categoria_id UUID REFERENCES categorias(id),
  etapa_id UUID REFERENCES etapas(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  gasto_criado_id UUID REFERENCES gastos(id),
  compra_criada_id UUID REFERENCES compras(id),
  feed_criado_id UUID REFERENCES feed_comunicacao(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_reunioes_data ON reunioes(data_reuniao DESC);
CREATE INDEX idx_reunioes_created_by ON reunioes(created_by);
CREATE INDEX idx_acoes_reuniao ON reunioes_acoes(reuniao_id);
CREATE INDEX idx_acoes_responsavel ON reunioes_acoes(responsavel_id);
CREATE INDEX idx_acoes_status ON reunioes_acoes(status);
CREATE INDEX idx_acoes_prazo ON reunioes_acoes(prazo);
```

### **Migration 4: Adicionar reuniao_relacionada_id ao feed**
```sql
-- 016_add_reuniao_to_feed.sql
ALTER TABLE feed_comunicacao 
ADD COLUMN reuniao_relacionada_id UUID REFERENCES reunioes(id);

CREATE INDEX idx_feed_reuniao ON feed_comunicacao(reuniao_relacionada_id);
```

---

## ⚡ EDGE FUNCTIONS

### **1. process-ocr** (OCR de Recibos)

**Endpoint:** `POST /functions/v1/process-ocr`

**Input:**
```typescript
{
  image_url: string  // URL da imagem no Storage (fotos-temp)
}
```

**Output:**
```typescript
{
  success: boolean
  dados: {
    fornecedor: string | null
    cnpj: string | null
    valor: number | null
    data: string | null  // ISO date
    descricao: string | null
    forma_pagamento: string | null
    categoria_sugerida: string | null
    confianca: number  // 0-1
  }
  categoria_id: string | null
  fornecedor_id: string | null  // Se encontrou match
  image_url: string
}
```

**Fluxo:**
1. Download da imagem do Storage
2. Enviar para Gemini 3 com prompt de extração (OCR + análise)
3. Parse do JSON retornado
4. Buscar categoria por nome sugerido
5. Buscar fornecedor por nome/CNPJ
6. Retornar dados estruturados

**Modelo usado:** `gemini-3-pro` (fallback: `gemini-3-flash`)

---

### **2. process-email** (Monitoramento de Email)

**Endpoint:** Cron job (não HTTP público)

**Trigger:** A cada 15 minutos

**Fluxo:**
1. Conectar via IMAP
2. Buscar emails não lidos
3. Para cada email:
   - Salvar em `emails_monitorados`
   - Se tem anexo PDF/imagem: processar OCR
   - Se tem anexo XML (NF-e): parser direto
   - Criar gasto/compra sugerido
   - Criar notificação para admins
4. Marcar emails como lidos no servidor

---

### **3. process-plaud** (Reuniões)

**Endpoint:** `POST /functions/v1/process-plaud`

**Input:**
```typescript
{
  markdown: string      // Conteúdo do arquivo Markdown
  reuniao_id: string    // ID da reunião criada
  autor_id: string      // Quem fez upload
}
```

**Output:**
```typescript
{
  success: boolean
  parsed: {
    titulo: string
    data: string
    participantes: string[]
    decisoes: string[]
    action_items: Array<{
      responsavel: string
      tarefa: string
      prazo: string | null
    }>
    gastos: Array<{
      descricao: string
      valor: number
      categoria_sugerida: string
    }>
    problemas: string[]
    mudancas_escopo: Array<{
      descricao: string
      impacto_custo: number | null
      impacto_prazo: number | null
    }>
  }
  acoes_criadas: number
  gastos_criados: number
  posts_criados: number
}
```

---

## 📄 PÁGINAS

### **1. /emails** (Kanban de Emails)

**Layout:** 3 colunas
- Não Processados
- Aguardando Revisão
- Processados

**Componentes:**
- `KanbanEmails` - Container principal
- `EmailCard` - Card de email em cada coluna
- `FiltrosEmail` - Filtros por data, status, remetente

---

### **2. /emails/[id]** (Detalhes do Email)

**Layout:** 2 colunas
- Esquerda: Preview do email + anexos
- Direita: Formulário de dados extraídos (editável)

**Ações:**
- Aprovar → Cria gasto/compra
- Rejeitar → Marca como ignorado
- Reprocessar → Tenta OCR novamente

---

### **3. /reunioes** (Lista de Reuniões)

**Layout:** Lista ou cards
- Título, data, participantes
- Qtd de action items pendentes
- Link para detalhes

---

### **4. /reunioes/nova** (Upload Plaud)

**Formulário:**
- Título (auto-preenchido do Markdown)
- Data da reunião
- Upload do arquivo .md ou .txt
- Preview do conteúdo
- Botão "Processar com IA"

---

### **5. /reunioes/[id]** (Visualização da Reunião)

**Seções:**
- Header: Título, data, participantes
- Resumo: Markdown renderizado
- Action Items: Lista com checkboxes
- Gastos Criados: Links para lançamentos
- Decisões: Posts no feed (backlinks)

---

### **6. OCR Mobile** (Integrado em /financeiro/lancamentos)

**Opção 1:** Botão flutuante "📷 Foto de Recibo"
**Opção 2:** Nova rota `/financeiro/lancamentos/foto`

**Fluxo:**
1. Abrir câmera ou selecionar arquivo
2. Upload para Storage
3. Chamar Edge Function
4. Mostrar formulário pré-preenchido
5. Confirmar e criar gasto

---

## 🎨 COMPONENTES

### **Componentes de Email:**
```
components/features/emails/
├── kanban-emails.tsx      # Container do Kanban
├── email-card.tsx         # Card de email
├── email-preview.tsx      # Preview do email (corpo + anexos)
├── form-aprovacao.tsx     # Formulário de aprovação
└── filtros-email.tsx      # Filtros da lista
```

### **Componentes de Reunião:**
```
components/features/reunioes/
├── upload-plaud.tsx       # Dropzone + preview
├── resumo-viewer.tsx      # Renderização do Markdown
├── action-items-list.tsx  # Lista de action items
├── backlinks.tsx          # Links para itens relacionados
└── reuniao-card.tsx       # Card na lista
```

### **Componentes de OCR:**
```
components/features/ocr/
├── camera-capture.tsx     # Captura de câmera (mobile)
├── preview-ocr.tsx        # Preview da imagem + dados extraídos
└── form-ocr.tsx           # Formulário pré-preenchido
```

---

## 📱 TYPES (TypeScript)

### **Adicionar ao database.ts:**

```typescript
// Novos tipos
export type EmailStatus = 
  | 'nao_processado'
  | 'processando'
  | 'aguardando_revisao'
  | 'processado'
  | 'erro'
  | 'ignorado'

export type AcaoTipo = 'decisao' | 'tarefa' | 'gasto' | 'problema' | 'mudanca_escopo'

export type AcaoStatus = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'

// Novas tabelas
interface Tables {
  // ... existentes ...
  
  configuracoes_sistema: {
    Row: {
      chave: string
      valor: Json
      descricao: string | null
      updated_by: string | null
      updated_at: string
    }
    // ...
  }
  
  emails_monitorados: {
    Row: {
      id: string
      email_id_externo: string
      remetente: string
      remetente_nome: string | null
      assunto: string
      corpo: string | null
      data_recebimento: string
      status: EmailStatus
      anexos: Json | null
      dados_extraidos: Json | null
      gasto_sugerido_id: string | null
      compra_sugerida_id: string | null
      erro_mensagem: string | null
      processado_em: string | null
      processado_por: string | null
      created_at: string
    }
    // ...
  }
  
  reunioes: {
    Row: {
      id: string
      titulo: string
      data_reuniao: string
      participantes: string[] | null
      resumo_markdown: string
      arquivo_original_url: string | null
      created_by: string
      created_at: string
    }
    // ...
  }
  
  reunioes_acoes: {
    Row: {
      id: string
      reuniao_id: string
      tipo: AcaoTipo
      descricao: string
      responsavel_id: string | null
      prazo: string | null
      valor: number | null
      categoria_id: string | null
      etapa_id: string | null
      status: AcaoStatus
      gasto_criado_id: string | null
      compra_criada_id: string | null
      feed_criado_id: string | null
      created_at: string
      updated_at: string
    }
    // ...
  }
}
```

---

## ✅ CHECKLIST DE TESTES

### **OCR de Recibos:**
- [ ] Upload de foto tirada pelo celular
- [ ] Upload de imagem de arquivo
- [ ] Extração de valor correto
- [ ] Extração de data correta
- [ ] Sugestão de categoria funciona
- [ ] Formulário permite edição antes de confirmar
- [ ] Gasto é criado corretamente

### **Monitoramento de Email:**
- [ ] Enviar email de teste com NF anexa (PDF)
- [ ] Enviar email de teste com NF anexa (imagem)
- [ ] Enviar email de teste com XML de NF-e
- [ ] Email aparece no Kanban "Aguardando Revisão"
- [ ] Dados extraídos estão corretos
- [ ] Aprovar cria gasto corretamente
- [ ] Rejeitar marca como ignorado
- [ ] Notificação é criada para admins

### **Reuniões Plaud:**
- [ ] Upload de arquivo .md funciona
- [ ] Parser extrai decisões corretamente
- [ ] Parser extrai action items com responsável e prazo
- [ ] Parser extrai gastos mencionados
- [ ] Action items são criados em `reunioes_acoes`
- [ ] Decisões criam posts no feed
- [ ] Gastos são criados com status pendente
- [ ] Backlinks funcionam (clicar no gasto mostra origem)
- [ ] Marcar action item como concluído funciona

---

## 🔒 SECRETS (Supabase Edge Functions)

```bash
# No Supabase Dashboard → Edge Functions → Secrets

GEMINI_API_KEY=AIzaSyAMXHA5c036cagXV2HruevpTCamENy8Vzg

# Para monitoramento de email (IMAP Umbler)
EMAIL_IMAP_HOST=imap.umbler.com
EMAIL_IMAP_PORT=993
EMAIL_IMAP_USER=casa@toniezzer.com
EMAIL_IMAP_PASSWORD=#1Soeuseitoniezzer
```

> ⚠️ **IMPORTANTE:** Esses secrets ficam criptografados no Supabase e NÃO aparecem no código-fonte.

---

## 📁 STORAGE BUCKETS

### **Bucket: fotos-temp**
```typescript
{
  id: 'fotos-temp',
  name: 'Temporário (Upload OCR)',
  public: false,
  fileSizeLimit: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/*', 'application/pdf'],
}
```

**Política:** Limpeza automática após 24h (via cron job)

---

## 📅 CRONOGRAMA DETALHADO

| Dia | Tarefa | Entrega |
|-----|--------|---------|
| 1 | Setup: migrations, storage, secrets | Infra pronta |
| 2 | Setup: types TypeScript, client Gemini | Types atualizados |
| 3 | OCR: Edge Function process-ocr | Function deployada |
| 4 | OCR: Componentes (camera, preview, form) | UI pronta |
| 5 | OCR: Integração com fluxo de gastos | OCR funcionando |
| 6 | Reuniões: Migrations, types | Tabelas criadas |
| 7 | Reuniões: Edge Function process-plaud | Function deployada |
| 8 | Reuniões: Páginas (/reunioes, /nova) | Upload funcionando |
| 9 | Reuniões: Página /[id], backlinks | Visualização completa |
| 10 | Email: Migration, types | Tabela criada |
| 11 | Email: Edge Function process-email | Function deployada |
| 12 | Email: Páginas (/emails, Kanban) | Lista funcionando |
| 13 | Email: Página /[id], aprovação | Fluxo completo |
| 14 | Email: Cron job, notificações | Automação ativa |
| 15-17 | Testes e refinamentos | Fase 3 completa |

---

## 🚀 PRÓXIMO PASSO

**Checklist de pré-requisitos:**

1. [x] API Key do Gemini disponível ✅
2. [x] Credenciais IMAP disponíveis ✅
3. [ ] Aprovação deste plano

**Comando para iniciar:**
```
"Iniciar FASE 3 - Etapa 1: Infraestrutura Base"
```

---

## 📚 REFERÊNCIAS

- **PRD:** `PRD-Toniezzer-Manager.md` (seções 5.14-5.23)
- **Google Gemini API:** https://ai.google.dev/docs
- **Gemini Models:** https://ai.google.dev/gemini-api/docs/models/gemini
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **IMAP em Deno:** https://deno.land/x/imap

---

## 🤖 CONFIGURAÇÃO DO MODELO GEMINI

### **Modelo: Gemini 3 Pro**

```typescript
// Configuração do cliente Gemini 3
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY'))

// Modelo principal: Gemini 3
const MODEL_NAME = 'gemini-3-pro'

function getModel() {
  return genAI.getGenerativeModel({ model: MODEL_NAME })
}

// Exemplo de uso para OCR
async function processImage(imageBase64: string) {
  const model = getModel()
  
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64
      }
    },
    'Extraia os dados desta nota fiscal/recibo e retorne em JSON...'
  ])
  
  return JSON.parse(result.response.text())
}
```

### **Vantagens do Gemini 3:**
- ✅ Raciocínio avançado (nível PhD)
- ✅ OCR nativo de alta precisão
- ✅ Compreensão multimodal superior (texto, imagem, áudio, vídeo)
- ✅ Melhor extração de dados estruturados
- ✅ Codificação autônoma (agentes de IA)
- ✅ Contexto mais longo e preciso

---

**Última Atualização:** 08/12/2024  
**Autor:** Claude (Anthropic)  
**Status:** ✅ Credenciais configuradas, pronto para iniciar implementação

