plano de implementacao.md
# 📋 PLANO DE IMPLEMENTAÇÃO - Toniezzer Manager

**Projeto:** Sistema de Gestão de Obra Residencial  
**Versão:** 1.0 MVP  
**Data:** 06/12/2024  
**Atualizado:** 08/12/2024 (MVP sem autenticação)  
**Baseado em:** PRD-Toniezzer-Manager.md v1.0 MVP

> ⚠️ **MVP:** Esta versão não possui login nem RLS. O app inicia diretamente no dashboard.

---

## 🎯 VISÃO GERAL

Este documento descreve o plano completo de implementação do Toniezzer Manager, dividido em **5 fases sequenciais**. Cada fase possui dependências claras e entregas específicas.

**Prazo Total Estimado:** 8-12 meses  
**Metodologia:** Desenvolvimento incremental com IA (Claude/Cursor)  
**Arquitetura:** Next.js 14 + TypeScript + Supabase Cloud

---

## 📊 ESTRUTURA DAS FASES

### **FASE 1 - Core Essencial (MVP)** 
**Duração:** 2-3 meses  
**Arquivo:** [`FASE_01.md`](./FASE_01.md)  
**Status:** 🔵 Próxima a iniciar

**Entregas:**
- ✅ Setup inicial (Next.js + Supabase + Vercel)
- ⏳ ~~Autenticação e Sistema de Permissões~~ *(versão futura)*
- ✅ Gestão Financeira Macro
- ✅ Cronograma Visual de Etapas
- ✅ Documentação Visual + Supabase Storage

> ⚠️ **MVP:** App inicia direto no dashboard, sem login nem RLS.

**Dependências:** Nenhuma (ponto de partida)

---

### **FASE 2 - Comunicação**
**Duração:** 1-2 meses  
**Arquivo:** [`FASE_02.md`](./FASE_02.md)  
**Status:** ⏳ Aguardando FASE 1

**Entregas:**
- ✅ Feed de Comunicação Centralizado
- ✅ Gestão de Fornecedores/Prestadores
- ✅ Sistema de Alertas Inteligentes

**Dependências:**
- ⚠️ **FASE 1 completa** (precisa de auth, usuários, etapas, gastos)
- Especificamente: tabelas `users`, `etapas`, `gastos`, `categorias`

---

### **FASE 3 - Automação com IA**
**Duração:** 2-3 meses  
**Arquivo:** [`FASE_03.md`](./FASE_03.md)  
**Status:** ⏳ Aguardando FASE 1 e 2

**Entregas:**
- ✅ OCR de Recibos via Foto/Upload
- ✅ Automação de Email + Notas Fiscais
- ✅ IA + Plaud (Processamento de Reuniões)

**Dependências:**
- ⚠️ **FASE 1 completa** (precisa de gastos, categorias, fornecedores, storage)
- ⚠️ **FASE 2 completa** (precisa de feed de comunicação para backlinks)
- Especificamente: tabelas `gastos`, `fornecedores`, `reunioes`, `feed_comunicacao`

---

### **FASE 4 - Qualidade e Relatórios**
**Duração:** 1-2 meses  
**Arquivo:** [`FASE_04.md`](./FASE_04.md)  
**Status:** ⏳ Aguardando FASE 1

**Entregas:**
- ✅ Checklist de Qualidade por Etapa
- ✅ Relatórios Automáticos
- ✅ Gestão de Compras/Materiais

**Dependências:**
- ⚠️ **FASE 1 completa** (precisa de etapas, gastos, fornecedores)
- Recomendado: FASE 2 completa (para notificações de qualidade)
- Especificamente: tabelas `etapas`, `checklists_qualidade`, `gastos`

---

### **FASE 5 - Funcionalidades Avançadas**
**Duração:** 1-2 meses  
**Arquivo:** [`FASE_05.md`](./FASE_05.md)  
**Status:** ⏳ Aguardando FASE 1, 2 e 3

**Entregas:**
- ✅ Gestão de Mudanças de Escopo (Change Orders)
- ✅ Integração Bancária Automática
- ✅ IA para Análise Preditiva

**Dependências:**
- ⚠️ **FASE 1 completa** (precisa de todo o core: etapas, gastos, cronograma)
- ⚠️ **FASE 2 completa** (precisa de comunicação e alertas)
- ⚠️ **FASE 3 completa** (precisa de automação IA base)
- Especificamente: tabelas `mudancas_escopo`, `etapas`, `gastos`, análise preditiva precisa de histórico de dados

---

## 🔗 DIAGRAMA DE DEPENDÊNCIAS

