
FASE_05.md
# 🔴 FASE 5 - Funcionalidades Avançadas

**Status:** ⏳ Aguardando FASE 1, 2 e 3  
**Duração Estimada:** 1-2 meses  
**Prioridade:** BAIXA (nice-to-have)

---

## 🎯 OBJETIVO DA FASE

Implementar funcionalidades avançadas que agregam valor estratégico: gestão formal de mudanças de escopo, integração bancária automática e análise preditiva com IA.

---

## 📦 ENTREGAS

### ✅ **Funcionalidade #13 - Gestão de Mudanças (Change Orders)**
- Solicitação formal de mudanças
- Fluxo de aprovação
- Cálculo de impacto (custo + prazo)
- Assinatura digital (opcional)
- Histórico completo

### ✅ **Funcionalidade #11 - Integração Bancária**
- **FASE 1:** Import manual de PDF/CSV
- **FASE 2 (opcional):** Open Banking automático
- Conciliação automática
- Detecção de duplicatas

### ✅ **Funcionalidade #14 - IA para Análise Preditiva**
- Prever atrasos baseado em tendências
- Alertas de risco de estouro de orçamento
- Sugestões de realocação de recursos
- Análise de eficiência de fornecedores

---

## 🔗 DEPENDÊNCIAS

### **Requer de FASE 1:**
- ✅ Todas tabelas core (etapas, gastos, categorias, fornecedores)
- ✅ Sistema de notificações
- ✅ Histórico de dados (mínimo 3 meses para análise preditiva)

### **Requer de FASE 2:**
- ✅ Feed de comunicação (para documentar mudanças)
- ✅ Notificações avançadas

### **Requer de FASE 3:**
- ✅ Automação IA base (Gemini configurado)
- ✅ Edge Functions de processamento

---

## 🗄️ BANCO DE DADOS - TABELAS A CRIAR

### **Migration 011: Mudanças de Escopo**

```sql
-- Tabela mudancas_escopo
CREATE TABLE mudancas_escopo (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero integer UNIQUE NOT NULL,
  titulo text NOT NULL,
  descricao text NOT NULL,
  justificativa text,
  impacto_custo decimal,
  impacto_prazo_dias integer,
  etapas_afetadas uuid[],
  status text NOT NULL CHECK (status IN ('rascunho', 'aguardando_aprovacao', 'aprovada', 'rejeitada', 'cancelada')),
  solicitado_por uuid NOT NULL REFERENCES users(id),
  aprovado_por uuid REFERENCES users(id),
  aprovado_em timestamptz,
  observacoes_aprovacao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_mudancas_status ON mudancas_escopo(status);
CREATE INDEX idx_mudancas_solicitado_por ON mudancas_escopo(solicitado_por);
CREATE INDEX idx_mudancas_numero ON mudancas_escopo(numero);

-- Trigger para gerar número sequencial
CREATE SEQUENCE mudancas_numero_seq START 1;

CREATE OR REPLACE FUNCTION set_mudanca_numero()
RETURNS trigger AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    NEW.numero := nextval('mudancas_numero_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_mudanca_numero
  BEFORE INSERT ON mudancas_escopo
  FOR EACH ROW EXECUTE FUNCTION set_mudanca_numero();

ALTER TABLE mudancas_escopo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mudancas_select_all" ON mudancas_escopo FOR SELECT TO authenticated USING (true);
CREATE POLICY "mudancas_insert_authenticated" ON mudancas_escopo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mudancas_update_own" ON mudancas_escopo FOR UPDATE TO authenticated USING (
  solicitado_por = auth.uid() AND status = 'rascunho'
);
CREATE POLICY "mudancas_approve_admin" ON mudancas_escopo FOR UPDATE TO authenticated USING (
  (SELECT perfil FROM users WHERE id = auth.uid()) = 'admin_sistema'
);

-- Trigger para notificar admin ao criar mudança
CREATE OR REPLACE FUNCTION notify_mudanca_escopo()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'aguardando_aprovacao' THEN
    INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link, origem_id)
    SELECT id, 'mudanca_escopo',
           'Nova mudança de escopo #' || NEW.numero,
           NEW.titulo || ' - Impacto: R$ ' || COALESCE(NEW.impacto_custo::text, '0'),
           '/mudancas/' || NEW.id,
           NEW.id
    FROM users WHERE perfil = 'admin_sistema';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_mudanca
  AFTER INSERT OR UPDATE ON mudancas_escopo
  FOR EACH ROW EXECUTE FUNCTION notify_mudanca_escopo();
```

