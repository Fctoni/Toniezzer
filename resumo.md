resumo.md
# 📋 RESUMO DE DECISÕES - Toniezzer Manager (Sistema de Gestão de Obra)

**Data:** 06/12/2024  
**Projeto:** Sistema de Gestão de Obra Residencial  
**Nome:** Toniezzer Manager  
**URL:** obra.toniezzer.com

---

## 🎯 1. CONTEXTO DO PROJETO

### 1.1 Tipo de Obra
- **Tipo:** Construção do zero (residencial)
- **Porte:** Grande - R$ 5 milhões
- **Duração:** 24 meses
- **Experiência prévia:** Não tem experiência em obras

### 1.2 Gestão
- **Modelo:** Gerenciar cada prestador separadamente
- **Administrador:** Contratou administrador de obra para gestão diária
- **Acompanhamento:** Administrador de obra (não arquiteto direto)

### 1.3 Principais Dores a Resolver
- ✅ Estourar orçamento
- ✅ Atrasos
- ✅ Qualidade
- ✅ Perder documentos
- ✅ Não conseguir acompanhar
- ✅ Retrabalhos
- ✅ Gambiarras por falta de comunicação/improvisos

### 1.4 Nível de Controle
- **Tipo:** Controle macro (não detalhar cada parafuso)
- **Relatórios:** Quanto mais dados melhor, mas sem trabalho excessivo para coleta
- **Integração bancária:** Interessante se fácil de implementar

### 1.5 Plataforma
- **Lançamentos:** Celular (pelos colaboradores)
- **Análises/Planejamento:** Desktop (pelo proprietário)
- **Internet:** Terá internet desde o início (não precisa offline)
- **Acesso:** Todos remotamente

---

## 🏗️ 2. STACK TECNOLÓGICO APROVADO

### 2.1 Frontend
- **Next.js 14+** (App Router)
- **TypeScript 5+**
- **Tailwind CSS 3+**
- **shadcn/ui** (componentes)
- **@dnd-kit** (drag & drop)
- **date-fns** (datas)
- **Zod** (validação)

### 2.2 Backend
- **Supabase Cloud** (plano pago)
  - PostgreSQL
  - Auth
  - Realtime
  - **Storage** (ADICIONAR - não estava no projeto ref.)
  - Edge Functions

### 2.3 Integrações
- **LLM:** Google Gemini (precisa criar API key)
- **OCR:** Google Vision API (ou similar)
- **Email:** IMAP (polling a cada 15 minutos)
- **Bancário:** Import manual de PDF (sem API por segurança)

### 2.4 Deploy
- **Hosting:** Vercel
- **Domínio:** Já tem (toniezzer.com)
- **Ambiente:** Só produção (sem dev/staging)

---

## 👥 3. USUÁRIOS E PERMISSÕES

### 3.1 Perfis Aprovados

| Perfil | Pode Ver | Pode Criar | Pode Editar | Pode Deletar |
|--------|----------|------------|-------------|--------------|
| **👑 Admin Sistema** | Tudo | Tudo | Tudo | Tudo |
| **🏗️ Admin Obra** | Financeiro só das etapas dele<br>Resto: tudo | Lançar gastos, criar etapas, fornecedores, upload docs, feed | Suas etapas, fornecedores, aprovar etapas, checklist qualidade | ❌ Lançamentos aprovados<br>✅ Resto que criou |
| **👷 Prestador** | Suas etapas, seus pagamentos, feed<br>❌ Valores de outros | Solicitar conclusão etapa, upload fotos, comentar feed | Progresso suas etapas, suas fotos | ❌ Nada financeiro |
| **📐 Arquiteto/Eng** | Técnico completo, financeiro macro, feed | Sugerir mudanças, criar checklists, upload plantas, comentar | Checklists, specs técnicas, aprovar/reprovar etapas | ❌ Sem deletes |
| **👀 Visualizador** | Cronograma, fotos, feed<br>❌ Financeiro<br>❌ Dados prestadores | ❌ Nada | ❌ Nada | ❌ Nada |

### 3.2 Regras Específicas
- **Admin Obra:** Vê financeiro SÓ das etapas que ele é responsável
- **Prestadores:** NÃO veem valores de outros prestadores
- **Lançar gastos:** SÓ Admin Obra ou Admin Sistema
- **Aprovar mudanças escopo:** Qualquer um sugere, SÓ Admin Sistema aprova
- **Arquiteto:** Visão macro financeira (ex: "Fundação: R$ 500k de R$ 600k") mas não vê NF por NF

---

## 📊 4. FUNCIONALIDADES APROVADAS (17 total)

