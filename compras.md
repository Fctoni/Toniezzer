# 📦 Módulo de Compras - Especificação de Implementação

**Versão:** 1.0  
**Data:** 08/12/2024  
**Status:** Aprovado para implementação

---

## 📋 Resumo Executivo

O módulo de Compras centraliza todas as transações/aquisições da obra, separando o conceito de **"Compra"** (a transação como um todo, com NF) do conceito de **"Gasto/Lançamento"** (as parcelas individuais que afetam o fluxo de caixa).

### Problema Atual
- Uma compra parcelada gera N lançamentos separados
- Não há forma de visualizar a compra como um todo
- A NF fica dispersa ou replicada nos lançamentos
- Difícil rastrear histórico por fornecedor/transação

### Solução
- Nova tabela `compras` como "pai" dos lançamentos
- Todo gasto passa pelo módulo de compras
- NF centralizada na compra, com backlink nos lançamentos
- Menu dedicado para gestão de compras

---

## 🗄️ Modelo de Dados

### Nova Tabela: `compras`

```sql
CREATE TABLE compras (
  -- Identificação
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informações da Compra
  descricao             TEXT NOT NULL,
  valor_total           DECIMAL NOT NULL CHECK (valor_total > 0),
  data_compra           DATE NOT NULL,
  
  -- Relacionamentos (obrigatórios)
  fornecedor_id         UUID NOT NULL REFERENCES fornecedores(id),
  categoria_id          UUID NOT NULL REFERENCES categorias(id),
  
  -- Relacionamentos (opcionais)
  subcategoria_id       UUID REFERENCES subcategorias(id),
  etapa_relacionada_id  UUID REFERENCES etapas(id),
  centro_custo_id       UUID REFERENCES centros_custo(id),
  
  -- Pagamento
  forma_pagamento       TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'boleto', 'cheque')),
  parcelas              INTEGER NOT NULL DEFAULT 1 CHECK (parcelas >= 1),
  data_primeira_parcela DATE NOT NULL,
  
  -- Nota Fiscal / Documento
  nota_fiscal_url       TEXT,
  nota_fiscal_numero    TEXT,
  
  -- Status e Controle
  status                TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'quitada', 'cancelada')),
  valor_pago            DECIMAL DEFAULT 0,
  parcelas_pagas        INTEGER DEFAULT 0,
  
  -- Observações
  observacoes           TEXT,
  
  -- Auditoria
  criado_por            UUID REFERENCES users(id),
  criado_via            TEXT NOT NULL DEFAULT 'manual' CHECK (criado_via IN ('manual', 'email', 'ocr', 'plaud')),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_compras_fornecedor ON compras(fornecedor_id);
CREATE INDEX idx_compras_categoria ON compras(categoria_id);
CREATE INDEX idx_compras_etapa ON compras(etapa_relacionada_id);
CREATE INDEX idx_compras_status ON compras(status);
CREATE INDEX idx_compras_data ON compras(data_compra DESC);
CREATE INDEX idx_compras_created_at ON compras(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_compras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_compras_updated_at
  BEFORE UPDATE ON compras
  FOR EACH ROW
  EXECUTE FUNCTION update_compras_updated_at();
```

### Alteração na Tabela `gastos`

```sql
-- Adicionar relacionamento com compras
ALTER TABLE gastos ADD COLUMN compra_id UUID REFERENCES compras(id) ON DELETE CASCADE;

-- Adicionar campo para status de pagamento do lançamento
ALTER TABLE gastos ADD COLUMN pago BOOLEAN DEFAULT false;
ALTER TABLE gastos ADD COLUMN pago_em DATE;

-- Índice para consultas por compra
CREATE INDEX idx_gastos_compra ON gastos(compra_id);
CREATE INDEX idx_gastos_pago ON gastos(pago);

-- Trigger para atualizar status da compra quando gasto é marcado como pago
CREATE OR REPLACE FUNCTION update_compra_status()
RETURNS TRIGGER AS $$
DECLARE
  v_compra_id UUID;
  v_total_parcelas INTEGER;
  v_parcelas_pagas INTEGER;
  v_valor_pago DECIMAL;
BEGIN
  -- Pegar compra_id (do NEW ou OLD dependendo da operação)
  v_compra_id := COALESCE(NEW.compra_id, OLD.compra_id);
  
  IF v_compra_id IS NOT NULL THEN
    -- Calcular totais
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE pago = true),
      COALESCE(SUM(valor) FILTER (WHERE pago = true), 0)
    INTO v_total_parcelas, v_parcelas_pagas, v_valor_pago
    FROM gastos
    WHERE compra_id = v_compra_id;
    
    -- Atualizar compra
    UPDATE compras
    SET 
      parcelas_pagas = v_parcelas_pagas,
      valor_pago = v_valor_pago,
      status = CASE 
        WHEN v_parcelas_pagas >= v_total_parcelas THEN 'quitada'
        ELSE 'ativa'
      END,
      updated_at = now()
    WHERE id = v_compra_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compra_status
  AFTER INSERT OR UPDATE OF pago OR DELETE ON gastos
  FOR EACH ROW
  EXECUTE FUNCTION update_compra_status();
```