### **Migration 012: Análises Preditivas (cache)**

```sql
-- Tabela para armazenar análises preditivas geradas
CREATE TABLE analises_preditivas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo text NOT NULL CHECK (tipo IN ('atraso_etapa', 'estouro_orcamento', 'eficiencia_fornecedor', 'risco_geral')),
  entidade_id uuid, -- ID da etapa, categoria, fornecedor, etc
  score decimal NOT NULL CHECK (score >= 0 AND score <= 1), -- 0 = baixo risco, 1 = alto risco
  confianca decimal CHECK (confianca >= 0 AND confianca <= 1),
  fatores jsonb, -- [{fator, peso, valor}]
  recomendacoes text[],
  valido_ate timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_analises_tipo ON analises_preditivas(tipo);
CREATE INDEX idx_analises_entidade ON analises_preditivas(entidade_id);
CREATE INDEX idx_analises_valido ON analises_preditivas(valido_ate);

ALTER TABLE analises_preditivas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analises_select_admin" ON analises_preditivas FOR SELECT TO authenticated USING (
  (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra')
);
```

---

## ⚡ EDGE FUNCTIONS (NENHUMA NOVA)

As funcionalidades desta fase usam as Edge Functions já criadas nas fases anteriores, especialmente:
- `generate-report` (para relatórios de mudanças)
- APIs de IA já configuradas (Gemini)

---

## 📱 COMPONENTES FRONTEND

### **Rotas a Criar:**

```
app/(dashboard)/
├── mudancas/
│   ├── page.tsx             # Lista de change orders
│   ├── nova/page.tsx        # Solicitar mudança
│   └── [id]/page.tsx        # Detalhes + aprovação
├── bancario/
│   ├── page.tsx             # Import manual de extrato
│   ├── conciliacao/page.tsx # Conciliar transações
│   └── duplicatas/page.tsx  # Resolver duplicatas
└── analises/
    └── page.tsx             # Dashboard preditivo
```

### **Componentes Chave:**

#### **1. Formulário de Change Order**
```typescript
interface ChangeOrderForm {
  titulo: string
  descricao: string
  justificativa: string
  impacto_custo?: number
  impacto_prazo_dias?: number
  etapas_afetadas: string[] // array de etapa_ids
}
```

#### **2. Dashboard Preditivo**
```typescript
interface PredictiveAnalysis {
  tipo: 'atraso_etapa' | 'estouro_orcamento' | 'eficiencia_fornecedor' | 'risco_geral'
  score: number // 0-1
  confianca: number // 0-1
  fatores: Array<{
    fator: string
    peso: number
    valor: number
  }>
  recomendacoes: string[]
}
```

Exemplo de exibição:
```
┌─────────────────────────────────────┐
│ 🔴 ALTO RISCO DE ATRASO             │
│ Etapa: Fundação                     │
│                                     │
│ Score: 85% | Confiança: 92%        │
│                                     │
│ Fatores:                            │
│ • Velocidade atual: 60% do esperado│
│ • Chuvas previstas: 5 dias         │
│ • Atraso em dependência: 3 dias    │
│                                     │
│ Recomendações:                      │
│ ✓ Adicionar equipe extra           │
│ ✓ Antecipar compra de materiais    │
│ ✓ Ajustar cronograma +7 dias       │
└─────────────────────────────────────┘
```

---

## 🤖 LÓGICA DE IA PREDITIVA

### **Algoritmo de Análise de Atraso**

