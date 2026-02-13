# Alteracao 07 - Salvar anexos de emails no Supabase Storage durante sincronizacao

| Aspecto | Detalhe |
|---------|---------|
| Status | Especificacao criada |
| Origem | Solicitacao do usuario |
| Complexidade | Media |
| Especificacao | [spec-alteracao07.md](../spec/spec-alteracao07.md) |

**Status possiveis:**
- Em planejamento
- Especificacao criada -> ver [spec-alteracao07.md](../spec/spec-alteracao07.md)

---

## 1. Ideia Inicial

Os anexos dos emails, na pagina de email, estao sendo requisitados do servidor IMAP toda vez que o arquivo e aberto. Precisamos salvar os anexos em um bucket no Supabase no momento da sincronizacao, e buscar estes anexos no bucket, ao inves de no servidor de emails, quando solicitados.

---

## 2. Conversa de Planejamento

#### usuario: Descricao da alteracao acima

#### IA: Analise do fluxo atual e perguntas de esclarecimento

Analisei os seguintes arquivos do projeto para entender o fluxo atual de anexos:

- `src/app/api/emails/sync/route.ts` -- Rota de sincronizacao IMAP
- `src/app/api/emails/attachment/route.ts` -- API que baixa anexo do IMAP sob demanda (GET)
- `src/app/api/emails/download-attachment/route.ts` -- API que baixa anexo do IMAP e retorna base64 (POST)
- `src/app/api/emails/process/route.ts` -- Processamento de emails com Gemini (tambem baixa do IMAP)
- `src/components/features/emails/email-preview.tsx` -- Componente de preview que exibe anexos
- `src/app/(dashboard)/emails/[id]/page.tsx` -- Pagina de detalhes do email

**Fluxo atual (problema):**

1. **Sincronizacao** (`/api/emails/sync`): Conecta ao IMAP, busca emails nao lidos dos ultimos 7 dias. Extrai apenas **metadados** dos anexos (nome, tipo, tamanho, `part`, `uid`) da `bodyStructure`, sem baixar o conteudo. Salva esses metadados no campo `anexos` (JSON) da tabela `emails_monitorados`.

2. **Exibicao** (`email-preview.tsx`): Quando o usuario abre a pagina de detalhes de um email, os anexos sao exibidos usando a URL `/api/emails/attachment?uid=X&part=Y&tipo=Z&nome=N`. Cada vez que um anexo e visualizado (imagem inline ou abertura em nova aba), o servidor faz uma **nova conexao IMAP** para baixar o anexo.

3. **Processamento** (`/api/emails/process`): Quando o sistema processa emails com Gemini, tambem conecta ao IMAP para baixar cada anexo individualmente via `baixarAnexo(uid, part)`.

4. **Download** (`/api/emails/download-attachment`): Outra rota que conecta ao IMAP para baixar anexo e retornar base64.

**Problemas identificados:**
- Cada visualizacao de anexo abre uma nova conexao IMAP (lento, ~2-3s por conexao)
- Se o email for movido ou deletado no servidor IMAP, os anexos ficam inacessiveis
- Carga desnecessaria no servidor de email
- A rota de processamento (`process`) tambem depende do IMAP para baixar anexos

**Proposta em alto nivel:**
- Durante a sincronizacao, alem de salvar metadados, **baixar o conteudo dos anexos** e fazer upload para um bucket no Supabase Storage
- Atualizar os metadados do anexo no campo `anexos` com a URL do arquivo no Storage
- No frontend, trocar a URL dos anexos de `/api/emails/attachment?...` para a URL publica do Storage
- A rota de processamento (`process`) tambem passa a buscar do Storage em vez do IMAP

**Perguntas para o usuario:**

1. O bucket no Supabase Storage -- deseja usar o bucket existente `notas-compras` (que ja e usado na aprovacao de emails, veja `[id]/page.tsx` linhas 101-114) ou criar um bucket separado para anexos de email (ex: `email-anexos`)? Considerando que sao propositos diferentes (anexos brutos vs notas fiscais aprovadas), minha recomendacao seria um bucket separado.

