FASE_02.md
# 🟡 FASE 2 - Comunicação

**Status:** ⏳ Aguardando FASE 1  
**Duração Estimada:** 1-2 meses  
**Prioridade:** ALTA

---

## 🎯 OBJETIVO DA FASE

Implementar sistema completo de comunicação centralizada, gestão de fornecedores e alertas inteligentes para substituir WhatsApp e centralizar todas as informações.

---

## 📦 ENTREGAS

### ✅ **Funcionalidade #3 - Feed de Comunicação Centralizado**
- Feed tipo timeline (substitui WhatsApp)
- @menções com notificações
- Comentários em posts
- Filtros (por etapa, autor, tipo)
- Backlinks para gastos, etapas, reuniões

### ✅ **Funcionalidade #5 - Gestão de Fornecedores/Prestadores**
- Cadastro completo
- Sistema de avaliação (1-5 estrelas)
- Histórico de pagamentos por fornecedor
- Vincular fornecedor a gastos

### ✅ **Funcionalidade #8 - Alertas Inteligentes**
- Sistema de notificações in-app
- Badge de notificações não lidas
- Centro de notificações
- Tipos: orçamento, etapa, menção, etc

---

## 🔗 DEPENDÊNCIAS

### **Requer de FASE 1:**
- ✅ Tabela `users` (para @menções e autoria)
- ✅ Tabela `etapas` (para relacionar posts)
- ✅ Tabela `gastos` (para backlinks)
- ✅ Tabela `fornecedores` (já criada na FASE 1, expandir)
- ✅ Tabela `notificacoes` (já criada na FASE 1)
- ✅ Sistema de auth e permissões

---

## 🗄️ BANCO DE DADOS - TABELAS A CRIAR

### **Migration 008: Feed de Comunicação**

```sql
-- Tabela feed_comunicacao
CREATE TABLE feed_comunicacao (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo text NOT NULL CHECK (tipo IN ('post', 'decisao', 'alerta', 'sistema')),
  conteudo text NOT NULL,
  autor_id uuid NOT NULL REFERENCES users(id),
  etapa_relacionada_id uuid REFERENCES etapas(id),
  gasto_relacionado_id uuid REFERENCES gastos(id),
  reuniao_relacionada_id uuid REFERENCES reunioes(id),
  mencoes uuid[],
  anexos jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  editado boolean DEFAULT false
);

CREATE INDEX idx_feed_created_at ON feed_comunicacao(created_at DESC);
CREATE INDEX idx_feed_autor ON feed_comunicacao(autor_id);
CREATE INDEX idx_feed_etapa ON feed_comunicacao(etapa_relacionada_id);
CREATE INDEX idx_feed_mencoes ON feed_comunicacao USING GIN(mencoes);

ALTER TABLE feed_comunicacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_select_all" ON feed_comunicacao 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "feed_insert_authenticated" ON feed_comunicacao 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "feed_update_own" ON feed_comunicacao 
  FOR UPDATE TO authenticated 
  USING (autor_id = auth.uid() AND created_at > now() - interval '1 hour');

-- Tabela feed_comentarios
CREATE TABLE feed_comentarios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id uuid NOT NULL REFERENCES feed_comunicacao(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  autor_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  editado boolean DEFAULT false
);

CREATE INDEX idx_comentarios_feed ON feed_comentarios(feed_id);
CREATE INDEX idx_comentarios_created_at ON feed_comentarios(created_at);

ALTER TABLE feed_comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comentarios_select_all" ON feed_comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "comentarios_insert_authenticated" ON feed_comentarios FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger para notificar mencionados
CREATE OR REPLACE FUNCTION notify_mentions()
RETURNS trigger AS $$
DECLARE
  mentioned_user uuid;
BEGIN
  IF NEW.mencoes IS NOT NULL THEN
    FOREACH mentioned_user IN ARRAY NEW.mencoes
    LOOP
      INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link, origem_id)
      VALUES (
        mentioned_user,
        'mencao',
        'Você foi mencionado',
        (SELECT nome_completo FROM users WHERE id = NEW.autor_id) || ' mencionou você: ' || LEFT(NEW.conteudo, 100),
        '/comunicacao',
        NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_mentions
  AFTER INSERT ON feed_comunicacao
  FOR EACH ROW EXECUTE FUNCTION notify_mentions();
```

---

## 📱 COMPONENTES FRONTEND

### **Rotas a Criar:**

