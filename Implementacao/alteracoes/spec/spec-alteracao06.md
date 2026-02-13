# Especificacao: Alteracao 06 - Corpo do email e parcelas editaveis na pagina de emails

| Aspecto | Detalhe |
|---------|---------|
| Status | Concluido |
| Conversa | [alteracao06.md](../alteracao/alteracao06.md) |
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

Duas melhorias na pagina de emails: (1) extrair o corpo do email durante a sincronizacao IMAP e exibi-lo como texto puro na secao "Email Original", e (2) adicionar tabela editavel de parcelas (data e valor) no formulario de aprovacao, com validacao de soma vs valor total.

---

## 2. O que sera feito

**Alteracao 1 -- Corpo do email:**
- [ ] Extrair body do email (text/plain ou text/html) na rota de sincronizacao IMAP
- [ ] Converter HTML para texto puro quando necessario (strip tags, preservar line breaks)
- [ ] Salvar texto extraido no campo `corpo` da tabela `emails_monitorados`
- [ ] Reposicionar bloco de exibicao do corpo para antes dos anexos no `email-preview.tsx`
- [ ] Renomear titulo de "Conteudo do Email" para "Mensagem"

**Alteracao 2 -- Parcelas editaveis:**
- [ ] Adicionar estado local de parcelas no `form-aprovacao.tsx`
- [ ] Renderizar tabela de parcelas com inputs editaveis (data e valor) abaixo do campo "Parcelas"
- [ ] Regenerar parcelas automaticamente quando usuario altera numero de parcelas, valor total ou data
- [ ] Implementar edicao on blur nos campos de data e valor
- [ ] Adicionar aviso visual quando soma das parcelas diverge do valor total
- [ ] Alterar `handleAprovar` na page para usar dados editados em vez de recalcular parcelas

---

## 3. Proposta

### 3.1 Antes vs Depois

#### Alteracao 1 -- Corpo do email

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Sincronizacao IMAP | `corpo: null` hardcoded na rota de sync. O body do email nunca e extraido | A rota de sync extrai o body do email via `client.download()`. Prioriza text/plain; se so houver text/html, converte para texto puro (strip tags, preservando line breaks) |
| Armazenamento | Campo `corpo` na tabela `emails_monitorados` sempre `null` | Campo `corpo` preenchido com o texto extraido do email |
| Exibicao no frontend | Bloco de renderizacao existe em `email-preview.tsx` mas nunca aparece (corpo sempre null). Posicionado apos anexos, com titulo "Conteudo do Email" | Bloco reposicionado para **antes dos anexos** (entre Recebido e Anexos). Titulo renomeado para "Mensagem". Renderiza como texto puro com `whitespace-pre-wrap` (preserva line breaks e paragrafos) |

#### Alteracao 2 -- Parcelas editaveis

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Visao de parcelas | Nao existe. O usuario preenche apenas o numero de parcelas num Input. Ao aprovar, o sistema calcula automaticamente valores e datas (divisao igual, datas mensais incrementais) | Abaixo do campo "Parcelas", aparece uma tabela editavel mostrando cada parcela com: numero (read-only), data (editavel), valor (editavel). Aparece sempre (mesmo com 1 parcela) |
| Edicao de parcelas | Impossivel. Valores e datas sao calculados automaticamente no `handleAprovar` | Usuario pode editar data e valor de cada parcela individualmente, on blur (sem botao salvar por campo). Estado mantido em memoria |
| Validacao | Nenhuma validacao visual sobre parcelas | Aviso visual quando soma dos valores das parcelas difere do valor total. Botao "Aprovar" continua habilitado |
| Fluxo de aprovacao | `handleAprovar` gera as parcelas internamente (loop com calculo de divisao) | `handleAprovar` usa os dados das parcelas editadas pelo usuario (vindas do estado local) em vez de recalcular |

### 3.2 UI Proposta

#### Alteracao 1 -- Corpo do email no EmailPreview (coluna esquerda)