2. Sobre **emails ja sincronizados** que tem anexos com metadados IMAP (uid/part) mas sem URL do Storage -- devemos:
   - **(A)** Ignorar emails antigos: somente novos emails sincronizados terao anexos no Storage. Os antigos continuam buscando do IMAP (manter rotas legadas)
   - **(B)** Criar uma migracao/script que resincroniza os anexos antigos para o Storage
   - **(C)** Suporte hibrido: se o anexo tem URL do Storage, usa Storage; se nao tem, faz fallback para IMAP

3. As rotas atuais que conectam ao IMAP para baixar anexos (`/api/emails/attachment` e `/api/emails/download-attachment`):
   - **(A)** Remover completamente apos a migracao
   - **(B)** Manter como fallback para anexos antigos que nao foram migrados
   - **(C)** Manter mas redirecionar para o Storage quando possivel

4. Qual limite de tamanho de anexo voce considera aceitavel para salvar no Storage? Hoje o Supabase tem limite de 50MB por arquivo por padrao, mas anexos de email raramente passam de 25MB. Devemos definir um limite maximo?

5. Sobre a estrutura de pastas no bucket, minha sugestao seria: `{email_id}/{nome_original_do_arquivo}` (ex: `abc123/nota-fiscal.pdf`). Isso facilita a organizacao e limpeza. Concorda ou prefere outra estrutura?

---

#### usuario: Respostas as 5 perguntas

1. **Bucket**: Separado -- criar novo bucket especifico para anexos de email
2. **Emails antigos**: Opcao (B) -- criar script para migrar os antigos
3. **Rotas IMAP legadas**: Quer minha sugestao
4. **Limite de tamanho**: Sem limite
5. **Estrutura de pastas**: `{email_id}/{nome_arquivo}` ok

---

#### IA: Respostas recebidas -- recomendacao sobre rotas legadas e proposta completa

**Recomendacao para pergunta 3 -- Rotas IMAP legadas:**

Recomendo **remover ambas as rotas** (`/api/emails/attachment` e `/api/emails/download-attachment`) apos a migracao dos emails antigos. Justificativa:

- Como a opcao (B) foi escolhida (migrar emails antigos), apos o script de migracao **todos** os anexos estarao no Storage. Nao havera mais cenario onde o IMAP precisa ser consultado para anexos.
- A rota `/api/emails/download-attachment` nao e consumida por nenhum arquivo no projeto (nenhuma referencia encontrada no codigo). Pode ser removida imediatamente.
- A rota `/api/emails/attachment` e consumida em 2 pontos: `email-preview.tsx` (exibicao) e `[id]/page.tsx` (aprovacao). Ambos serao atualizados para usar URL do Storage.
- A funcao `baixarAnexo()` dentro de `process/route.ts` tambem sera atualizada para buscar do Storage.
- Manter codigo morto gera confusao e custo de manutencao.

**Ordem de execucao recomendada:**
1. Primeiro: alterar a sync para salvar no Storage (novos emails)
2. Segundo: executar script de migracao (emails antigos)
3. Terceiro: atualizar frontend e processamento para usar Storage
4. Quarto: remover rotas IMAP legadas

Todas as informacoes necessarias estao coletadas. A proposta completa segue abaixo.

---

## 3. Proposta de Implementacao

**Status:** Aprovada -- spec criada em [spec-alteracao07.md](../spec/spec-alteracao07.md)

### 3.1 Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Sincronizacao IMAP | Extrai apenas metadados dos anexos (nome, tipo, tamanho, `part`, `uid`) da `bodyStructure`. Nao baixa o conteudo dos anexos | Alem dos metadados, **baixa o conteudo** de cada anexo durante a sincronizacao e faz upload para o bucket `email-anexos` no Supabase Storage. Salva a `url_storage` nos metadados do anexo no campo JSON `anexos` |
| Armazenamento de metadados | Campo `anexos` (JSON) contem: `{ nome, tipo, tamanho, part, uid }` | Campo `anexos` (JSON) contem: `{ nome, tipo, tamanho, part, uid, url_storage }` -- o campo `url_storage` e a URL publica do arquivo no Storage |
| Exibicao no frontend | `email-preview.tsx` usa `getAnexoUrl()` que monta URL `/api/emails/attachment?uid=X&part=Y...`. Cada visualizacao abre conexao IMAP (lento, ~2-3s) | `email-preview.tsx` usa diretamente `anexo.url_storage` para exibir imagens inline, abrir em nova aba e download. Acesso instantaneo via CDN do Storage |
| Processamento com Gemini | `process/route.ts` usa funcao `baixarAnexo(uid, part)` que conecta ao IMAP para baixar cada anexo | `process/route.ts` busca o anexo via URL do Storage (fetch HTTP simples), eliminando conexao IMAP |
| Aprovacao de email | `[id]/page.tsx` busca anexo via `/api/emails/attachment` do IMAP e depois faz upload para bucket `notas-compras` | `[id]/page.tsx` busca anexo diretamente da `url_storage` no Storage (ja esta la). Upload para `notas-compras` continua igual (copia do `email-anexos` para `notas-compras`) |
| Rotas API de anexo | 2 rotas IMAP: `attachment/route.ts` (GET) e `download-attachment/route.ts` (POST), ambas conectam ao IMAP | Removidas apos migracao -- nao sao mais necessarias |
| Emails antigos | Anexos so acessiveis via IMAP (dependencia do servidor de email) | Script de migracao baixa todos os anexos antigos do IMAP e salva no Storage, atualizando os metadados com `url_storage` |

