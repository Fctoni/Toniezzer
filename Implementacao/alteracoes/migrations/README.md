# 📁 Migrations - Alteração 01

## ⚠️ INSTRUÇÕES DE EXECUÇÃO

### Pré-requisitos
- [ ] Backup completo do banco de dados Supabase
- [ ] Acesso ao Supabase Dashboard (SQL Editor e Storage)
- [ ] Verificar que não há dados importantes na tabela `tarefas` antiga

---

## 🔄 Ordem de Execução

### **Etapa 1: Criar Bucket de Storage**

1. Acesse: **Supabase Dashboard → Storage → Buckets**
2. Clique em **"New bucket"**
3. Configure:
   - **Name:** `tarefas-anexos`
   - **Public:** ❌ **false** (desabilitar)
   - **Allowed MIME types:** (deixar em branco ou definir tipos permitidos)
   - **File size limit:** 10MB (sugestão)
4. Clique em **"Create bucket"**

✅ **Resultado esperado:** Bucket `tarefas-anexos` criado e visível na lista

---

### **Etapa 2: Executar Migration Principal**

1. Acesse: **Supabase Dashboard → SQL Editor**
2. Crie um **New query**
3. **Copie todo o conteúdo** de: `alteracao01-3-niveis-hierarquicos.sql`
4. **Cole no editor** e clique em **"Run"**
5. Aguarde execução (pode levar 10-30 segundos)

✅ **Resultado esperado:**
```
Success. No rows returned
```

---

### **Etapa 3: Executar Storage Policies**

1. No **SQL Editor**, crie um **New query**
2. **Copie todo o conteúdo** de: `alteracao01-storage-policies.sql`
3. **Cole no editor** e clique em **"Run"**

✅ **Resultado esperado:**
```
Success. No rows returned
```

---

### **Etapa 4: Verificar Criação das Tabelas**

Execute no **SQL Editor**:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subetapas', 'tarefas', 'tarefas_anexos')
ORDER BY table_name;
```

✅ **Resultado esperado:**
```
subetapas
tarefas
tarefas_anexos
```

---

### **Etapa 5: Verificar Triggers**

Execute no **SQL Editor**:

```sql
-- Verificar triggers criados
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%atualizar%'
ORDER BY event_object_table;
```

✅ **Resultado esperado:**
```
trigger_atualizar_progresso_subetapa | tarefas
trigger_subetapas_updated_at        | subetapas
trigger_tarefas_updated_at          | tarefas
```

---

### **Etapa 6: Verificar RLS Policies**

Execute no **SQL Editor**:

```sql
-- Verificar policies criadas
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('subetapas', 'tarefas', 'tarefas_anexos')
ORDER BY tablename, policyname;
```

✅ **Resultado esperado:** Lista de ~10 policies

---

### **Etapa 7: Verificar Storage Policies**

1. Acesse: **Supabase Dashboard → Storage → Buckets**
2. Clique no bucket **`tarefas-anexos`**
3. Vá até a aba **"Policies"**

✅ **Resultado esperado:** 3 policies listadas:
- `Usuarios podem visualizar anexos`
- `Usuarios autorizados podem fazer upload`
- `Usuarios autorizados podem deletar anexos`

---

## 🧪 Testes de Validação

### Teste 1: Criar Subetapa (via SQL)

```sql
INSERT INTO subetapas (etapa_id, nome, status, ordem)
VALUES (
  (SELECT id FROM etapas LIMIT 1),
  'Teste Subetapa',
  'nao_iniciada',
  0
)
RETURNING *;
```

### Teste 2: Criar Tarefa (via SQL)

```sql
INSERT INTO tarefas (subetapa_id, nome, status, prioridade, ordem)
VALUES (
  (SELECT id FROM subetapas LIMIT 1),
  'Teste Tarefa',
  'pendente',
  'media',
  0
)
RETURNING *;
```

### Teste 3: Verificar Progresso Automático

```sql
-- Criar 2 tarefas
INSERT INTO tarefas (subetapa_id, nome, status)
VALUES
  ((SELECT id FROM subetapas LIMIT 1), 'Tarefa 1', 'pendente'),
  ((SELECT id FROM subetapas LIMIT 1), 'Tarefa 2', 'concluida');

-- Verificar progresso da subetapa (deve ser 50%)
SELECT nome, progresso_percentual
FROM subetapas
WHERE id = (SELECT id FROM subetapas LIMIT 1);
```

✅ **Resultado esperado:** `progresso_percentual = 50`

---

## ⚠️ Troubleshooting

### Erro: "relation tarefas already exists"

**Causa:** Tabela `tarefas` antiga não foi removida

**Solução:**
```sql
DROP TABLE IF EXISTS tarefas CASCADE;
```

### Erro: "must be owner of table tarefas to enable row level security"

**Causa:** Falta de permissões

**Solução:** Executar como superuser ou ajustar permissões

### Erro: "bucket tarefas-anexos does not exist"

**Causa:** Bucket não foi criado antes de executar storage policies

**Solução:** Criar bucket via interface e re-executar storage policies

---

## 📝 Próximos Passos

Após execução bem-sucedida:

1. ✅ Marcar Etapa A como concluída no spec
2. ⏭️ Avançar para **Etapa B: Tipos TypeScript e Utils**
   - Regenerar tipos do Supabase
   - Criar arquivos de utilidades (dependencias.ts, progresso.ts)

---

**Data de criação:** 07/02/2026
**Alteração:** 01 - Sistema de 3 níveis hierárquicos
