# Especificacao: Alteracao 12 - Persistir anexos de email no Supabase Storage

| Aspecto | Detalhe |
|---------|---------|
| Status | Aguardando testes |
| Conversa | [alteracao12.md](../alteracao/alteracao12.md) |
| Data criacao | 2026-02-13 |
| Complexidade | Media |

---

## 1. Resumo

Migrar o armazenamento de anexos de email do download on-demand via IMAP para persistencia no Supabase Storage (bucket privado `email-anexos`). Inclui mudanca na rota de sync, atualizacao das rotas de servir/processar anexos, e script de backfill para emails existentes.

---

## 2. O que sera feito

- [ ] Criar bucket `email-anexos` (privado) no Supabase
- [ ] Modificar rota de sync para upload de anexos ao Storage apos inserir email
- [ ] Modificar rota de attachment para ler do Storage (fallback IMAP)
- [ ] Modificar rota de download-attachment para ler do Storage (fallback IMAP)
- [ ] Modificar rota de process para ler do Storage (fallback IMAP)
- [ ] Atualizar componente email-preview para passar storage_path
- [ ] Adicionar funcao `atualizarAnexosEmail` no service
- [ ] Criar e executar script de backfill para emails existentes
- [ ] Deletar script de backfill apos uso

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- Sync salva apenas metadados dos anexos (nome, tipo, tamanho, part, uid) no campo `anexos` JSON
- Cada visualizacao/processamento de anexo abre uma conexao IMAP sob demanda
- Se o email for removido do IMAP, os anexos ficam inacessiveis

**Depois (comportamento proposto):**
- Sync baixa anexos do IMAP e faz upload para Supabase Storage (`email-anexos`, privado)
- Campo `anexos` JSON ganha `storage_path` por item
- Rotas de attachment e process leem do Storage (fallback IMAP se sem `storage_path`)
- Script de backfill migra anexos dos emails ja sincronizados

### 3.2 UI Proposta

N/A - sem impacto visual. A UI continua usando `/api/emails/attachment`. Unica mudanca: `email-preview.tsx` passa `storage_path` como query param quando disponivel.

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

Sem alteracoes de schema. O campo `anexos` (jsonb) ganha `storage_path` por item:

```json
{
  "nome": "nota.pdf",
  "tipo": "application/pdf",
  "tamanho": 230984,
  "part": "2",
  "uid": 3,
  "storage_path": "emails/1df75d17-cb28-4f05-9a93-2324053c9e38/nota.pdf"
}
```