```
FASE 1 (Core Essencial)
    │
    ├─────────────┬──────────────┬─────────────┐
    │             │              │             │
    ▼             ▼              ▼             ▼
FASE 2        FASE 4       FASE 3*        FASE 5**
(Comunicação) (Qualidade)  (IA)          (Avançado)
    │             │              │             │
    └─────────────┴──────────────┴─────────────┘
                        │
                        ▼
            Produto Completo ✅

* FASE 3 precisa de FASE 1 + FASE 2
** FASE 5 precisa de FASE 1 + FASE 2 + FASE 3
```

---

## 📦 ENTREGAS POR FASE (Resumo)

| Fase | Funcionalidades | Tabelas Criadas | Funções server (Node) | Duração |
|------|-----------------|-----------------|----------------------|---------|
| **1** | 4 funcionalidades | 10 tabelas | 2 functions | 2-3 meses |
| **2** | 3 funcionalidades | 4 tabelas | 1 function | 1-2 meses |
| **3** | 3 funcionalidades | 3 tabelas | 3 functions | 2-3 meses |
| **4** | 3 funcionalidades | 2 tabelas | 1 function | 1-2 meses |
| **5** | 3 funcionalidades | 2 tabelas | 0 functions | 1-2 meses |
| **TOTAL** | **16 funcionalidades** | **21 tabelas** | **7 functions** | **8-12 meses** |

*Nota: BIM Viewer (#12) é nice-to-have e não está incluído no plano principal.*

---

## ✅ CRITÉRIOS DE CONCLUSÃO DE FASE

### **Para considerar uma fase COMPLETA:**

1. ✅ **Todas as funcionalidades implementadas** conforme especificação
2. ✅ **Todas as tabelas criadas** no banco de dados
3. ✅ **Funções server (Node)** deployadas e testadas
4. ✅ **Testes manuais** executados (checklist por fase)
5. ✅ **Deploy em produção** funcionando (Vercel + Supabase)
6. ✅ **Documentação** atualizada (se necessário)
7. ✅ **Aprovação do proprietário** (você)

> ⚠️ **MVP:** RLS policies não são critério de conclusão nesta versão.

---

## 🚀 RECOMENDAÇÕES DE EXECUÇÃO

### **1. Desenvolvimento Iterativo**
- Implementar uma funcionalidade por vez
- Testar manualmente após cada implementação
- Não avançar sem validar que está funcionando

### **2. Uso de IA (Claude/Cursor)**
- Seguir o PRD rigorosamente
- Validar código gerado antes de aplicar
- Rodar linter após cada mudança

### **3. Gestão de Riscos**
- Backup do banco antes de migrations grandes
- Testar RLS policies cuidadosamente (pode bloquear acesso)
- Validar rotas server / jobs em ambiente de teste primeiro

### **4. Comunicação**
- Ao final de cada fase: revisar PRD vs implementado
- Ajustar próximas fases baseado em aprendizados
- Documentar decisões técnicas importantes

---

## 📅 CRONOGRAMA SUGERIDO

**Início:** Janeiro/2025  
**Fim Estimado:** Setembro/2025

| Fase | Início Previsto | Fim Previsto | Status |
|------|-----------------|--------------|--------|
| FASE 1 | Jan/2025 | Mar/2025 | 🔵 A iniciar |
| FASE 2 | Mar/2025 | Mai/2025 | ⏳ Aguardando |
| FASE 3 | Mai/2025 | Ago/2025 | ⏳ Aguardando |
| FASE 4 | Ago/2025 | Set/2025 | ⏳ Aguardando |
| FASE 5 | Set/2025 | Out/2025 | ⏳ Aguardando |

**Margem:** +2 meses para ajustes e imprevistos

---

## 📚 ARQUIVOS RELACIONADOS

- 📄 **PRD Completo:** [`../PRD-Toniezzer-Manager.md`](../PRD-Toniezzer-Manager.md)
- 📄 **Resumo de Decisões:** [`../resumo.md`](../resumo.md)
- 📂 **Detalhes por Fase:**
  - [FASE_01.md](./FASE_01.md) - Core Essencial
  - [FASE_02.md](./FASE_02.md) - Comunicação
  - [FASE_03.md](./FASE_03.md) - Automação IA
  - [FASE_04.md](./FASE_04.md) - Qualidade e Relatórios
  - [FASE_05.md](./FASE_05.md) - Avançado

---

## 🎯 PRÓXIMO PASSO

➡️ **Iniciar FASE 1** - Ler [`FASE_01.md`](./FASE_01.md) e seguir o guia de implementação.

---

**Última Atualização:** 06/12/2024  
**Autor:** Claude (Anthropic)