---

## 🔄 Fluxo de Criação de Compra

### Diagrama

```
┌─────────────────────────────────────────────────────────────┐
│  Usuário preenche formulário de Nova Compra                 │
│  - Descrição, Valor Total, Data da Compra                   │
│  - Fornecedor (obrigatório)                                 │
│  - Categoria (obrigatório)                                  │
│  - Forma de Pagamento, Parcelas                             │
│  - Data da 1ª Parcela                                       │
│  - Upload de NF (opcional)                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Sistema calcula e exibe preview das parcelas               │
│  - Parcela 1: R$ X.XXX - DD/MM/YYYY                        │
│  - Parcela 2: R$ X.XXX - DD/MM/YYYY                        │
│  - ...                                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Ao confirmar:                                              │
│  1. Cria registro em `compras`                              │
│  2. Para cada parcela, cria registro em `gastos`:           │
│     - compra_id = ID da compra                              │
│     - valor = valor_total / parcelas                        │
│     - data = data calculada                                 │
│     - parcela_atual = 1, 2, 3...                           │
│     - parcelas = total                                      │
│     - Herda: fornecedor, categoria, etapa, etc.            │
│     - status = 'aprovado'                                   │
│     - pago = false                                          │
└─────────────────────────────────────────────────────────────┘
```

### Lógica de Cálculo de Parcelas

```typescript
function calcularParcelas(
  valorTotal: number,
  numeroParcelas: number,
  dataPrimeiraParcela: Date
): Array<{ valor: number; data: Date; parcela: number }> {
  const parcelas = [];
  const valorParcela = valorTotal / numeroParcelas;
  
  // Arredondar para 2 casas decimais
  const valorArredondado = Math.floor(valorParcela * 100) / 100;
  
  // A última parcela absorve a diferença de arredondamento
  const diferencaArredondamento = valorTotal - (valorArredondado * numeroParcelas);
  
  for (let i = 0; i < numeroParcelas; i++) {
    const dataParcela = new Date(dataPrimeiraParcela);
    dataParcela.setMonth(dataParcela.getMonth() + i);
    
    parcelas.push({
      valor: i === numeroParcelas - 1 
        ? valorArredondado + diferencaArredondamento 
        : valorArredondado,
      data: dataParcela,
      parcela: i + 1
    });
  }
  
  return parcelas;
}
```

---

## 📁 Estrutura de Arquivos

### Novos Arquivos a Criar

```
toniezzer-manager/
├── src/
│   ├── app/
│   │   └── (dashboard)/
│   │       └── compras/                      # NOVO
│   │           ├── page.tsx                  # Lista de compras
│   │           ├── nova/
│   │           │   └── page.tsx              # Formulário nova compra
│   │           └── [id]/
│   │               └── page.tsx              # Detalhes da compra
│   │
│   └── components/
│       └── features/
│           └── compras/                      # NOVO
│               ├── compra-card.tsx           # Card de compra na lista
│               ├── compra-form.tsx           # Formulário de criação
│               ├── compra-detalhes.tsx       # Visualização detalhada
│               ├── parcelas-preview.tsx      # Preview das parcelas
│               └── parcelas-table.tsx        # Tabela de parcelas
```

### Arquivos a Modificar

```
toniezzer-manager/
├── src/
│   ├── components/
│   │   └── layout/
│   │       └── sidebar.tsx                   # Adicionar menu Compras
│   │
│   └── lib/
│       └── types/
│           └── database.ts                   # Adicionar tipo Compra
```

---

## 🖥️ Interfaces de Usuário

