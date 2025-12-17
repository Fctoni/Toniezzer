# MINI-PLANO: Migração de Orçamento (Categorias → Etapas + Detalhamento)

**Data:** 17/12/2024  
**Objetivo:** Implementar orçamento por etapa com detalhamento opcional por categoria (Opção 2 Completa)

---

## 📊 1. ESTADO ATUAL

### Banco de Dados
```sql
-- ATUAL (errado para gestão de obras)
categorias {
  orcamento DECIMAL  ← Campo a ser depreciado
}

-- ALVO (correto - 2 níveis)
etapas {
  orcamento DECIMAL  ← Nível 1: Orçamento total da etapa
}

orcamento_detalhado {  ← Nível 2: Detalhamento opcional
  etapa_id UUID
  categoria_id UUID
  valor_previsto DECIMAL
  -- Ex: Fundação + Materiais = R$ 30.000
}
```

### Páginas Existentes
- ✅ `/financeiro/orcamento` → Edita `categorias.orcamento`
- ✅ `/financeiro` → Mostra gastos vs orçamento por categoria
- ✅ `/dashboard` → Cards com orçamento total por categoria

### Componentes
- `OrcamentoEditor` → Edita orçamento por categoria (precisa reescrever)

---

## 🎯 2. MUDANÇAS NECESSÁRIAS

### A) Banco de Dados (Migration)

**Migration 1: Adicionar campo em etapas**
```sql
ALTER TABLE etapas 
ADD COLUMN orcamento DECIMAL(15, 2) DEFAULT NULL;

CREATE INDEX idx_etapas_orcamento ON etapas(orcamento);
```

**Migration 2: Criar tabela de detalhamento**
```sql
CREATE TABLE orcamento_detalhado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etapa_id UUID NOT NULL REFERENCES etapas(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  valor_previsto DECIMAL(15, 2) NOT NULL CHECK (valor_previsto >= 0),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(etapa_id, categoria_id)  -- Não pode repetir combinação
);

CREATE INDEX idx_orcamento_detalhado_etapa ON orcamento_detalhado(etapa_id);
CREATE INDEX idx_orcamento_detalhado_categoria ON orcamento_detalhado(categoria_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_orcamento_detalhado_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orcamento_detalhado_updated_at
  BEFORE UPDATE ON orcamento_detalhado
  FOR EACH ROW
  EXECUTE FUNCTION update_orcamento_detalhado_updated_at();
```

**Regra de Negócio:**
- Soma de `orcamento_detalhado` de uma etapa DEVE = `etapas.orcamento`
- Se não houver detalhamento, usar apenas `etapas.orcamento`
- Validação na interface (não no banco)

### B) Types TypeScript
Atualizar `src/lib/types/database.ts`:
```typescript
etapas: {
  Row: {
    // ... campos existentes ...
    orcamento: number | null  // NOVO
  }
}

// NOVA TABELA
orcamento_detalhado: {
  Row: {
    id: string
    etapa_id: string
    categoria_id: string
    valor_previsto: number
    observacoes: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    etapa_id: string
    categoria_id: string
    valor_previsto: number
    observacoes?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    etapa_id?: string
    categoria_id?: string
    valor_previsto?: number
    observacoes?: string | null
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "orcamento_detalhado_etapa_id_fkey"
      columns: ["etapa_id"]
      referencedRelation: "etapas"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "orcamento_detalhado_categoria_id_fkey"
      columns: ["categoria_id"]
      referencedRelation: "categorias"
      referencedColumns: ["id"]
    }
  ]
}
```

### C) Páginas e Componentes

**1. Criar novos componentes:**

- `src/components/features/cronograma/orcamento-etapa-editor.tsx`
  - **Nível 1:** Lista etapas com orçamento total
  - Input para definir orçamento da etapa
  - Botão "Detalhar" para abrir modal de detalhamento
  - Mostra: Nome | Gasto | Orçamento | % Utilizado

- `src/components/features/cronograma/orcamento-detalhamento-dialog.tsx`
  - **Nível 2:** Modal para detalhar orçamento por categoria
  - Lista categorias da obra
  - Input de valor para cada categoria
  - Validação: soma = orçamento total da etapa
  - Salva em `orcamento_detalhado`
  - Botão "Limpar Detalhamento" (delete registros)

**2. Atualizar página:**
- `src/app/(dashboard)/financeiro/orcamento/page.tsx`
  - Trocar query: `categorias` → `etapas`
  - Calcular gastos por etapa (agregar por `etapa_relacionada_id`)
  - Usar novo componente `OrcamentoEtapaEditor`