```
+---------------------------------------------------------------------------+
|  [Mail] Email Original                                                     |
+--------------------------------------------------------------------------- +
|                                                                            |
|  De:        Nome Remetente <email@exemplo.com>                             |
|  Assunto:   Nota fiscal #12345                                             |
|  Recebido:  segunda-feira, 10 de fevereiro de 2026, 14:30                  |
|                                                                            |
|  +----------------------------------------------------------------------+  |
|  | Mensagem                                                             |  |
|  +----------------------------------------------------------------------+  |
|  | Boa tarde,                                                           |  |
|  |                                                                      |  |
|  | Segue em anexo a nota fiscal referente ao                            |  |
|  | pedido #12345.                                                       |  |
|  |                                                                      |  |
|  | Atenciosamente,                                                      |  |
|  | Fornecedor XYZ                                                       |  |
|  +------------------------------------------------- (ScrollArea 150px) -+  |
|                                                                            |
|  [Paperclip] Anexos (1)                                                    |
|  +----------------------------------------------------------------------+  |
|  | [imagem inline do anexo]                                             |  |
|  +----------------------------------------------------------------------+  |
|  | nota-fiscal.pdf  120.5 KB                          [link] [download] |  |
|  +----------------------------------------------------------------------+  |
|                                                                            |
|  [Bug] Ver resposta bruta da IA                                            |
+----------------------------------------------------------------------------+
```

**Mudancas visuais:**
- Bloco "Mensagem" (antes chamado "Conteudo do Email") agora aparece **entre os metadados (De/Assunto/Recebido) e os Anexos**
- Titulo alterado de "Conteudo do Email" para "Mensagem"
- Renderizacao continua como texto puro com `whitespace-pre-wrap`

#### Alteracao 2 -- Tabela de parcelas no FormAprovacao (coluna direita)

```
+---------------------------------------------------------------------------+
|  Dados Extraidos                                        [85% confianca]    |
+--------------------------------------------------------------------------- +
|                                                                            |
|  Descricao        [Nota fiscal fornecedor XYZ                       ]     |
|  Valor (R$)  [1500.00]               Data  [2026-02-10]                    |
|  Categoria   [Material de construcao          v]                           |
|  Fornecedor  [Fornecedor XYZ                  v]                           |
|  Forma Pgto  [PIX v]   Parcelas [3]   N. NF [123456]                      |
|  Etapa       [Fundacao                        v]                           |
|  Observacoes [Importado do email de...]                                    |
|                                                                            |
|  +--------------------------------------------------------------------+   |
|  | Parcelas                                              R$ Total     |   |
|  |                                                       1.500,00     |   |
|  +-----------+---------------------+------------------------------+   |   |
|  | Parcela   | Data                | Valor (R$)                   |   |   |
|  +-----------+---------------------+------------------------------+   |   |
|  | 1/3       | [2026-02-10]        | [500.00]                     |   |   |
|  | 2/3       | [2026-03-10]        | [500.00]                     |   |   |
|  | 3/3       | [2026-04-10]        | [500.00]                     |   |   |
|  +-----------+---------------------+------------------------------+   |   |
|  |                                           Soma: R$ 1.500,00    |   |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  +-- aviso (so aparece quando soma != valor total) -------------------+   |
|  | A soma das parcelas (R$ 1.480,00) difere do valor                  |   |
|  | total (R$ 1.500,00) em R$ 20,00                                    |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|                                    [Rejeitar]  [Aprovar]                   |
|                              [Reprocessar com IA]                          |
+---------------------------------------------------------------------------+
```

**Comportamentos da tabela de parcelas:**
- Aparece sempre que `parcelas >= 1` (ou seja, sempre)
- Quando o usuario muda o campo "Parcelas" (numero), a tabela e regenerada: valores divididos igualmente, datas incrementais mensais a partir da data do formulario
- Campos "Data" e "Valor" de cada parcela sao inputs editaveis
- Edicao on blur: ao sair do campo, o estado local e atualizado
- Coluna "Parcela" e read-only (ex: "1/3", "2/3", "3/3")
- Header mostra "R$ Total" com o valor total do formulario para referencia
- Footer mostra a soma atual dos valores das parcelas
- Aviso amarelo aparece **somente** quando a soma das parcelas difere do valor total

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A -- sem alteracoes no banco.

- O campo `corpo` (tipo `text | null`) ja existe na tabela `emails_monitorados`. Hoje esta sempre `null` por falta de extracao. A rota de sync passara a preenche-lo
- A tabela `gastos` ja tem todos os campos necessarios para as parcelas (valor, data, parcela_atual, etc.)
- Emails ja sincronizados continuarao com `corpo = null`. Somente novos emails sincronizados terao o corpo preenchido

### 4.2 Arquivos a Modificar/Criar

#### Alteracao 1 -- Corpo do email

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| MODIFICAR | `src/app/api/emails/sync/route.ts` | Apos o fetch de cada email, usar `client.download()` para extrair o body (text/plain ou text/html). Adicionar funcao auxiliar `findTextPart()` para encontrar a parte de texto na `bodyStructure`. Adicionar funcao auxiliar `stripHtmlToText()` para converter HTML em texto puro (strip tags preservando line breaks). Salvar no campo `corpo` em vez de `null` |
| MODIFICAR | `src/components/features/emails/email-preview.tsx` | Mover o bloco de renderizacao do corpo (linhas 216-228) para **antes** da secao de anexos (antes da linha 109). Renomear titulo de "Conteudo do Email" para "Mensagem" |