### 1. Lista de Compras (`/compras`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  📦 Compras                                         [+ Nova Compra]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Filtros:                                                            │
│  [📅 Período ▼] [👤 Fornecedor ▼] [📁 Categoria ▼] [📊 Status ▼]    │
│                                                                      │
│  ────────────────────────────────────────────────────────────────── │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📦 Porcelanato Portinari 60x60                    15/12/2024  │ │
│  │    👤 Casa dos Pisos • 📁 Revestimentos                        │ │
│  │    💰 R$ 15.000,00 (10x de R$ 1.500)                          │ │
│  │    ████████░░░░ 80% • 8/10 parcelas pagas          📄 NF 12345 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📦 Cimento CP-II 50kg (100 sacos)                 10/12/2024  │ │
│  │    👤 Cimento ABC • 📁 Fundação                                │ │
│  │    💰 R$ 5.000,00 (à vista)                                   │ │
│  │    ████████████ 100% • Quitada ✅                  📄 NF 54321 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📦 Mão de obra - Fundação                         05/12/2024  │ │
│  │    👤 João Pedreiro • 📁 Mão de Obra                           │ │
│  │    💰 R$ 8.000,00 (2x de R$ 4.000)                            │ │
│  │    ██████░░░░░░ 50% • 1/2 parcelas pagas                      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ────────────────────────────────────────────────────────────────── │
│  Mostrando 3 compras • Total: R$ 28.000,00                          │
└──────────────────────────────────────────────────────────────────────┘
```

### 2. Nova Compra (`/compras/nova`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Voltar                          Nova Compra                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Informações da Compra                                           ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │                                                                 ││
│  │  Descrição *                                                    ││
│  │  ┌─────────────────────────────────────────────────────────┐   ││
│  │  │ Ex: Porcelanato Portinari 60x60 (50 caixas)            │   ││
│  │  └─────────────────────────────────────────────────────────┘   ││
│  │                                                                 ││
│  │  ┌────────────────────────┐  ┌────────────────────────┐        ││
│  │  │ Valor Total *          │  │ Data da Compra *       │        ││
│  │  │ R$ [___________]       │  │ [📅 __/__/____]        │        ││
│  │  └────────────────────────┘  └────────────────────────┘        ││
│  │                                                                 ││
│  │  ┌────────────────────────┐  ┌────────────────────────┐        ││
│  │  │ Fornecedor *           │  │ Categoria *            │        ││
│  │  │ [▼ Selecione...] [+]   │  │ [▼ Selecione...]       │        ││
│  │  └────────────────────────┘  └────────────────────────┘        ││
│  │                                                                 ││
│  │  Etapa Relacionada (opcional)                                   ││
│  │  ┌─────────────────────────────────────────────────────────┐   ││
│  │  │ [▼ Selecione...]                                        │   ││
│  │  └─────────────────────────────────────────────────────────┘   ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Pagamento                                                       ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │                                                                 ││
│  │  ┌────────────────────────┐  ┌────────────────────────┐        ││
│  │  │ Forma de Pagamento *   │  │ Parcelas *             │        ││
│  │  │ [▼ PIX]                │  │ [▼ 10x]                │        ││
│  │  └────────────────────────┘  └────────────────────────┘        ││
│  │                                                                 ││
│  │  Data da 1ª Parcela *                                           ││
│  │  ┌─────────────────────────────────────────────────────────┐   ││
│  │  │ [📅 15/01/2025]                                         │   ││
│  │  └─────────────────────────────────────────────────────────┘   ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Preview das Parcelas                                            ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │                                                                 ││
│  │  │ Parcela │ Vencimento  │ Valor       │                       ││
│  │  ├─────────┼─────────────┼─────────────┤                       ││
│  │  │ 1/10    │ 15/01/2025  │ R$ 1.500,00 │                       ││
│  │  │ 2/10    │ 15/02/2025  │ R$ 1.500,00 │                       ││
│  │  │ 3/10    │ 15/03/2025  │ R$ 1.500,00 │                       ││
│  │  │ ...     │ ...         │ ...         │                       ││
│  │  │ 10/10   │ 15/10/2025  │ R$ 1.500,00 │                       ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Nota Fiscal                                                     ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │                                                                 ││
│  │  ┌─────────────────────────────────────────────────────────┐   ││
│  │  │                                                         │   ││
│  │  │     📎 Arraste o arquivo ou clique para selecionar     │   ││
│  │  │        PDF, PNG, JPG (máx 10MB)                        │   ││
│  │  │                                                         │   ││
│  │  └─────────────────────────────────────────────────────────┘   ││
│  │                                                                 ││
│  │  Número da NF                                                   ││
│  │  ┌─────────────────────────────────────────────────────────┐   ││
│  │  │ [_______________]                                       │   ││
│  │  └─────────────────────────────────────────────────────────┘   ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Observações                                                     ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │  ┌─────────────────────────────────────────────────────────┐   ││
│  │  │                                                         │   ││
│  │  │                                                         │   ││
│  │  └─────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ────────────────────────────────────────────────────────────────── │
│                                                                      │
│  [Cancelar]                              [Criar Compra e Parcelas]   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 3. Detalhes da Compra (`/compras/[id]`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Voltar para Compras                                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📦 Porcelanato Portinari 60x60                                     │
│  ══════════════════════════════════════════════════════════════════ │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐ │
│  │ 💰 Valor Total      │  │ 📊 Status           │  │ 📅 Compra    │ │
│  │ R$ 15.000,00        │  │ ████████░░ 80%      │  │ 15/12/2024   │ │
│  │ 10x R$ 1.500        │  │ 8/10 pagas          │  │              │ │
│  └─────────────────────┘  └─────────────────────┘  └──────────────┘ │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐ │
│  │ 👤 Fornecedor       │  │ 📁 Categoria        │  │ 🏗️ Etapa     │ │
│  │ Casa dos Pisos      │  │ Revestimentos       │  │ Acabamento   │ │
│  │ CNPJ: 12.345.678/01 │  │                     │  │              │ │
│  └─────────────────────┘  └─────────────────────┘  └──────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📄 Nota Fiscal: #12345                                         │ │
│  │    NF_12345_portinari.pdf                      [📥 Download]   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ══════════════════════════════════════════════════════════════════ │
│  💳 Parcelas                                                        │
│  ══════════════════════════════════════════════════════════════════ │
│                                                                      │
│  │ #  │ Vencimento  │ Valor       │ Status      │ Pago em    │ Ação││
│  ├────┼─────────────┼─────────────┼─────────────┼────────────┼─────┤│
│  │ 1  │ 15/01/2025  │ R$ 1.500,00 │ ✅ Pago     │ 14/01/2025 │     ││
│  │ 2  │ 15/02/2025  │ R$ 1.500,00 │ ✅ Pago     │ 15/02/2025 │     ││
│  │ 3  │ 15/03/2025  │ R$ 1.500,00 │ ✅ Pago     │ 15/03/2025 │     ││
│  │ 4  │ 15/04/2025  │ R$ 1.500,00 │ ✅ Pago     │ 14/04/2025 │     ││
│  │ 5  │ 15/05/2025  │ R$ 1.500,00 │ ✅ Pago     │ 15/05/2025 │     ││
│  │ 6  │ 15/06/2025  │ R$ 1.500,00 │ ✅ Pago     │ 14/06/2025 │     ││
│  │ 7  │ 15/07/2025  │ R$ 1.500,00 │ ✅ Pago     │ 15/07/2025 │     ││
│  │ 8  │ 15/08/2025  │ R$ 1.500,00 │ ✅ Pago     │ 14/08/2025 │     ││
│  │ 9  │ 15/09/2025  │ R$ 1.500,00 │ ⏳ Pendente │            │[💰] ││
│  │ 10 │ 15/10/2025  │ R$ 1.500,00 │ ⏳ Pendente │            │[💰] ││
│                                                                      │
│  ══════════════════════════════════════════════════════════════════ │
│                                                                      │
│  [✏️ Editar Compra]  [🗑️ Cancelar Compra]                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 4. Backlink no Lançamento (em `/financeiro/lancamentos`)

Na tabela de lançamentos, adicionar coluna "Origem":

```
│ Data       │ Descrição                    │ Origem                  │ Valor      │ Status │
├────────────┼──────────────────────────────┼─────────────────────────┼────────────┼────────┤
│ 15/01/2025 │ Porcelanato Portinari (1/10) │ 📦 Ver Compra           │ R$ 1.500   │ ✅ Pago │
│ 15/02/2025 │ Porcelanato Portinari (2/10) │ 📦 Ver Compra           │ R$ 1.500   │ ✅ Pago │
```

E nos detalhes do lançamento:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Lançamento #247                                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📦 Origem: Porcelanato Portinari 60x60          [🔗 Ver Compra] │ │
│  │    Parcela 3 de 10 • NF: #12345                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Valor: R$ 1.500,00                                                 │
│  Vencimento: 15/03/2025                                             │
│  Status: ✅ Pago em 15/03/2025                                       │
│  ...                                                                │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementação Técnica

### Ordem de Implementação

1. **Banco de Dados**
   - [ ] Criar tabela `compras` via SQL/MCP
   - [ ] Adicionar `compra_id` na tabela `gastos`
   - [ ] Adicionar campos `pago` e `pago_em` em `gastos`
   - [ ] Criar triggers de atualização automática

2. **Types TypeScript**
   - [ ] Atualizar `database.ts` com tipo `Compra`
   - [ ] Adicionar novos campos em `Gasto`

3. **Componentes**
   - [ ] Criar `compra-card.tsx`
   - [ ] Criar `compra-form.tsx`
   - [ ] Criar `parcelas-preview.tsx`
   - [ ] Criar `parcelas-table.tsx`
   - [ ] Criar `compra-detalhes.tsx`

4. **Páginas**
   - [ ] Criar `/compras/page.tsx` (lista)
   - [ ] Criar `/compras/nova/page.tsx` (formulário)
   - [ ] Criar `/compras/[id]/page.tsx` (detalhes)

5. **Layout**
   - [ ] Atualizar sidebar com menu "Compras"

6. **Integração**
   - [ ] Atualizar `/financeiro/lancamentos` para mostrar backlink
   - [ ] Adaptar ou remover form de lançamento direto

---

## 📊 Queries Úteis

### Listar compras com status calculado

```sql
SELECT 
  c.*,
  f.nome as fornecedor_nome,
  cat.nome as categoria_nome,
  cat.cor as categoria_cor,
  e.nome as etapa_nome,
  COUNT(g.id) as total_parcelas,
  COUNT(g.id) FILTER (WHERE g.pago = true) as parcelas_pagas,
  COALESCE(SUM(g.valor) FILTER (WHERE g.pago = true), 0) as valor_pago
