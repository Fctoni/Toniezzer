FASE_04.md
# 🟢 FASE 4 - Qualidade e Relatórios

**Status:** ⏳ Aguardando FASE 1  
**Duração Estimada:** 1-2 meses  
**Prioridade:** MÉDIA

---

## 🎯 OBJETIVO DA FASE

Implementar controles de qualidade, relatórios automáticos e gestão de compras/materiais para garantir excelência na execução e análise de dados.

---

## 📦 ENTREGAS

### ✅ **Funcionalidade #7 - Checklist de Qualidade por Etapa**
- Templates de inspeção configuráveis
- Fotos obrigatórias
- Aprovação/reprovação de etapas
- Histórico de não conformidades

### ✅ **Funcionalidade #9 - Relatórios Automáticos**
- Relatórios semanais em PDF
- Gráficos de evolução
- Exportação CSV
- Envio automático por email (opcional)

### ✅ **Funcionalidade #10 - Gestão de Compras/Materiais**
- Lista de materiais por etapa
- Comparativo de fornecedores (3 orçamentos)
- Controle de estoque básico
- Status: comprado, aguardando, entregue

---

## 🔗 DEPENDÊNCIAS

### **Requer de FASE 1:**
- ✅ Tabela `etapas` (para vincular checklists)
- ✅ Tabela `gastos` (para relatórios financeiros)
- ✅ Tabela `fornecedores` (para comparativos)
- ✅ Sistema de documentos (para fotos de qualidade)

### **Recomendado de FASE 2:**
- ✅ Notificações (para avisar sobre reprovações)

---

## 🗄️ BANCO DE DADOS - TABELAS A CRIAR

### **Migration 010: Qualidade e Materiais**

```sql
-- Tabela checklists_qualidade
CREATE TABLE checklists_qualidade (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  etapa_id uuid NOT NULL REFERENCES etapas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  itens jsonb NOT NULL, -- [{descricao, tipo, obrigatorio, valor_esperado}]
  preenchido_por uuid REFERENCES users(id),
  preenchido_em timestamptz,
  resultados jsonb, -- [{item_id, conforme, obs, foto_url}]
  aprovado boolean,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_checklists_etapa ON checklists_qualidade(etapa_id);
CREATE INDEX idx_checklists_preenchido_por ON checklists_qualidade(preenchido_por);

ALTER TABLE checklists_qualidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklists_select_all" ON checklists_qualidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "checklists_insert_admin" ON checklists_qualidade FOR INSERT TO authenticated WITH CHECK (
  (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra', 'arquiteto')
);

-- Tabela materiais
CREATE TABLE materiais (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  descricao text,
  unidade text NOT NULL, -- m², m³, kg, unidade, etc
  quantidade_necessaria decimal NOT NULL,
  quantidade_comprada decimal DEFAULT 0,
  quantidade_entregue decimal DEFAULT 0,
  etapa_id uuid REFERENCES etapas(id),
  status text NOT NULL CHECK (status IN ('pendente', 'orcamento', 'comprado', 'aguardando_entrega', 'entregue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_materiais_etapa ON materiais(etapa_id);
CREATE INDEX idx_materiais_status ON materiais(status);

ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materiais_select_all" ON materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "materiais_insert_admin" ON materiais FOR INSERT TO authenticated WITH CHECK (
  (SELECT perfil FROM users WHERE id = auth.uid()) IN ('admin_sistema', 'admin_obra')
);

-- Tabela orcamentos_materiais (comparativo de fornecedores)
CREATE TABLE orcamentos_materiais (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id uuid NOT NULL REFERENCES materiais(id) ON DELETE CASCADE,
  fornecedor_id uuid NOT NULL REFERENCES fornecedores(id),
  valor_unitario decimal NOT NULL,
  prazo_entrega_dias integer,
  observacoes text,
  selecionado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_orcamentos_material ON orcamentos_materiais(material_id);
ALTER TABLE orcamentos_materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orcamentos_select_all" ON orcamentos_materiais FOR SELECT TO authenticated USING (true);
```

---

## 🌐 API SERVER (NODE)