**3. Atualizar Dashboard:**
- `src/app/(dashboard)/dashboard/page.tsx`
  - Card "Orçamento Total": somar `etapas.orcamento`
  - Card "Gasto Total": continua igual (soma todos gastos)

**4. Atualizar Financeiro:**
- `src/app/(dashboard)/financeiro/page.tsx`
  - Manter visualização por categoria (ainda útil)
  - Adicionar seção "Orçamento por Etapa" (nova)

**5. Atualizar Cronograma:**
- `src/app/(dashboard)/cronograma/page.tsx`
  - Adicionar coluna "Orçamento" na tabela de etapas
  - Adicionar coluna "Gasto" na tabela de etapas
  - Badge de alerta se gasto > orçamento

**6. Atualizar Matriz (Opcional - Melhoria):**
- `src/app/(dashboard)/financeiro/matriz-gastos/page.tsx`
  - Adicionar comparação: Total Etapa vs Orçamento Etapa
  - Badge na linha de totais: "Dentro" | "Alerta" | "Estourado"

---

## 🔄 3. ESTRATÉGIA DE MIGRAÇÃO DE DADOS

### Verificar Dados Existentes
```sql
-- Quantas categorias têm orçamento definido?
SELECT COUNT(*) FROM categorias WHERE orcamento IS NOT NULL;

-- Se houver dados, precisamos decidir o que fazer
```

### Opções de Migração

**Opção A: Não migrar (RECOMENDADA)**
- Orçamento por categoria não faz sentido → descartar
- Usuário recadastra orçamentos nas etapas
- Simples e limpo

**Opção B: Migrar tentando distribuir (complexo)**
- Pegar orçamento total das categorias
- Dividir proporcionalmente entre etapas
- Arriscado e impreciso

**DECISÃO: Opção A** - Não migrar, recadastrar

---

## 📝 4. ORDEM DE IMPLEMENTAÇÃO

### Etapa 1: Banco de Dados (5 min)
```sql
-- Migration: add_orcamento_etapas
ALTER TABLE etapas ADD COLUMN orcamento DECIMAL(15, 2) DEFAULT NULL;
CREATE INDEX idx_etapas_orcamento ON etapas(orcamento);
```

### Etapa 2: Types (5 min)
- [ ] Atualizar `database.ts` (adicionar campo orcamento em etapas)
- [ ] Regenerar types se necessário

### Etapa 3: Novos Componentes (60 min)

**3A. Componente Principal (30 min)**
- [ ] Criar `orcamento-etapa-editor.tsx`
  - Lista etapas ordenadas por `ordem`
  - Calcula gasto por etapa (soma gastos com `etapa_relacionada_id`)
  - Input para definir orçamento total
  - Botão "Detalhar" (abre modal)
  - Indicador se tem detalhamento: 📊 ou -
  - Progress bar (gasto / orçamento)
  - Badge de alerta se > 80%

**3B. Modal de Detalhamento (30 min)**
- [ ] Criar `orcamento-detalhamento-dialog.tsx`
  - Props: etapaId, etapaNome, orcamentoTotal
  - Buscar detalhamento existente (se houver)
  - Lista categorias ativas
  - Input valor para cada categoria
  - Cálculo em tempo real: soma parcial
  - Validação: soma = orcamentoTotal (erro se diferente)
  - Botão "Salvar Detalhamento"
  - Botão "Limpar Detalhamento" (remove todos registros)
  - Toast de sucesso/erro

### Etapa 4: Página Orçamento (20 min)
- [ ] Atualizar `/financeiro/orcamento/page.tsx`
  - Query etapas ao invés de categorias
  - Calcular gastos por etapa
  - Usar novo componente
  - Atualizar título: "Orçamento por Etapa"

### Etapa 5: Dashboard (15 min)
- [ ] Atualizar `/dashboard/page.tsx`
  - Card "Orçamento Total": somar `etapas.orcamento`
  - Verificar se há quebras

### Etapa 6: Cronograma (20 min)
- [ ] Adicionar colunas na tabela de etapas:
  - "Orçamento"
  - "Gasto Realizado"
  - "% Utilizado"
- [ ] Badge de alerta

### Etapa 7: Financeiro (15 min)
- [ ] Página `/financeiro/page.tsx`
  - Manter gráfico por categoria (análise)
  - Adicionar card/seção "Orçamento por Etapa"

### Etapa 8: Matriz - Comparação com Orçamento (20 min)
- [ ] Na linha de totais por etapa, adicionar:
  - Orçamento previsto (buscar de `etapas.orcamento`)
  - Delta: Realizado - Previsto
  - Badge: "No prazo" / "Alerta" / "Estourado"
- [ ] Se houver detalhamento (`orcamento_detalhado`):
  - Comparar cada célula (categoria × etapa) com previsão
  - Highlight célula: verde (ok), amarelo (alerta), vermelho (estouro)

