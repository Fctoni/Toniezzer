# Especificacao: Alteracao 07 - Salvar anexos de emails no Supabase Storage durante sincronizacao

| Aspecto | Detalhe |
|---------|---------|
| Status | Em execucao |
| Conversa | [alteracao07.md](../alteracao/alteracao07.md) |
| Data criacao | 2026-02-12 |
| Complexidade | Media |

**Status possiveis:**
- Pronto para executar
- Em execucao
- Aguardando testes
- Concluido
- Cancelado

---

## 1. Resumo

Salvar os anexos de email no Supabase Storage (bucket `email-anexos`) durante a sincronizacao IMAP, e servir os anexos a partir do Storage em vez de abrir novas conexoes IMAP a cada visualizacao. Inclui script de migracao para emails antigos e remocao das rotas IMAP legadas.

---

## 2. O que sera feito

- [ ] Criar bucket `email-anexos` no Supabase Storage
- [ ] Alterar rota de sincronizacao para baixar anexos e salvar no Storage
- [ ] Atualizar `email-preview.tsx` para usar `url_storage` em vez de URL IMAP
- [ ] Atualizar `process/route.ts` para buscar anexos do Storage em vez do IMAP
- [ ] Atualizar `[id]/page.tsx` para buscar anexo do Storage na aprovacao
- [ ] Criar script de migracao para emails antigos
- [ ] Remover rota `attachment/route.ts`
- [ ] Remover rota `download-attachment/route.ts`

---

## 3. Proposta

### 3.1 Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Sincronizacao IMAP | Extrai apenas metadados dos anexos (nome, tipo, tamanho, `part`, `uid`) da `bodyStructure`. Nao baixa o conteudo dos anexos | Alem dos metadados, baixa o conteudo de cada anexo durante a sincronizacao e faz upload para o bucket `email-anexos` no Supabase Storage. Salva a `url_storage` nos metadados do anexo |
| Armazenamento de metadados | Campo `anexos` (JSON) contem: `{ nome, tipo, tamanho, part, uid }` | Campo `anexos` (JSON) contem: `{ nome, tipo, tamanho, part, uid, url_storage }` |
| Exibicao no frontend | `email-preview.tsx` usa `getAnexoUrl()` que monta URL `/api/emails/attachment?uid=X&part=Y...`. Cada visualizacao abre conexao IMAP (~2-3s) | `email-preview.tsx` usa diretamente `anexo.url_storage`. Acesso instantaneo via CDN do Storage |
| Processamento com Gemini | `process/route.ts` usa funcao `baixarAnexo(uid, part)` que conecta ao IMAP para baixar cada anexo | `process/route.ts` busca o anexo via `fetch(url_storage)` -- HTTP simples, sem IMAP |
| Aprovacao de email | `[id]/page.tsx` busca anexo via `/api/emails/attachment` do IMAP e depois faz upload para bucket `notas-compras` | `[id]/page.tsx` busca anexo diretamente da `url_storage`. Upload para `notas-compras` continua igual |
| Rotas API de anexo | 2 rotas IMAP: `attachment/route.ts` (GET) e `download-attachment/route.ts` (POST) | Removidas apos migracao |
| Emails antigos | Anexos so acessiveis via IMAP | Script de migracao baixa todos os anexos antigos do IMAP e salva no Storage |

### 3.2 UI Proposta

N/A -- alteracao sem impacto visual. O usuario vera os mesmos anexos com as mesmas acoes (preview, abrir em nova aba, download). A unica diferenca perceptivel sera a velocidade de carregamento (instantaneo via Storage vs ~2-3s via IMAP).

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

Nenhuma alteracao de schema necessaria. O campo `anexos` e do tipo `Json | null` e ja aceita qualquer estrutura.

