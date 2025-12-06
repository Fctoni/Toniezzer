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

## ⚡ EDGE FUNCTION

### **Function 7: generate-report**

**Arquivo:** `supabase/functions/generate-report/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsPDF } from 'https://esm.sh/jspdf@2'

serve(async (req) => {
  const { tipo, data_inicio, data_fim } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  if (tipo === 'financeiro') {
    // Buscar dados financeiros
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
    
    // Buscar orçamentos
    const { data: categorias } = await supabase
      .from('categorias')
      .select('*')
      .eq('ativo', true)
    
    // Calcular métricas
    const total_gasto = gastos?.reduce((sum, g) => sum + Number(g.valor), 0) || 0
    const total_orcado = categorias?.reduce((sum, c) => sum + (Number(c.orcamento) || 0), 0) || 0
    
    // Gerar PDF
    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFontSize(20)
    doc.text('Relatório Financeiro - Toniezzer Manager', 20, 20)
    doc.setFontSize(10)
    doc.text(`Período: ${data_inicio} a ${data_fim}`, 20, 30)
    
    // Resumo
    doc.setFontSize(14)
    doc.text('Resumo Executivo', 20, 45)
    doc.setFontSize(10)
    doc.text(`Total Orçado: R$ ${total_orcado.toLocaleString('pt-BR')}`, 20, 55)
    doc.text(`Total Gasto: R$ ${total_gasto.toLocaleString('pt-BR')}`, 20, 62)
    doc.text(`Saldo: R$ ${(total_orcado - total_gasto).toLocaleString('pt-BR')}`, 20, 69)
    doc.text(`Percentual Executado: ${((total_gasto / total_orcado) * 100).toFixed(1)}%`, 20, 76)
    
    // Por Categoria
    doc.setFontSize(14)
    doc.text('Por Categoria', 20, 90)
    doc.setFontSize(8)
    
    let y = 100
    for (const cat of categorias || []) {
      const gastos_cat = gastos?.filter(g => g.categoria_id === cat.id) || []
      const total_cat = gastos_cat.reduce((sum, g) => sum + Number(g.valor), 0)
      const perc = cat.orcamento ? (total_cat / cat.orcamento) * 100 : 0
      
      doc.text(`${cat.nome}: R$ ${total_cat.toLocaleString('pt-BR')} / R$ ${(cat.orcamento || 0).toLocaleString('pt-BR')} (${perc.toFixed(0)}%)`, 20, y)
      y += 7
      
      if (y > 270) {
        doc.addPage()
        y = 20
      }
    }
    
    // Salvar PDF
    const pdfBuffer = doc.output('arraybuffer')
    
    // Upload para Storage
    const fileName = `relatorio-financeiro-${data_inicio}-${data_fim}.pdf`
    const { data: uploadData, error } = await supabase
      .storage
      .from('documentos-privados')
      .upload(`relatorios/${fileName}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })
    
    if (error) throw error
    
    // Retornar URL
    const { data: urlData } = supabase
      .storage
      .from('documentos-privados')
      .getPublicUrl(`relatorios/${fileName}`)
    
    return new Response(JSON.stringify({ 
      success: true, 
      url: urlData.publicUrl,
      total_gasto,
      total_orcado
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify({ error: 'Tipo de relatório não suportado' }), {
    status: 400
  })
})
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
- ✅ Edge Function generate-report funcionando
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