### 4.1 CORE (Essenciais)
1. ✅ **Gestão Financeira Macro** - Orçamento vs realizado, alertas, projeções
2. ✅ **Cronograma Visual de Etapas** - Timeline, status, responsáveis, dependências
3. ✅ **Comunicação Centralizada** - Feed de atividades, decisões, @menções
4. ✅ **Documentação Visual** - Galeria de fotos, upload de plantas/contratos, versionamento
5. ✅ **Gestão de Fornecedores/Prestadores** - Cadastro, pagamentos, avaliações
6. ✅ **Sistema de Permissões** - Perfis e acessos diferenciados por usuário

### 4.2 IMPORTANTES
7. ✅ **Checklist de Qualidade por Etapa** - Templates de inspeção, fotos obrigatórias
8. ✅ **Alertas Inteligentes** - Notificações proativas de problemas
9. ✅ **Relatórios Automáticos** - Relatórios semanais em PDF, gráficos
10. ✅ **Gestão de Compras/Materiais** - Lista, comparativo de fornecedores, estoque

### 4.3 AVANÇADAS
11. ✅ **Integração Bancária Automática** - Open Banking, categorização automática
12. ⏸️ **BIM Viewer Simplificado** - Nice to have (avaliar complexidade depois)
13. ✅ **Gestão de Mudanças (Change Orders)** - Solicitação formal, aprovação digital
14. ✅ **IA para Análise Preditiva** - Prever atrasos, sugerir realocações

### 4.4 AUTOMAÇÃO COM IA
15. ✅ **IA + Plaud - Processamento de Reuniões** - Importar resumo, lançar com backlinks
16. ✅ **Automação de Email - Notas Fiscais** - Monitorar casa@toniezzer.com, OCR, sugestão automática
17. ✅ **OCR de Recibos via Foto/Upload** - Câmera mobile/upload, extração, sugestão

---

## 🎨 5. CONFIGURAÇÕES PERSONALIZÁVEIS

**DECISÃO CRÍTICA:** NÃO cadastrar dados iniciais (seed data). Sistema inicia vazio.

### 5.1 O Que é Configurável
- ✅ **Categorias de gastos** (aba de configurações)
- ✅ **Subcategorias** dentro de categorias
- ✅ **Status de etapas** (configurável)
- ✅ **Tipos de prestadores** (configurável)
- ✅ **Dependências entre etapas** (todas configuráveis)

### 5.2 Funcionalidade Especial
- ✅ **Botão de adição rápida** de categorias durante lançamento de conta
- ✅ **Aba de configurações** centralizada para gerenciar tudo

---

## 💰 6. GESTÃO FINANCEIRA - REGRAS

### 6.1 Lançamentos
- ✅ Controlar **parcelas** (ex: compra em 10x)
- ✅ Ter **subcategorias**
- ✅ Campos: valor, data, categoria, subcategoria, fornecedor, forma_pagamento, parcelas, nota_fiscal, aprovado_por, etapa_relacionada, centro_custo

### 6.2 Alertas de Orçamento
- **Trigger:** 80% e 100% de cada categoria
- **Destino:** Notificação in-app
- **Bloqueio:** SEM bloqueio ao atingir 100%, só notificação
- **Reserva/Contingência:** Não precisa

### 6.3 Relatórios de Fluxo de Caixa
- ✅ Calcular gastos futuros baseado em parcelas
- ✅ Projeções de despesas
- ✅ Relatórios semanais automáticos

---

## 📅 7. CRONOGRAMA E ETAPAS - REGRAS

### 7.1 Dependências
- ✅ Etapas têm dependências obrigatórias (configuráveis)
- ✅ Sistema **SÓ AVISA** (não bloqueia)
- ✅ **NÃO usar arrays** → criar tabela separada com FK para relacionar dependências

### 7.2 Datas
- **Quem define:** Proprietário (Admin Sistema) OU Admin Obra
- **Recálculo automático:** SIM - quando etapa atrasa, recalcula datas das seguintes

### 7.3 Progresso
- **Cálculo:** Automático (baseado em checklists concluídos)
- **Edição:** Pode ser editado manualmente

### 7.4 Fluxo de Aprovação de Etapas

```
Status da Etapa:

Não Iniciada (inicial)
    ↓ (prestador clica "Iniciar")
Em Andamento
    ↓ (prestador clica "Concluir")
Aguardando Aprovação ← NOVO STATUS
    ↓ (admin obra revisa)
    ├─ Aprovou → Aguardando Qualidade
    └─ Rejeitou → Em Retrabalho
Aguardando Qualidade ← NOVO STATUS
    ↓ (admin obra preenche checklist)
    ├─ Passou → Concluída ✅
    └─ Não passou → Em Retrabalho
```