Criar o bucket no Supabase Storage:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-anexos', 'email-anexos', true);
```

### 4.2 Arquivos a Modificar/Criar

**Ordem de execucao recomendada:** seguir a numeracao abaixo (1 a 6).

#### 1. MODIFICAR `src/app/api/emails/sync/route.ts`

**O que muda:** Apos extrair metadados dos anexos com `findAttachments()`, baixar o conteudo de cada anexo e fazer upload para o Storage. Adicionar `url_storage` ao tipo e aos dados de cada anexo.

**Detalhes de implementacao:**

- Adicionar `url_storage` ao tipo do array `anexos`:
```typescript
const anexos: Array<{
  nome: string
  tipo: string
  tamanho: number
  part: string
  uid: number
  url_storage: string  // NOVO
}> = []
```

- Apos o `findAttachments(message.bodyStructure)` (linha 161 atual), e antes do insert no banco, adicionar bloco que percorre os anexos encontrados e, para cada um:
  1. Baixa o conteudo via `client.download(message.uid.toString(), anexo.part, { uid: true })` -- reutilizando a conexao/lock IMAP ja aberto
  2. Converte o stream para Buffer (mesmo padrao ja usado no bloco de corpo do email, linhas 169-175)
  3. Faz upload para Supabase Storage: `supabase.storage.from('email-anexos').upload(path, buffer, { contentType: anexo.tipo, upsert: false })`
  4. O `path` segue o padrao `{emailId}/{anexo.nome}` onde `emailId` e o `email_id_externo` (messageId ou `msg-{uid}`)
  5. Obtem URL publica via `supabase.storage.from('email-anexos').getPublicUrl(path)`
  6. Atribui `anexo.url_storage = publicUrl`

- Tratamento de erro: se o upload de um anexo falhar, logar o erro e continuar com os demais anexos. O `url_storage` fica como string vazia para esse anexo (o frontend deve tratar esse caso).

- O `emailId` usado no path pode conter caracteres especiais (como `<`, `>`, `@`). Sanitizar para uso como path no Storage: remover `<>`, substituir caracteres nao-alfanumericos por `_`. Exemplo: `<abc@mail.com>` -> `abc_mail.com`.

- O comentario na linha 193 ("NAO baixamos os anexos aqui, apenas metadados") deve ser atualizado ou removido, pois agora estamos baixando.

**Nota sobre o tipo `any`:** A funcao `findAttachments` (linha 128) ja usa `any` na assinatura (`structure: any`). Manter como esta por enquanto -- a `bodyStructure` do ImapFlow nao tem tipagem precisa.

#### 2. MODIFICAR `src/components/features/emails/email-preview.tsx`

**O que muda:** Substituir `getAnexoUrl()` por acesso direto a `url_storage` do anexo.

**Detalhes de implementacao:**

- Atualizar o tipo do cast de `anexos` (linhas 32-38) para incluir `url_storage`:
```typescript
const anexos = email.anexos as Array<{
  nome: string
  tipo: string
  tamanho?: number
  part: string
  uid: number
  url_storage: string  // NOVO
}> | null
```

- Remover a funcao `getAnexoUrl()` (linhas 62-64). Ela nao sera mais necessaria.

- Remover a funcao `handlePreview()` (linhas 66-73) e o estado `previewUrl` (linha 26). Nao sao mais necessarios pois a URL e direta.

- Substituir todas as chamadas a `getAnexoUrl(anexo)` por `anexo.url_storage`:
  - Linha 138 (`<img src={getAnexoUrl(anexo)}>`) -> `<img src={anexo.url_storage}>`
  - Linha 154 (`<img src={getAnexoUrl(anexo)}>`) -> `<img src={anexo.url_storage}>`
  - Linha 184 (`href={getAnexoUrl(anexo)}`) -> `href={anexo.url_storage}`
  - Linha 195 (`href={getAnexoUrl(anexo)}`) -> `href={anexo.url_storage}`

- Remover o `onClick={() => handlePreview(anexo)}` do botao de imagem (linha 129), pois a URL ja esta disponivel.

- Remover o estado `loadingAnexo` (linha 24) e a condicao de loading no preview de imagem (linhas 131-133), pois o carregamento via URL do Storage e direto (o proprio `<img>` cuida do loading).

#### 3. MODIFICAR `src/app/api/emails/process/route.ts`

**O que muda:** Substituir a funcao `baixarAnexo(uid, part)` que conectava ao IMAP por uma funcao que busca do Storage via HTTP. Remover o import do `ImapFlow`.

**Detalhes de implementacao:**

- Remover o import `import { ImapFlow } from 'imapflow'` (linha 5)

- Substituir a funcao `baixarAnexo` (linhas 26-69) por:
```typescript
async function baixarAnexoDoStorage(urlStorage: string): Promise<Buffer | null> {
  console.log('[PROCESS] Baixando anexo do Storage:', urlStorage)

  const response = await fetch(urlStorage)
  if (!response.ok) {
    console.error('[PROCESS] Erro ao baixar do Storage:', response.status)
    return null
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  console.log('[PROCESS] Anexo baixado, tamanho:', buffer.length, 'bytes')
  return buffer
}
```

- Atualizar o tipo do cast de `anexos` (linhas 372-378 no loop de processamento) para incluir `url_storage`:
```typescript
const anexos = email.anexos as Array<{
  nome: string
  tipo: string
  tamanho: number
  part: string
  uid: number
  url_storage: string  // NOVO
}> | null
```

- Na linha 405, substituir a chamada:
```typescript
// ANTES:
const buffer = await baixarAnexo(anexo.uid, anexo.part)

// DEPOIS:
const buffer = await baixarAnexoDoStorage(anexo.url_storage)
```

- Na mensagem de erro (linha 408), ajustar de "falha ao baixar do servidor IMAP" para "falha ao baixar do Storage".

#### 4. MODIFICAR `src/app/(dashboard)/emails/[id]/page.tsx`

**O que muda:** No `handleAprovar`, substituir o fetch via rota IMAP por fetch direto da `url_storage` do anexo.

**Detalhes de implementacao:**

- Atualizar o tipo do cast de `anexos` (linhas 68-74) para incluir `url_storage`:
```typescript
const anexos = email.anexos as Array<{
  nome: string
  tipo: string
  tamanho?: number
  part: string
  uid: number
  url_storage: string  // NOVO
}> | null
```

- Substituir a construcao da URL do anexo (linha 85):
```typescript
// ANTES:
const anexoUrl = `/api/emails/attachment?uid=${anexoParaSalvar.uid}&part=${anexoParaSalvar.part}&tipo=${encodeURIComponent(anexoParaSalvar.tipo)}&nome=${encodeURIComponent(anexoParaSalvar.nome)}`
const response = await fetch(anexoUrl)

// DEPOIS:
const response = await fetch(anexoParaSalvar.url_storage)
```

- O restante do fluxo (converter para blob, determinar extensao, upload para `notas-compras`) permanece identico.

#### 5. CRIAR `scripts/migrate-email-attachments.ts`

**O que faz:** Script executado uma unica vez para migrar anexos de emails antigos do IMAP para o Storage.

**Detalhes de implementacao:**

- Script Node.js/TypeScript standalone que pode ser executado via `npx tsx scripts/migrate-email-attachments.ts`
- Depende de: `imapflow`, `@supabase/supabase-js` (imports diretos, sem aliases `@/`)
- Usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do `.env.local` para criar client Supabase com permissao de admin (service role)
- Usa as mesmas variaveis de ambiente IMAP (`EMAIL_IMAP_HOST`, `EMAIL_IMAP_USER`, `EMAIL_IMAP_PASSWORD`, `EMAIL_IMAP_PORT`)

**Fluxo do script:**

1. Criar client Supabase com service role key
2. Buscar todos os emails da tabela `emails_monitorados` que tem `anexos IS NOT NULL`
3. Filtrar apenas os que tem pelo menos um anexo sem `url_storage` (verificar no JSON)
4. Conectar ao IMAP (uma unica conexao para todos)
5. Para cada email, para cada anexo sem `url_storage`:
   a. Baixar via `client.download(uid, part, { uid: true })`
   b. Sanitizar o `email_id_externo` para uso como path (remover `<>`, caracteres especiais)
   c. Upload para Storage: `supabase.storage.from('email-anexos').upload(path, buffer, { contentType, upsert: true })`
   d. Obter URL publica
   e. Adicionar `url_storage` ao objeto do anexo
6. Atualizar o campo `anexos` no banco com os metadados atualizados
7. Exibir relatorio final: total de emails processados, total de anexos migrados, falhas

**Tratamento de erros:**
- Se um anexo falhar (ex: email deletado do IMAP), logar o erro e continuar com o proximo
- Nao interromper a migracao por falhas individuais
- Usar `upsert: true` no upload para evitar erros de duplicata caso o script seja re-executado

**Exemplo de saida:**
```
[MIGRATE] Iniciando migracao de anexos...
[MIGRATE] Emails com anexos pendentes: 15
[MIGRATE] Email abc123: 2 anexos migrados
[MIGRATE] Email def456: 1 anexo migrado, 1 falha (email deletado do IMAP)
...
[MIGRATE] Concluido! 28 anexos migrados, 2 falhas.
```

#### 6. REMOVER rotas IMAP legadas

**Somente apos confirmar que a migracao foi executada com sucesso.**

- REMOVER `src/app/api/emails/attachment/route.ts` -- arquivo inteiro
- REMOVER `src/app/api/emails/download-attachment/route.ts` -- arquivo inteiro
- Verificar se os diretórios `attachment/` e `download-attachment/` ficam vazios e removê-los também

### 4.3 Fluxo de Dados

#### Fluxo da sincronizacao (novos emails)

1. Rota `POST /api/emails/sync` conecta ao IMAP e faz `client.fetch()` com `{ envelope, bodyStructure, uid }`
2. Para cada email, percorre a `bodyStructure` identificando anexos via `findAttachments()`
3. Para cada anexo encontrado, usa `client.download(uid, part, { uid: true })` para baixar o conteudo (dentro do mesmo lock IMAP ja aberto)
4. Converte o stream para Buffer
5. Sanitiza o `emailId` para uso como path (remove `<>` e caracteres especiais)
6. Faz upload do Buffer para Supabase Storage: `supabase.storage.from('email-anexos').upload('{emailId}/{nome}', buffer)`
7. Obtem a URL publica via `getPublicUrl()`
8. Adiciona `url_storage` ao objeto de metadados do anexo
9. Insere o email na tabela `emails_monitorados` com o campo `anexos` contendo os metadados atualizados

#### Fluxo de exibicao (frontend)

1. Usuario abre pagina `/emails/[id]`
2. `email-preview.tsx` recebe o email com campo `anexos` contendo `url_storage`
3. Imagens inline usam `<img src={anexo.url_storage}>` -- carregamento instantaneo
4. Botao "Abrir em nova aba" usa `<a href={anexo.url_storage} target="_blank">`
5. Botao "Download" usa `<a href={anexo.url_storage} download={anexo.nome}>`

#### Fluxo de processamento (Gemini)

1. Rota `POST /api/emails/process` busca emails pendentes
2. Para cada email, le os metadados dos anexos
3. Busca o conteudo do anexo via `fetch(anexo.url_storage)` -- HTTP simples
4. Converte para Buffer e processa com Gemini (igual ao atual)

#### Fluxo de migracao (emails antigos -- executado uma vez)

1. Script busca todos os emails com anexos sem `url_storage`
2. Conecta ao IMAP (uma conexao para todos)
3. Para cada email, para cada anexo, baixa via `client.download(uid, part)`
4. Faz upload para Storage
5. Atualiza o campo `anexos` no banco com `url_storage`
6. Exibe relatorio de sucesso/falha

### 4.4 Dependencias Externas

- [ ] Criar bucket `email-anexos` no Supabase Storage (SQL fornecido na secao 4.1)
- [ ] Garantir que as variaveis de ambiente IMAP estao configuradas no `.env.local` (ja devem estar, pois a sync funciona hoje)
- [ ] Para o script de migracao: garantir que `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estao no `.env.local`

---

### 4.5 Decisoes de Design e Justificativas

- **Bucket separado `email-anexos`:** Propositos diferentes do `notas-compras`. `email-anexos` armazena anexos brutos da sincronizacao; `notas-compras` armazena documentos aprovados pelo usuario. Separacao facilita limpeza e controle de acesso futuro.

- **Migrar emails antigos via script:** Garante que todos os anexos estejam no Storage, permitindo remocao completa das rotas IMAP legadas. Elimina dependencia do servidor de email para dados historicos.

- **Remover rotas IMAP legadas apos migracao:** Codigo morto gera confusao e custo de manutencao. Com todos os anexos migrados, nao ha cenario de fallback. A rota `download-attachment` nem era referenciada no codigo.

- **Sem limite de tamanho para anexos:** O Supabase ja tem limite padrao de 50MB por arquivo. Anexos de email raramente excedem esse valor.

- **Estrutura de pastas `{email_id_externo}/{nome_arquivo}`:** Agrupa anexos por email, facilita limpeza e evita colisao de nomes entre emails diferentes.

- **Reutilizar conexao IMAP da sync:** O lock do INBOX ja esta aberto durante a sincronizacao. Baixar os anexos dentro do mesmo lock e mais eficiente do que abrir novas conexoes.

- **Bucket publico:** Anexos de email precisam ser acessiveis via URL publica para exibicao no frontend (imagens inline, preview de PDF). Seguranca por obscuridade via path unico (email_id/nome).

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [x] Bucket `email-anexos` criado no Supabase
- [x] `sync/route.ts` alterado para baixar e salvar anexos no Storage
- [x] `email-preview.tsx` atualizado para usar `url_storage`
- [x] `process/route.ts` atualizado para buscar do Storage
- [x] `[id]/page.tsx` atualizado para buscar do Storage na aprovacao
- [x] Script de migracao criado (`scripts/migrate-email-attachments.ts`)
- [ ] Script de migracao executado
- [ ] Rotas IMAP legadas removidas (apos migracao)
- [x] TypeScript sem erros (nos arquivos alterados)
- [ ] Testado manualmente

### 5.2 Notas de Implementacao

- `tsconfig.json`: adicionado `scripts` ao `exclude` para evitar erros de compilacao no script standalone de migracao
- `email-preview.tsx`: removidos imports nao utilizados (`Eye`, `Loader2`), estados (`loadingAnexo`, `previewUrl`) e funcoes (`getAnexoUrl`, `handlePreview`)
- `process/route.ts`: removido import do `ImapFlow` e funcao `baixarAnexo` inteira, substituida por `baixarAnexoDoStorage` (fetch HTTP simples)
- `[id]/page.tsx`: removida construcao manual da URL IMAP, substituida por `fetch(anexoParaSalvar.url_storage)`
- Script de migracao usa `dotenv` para ler `.env.local` e `@supabase/supabase-js` com service role key

### 5.3 Conversa de Execucao

*(problemas encontrados durante execucao, solucoes propostas)*

#### IA:
[mensagem]

---

## 6. Validacao Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