### **API 7: generate-report (server runtime)**

**Arquivo sugerido:** `app/api/reports/route.ts` (Next.js server)

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'

export async function POST(req: Request) {
  const { tipo, data_inicio, data_fim } = await req.json()

  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  )

  if (tipo !== 'financeiro') {
    return NextResponse.json({ error: 'Tipo de relatório não suportado' }, { status: 400 })
  }

  const { data: gastos } = await supabase
    .from('gastos')
    .select(`
      *,
      categoria:categorias(nome, cor),
      fornecedor:fornecedores(nome)
    `)
    .gte('data', data_inicio)
    .lte('data', data_fim)
    .eq('status', 'aprovado')
    .order('data', { ascending: true })

  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .eq('ativo', true)

  const total_gasto = gastos?.reduce((sum, g) => sum + Number(g.valor), 0) || 0
  const total_orcado = categorias?.reduce((sum, c) => sum + (Number(c.orcamento) || 0), 0) || 0

  const doc = new jsPDF()
  doc.setFontSize(20)
  doc.text('Relatório Financeiro - Toniezzer Manager', 20, 20)
  doc.setFontSize(10)
  doc.text(`Período: ${data_inicio} a ${data_fim}`, 20, 30)
  // ... restante igual ao PRD (resumo, por categoria, paginação) ...

  const pdfBuffer = doc.output('arraybuffer')
  const fileName = `relatorio-financeiro-${data_inicio}-${data_fim}.pdf`

  const { error } = await supabase.storage
    .from('documentos-privados')
    .upload(`relatorios/${fileName}`, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    })
  if (error) throw error

  const { data: urlData } = supabase
    .storage
    .from('documentos-privados')
    .getPublicUrl(`relatorios/${fileName}`)

  return NextResponse.json({ 
    success: true, 
    url: urlData.publicUrl,
    total_gasto,
    total_orcado
  })
}
```

---

## 📱 COMPONENTES FRONTEND

### **Rotas a Criar:**

```
app/(dashboard)/
├── qualidade/
│   ├── page.tsx             # Lista de checklists
│   └── [etapa_id]/page.tsx  # Preencher checklist
├── relatorios/
│   ├── page.tsx             # Lista de relatórios
│   └── [tipo]/page.tsx      # Configurar e gerar
└── compras/
    ├── page.tsx             # Lista de materiais
    ├── novo/page.tsx        # Adicionar material
    └── [id]/page.tsx        # Comparativo fornecedores
```

---

## ✅ CHECKLIST DE TESTES MANUAIS

### **Checklists de Qualidade**
- [ ] Criar template de checklist para etapa
- [ ] Preencher checklist (com fotos obrigatórias)
- [ ] Aprovar etapa via checklist (status → concluída)
- [ ] Reprovar etapa (status → em_retrabalho)
- [ ] Ver histórico de checklists de uma etapa

### **Relatórios**
- [ ] Gerar relatório financeiro (período específico)
- [ ] Verificar PDF gerado
- [ ] Exportar dados em CSV
- [ ] Gerar relatório de progresso de etapas

### **Materiais**
- [ ] Adicionar material à lista
- [ ] Solicitar 3 orçamentos de fornecedores
- [ ] Comparar orçamentos
- [ ] Selecionar fornecedor
- [ ] Marcar como comprado/entregue
- [ ] Ver status de materiais por etapa

---

## 🎯 CRITÉRIOS DE CONCLUSÃO

- ✅ Migration 010 executada
- ✅ API server generate-report funcionando
- ✅ Todos testes manuais passando
- ✅ Deploy em produção
- ✅ Aprovação do proprietário

---

## 📚 REFERÊNCIAS

- **PRD:** Seções específicas de Qualidade e Relatórios
- **FASE anterior:** [FASE_03.md](./FASE_03.md)
- **Próxima FASE:** [FASE_05.md](./FASE_05.md)

---

## ➡️ PRÓXIMA FASE

Após concluir FASE 4 → **[FASE_05.md](./FASE_05.md)** (Avançado)

---

**Criado em:** 06/12/2024  
**Autor:** Claude (Anthropic)