**Bucket:**

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-anexos', 'email-anexos', false);
```

### 4.2 Arquivos a Modificar/Criar

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| MODIFICAR | `src/app/api/emails/sync/route.ts` | Apos inserir email: baixar anexos do IMAP, upload para Storage, update `anexos` com `storage_path` |
| MODIFICAR | `src/app/api/emails/attachment/route.ts` | Se `storage_path` presente: download do Storage. Senao: IMAP (fluxo atual) |
| MODIFICAR | `src/app/api/emails/download-attachment/route.ts` | Mesma logica: Storage primeiro, IMAP fallback |
| MODIFICAR | `src/app/api/emails/process/route.ts` | Funcao `baixarAnexo`: aceitar `storage_path`, ler do Storage. IMAP fallback |
| MODIFICAR | `src/components/features/emails/email-preview.tsx` | `getAnexoUrl()`: incluir `storage_path` na query string quando disponivel |
| MODIFICAR | `src/lib/services/emails-monitorados.ts` | Nova funcao `atualizarAnexosEmail(supabase, id, anexos)` |
| CRIAR (temp) | `toniezzer-manager/backfill-anexos-storage.mjs` | Script backfill: IMAP -> Storage para emails existentes |

### 4.3 Fluxo de Dados

**Sync (novos emails):**

1. Rota sync busca emails do IMAP (metadados + bodyStructure) — sem mudanca
2. Extrai metadados de anexos e corpo — sem mudanca
3. Insere email no banco via `criarEmail()` — retorna registro com `id`
4. **NOVO:** Para cada anexo do email:
   a. Baixa conteudo do IMAP via `client.download(uid, part, { uid: true })`
   b. Upload para Storage: `supabase.storage.from('email-anexos').upload('emails/{id}/{filename}', buffer)`
   c. Adiciona `storage_path` ao objeto do anexo
5. **NOVO:** Update do registro via `atualizarAnexosEmail(supabase, id, anexosComStoragePath)`
6. Se upload falhar: email fica no banco com metadados IMAP (degradacao graceful, log do erro)

**Attachment (visualizacao):**

1. UI chama `/api/emails/attachment?storage_path=X&tipo=Y&nome=Z` (ou `uid=X&part=Y` para antigos)
2. Se `storage_path`: cria client Supabase server, `supabase.storage.from('email-anexos').download(storage_path)`
3. Se sem `storage_path` mas com `uid+part`: conecta ao IMAP (fluxo atual, sem mudanca)
4. Retorna buffer com headers Content-Type/Content-Disposition

**Process (processamento IA):**

1. Funcao `baixarAnexo` recebe `{ storage_path?, uid, part }`
2. Se `storage_path`: download do Storage via Supabase client
3. Senao: download do IMAP (fluxo atual)
4. Retorna `Buffer`

### 4.4 Dependencias Externas

- [ ] Criar bucket `email-anexos` no Supabase (via dashboard ou SQL)

### 4.5 Decisoes de Design e Justificativas

- **Bucket privado**: segue padrao existente (`tarefas-anexos`). Requer download via API route, mas eh mais seguro.
- **Fallback IMAP**: garante compatibilidade com emails antigos que nao tem `storage_path`. Os 14 emails cujos originais ja foram deletados do IMAP ficarao sem anexo de qualquer forma.
- **Storage path `emails/{db_id}/{filename}`**: usa UUID do banco como prefixo. Garante unicidade e facilita cleanup futuro.
- **Insert primeiro, upload depois**: permite obter o `id` do banco para compor o storage path. Se upload falhar, email existe no banco com metadados IMAP (fallback funciona).
- **Script backfill `.mjs`**: JavaScript puro, temporario, deletado apos uso. Usa Supabase REST + service_role key (mesmo padrao do backfill de corpo).
- **Supabase client server na rota de attachment**: necessario para download de bucket privado. Usa `createClient` de `@/lib/supabase/server`.

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [x] Bucket criado no Supabase
- [x] Service: funcao `atualizarAnexosEmail`
- [x] Sync route: upload de anexos para Storage
- [x] Attachment route: download do Storage + fallback IMAP
- [x] Download-attachment route: Storage + fallback IMAP
- [x] Process route: Storage + fallback IMAP
- [x] Email-preview: passar storage_path
- [x] Backfill script criado e executado
- [x] Backfill script deletado
- [x] TypeScript sem erros

### 5.2 Notas de Implementacao

- **Sanitizacao de filename**: Supabase Storage rejeita acentos e caracteres especiais no path. Adicionada sanitizacao NFD + replace de chars invalidos. O storage_path usa formato `{part}-{safeName}` para evitar colisoes quando o mesmo email tem dois anexos com o mesmo nome mas parts diferentes.
- **Backfill**: 15 anexos migrados (de 11 emails encontrados no IMAP). 5 emails nao encontrados no IMAP (muito antigos). Esses mantem fallback IMAP.
- **Bug fix extra**: Corrigido `findTextPart()` no sync route para tratar formato combinado `"text/plain"` do ImapFlow (mesmo bug que foi encontrado no backfill de corpo).

### 5.3 Conversa de Execucao

#### IA: implementacao completa

---

## 6. Validacao Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] Sincronizar novos emails e verificar que anexos vao para Storage
- [ ] Visualizar anexos de emails novos (Storage) e antigos (IMAP fallback)
- [ ] Processar email com anexo vindo do Storage
- [ ] Verificar backfill: emails existentes com `storage_path` nos anexos