```
app/(dashboard)/
├── comunicacao/
│   └── page.tsx              # Feed principal
├── fornecedores/
│   ├── page.tsx             # Lista de fornecedores
│   ├── novo/page.tsx        # Cadastrar fornecedor
│   └── [id]/page.tsx        # Detalhes + avaliação
└── notificacoes/
    └── page.tsx             # Centro de notificações

components/features/
├── comunicacao/
│   ├── feed-item.tsx        # Card de post
│   ├── comentario.tsx       # Comentário
│   ├── mencoes-input.tsx    # Input com autocomplete @
│   └── filtros-feed.tsx     # Filtros
├── fornecedores/
│   ├── fornecedor-card.tsx
│   └── avaliacao-stars.tsx
└── layout/
    └── notificacoes-dropdown.tsx  # Badge + dropdown header
```

### **Componentes Chave:**

#### **1. Feed Item**
```typescript
interface FeedItemProps {
  post: {
    id: string
    tipo: 'post' | 'decisao' | 'alerta' | 'sistema'
    conteudo: string
    autor: User
    created_at: string
    mencoes?: string[]
    etapa_relacionada?: Etapa
    comentarios_count: number
  }
}
```

#### **2. Input de Menções**
- Textarea com autocomplete
- Detectar @ e mostrar lista de usuários
- Destacar menções no preview

#### **3. Badge de Notificações**
- Contador de não lidas
- Dropdown com últimas 5
- Link "Ver todas"

---

## ⚡ EDGE FUNCTION

### **Function 3: send-digest-notifications**

**Arquivo:** `supabase/functions/send-digest-notifications/index.ts`

Enviar resumo diário de notificações para usuários com muitas notificações não lidas.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Buscar usuários com >10 notificações não lidas
  const { data: users } = await supabase
    .from('users')
    .select('id, nome_completo, email')
    .eq('ativo', true)
  
  for (const user of users || []) {
    const { data: notifs, count } = await supabase
      .from('notificacoes')
      .select('*', { count: 'exact' })
      .eq('usuario_id', user.id)
      .eq('lida', false)
    
    if (count && count > 10) {
      // Agrupar por tipo
      const grouped = notifs?.reduce((acc, n) => {
        acc[n.tipo] = (acc[n.tipo] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Criar notificação de resumo
      await supabase.from('notificacoes').insert({
        usuario_id: user.id,
        tipo: 'sistema',
        titulo: `Você tem ${count} notificações não lidas`,
        mensagem: Object.entries(grouped || {})
          .map(([tipo, qtd]) => `${qtd} ${tipo}`)
          .join(', '),
        link: '/notificacoes'
      })
    }
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Cron:** Diário às 8h

---

## ✅ CHECKLIST DE TESTES MANUAIS

### **Feed de Comunicação**
- [ ] Criar post simples
- [ ] Criar post com @menção → verificar notificação do mencionado
- [ ] Adicionar comentário em post
- [ ] Editar post (dentro de 1h)
- [ ] Vincular post a etapa
- [ ] Vincular post a gasto (backlink)
- [ ] Filtrar por etapa
- [ ] Filtrar por autor
- [ ] Upload de imagem no post

### **Fornecedores**
- [ ] Cadastrar fornecedor completo
- [ ] Avaliar fornecedor (1-5 estrelas + comentário)
- [ ] Ver histórico de pagamentos do fornecedor
- [ ] Filtrar fornecedores por tipo
- [ ] Buscar fornecedor por nome

### **Notificações**
- [ ] Ver badge de não lidas (header)
- [ ] Abrir dropdown de notificações
- [ ] Marcar como lida (individual)
- [ ] Marcar todas como lidas
- [ ] Clicar em notificação → ir para link correto
- [ ] Ver centro de notificações (/notificacoes)

---

## 🎯 CRITÉRIOS DE CONCLUSÃO

- ✅ Migration 008 executada
- ✅ Feed funcional com menções
- ✅ Sistema de notificações completo
- ✅ Todos testes manuais passando
- ✅ Deploy em produção
- ✅ Aprovação do proprietário

---

## 📚 REFERÊNCIAS

- **PRD:** Seção 5.14+ (Feed e Comunicação)
- **FASE anterior:** [FASE_01.md](./FASE_01.md)
- **Próxima FASE:** [FASE_03.md](./FASE_03.md)

---

## ➡️ PRÓXIMA FASE

Após concluir FASE 2 → **[FASE_03.md](./FASE_03.md)** (Automação com IA)

---

**Criado em:** 06/12/2024  
**Autor:** Claude (Anthropic)