FROM compras c
LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
LEFT JOIN categorias cat ON c.categoria_id = cat.id
LEFT JOIN etapas e ON c.etapa_relacionada_id = e.id
LEFT JOIN gastos g ON g.compra_id = c.id
GROUP BY c.id, f.nome, cat.nome, cat.cor, e.nome
ORDER BY c.created_at DESC;
```

### Dashboard - Resumo de compras

```sql
SELECT 
  COUNT(*) as total_compras,
  COUNT(*) FILTER (WHERE status = 'ativa') as compras_ativas,
  COUNT(*) FILTER (WHERE status = 'quitada') as compras_quitadas,
  SUM(valor_total) as valor_total_compras,
  SUM(valor_pago) as valor_total_pago,
  SUM(valor_total) - SUM(valor_pago) as valor_a_pagar
FROM compras
WHERE status != 'cancelada';
```

### Próximas parcelas a vencer

```sql
SELECT 
  g.*,
  c.descricao as compra_descricao,
  c.nota_fiscal_numero,
  f.nome as fornecedor_nome
FROM gastos g
JOIN compras c ON g.compra_id = c.id
JOIN fornecedores f ON c.fornecedor_id = f.id
WHERE g.pago = false
  AND g.data >= CURRENT_DATE
ORDER BY g.data ASC
LIMIT 10;
```

---

## ⚠️ Considerações Importantes

### Sobre Gastos "Avulsos"

Com esta implementação, **todo gasto passa pelo módulo de compras**. Isso significa:

1. O formulário atual de `/financeiro/lancamentos/novo` será:
   - **Opção A**: Removido (tudo passa por compras)
   - **Opção B**: Mantido apenas para edições/ajustes

2. Gastos criados via automação (email, OCR) serão:
   - Primeiro criados como `compra` (mesmo que 1 parcela)
   - Depois geram o `gasto` associado

### Sobre Status de Pagamento

- `gastos.pago` indica se a parcela foi paga
- `gastos.pago_em` registra a data do pagamento
- `compras.status` é atualizado automaticamente pelo trigger:
  - `ativa`: quando há parcelas pendentes
  - `quitada`: quando todas parcelas estão pagas
  - `cancelada`: manual pelo usuário

### Sobre a NF

- A NF fica armazenada apenas em `compras.nota_fiscal_url`
- Nos lançamentos, a NF é acessada via JOIN com a compra
- Ao visualizar um gasto, mostrar: "📄 NF: #12345 [Ver]"

---

## 🚀 Próximos Passos

1. ✅ Especificação aprovada (este documento)
2. ⬜ Limpar dados de teste existentes na tabela `gastos`
3. ⬜ Executar migrations no Supabase
4. ⬜ Implementar componentes e páginas
5. ⬜ Testar fluxo completo
6. ⬜ Atualizar documentação

---

**Fim da Especificação - Módulo de Compras**