**Quem pode marcar concluída:**
- Qualquer prestador solicita
- Admin Obra aprova
- Checklist de qualidade valida
- Status final: Concluída

---

## 🤖 8. AUTOMAÇÃO COM IA - DETALHES

### 8.1 Lançamento Automático (Email + OCR)

#### Fluxo de Aprovação
1. IA processa e sugere lançamento
2. **Quem recebe notificação:** Proprietário E Admin Obra (ambos)
3. **Prazo para aprovar:** SEM prazo
4. **Edição antes de aprovar:** Pode editar TODOS os campos
5. **Após aprovado:** SÓ Admin Sistema pode editar/deletar

### 8.2 Email - Notas Fiscais (casa@toniezzer.com)

#### Monitoramento
- **Email:** casa@toniezzer.com (ainda não contratado)
- **Protocolo:** IMAP
- **Polling:** A cada **15 minutos**
- **Outros emails:** Não, só esse por enquanto

#### Processamento
- **Com anexo (PDF/XML):** OCR ou parser XML de NF-e
- **Sem anexo (só texto):** Tentar extrair do corpo do email
- **Fornecedores desconhecidos:** Sugere e pede revisão (não cadastra automaticamente)

#### Interface - Aba de Emails
- **Formato:** Kanban com 3 colunas
  - Não Processados
  - Aguardando Revisão
  - Processados
- **Notificações:** Emails não verificados OU que IA não conseguiu extrair nada

### 8.3 Plaud - Reuniões

#### Import
- **Método:** Upload manual (não API)
- **Formato:** Markdown
- **Template customizado:** ✅ **CRIAR TEMPLATE NO PLAUD** - temos controle total sobre como a IA do Plaud atua
- **Backlinks:** Ao clicar, abre o **resumo** da reunião

#### Processamento
- Plaud JÁ envia resumo estruturado com tarefas, decisões, etc
- Sistema só precisa pegar dados estruturados e fazer lançamentos automáticos
- Criar backlinks para a reunião original

### 8.4 OCR de Recibos (Foto/Upload)
- **Mobile:** Usar câmera diretamente
- **Desktop:** Upload de imagem/PDF
- **Processamento:** Google Vision API (ou similar)
- **Fluxo:** Foto → OCR → Sugestão → Aprovação → Lançamento

### 8.5 Integração Bancária
- **Método:** Import manual de PDF/arquivo exportado pelo banco
- **Motivo:** Segurança (sem API automática neste momento)
- **Futuro:** Pode implementar Open Banking depois

---

## 🔄 9. ORDEM DE IMPLEMENTAÇÃO (Aprovada)