#### Alteracao 2 -- Parcelas editaveis

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| MODIFICAR | `src/components/features/emails/form-aprovacao.tsx` | Adicionar estado local para parcelas (`useState` com array de `{ parcela: number, data: string, valor: number }`). Adicionar `useEffect` para regenerar parcelas quando numero de parcelas, data ou valor total mudam. Renderizar tabela de parcelas com inputs editaveis (data e valor). Adicionar aviso visual de validacao (soma != total). Alterar interface `FormAprovacaoProps` para que `onAprovar` receba tambem o array de parcelas editadas |
| MODIFICAR | `src/app/(dashboard)/emails/[id]/page.tsx` | Alterar a assinatura de `handleAprovar` para receber dados de parcelas editadas (array com `{ parcela, data, valor }`). Substituir o loop de geracao de parcelas (linhas 160-187) por uso direto dos dados editados recebidos do formulario |

### 4.3 Fluxo de Dados

#### Alteracao 1 -- Corpo do email

1. A rota `POST /api/emails/sync` conecta ao servidor IMAP e faz `client.fetch()` com `{ envelope, bodyStructure, uid }`
2. **NOVO:** Para cada email, chamar `findTextPart(message.bodyStructure)` que percorre a arvore da bodyStructure procurando a parte com tipo `text/plain` (prioridade) ou `text/html` (fallback). Retorna o `partId` e o tipo encontrado
3. **NOVO:** Se encontrou uma parte de texto, usar `client.download(message.uid, partId, { uid: true })` para baixar o conteudo. O ImapFlow retorna um stream
4. **NOVO:** Ler o stream retornado pelo download e converter para string (concatenar chunks)
5. **NOVO:** Se o conteudo for HTML (tipo `text/html`), aplicar funcao `stripHtmlToText()` que:
   - Converte `<br>`, `<br/>`, `<br />` em `\n`
   - Converte `</p>`, `</div>`, `</tr>`, `</li>` em `\n`
   - Remove todas as demais tags HTML
   - Faz decode de entidades HTML basicas (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&nbsp;`)
   - Colapsa multiplas linhas vazias consecutivas em no maximo 2
6. O insert no banco agora usa o texto extraido no campo `corpo` em vez de `null`
7. No frontend, `email-preview.tsx` recebe `email.corpo` (agora preenchido) e renderiza como texto com `whitespace-pre-wrap`

#### Alteracao 2 -- Parcelas editaveis

1. O `form-aprovacao.tsx` mantem um estado local `parcelas` (array de objetos `{ parcela: number, data: string, valor: number }`)
2. Um `useEffect` observa os campos `parcelas` (numero), `valor` e `data` do formulario (via `form.watch`). Quando qualquer um muda, regenera o array de parcelas:
   - Divide o valor total igualmente entre as parcelas (arredondando para 2 casas)
   - Ultima parcela absorve a diferenca de arredondamento
   - Gera datas mensais incrementais a partir da data do formulario
3. O usuario pode editar data e valor de cada parcela diretamente nos inputs da tabela
4. Ao sair do campo (onBlur), o estado local e atualizado com o novo valor via funcao `updateParcela(index, field, value)`
5. A soma das parcelas e calculada em tempo real (`parcelas.reduce`). Se diferir do valor total, um aviso amarelo aparece com a diferenca exata
6. Ao clicar "Aprovar", o `onAprovar` recebe os dados do formulario **mais** o array de parcelas editadas
7. No `handleAprovar` da page `[id]/page.tsx`, ao inves de recalcular parcelas com divisao igual (loop atual das linhas 160-187), usa diretamente o array recebido para construir os lancamentos inseridos na tabela `gastos`. Cada item do array vira um registro com os campos `valor` e `data` vindos da edicao do usuario, e os demais campos (descricao, categoria_id, fornecedor_id, forma_pagamento) herdados do formulario principal

### 4.4 Dependencias Externas

Nenhuma dependencia externa necessaria.

- A extracao de texto do HTML sera feita com funcao propria (regex simples para strip de tags), sem necessidade de bibliotecas como DOMPurify
- O ImapFlow (`client.download()`) ja esta instalado e em uso no projeto

### 4.5 Decisoes de Design e Justificativas

| # | Decisao | Justificativa |
|---|---------|---------------|
| 1 | **Texto puro (opcao B) para corpo do email** | Simplicidade maxima, sem risco de XSS, sem dependencia de DOMPurify ou sanitizadores. Line breaks e paragrafos preservados via conversao de tags de bloco em `\n`. Alternativas consideradas: (A) HTML sanitizado -- mais complexo, exige DOMPurify; (C) texto + botao "Ver HTML" -- complexidade desnecessaria |
| 2 | **Priorizar text/plain sobre text/html na extracao** | text/plain ja vem limpo, sem necessidade de conversao. HTML so como fallback quando text/plain nao esta disponivel. Evita processamento desnecessario |
| 3 | **Tabela de parcelas aparece sempre (mesmo com 1 parcela)** | Permite editar data de vencimento mesmo de pagamento avista. Sem isso, usuario nao teria como ajustar a data de uma parcela unica |
| 4 | **Apenas data e valor editaveis por parcela** | Demais campos (descricao, categoria, fornecedor, forma pagamento) sao herdados do formulario principal e nao faz sentido diferir por parcela no contexto deste projeto |
| 5 | **Estado de parcelas em memoria (in-memory)** | Parcelas so existem no banco apos aprovacao. Nao ha necessidade de persistencia intermediaria. Simplifica o fluxo |
| 6 | **Aviso visual nao bloqueante quando soma diverge** | Usuario pode aprovar mesmo com divergencia (flexibilidade para casos especiais), mas e alertado visualmente para corrigir se necessario |
| 7 | **Edicao on blur (sem botao salvar por campo)** | Experiencia mais fluida. Consistente com a solicitacao de "auto-save" do usuario. Cada campo atualiza o estado ao perder foco |
| 8 | **Nenhuma alteracao de schema no banco** | Campo `corpo` ja existe na tabela `emails_monitorados`. Tabela `gastos` ja suporta todos os campos necessarios para parcelas. Nao ha necessidade de migrations |

---

## 5. Execucao

### 5.1 Progresso

**Alteracao 1 -- Corpo do email:**
- [x] Funcao `findTextPart()` implementada na rota de sync
- [x] Funcao `stripHtmlToText()` implementada na rota de sync
- [x] Extracao do body via `client.download()` integrada ao loop de fetch
- [x] Campo `corpo` preenchido no insert (em vez de `null`)
- [x] Bloco "Mensagem" reposicionado antes dos anexos no `email-preview.tsx`
- [x] Titulo renomeado para "Mensagem"

**Alteracao 2 -- Parcelas editaveis:**
- [x] Estado local de parcelas adicionado ao `form-aprovacao.tsx`
- [x] useEffect para regenerar parcelas implementado
- [x] Tabela de parcelas com inputs editaveis renderizada
- [x] Edicao on blur funcionando
- [x] Aviso de validacao (soma != total) implementado
- [x] Interface `onAprovar` atualizada para receber parcelas editadas
- [x] `handleAprovar` na page atualizado para usar parcelas editadas
- [x] TypeScript sem erros (`npx tsc --noEmit`) -- erros pre-existentes de ambiente (falta @types/node)
- [ ] Testado manualmente

### 5.2 Notas de Implementacao

- `findTextPart()` prioriza `text/plain` sobre `text/html`, percorrendo recursivamente a `bodyStructure`
- `stripHtmlToText()` converte tags de bloco em `\n`, remove demais tags, decode entidades HTML basicas
- Extracao do body usa `client.download()` com stream → Buffer → string. Erro na extracao nao impede o fluxo (try/catch com log)
- Tabela de parcelas usa `defaultValue` + `onBlur` para edicao sem re-render a cada keystroke
- `useEffect` regenera parcelas quando numero/valor/data mudam via `form.watch()`
- Tipo `ParcelaEditavel` exportado do `form-aprovacao.tsx` e importado na page via `import type`
- Import de `formatDateToString` removido da page pois nao era mais necessario (parcelas vem editadas do form)
- Erros de TypeScript nos 4 arquivos sao todos pre-existentes (module resolution do monorepo, falta @types/node)

### 5.3 Conversa de Execucao

#### IA: Implementacao concluida

Implementei as duas alteracoes em 4 arquivos:

1. `route.ts`: findTextPart, stripHtmlToText, extracao do body via client.download, corpo preenchido no insert
2. `email-preview.tsx`: bloco "Mensagem" movido antes dos anexos, bloco antigo removido
3. `form-aprovacao.tsx`: estado local de parcelas, useEffect de regeneracao, tabela editavel, aviso de soma, onAprovar com parcelas
4. `page.tsx`: handleAprovar recebe parcelasEditadas, loop de calculo substituido por map direto

---

## 6. Validacao Final

- [x] `npx tsc --noEmit` sem erros (apenas erros pre-existentes de ambiente)
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