### 3.2 UI Proposta

N/A -- alteracao sem impacto visual. O usuario vera os mesmos anexos, com as mesmas acoes (preview, abrir em nova aba, download). A unica diferenca perceptivel sera a **velocidade** de carregamento (instantaneo via Storage vs ~2-3s via IMAP).

### 3.3 Arquivos Afetados

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/api/emails/sync/route.ts` | Apos extrair metadados dos anexos, baixar o conteudo de cada anexo via `client.download()` e fazer upload para bucket `email-anexos` no Supabase Storage. Adicionar `url_storage` aos metadados de cada anexo. Usar a mesma conexao IMAP ja aberta (sem conexoes extras) |
| MODIFICAR | `src/components/features/emails/email-preview.tsx` | Substituir `getAnexoUrl()` (que montava URL IMAP) por acesso direto a `anexo.url_storage`. Atualizar o tipo do anexo para incluir `url_storage`. Atualizar todos os pontos que usam `getAnexoUrl`: img src, href de nova aba, href de download |
| MODIFICAR | `src/app/api/emails/process/route.ts` | Substituir funcao `baixarAnexo(uid, part)` (que conectava ao IMAP) por fetch HTTP da `url_storage`. Eliminar a dependencia de ImapFlow neste arquivo |
| MODIFICAR | `src/app/(dashboard)/emails/[id]/page.tsx` | No `handleAprovar`, substituir o fetch via `/api/emails/attachment` por fetch da `url_storage` do anexo. O upload para `notas-compras` continua igual |
| MODIFICAR | `src/components/features/emails/email-card.tsx` | O tipo de `anexos` ja referencia `url_storage` (linha 28). Nenhuma mudanca funcional, apenas consistencia de tipo |
| CRIAR | `scripts/migrate-email-attachments.ts` | Script Node.js que busca todos os emails com anexos que nao tem `url_storage`, conecta ao IMAP, baixa cada anexo, faz upload para o Storage, e atualiza o campo `anexos` no banco. Executado uma unica vez |
| REMOVER | `src/app/api/emails/attachment/route.ts` | Rota GET que baixava anexo do IMAP sob demanda. Removida apos migracao |
| REMOVER | `src/app/api/emails/download-attachment/route.ts` | Rota POST que baixava anexo do IMAP e retornava base64. Nao e referenciada em nenhum arquivo. Removida |

### 3.4 Fluxo de Dados

#### Fluxo da sincronizacao (novos emails)

1. Rota `POST /api/emails/sync` conecta ao IMAP e faz `client.fetch()` com `{ envelope, bodyStructure, uid }`
2. Para cada email, percorre a `bodyStructure` identificando anexos (igual ao atual)
3. **NOVO:** Para cada anexo encontrado, usa `client.download(uid, part, { uid: true })` para baixar o conteudo (dentro do mesmo lock IMAP ja aberto)
4. **NOVO:** Converte o stream para Buffer
5. **NOVO:** Faz upload do Buffer para Supabase Storage no bucket `email-anexos`, path `{email_id_externo}/{nome_arquivo}`
6. **NOVO:** Obtem a URL publica via `getPublicUrl()`
7. **NOVO:** Adiciona `url_storage` ao objeto de metadados do anexo
8. Insere o email na tabela `emails_monitorados` com o campo `anexos` contendo os metadados atualizados (com `url_storage`)

#### Fluxo de exibicao (frontend)

1. Usuario abre pagina `/emails/[id]`
2. `email-preview.tsx` recebe o email com campo `anexos` contendo `url_storage`
3. Imagens inline usam `<img src={anexo.url_storage}>` -- carregamento instantaneo via CDN
4. Botao "Abrir em nova aba" usa `<a href={anexo.url_storage} target="_blank">`
5. Botao "Download" usa `<a href={anexo.url_storage} download={anexo.nome}>`

#### Fluxo de processamento (Gemini)

1. Rota `POST /api/emails/process` busca emails pendentes no banco
2. Para cada email, le os metadados dos anexos do campo `anexos`
3. **NOVO:** Busca o conteudo do anexo via `fetch(anexo.url_storage)` -- HTTP simples, sem IMAP
4. Converte para Buffer e processa com Gemini (igual ao atual)

#### Fluxo de migracao (emails antigos -- executado uma vez)

1. Script busca todos os emails que tem anexos sem `url_storage`
2. Conecta ao IMAP
3. Para cada email, para cada anexo, baixa via `client.download(uid, part)`
4. Faz upload para Storage no bucket `email-anexos`
5. Atualiza o campo `anexos` no banco com `url_storage`
6. Ao final, exibe relatorio de sucesso/falha

### 3.5 Banco de Dados

Nenhuma alteracao de schema necessaria.

- O campo `anexos` e do tipo `Json | null` e ja aceita qualquer estrutura. A adicao de `url_storage` como propriedade do objeto JSON nao requer migracao DDL
- O bucket `email-anexos` precisa ser criado no Supabase Storage (via dashboard ou SQL)

```sql
-- Criar bucket publico para anexos de email
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-anexos', 'email-anexos', true);
```

### 3.6 Impacto Cross-Domain

**Dominio financeiro (impacto leve):** O fluxo de aprovacao de email (`[id]/page.tsx`) que copia anexos para o bucket `notas-compras` sera atualizado para buscar do Storage em vez do IMAP. A logica de upload para `notas-compras` permanece identica -- muda apenas a origem (de IMAP para Storage).

Nenhum outro dominio e afetado.

---

## 4. Decisoes Importantes

| # | Decisao | Motivo |
|---|---------|--------|
| 1 | Bucket separado `email-anexos` (nao reutilizar `notas-compras`) | Propositos diferentes: `email-anexos` armazena anexos brutos da sincronizacao; `notas-compras` armazena documentos aprovados pelo usuario. Separacao facilita limpeza e controle de acesso futuro |
| 2 | Migrar emails antigos via script | Garante que todos os anexos estejam no Storage, permitindo remocao completa das rotas IMAP legadas |
| 3 | Remover rotas IMAP legadas apos migracao | Codigo morto gera confusao. Com todos os anexos migrados, nao ha cenario de fallback. A rota `download-attachment` nem era referenciada no codigo |
| 4 | Sem limite de tamanho para anexos | O Supabase ja tem limite padrao de 50MB por arquivo. Anexos de email raramente excedem esse valor |
| 5 | Estrutura de pastas `{email_id_externo}/{nome_arquivo}` | Agrupa anexos por email, facilita limpeza e evita colisao de nomes |
| 6 | Baixar anexos na mesma conexao IMAP da sync (sem conexoes extras) | O lock do INBOX ja esta aberto durante a sincronizacao. Reutilizar a conexao e mais eficiente do que abrir novas |
| 7 | Bucket publico | Anexos de email precisam ser acessiveis via URL publica para exibicao no frontend (imagens inline, preview de PDF). Seguranca por obscuridade via path unico (`email_id/nome`) |

---

## 5. Checkpoints

#### Checkpoint 2026-02-12
**Status atual:** Proposta de implementacao completa, aguardando aprovacao
**Decisoes tomadas:**
- Bucket separado `email-anexos`, publico
- Migrar emails antigos via script
- Remover rotas IMAP legadas apos migracao
- Sem limite de tamanho, estrutura `{email_id}/{nome}`
- Reutilizar conexao IMAP aberta na sync

**Proximo passo:** Aprovacao da proposta pelo usuario -> Criar spec-alteracao07.md