```typescript
// lib/ai/predictive-analysis.ts

interface EtapaHistorico {
  progresso_atual: number
  dias_decorridos: number
  dias_previstos: number
  velocidade_media_dia: number // % por dia
}

export async function calcularRiscoAtraso(etapa_id: string): Promise<PredictiveAnalysis> {
  // 1. Buscar dados da etapa
  const etapa = await supabase
    .from('etapas')
    .select('*')
    .eq('id', etapa_id)
    .single()
  
  if (!etapa.data_inicio_real) {
    return { score: 0, confianca: 1, tipo: 'atraso_etapa', fatores: [], recomendacoes: [] }
  }
  
  // 2. Calcular velocidade atual
  const dias_decorridos = Math.floor(
    (new Date().getTime() - new Date(etapa.data_inicio_real).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const velocidade_atual = etapa.progresso_percentual / dias_decorridos
  
  // 3. Calcular velocidade necessária
  const dias_restantes = Math.floor(
    (new Date(etapa.data_fim_prevista).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const progresso_restante = 100 - etapa.progresso_percentual
  const velocidade_necessaria = progresso_restante / dias_restantes
  
  // 4. Calcular score (0-1)
  const ratio = velocidade_atual / velocidade_necessaria
  let score = 0
  
  if (ratio < 0.5) score = 1.0      // Muito atrasado
  else if (ratio < 0.7) score = 0.8  // Atrasado
  else if (ratio < 0.9) score = 0.5  // Risco médio
  else if (ratio < 1.0) score = 0.3  // Risco baixo
  else score = 0.1                   // No prazo
  
  // 5. Fatores
  const fatores = [
    { fator: 'Velocidade atual', peso: 0.5, valor: ratio },
    { fator: 'Dias restantes', peso: 0.3, valor: dias_restantes < 7 ? 0.3 : 1.0 },
    { fator: 'Progresso realizado', peso: 0.2, valor: etapa.progresso_percentual / 100 }
  ]
  
  // 6. Recomendações
  const recomendacoes = []
  if (ratio < 0.7) {
    recomendacoes.push('Adicionar mais recursos à etapa')
    recomendacoes.push('Considerar horas extras')
  }
  if (dias_restantes < 7 && score > 0.5) {
    recomendacoes.push('Renegociar prazo com stakeholders')
  }
  
  return {
    tipo: 'atraso_etapa',
    entidade_id: etapa_id,
    score,
    confianca: 0.85,
    fatores,
    recomendacoes
  }
}
```

---

## 🏦 INTEGRAÇÃO BANCÁRIA (MANUAL)

### **Fluxo:**

1. **Upload de Extrato** (CSV ou PDF)
2. **Parser** → extrair transações
3. **Matching Automático:**
   - Comparar valor + data (±2 dias) com gastos
   - Similaridade de descrição (Levenshtein distance)
4. **Interface de Conciliação:**
   - Transação bancária | Gasto sugerido | [Confirmar] [Ignorar] [Criar Novo]
5. **Marcar como conciliado**

---

## ✅ CHECKLIST DE TESTES MANUAIS

### **Change Orders**
- [ ] Solicitar mudança de escopo (qualquer usuário)
- [ ] Calcular impacto (custo + prazo)
- [ ] Enviar para aprovação → verificar notificação Admin
- [ ] Admin: aprovar mudança
- [ ] Admin: rejeitar mudança
- [ ] Ver histórico de mudanças

### **Integração Bancária**
- [ ] Upload de extrato CSV
- [ ] Ver transações detectadas
- [ ] Conciliar transação com gasto existente
- [ ] Criar novo gasto a partir de transação
- [ ] Ignorar transação (ex: transferência)
- [ ] Ver relatório de conciliação

### **IA Preditiva**
- [ ] Ver dashboard de riscos
- [ ] Verificar análise de atraso de etapa
- [ ] Verificar previsão de estouro de orçamento
- [ ] Ver recomendações geradas
- [ ] Exportar análise em PDF

---

## 🎯 CRITÉRIOS DE CONCLUSÃO

- ✅ Migrations 011 e 012 executadas
- ✅ Change Orders funcional
- ✅ Import bancário manual funcional
- ✅ Dashboard preditivo funcional
- ✅ Todos testes manuais passando
- ✅ Deploy em produção
- ✅ Aprovação do proprietário

---

## 🎉 CONCLUSÃO DO PROJETO

Com a conclusão da FASE 5, o **Toniezzer Manager** está 100% implementado conforme PRD!

**Próximos Passos:**
1. Usar o sistema durante a obra (24 meses)
2. Coletar feedback dos usuários
3. Iterar e melhorar
4. Considerar funcionalidades adicionais:
   - BIM Viewer (#12 - nice to have)
   - Integração WhatsApp Business
   - App mobile nativo

---

## 📚 REFERÊNCIAS

- **PRD:** Seções de Change Orders, Bancário, IA Preditiva
- **FASE anterior:** [FASE_04.md](./FASE_04.md)
- **Plano Completo:** [plano de implementacao.md](./plano%20de%20implementacao.md)

---

## 🎊 PARABÉNS!

Você chegou ao final do plano de implementação. Todas as 16 funcionalidades principais estão documentadas e prontas para serem desenvolvidas.

Boa sorte na construção da sua obra! 🏗️

---

**Criado em:** 06/12/2024  
**Autor:** Claude (Anthropic)

