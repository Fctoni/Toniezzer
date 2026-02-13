# Alteracao 12 - Persistir anexos de email no Supabase Storage

| Aspecto | Detalhe |
|---------|---------|
| Status | Especificacao criada |
| Origem | Necessidade de eliminar dependencia do IMAP para servir anexos |
| Complexidade | Media |
| Especificacao | [spec-alteracao12.md](../spec/spec-alteracao12.md) |

---

## 1. Ideia Inicial

Hoje os anexos de email sao armazenados apenas como metadados (nome, tipo, tamanho, part, uid) no campo `anexos` JSON da tabela `emails_monitorados`. Cada vez que um anexo precisa ser visualizado ou processado, uma nova conexao IMAP eh aberta para baixar o arquivo sob demanda.

Problemas:
- Lento (conexao IMAP a cada visualizacao)
- Fragil (se o IMAP estiver fora, anexos ficam inacessiveis)
- Emails antigos podem ser removidos do servidor IMAP, perdendo acesso aos anexos

Proposta:
1. Salvar anexos no Supabase Storage durante a sincronizacao (rota sync)
2. Criar script de backfill para persistir anexos dos emails ja sincronizados
3. Atualizar rotas de attachment e process para ler do Storage

---

## 2. Conversa de Planejamento

#### usuario: persistir anexos em bucket supabase na sync + backfill para existentes

#### IA: analise do codebase e proposta

Analisei todo o fluxo de emails e identifiquei os pontos de mudanca. Seguem duas perguntas antes de propor:

**Pergunta 1 - Bucket privado ou publico?**

O projeto ja usa bucket privado para `tarefas-anexos`. Recomendo o mesmo padrao:
- **Privado**: anexos servidos via API route (como hoje), mas lendo do Storage em vez do IMAP. Mais seguro.
- **Publico**: URLs diretas do Supabase. Mais simples, mas qualquer pessoa com a URL acessa.

**Pergunta 2 - Fallback IMAP?**

Dos 25 emails antigos, 14 nao existem mais no servidor IMAP (nao sera possivel fazer backfill dos anexos deles). Devemos manter fallback IMAP na rota de attachment para esses casos, ou aceitar que ficam inacessiveis?

Recomendo manter fallback: se o anexo nao tem `storage_path`, tenta IMAP como hoje.

---

#### usuario:

Concordo com a abordagem. Deixar o bucket privado. Fazer fallback imap!

#### IA: proposta criada, spec gerada

Perfeito. Decisoes:
- Bucket **privado** (`email-anexos`)
- **Fallback IMAP** para anexos sem `storage_path`

Proposta preenchida na secao 3. Especificacao criada em [spec-alteracao12.md](../spec/spec-alteracao12.md).

---

## 3. Proposta de Implementacao

**Status:** Aprovada

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- Sync salva apenas metadados dos anexos (nome, tipo, tamanho, part, uid) no campo `anexos` JSON
- Cada visualizacao/processamento de anexo abre uma conexao IMAP para download sob demanda
- Se o email for removido do IMAP, os anexos ficam inacessiveis
- Rota `/api/emails/attachment` conecta ao IMAP a cada request
- Rota `/api/emails/process` conecta ao IMAP para cada anexo de cada email

**Depois (comportamento proposto):**
- Sync baixa os anexos do IMAP e faz upload para Supabase Storage (bucket `email-anexos`, privado)
- Campo `anexos` JSON ganha novo campo `storage_path` por anexo
- Rota `/api/emails/attachment` le do Storage (com fallback IMAP se nao tiver `storage_path`)
- Rota `/api/emails/process` le do Storage (com fallback IMAP)
- Script de backfill migra anexos dos emails ja sincronizados
- Rota `/api/emails/download-attachment` le do Storage (com fallback IMAP)

### 3.2 UI Proposta

N/A - alteracao sem impacto visual. A UI continua chamando `/api/emails/attachment` da mesma forma. A unica mudanca no componente `email-preview.tsx` eh passar `storage_path` como query param quando disponivel.

### 3.3 Arquivos Afetados

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/api/emails/sync/route.ts` | Apos inserir email, baixar anexos do IMAP, upload para Storage, update do campo `anexos` com `storage_path` |
| MODIFICAR | `src/app/api/emails/attachment/route.ts` | Ler do Storage quando `storage_path` presente; fallback IMAP |
| MODIFICAR | `src/app/api/emails/download-attachment/route.ts` | Ler do Storage quando `storage_path` presente; fallback IMAP |
| MODIFICAR | `src/app/api/emails/process/route.ts` | Funcao `baixarAnexo` le do Storage primeiro; fallback IMAP |
| MODIFICAR | `src/components/features/emails/email-preview.tsx` | Passar `storage_path` na URL do anexo quando disponivel |
| MODIFICAR | `src/lib/services/emails-monitorados.ts` | Nova funcao `atualizarAnexosEmail()` para update do campo `anexos` |
| CRIAR (temp) | `backfill-anexos-storage.mjs` | Script temporario para migrar anexos existentes para Storage |

### 3.4 Fluxo de Dados

**Fluxo de sync (novos emails):**
1. Rota sync busca emails do IMAP (metadados + bodyStructure)
2. Para cada email novo: extrai metadados de anexos e corpo (como hoje)
3. Insere email no banco (via `criarEmail`) — retorna o `id` do registro
4. **NOVO:** Para cada anexo, baixa conteudo do IMAP via `client.download()`
5. **NOVO:** Upload para Storage: `supabase.storage.from('email-anexos').upload('emails/{id}/{filename}', buffer)`
6. **NOVO:** Update do registro: campo `anexos` JSON ganha `storage_path` em cada item
7. Responde com quantidade de emails sincronizados

**Fluxo de visualizacao (attachment route):**
1. UI chama `/api/emails/attachment?storage_path=X&tipo=Y&nome=Z`
2. **NOVO:** Se `storage_path` presente: download do Storage, retorna buffer
3. **FALLBACK:** Se sem `storage_path` mas com `uid+part`: conecta ao IMAP (fluxo atual)

**Fluxo de processamento (process route):**
1. Funcao `baixarAnexo` recebe `storage_path` (novo) + `uid` + `part`
2. **NOVO:** Se `storage_path` presente: download do Storage
3. **FALLBACK:** Se sem `storage_path`: conecta ao IMAP (fluxo atual)

### 3.5 Banco de Dados

N/A - sem alteracoes no schema. O campo `anexos` ja eh `jsonb` e aceita campos adicionais. A mudanca eh adicionar `storage_path` ao JSON de cada anexo.

**Bucket no Supabase Storage:**

```sql
-- Criar bucket privado (via dashboard ou SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-anexos', 'email-anexos', false);
```

### 3.6 Impacto Cross-Domain

N/A - alteracao isolada no dominio de emails.

---

## 4. Decisoes Importantes

- **Bucket privado** (`email-anexos`): segue padrao existente (`tarefas-anexos`). Anexos servidos via API route.
- **Fallback IMAP**: se anexo nao tem `storage_path`, tenta IMAP. Garante compatibilidade com emails antigos (14 que nao estao mais no IMAP ficarao sem anexo de qualquer forma).
- **Storage path**: `emails/{email_db_id}/{filename}` — usa o ID do banco (UUID) como prefixo.
- **Duas etapas no sync**: primeiro insere o email (para obter o ID), depois faz upload dos anexos e update do campo `anexos`. Se o upload falhar, o email ainda fica no banco com metadados IMAP (degradacao graceful).
- **Script backfill temporario**: `.mjs` (JavaScript puro), sera deletado apos uso. Mesmo padrao do backfill de corpo.