### FASE 1 (Core Essencial)
1. Auth e Permissões (#6)
2. Gestão Financeira (#1)
3. Cronograma de Etapas (#2)
4. Documentação Visual (#4) - incluindo Supabase Storage

### FASE 2 (Comunicação)
5. Feed de Comunicação (#3)
6. Gestão de Fornecedores (#5)
7. Alertas Inteligentes (#8)

### FASE 3 (Automação IA)
8. OCR de Recibos (#17)
9. Email + Notas Fiscais (#16)
10. Plaud + Reuniões (#15)

### FASE 4 (Qualidade e Relatórios)
11. Checklist de Qualidade (#7)
12. Relatórios Automáticos (#9)
13. Gestão de Compras (#10)

### FASE 5 (Avançado)
14. Change Orders (#13)
15. Integração Bancária (#11)
16. IA Preditiva (#14)

---

## 🗄️ 10. MODELO DE DADOS - DECISÕES CRÍTICAS

### 10.1 Tabela: gastos (lançamentos financeiros)
```sql
- id (uuid, PK)
- valor (decimal)
- data (date)
- categoria_id (FK)
- subcategoria_id (FK, nullable)
- fornecedor_id (FK)
- forma_pagamento (enum: dinheiro, pix, cartao, boleto)
- parcelas (integer, default 1)
- parcela_atual (integer, nullable) -- se for parcelado
- nota_fiscal_url (text) -- link para Supabase Storage
- aprovado_por (FK user_id)
- etapa_relacionada_id (FK, nullable)
- centro_custo_id (FK, nullable)
- status (enum: pendente_aprovacao, aprovado, rejeitado)
- criado_por (FK user_id)
- criado_via (enum: manual, email, ocr, bancario)
- created_at, updated_at
```

### 10.2 Tabela: etapas
```sql
- id (uuid, PK)
- nome (text)
- status (enum: nao_iniciada, em_andamento, aguardando_aprovacao, aguardando_qualidade, em_retrabalho, pausada, atrasada, concluida)
- data_inicio_prevista (date)
- data_fim_prevista (date)
- data_inicio_real (date, nullable)
- data_fim_real (date, nullable)
- responsavel_id (FK user_id)
- progresso_percentual (integer, 0-100)
- progresso_manual (boolean) -- se foi editado manualmente
- created_at, updated_at
```

### 10.3 Tabela: etapas_dependencias
```sql
- id (uuid, PK)
- etapa_id (FK etapas.id) -- etapa que depende
- depende_de_etapa_id (FK etapas.id) -- etapa da qual depende
- tipo (enum: obrigatoria, recomendada)
- created_at
```

**NÃO usar arrays para dependências** → usar FK e tabela de relacionamento

### 10.4 Tabela: categorias
```sql
- id (uuid, PK)
- nome (text)
- cor (text) -- hex color
- icone (text) -- opcional
- ordem (integer) -- para ordenação customizada
- ativo (boolean)
- created_at, updated_at
```

### 10.5 Tabela: subcategorias
```sql
- id (uuid, PK)
- categoria_id (FK categorias.id)
- nome (text)
- ativo (boolean)
- created_at, updated_at
```

### 10.6 Tabela: emails_monitorados
```sql
- id (uuid, PK)
- email_id_externo (text) -- ID do email no servidor IMAP
- remetente (text)
- assunto (text)
- corpo (text)
- data_recebimento (timestamptz)
- status (enum: nao_processado, processando, aguardando_revisao, processado, erro)
- anexos (jsonb) -- [{nome, url_storage, tipo}]
- dados_extraidos (jsonb) -- resultado do OCR/parser
- lançamento_sugerido_id (FK, nullable)
- erro_mensagem (text, nullable)
- processado_em (timestamptz, nullable)
- processado_por (FK user_id, nullable)
- created_at, updated_at
```

### 10.7 Tabela: reunioes
```sql
- id (uuid, PK)
- titulo (text)
- data_reuniao (date)
- participantes (text[])
- resumo_markdown (text) -- resumo completo do Plaud
- arquivo_original_url (text, nullable) -- se tiver áudio/arquivo
- criado_por (FK user_id)
- created_at, updated_at
```

### 10.8 Tabela: reunioes_acoes (action items extraídos)
```sql
- id (uuid, PK)
- reuniao_id (FK reunioes.id)
- tipo (enum: decisao, tarefa, gasto, problema, mudanca_escopo)
- descricao (text)
- responsavel_id (FK user_id, nullable)
- prazo (date, nullable)
- valor (decimal, nullable) -- se for gasto
- categoria_id (FK, nullable) -- se for gasto
- etapa_id (FK, nullable) -- se relacionado a etapa
- status (enum: pendente, em_andamento, concluido, cancelado)
- lançamento_criado_id (FK, nullable) -- backlink para lançamento gerado
- created_at, updated_at
```

---

## 📝 11. REQUISITOS ESPECIAIS DO PRD

### 11.1 Itens a Incluir no PRD
1. ✅ **Template customizado do Plaud** - seção explicando que podemos configurar o template de exportação do Plaud exatamente como precisamos
2. ✅ **Supabase Storage** - detalhar buckets, políticas RLS, transformação de imagens
3. ✅ **Edge Functions** específicas para cada automação IA
4. ✅ **Fluxo completo de aprovação** de etapas com estados intermediários
5. ✅ **Aba de configurações** para categorias, status, tipos de prestadores
6. ✅ **Kanban de emails** com 3 colunas
7. ✅ **Sistema de notificações** in-app
8. ✅ **Permissões RLS** detalhadas no Supabase por perfil

### 11.2 Modelo de Referência
- **Arquivo:** `PRD-Sistema-Apontamento-v3.md` (3517 linhas)
- **Stack:** Next.js 14 + TypeScript + Tailwind + shadcn/ui + Supabase
- **Estrutura a seguir:** Mesma do arquivo de referência

---

## 🎯 12. OBSERVAÇÕES FINAIS

1. **Assertividade:** Todas decisões foram validadas. Não há suposições no PRD.
2. **Complexidade:** Sistema grande (17 funcionalidades), mas viável com a stack escolhida.
3. **Prioridade:** Focar na ordem de implementação definida (FASE 1 → 2 → 3 → 4 → 5).
4. **Segurança:** RLS rigoroso no Supabase para cada perfil de usuário.
5. **UX Mobile:** Priorizar experiência mobile para prestadores (lançamentos rápidos).
6. **UX Desktop:** Priorizar dashboards e análises para proprietário/admin obra.

---

**FIM DO RESUMO**

Este documento contém TODAS as decisões tomadas e deve ser consultado durante a criação do PRD para garantir assertividade total.