### Etapa 9: API Route para Detalhamento (15 min)
- [ ] Criar `/api/orcamento/detalhamento/route.ts`
  - GET: Buscar detalhamento de uma etapa
  - POST: Salvar/atualizar detalhamento
  - DELETE: Limpar detalhamento de uma etapa

### Etapa 10: Cleanup (10 min)
- [ ] Adicionar comentário deprecation em `categorias.orcamento`
- [ ] Atualizar documentação
- [ ] Criar migration SQL em arquivo separado

---

## ⚠️ 5. PONTOS DE ATENÇÃO

### Dados sem Etapa
- Gastos com `etapa_relacionada_id = NULL` não serão computados no orçamento
- **Solução:** Criar etapa "Geral" ou "Custos Indiretos" para receber esses gastos

### Compatibilidade
- NÃO deletar `categorias.orcamento` (pode ter código legado)
- Apenas depreciar e parar de usar

### Notificações
- Sistema tem notificações `orcamento_80` e `orcamento_100`
- **Atualizar triggers** para verificar `etapas.orcamento` ao invés de `categorias.orcamento`

---

## 📋 6. CHECKLIST DE VALIDAÇÃO

### Banco de Dados
- [ ] Campo `orcamento` adicionado em `etapas`
- [ ] Índice criado
- [ ] Types TypeScript atualizados

### Interface
- [ ] Página Orçamento edita etapas (não categorias)
- [ ] Dashboard mostra orçamento total de etapas
- [ ] Cronograma mostra orçamento e gasto por etapa
- [ ] Matriz (opcional) mostra comparação

### Funcionalidades
- [ ] Calcular gasto por etapa funciona
- [ ] Salvar orçamento da etapa funciona
- [ ] Progress bars corretos
- [ ] Alertas (80%, 100%) funcionam

### Limpeza
- [ ] 0 erros de linter
- [ ] Comentários de deprecation adicionados
- [ ] Documentação atualizada

---

## ⏱️ 7. ESTIMATIVA DE TEMPO

| Etapa | Tempo |
|-------|-------|
| 1. Migrations SQL (2 tabelas) | 10 min |
| 2. Types | 10 min |
| 3A. Componente Principal | 30 min |
| 3B. Modal Detalhamento | 30 min |
| 4. Página Orçamento | 20 min |
| 5. Dashboard | 15 min |
| 6. Cronograma | 20 min |
| 7. Financeiro | 15 min |
| 8. Matriz (comparações) | 20 min |
| 9. API Route | 15 min |
| 10. Cleanup | 10 min |
| **TOTAL** | **~3h** |

---

## 🎯 8. RESULTADO ESPERADO

### Antes (Errado)
```
Orçamento:
├─ Materiais: R$ 200.000
├─ Mão de obra: R$ 150.000
└─ Equipamentos: R$ 50.000
```

### Depois (Correto - 2 Níveis)

**Nível 1: Orçamento por Etapa (Simples)**
```
Orçamento:
├─ Fundação: R$ 50.000 (R$ 45k gasto - 90%)
├─ Alvenaria: R$ 120.000 (R$ 80k gasto - 67%)
├─ Instalações: R$ 80.000 (R$ 30k gasto - 38%)
└─ Acabamento: R$ 100.000 (R$ 0 gasto - 0%)
```

**Nível 2: Detalhamento por Categoria (Opcional)**
```
Fundação: R$ 50.000
  ├─ Materiais: R$ 30.000 (R$ 28k gasto) ← Detalhado
  ├─ Mão de obra: R$ 15.000 (R$ 14k gasto)
  └─ Equipamentos: R$ 5.000 (R$ 3k gasto)

Alvenaria: R$ 120.000
  ├─ Materiais: R$ 80.000
  └─ Mão de obra: R$ 40.000
  
Instalações: R$ 80.000 (sem detalhamento) ← OK também
```

---

## ✅ 9. APROVAÇÃO

**Status:** ⏳ Aguardando aprovação para iniciar implementação

**Decisões Tomadas:**
1. ✅ Orçamento por Etapa (principal) + Detalhamento opcional por Categoria
2. ✅ Não migrar dados de `categorias.orcamento` (recadastrar)
3. ✅ Criar etapa "Geral/Custos Indiretos" para gastos sem etapa
4. ✅ Implementar melhorias na Matriz (comparação previsto vs realizado)

**Próxima Ação:** Aguardando comando para iniciar implementação

---

**Criado por:** AI Assistant  
**Baseado em:** Feedback do usuário sobre orçamento  
**Versão:** 2.0 (Opção 2 Completa - Orçamento + Detalhamento)

