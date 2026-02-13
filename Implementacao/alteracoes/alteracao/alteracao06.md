# Alteracao 06 - Melhorias na pagina de emails: corpo do email e parcelas editaveis

| Aspecto | Detalhe |
|---------|---------|
| Status | Especificacao criada |
| Origem | Solicitacao do usuario |
| Complexidade | Media |
| Especificacao | [spec-alteracao06.md](../spec/spec-alteracao06.md) |

**Status possiveis:**
- Em planejamento
- Especificacao criada -> ver [spec-alteracao06.md](../spec/spec-alteracao06.md)

---

## 1. Ideia Inicial

Duas alteracoes na pagina de emails (/emails):

**Alteracao 1 - Corpo do email em "Email Original":**
- Hoje a secao "Email Original" mostra: De, Assunto, Recebido, Anexos e Resposta da IA
- Adicionar campo "Mensagem" com o corpo/conteudo do email
- Posicao: antes de "Anexos"
- O corpo pode ser HTML ou texto puro

**Alteracao 2 - Visao de parcelas editaveis em "Dados Extraidos":**
- Quando o tipo selecionado e "parcelas" nos dados extraidos, mostrar uma visao das parcelas que serao criadas
- Todos os campos devem ser editaveis, EXCETO numero da parcela (read-only)
- Validacao: soma do valor das parcelas deve ser igual ao "valor total"
- Edicao ANTES de salvar (ajustar antes de criar as parcelas no sistema)
- Salvar automaticamente ao alterar cada campo (auto-save nos campos)

---

## 2. Conversa de Planejamento

#### usuario: Descricao das duas alteracoes acima

#### IA: Analise do codigo existente e perguntas de esclarecimento

Analisei os seguintes arquivos do projeto:

- `email-preview.tsx` - Componente "Email Original" (coluna esquerda)
- `form-aprovacao.tsx` - Componente "Dados Extraidos" (coluna direita)
- `emails/[id]/page.tsx` - Pagina de detalhes do email
- `api/emails/process/route.ts` - API de processamento de emails via Gemini
- `database.ts` - Tipos do banco (tabelas `emails_monitorados`, `gastos`, `compras`)

**Sobre a Alteracao 1 (corpo do email):**

Identifiquei que o campo `corpo` ja existe na tabela `emails_monitorados` (tipo `string | null`) e ja esta sendo exibido no `email-preview.tsx` (linhas 217-228), porem esta posicionado APOS os anexos. O codigo atual:

```
{email.corpo && (
  <div className="border rounded-lg">
    <div className="p-2 bg-muted/50 border-b text-xs text-muted-foreground">
      Conteudo do Email
    </div>
    <ScrollArea className="h-[150px] p-3">
      <div className="text-sm whitespace-pre-wrap">
        {email.corpo}
      </div>
    </ScrollArea>
  </div>
)}
```

Porem, o corpo e renderizado como texto puro (`whitespace-pre-wrap`). Preciso verificar como o campo `corpo` e preenchido na sincronizacao para saber se pode conter HTML.

**Perguntas sobre a Alteracao 1:**

1. O corpo ja esta sendo exibido, mas depois dos anexos e com titulo "Conteudo do Email". A alteracao seria apenas **reposicionar** para antes dos anexos e renomear para "Mensagem"? Ou ha algo mais?
2. Se o corpo vier em HTML, deseja renderizar o HTML (com sanitizacao para seguranca) ou preferir extrair apenas o texto?

---

**Sobre a Alteracao 2 (parcelas editaveis):**

Analisei o fluxo atual de criacao de parcelas no `handleAprovar` da page `[id]/page.tsx`:

- O usuario preenche o campo "Parcelas" (numero, ex: 3)
- Ao aprovar, o sistema divide o `valor_total` igualmente entre as parcelas
- As datas sao incrementais mensais a partir da data informada
- Cada parcela herda: descricao, categoria_id, fornecedor_id, forma_pagamento
- A ultima parcela absorve a diferenca de arredondamento

Porem, **nao existe** hoje um conceito de "tipo parcelas" nos dados extraidos. O campo `parcelas` no formulario e apenas um `<Input type="number">` com o numero de parcelas.

**Perguntas sobre a Alteracao 2:**

3. Quando voce diz "quando o tipo selecionado e 'parcelas'", o que exatamente dispara essa visao? Seria quando o campo "Parcelas" no formulario tem valor maior que 1? Ou existe uma selecao de tipo que precisa ser criada?

r: mesmo sendo somente 1 parcela, teria que mostra essa parcela, para poder editar a data de vencimento

por tipo, eu quis dizer 'pix, cartão de crédito, etc', mas isso é indiferente para nossa alteração. o que importa é realmente o número de parcelas

4. Quais campos de cada parcela devem ser editaveis? Pelo que vi, cada parcela (registro em `gastos`) tem: descricao, valor, data, categoria_id, fornecedor_id, forma_pagamento. Quais desses o usuario deve poder editar individualmente por parcela?

r: data e valor. Lembrando que temos que validar que a soma de todas parcelas seja igual ao valor do documento

5. O "auto-save" ao alterar campos -- salvar onde? As parcelas ainda nao existem no banco neste momento (sao criadas apenas ao aprovar). O auto-save seria atualizar o estado local (in-memory) para que ao clicar "Aprovar" use os valores editados? Ou espera-se salvar em algum lugar intermediario?

r: isso, salvar no estado local (in memory), para depois registrar tudo no banco

6. A validacao "soma das parcelas = valor total" -- se o usuario alterar o valor de uma parcela, o que acontece? Aparece um alerta impedindo de aprovar? Ou o sistema redistribui automaticamente os valores?

r: o botão de salvar deve mudar para 'blur', e ter um pequeno aviso em algum lugar que a soma das parcelas está diferente do valor total

---

#### usuario: Investigacao revelou causa raiz do corpo nao aparecer

Investigamos o problema e descobrimos a causa raiz: na rota de sincronizacao IMAP (`api/emails/sync/route.ts`, linha 128), o campo `corpo` esta **hardcoded como `null`**:

```typescript
corpo: null,  // <-- nunca extrai o body do email IMAP
```

O componente `email-preview.tsx` ja tem o codigo de renderizacao (`{email.corpo && (...)}`), mas como `corpo` e sempre `null` no banco, nada aparece. O foco agora e apenas na **Alteracao 1** (corpo do email). As perguntas da Alteracao 2 (parcelas) ficam pendentes.

---

#### IA: Causa raiz identificada -- corpo nunca e extraido do IMAP; proposta de implementacao

A descoberta responde as duas perguntas que eu havia feito sobre a Alteracao 1:

**Pergunta 1** (reposicionar ou algo mais?) -- Agora sabemos que **nao e apenas reposicionar**. O problema real e que o corpo **nunca e extraido** do email IMAP. A rota de sync busca apenas `envelope` e `bodyStructure` (metadados), mas nunca faz `download` do conteudo textual da mensagem. Portanto a alteracao precisa:
- **Backend**: Extrair o body (text/plain ou text/html) durante a sincronizacao IMAP
- **Frontend**: Reposicionar e ajustar a renderizacao (ja existe, so precisa mover e tratar HTML)

**Pergunta 2** (HTML ou texto?) -- Como o ImapFlow retorna o conteudo real do email, podemos receber tanto `text/plain` quanto `text/html`. A maioria dos emails modernos envia HTML. A proposta e:
- Priorizar `text/plain` quando disponivel (mais leve, sem riscos de seguranca)
- Usar `text/html` como fallback quando so houver HTML
- Quando for HTML, sanitizar antes de renderizar (remover scripts, iframes, etc.)

Analisei a rota `api/emails/sync/route.ts` em detalhe. Atualmente o `client.fetch()` usa:

```typescript
client.fetch(
  { seen: false, since },
  { envelope: true, bodyStructure: true, uid: true }
)
```

Para extrair o corpo, precisamos de uma chamada separada apos o fetch, usando `client.download()` do ImapFlow, que permite baixar partes especificas da mensagem (text/plain ou text/html) identificadas pela `bodyStructure`.

O fluxo seria:
1. O fetch atual ja traz `bodyStructure` -- nela identificamos as partes text/plain e text/html
2. Apos o fetch, usamos `client.download(message.uid, partId)` para baixar o conteudo textual
3. Salvamos no campo `corpo` da tabela `emails_monitorados`

Sobre a renderizacao no frontend, preciso de uma resposta para prosseguir com a proposta completa:

**Quando o corpo for HTML, prefere:**
- **(A)** Renderizar o HTML sanitizado (visual fiel ao email original, usando `dangerouslySetInnerHTML` + biblioteca de sanitizacao como DOMPurify)
- **(B)** Extrair apenas o texto do HTML (mais simples, sem risco, mas perde formatacao)
- **(C)** Mostrar como texto por padrao com opcao de "Ver HTML" num botao separado

---

#### usuario: Respostas a todas as perguntas pendentes

respondi cada pergunta abaixo dela, com um 'r:'

para a pergunta sobre HTML, pode mostrar a opção B, texto sem formatação. Os line breaks e parágrafos, conseguimos manter, certo?

**Respostas da Alteracao 2:**
- P3: Mesmo com 1 parcela, mostrar a visao para editar data de vencimento. "Tipo" referia-se a forma de pagamento, mas e indiferente.
- P4: Campos editaveis por parcela: **data e valor** apenas. Validar soma = valor total.
- P5: Auto-save em estado local (in-memory), salvar tudo no banco ao aprovar.
- P6: Botao de salvar muda para blur. Aviso quando soma das parcelas diverge do valor total.

---

#### IA: Todas as respostas recebidas -- confirmacao e preparacao da proposta

**Alteracao 1 -- Corpo do email:**
Confirmado. Opcao **(B)** -- texto sem formatacao HTML. Sim, line breaks e paragrafos serao mantidos. Na pratica, quando o email vier em HTML, usaremos uma funcao para extrair apenas o texto, convertendo `<br>`, `<p>`, `<div>` em quebras de linha (`\n`), e removendo todas as tags HTML. O resultado e exibido com `whitespace-pre-wrap` (que ja e o estilo atual no componente), preservando paragrafos e line breaks naturais.

**Alteracao 2 -- Parcelas editaveis:**
Entendido o fluxo completo:

1. **Sempre mostrar a visao de parcelas** (mesmo com 1 parcela), para permitir editar data de vencimento
2. **Campos editaveis:** apenas data e valor por parcela
3. **Estado local:** as parcelas sao geradas em memoria quando o usuario altera o numero de parcelas (ou quando o formulario carrega com parcelas >= 1). Edicoes ficam em estado React local
4. **Validacao:** aviso visual quando soma dos valores das parcelas diverge do valor total. O botao "Aprovar" continua habilitado (nao bloqueia), mas o aviso fica visivel
5. **Auto-save on blur:** cada campo (data, valor) atualiza o estado local quando o usuario sai do campo (onBlur), sem necessidade de botao "salvar" por campo
6. **Ao aprovar:** o `handleAprovar` usa os dados editados das parcelas (em vez de recalcular dividindo igualmente)

Tenho todas as informacoes necessarias. Vou preencher a proposta de implementacao completa (secao 3) a seguir.

---

## 3. Proposta de Implementacao

**Status:** Aprovada -- spec criada em [spec-alteracao06.md](../spec/spec-alteracao06.md)

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
┌─────────────────────────────────────────────────────────────────────┐
│  [Mail] Email Original                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  De:        Nome Remetente <email@exemplo.com>                      │
│  Assunto:   Nota fiscal #12345                                      │
│  Recebido:  segunda-feira, 10 de fevereiro de 2026, 14:30           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Mensagem                                                       ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ Boa tarde,                                                     ││
│  │                                                                ││
│  │ Segue em anexo a nota fiscal referente ao                      ││
│  │ pedido #12345.                                                 ││
│  │                                                                ││
│  │ Atenciosamente,                                                ││
│  │ Fornecedor XYZ                                                 ││
│  └──────────────────────────────────────────── (ScrollArea 150px) ─┘│
│                                                                     │
│  [Paperclip] Anexos (1)                                             │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ [imagem inline do anexo]                                       ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ 📄 nota-fiscal.pdf  120.5 KB        [🔗] [⬇️]                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [Bug] Ver resposta bruta da IA                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Mudancas visuais:**
- Bloco "Mensagem" (antes chamado "Conteudo do Email") agora aparece **entre os metadados (De/Assunto/Recebido) e os Anexos**
- Titulo alterado de "Conteudo do Email" para "Mensagem"
- Renderizacao continua como texto puro com `whitespace-pre-wrap`

#### Alteracao 2 -- Tabela de parcelas no FormAprovacao (coluna direita)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dados Extraidos                                   [85% confianca]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Descricao        [Nota fiscal fornecedor XYZ               ]      │
│  Valor (R$)  [1500.00]         Data  [2026-02-10]                   │
│  Categoria   [Material de construcao  v]                            │
│  Fornecedor  [Fornecedor XYZ          v]                            │
│  Forma Pgto  [PIX v]  Parcelas [3]  N. NF [123456]                 │
│  Etapa       [Fundacao                v]                            │
│  Observacoes [Importado do email de...]                             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Parcelas                                            R$ Total │  │
│  │                                                     1.500,00 │  │
│  ├──────────┬────────────────────┬──────────────────────────────┤  │
│  │ Parcela  │ Data               │ Valor (R$)                   │  │
│  ├──────────┼────────────────────┼──────────────────────────────┤  │
│  │ 1/3      │ [2026-02-10]       │ [500.00]                     │  │
│  │ 2/3      │ [2026-03-10]       │ [500.00]                     │  │
│  │ 3/3      │ [2026-04-10]       │ [500.00]                     │  │
│  ├──────────┴────────────────────┴──────────────────────────────┤  │
│  │                                         Soma: R$ 1.500,00   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌ ⚠️  ────────────────────────────────────────────────────────────┐│
│  │ A soma das parcelas (R$ 1.480,00) difere do valor              ││
│  │ total (R$ 1.500,00) em R$ 20,00                                ││
│  └────────────────────────────────────────────────────────────────┘│
│  (aviso acima so aparece quando soma != valor total)               │
│                                                                     │
│                              [Rejeitar]  [Aprovar]                  │
│                        [Reprocessar com IA]                         │
└─────────────────────────────────────────────────────────────────────┘
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

### 3.3 Arquivos Afetados

#### Alteracao 1 -- Corpo do email

| Arquivo | Acao | O que muda |
|---------|------|------------|
| `src/app/api/emails/sync/route.ts` | MODIFICAR | Apos o fetch de cada email, usar `client.download()` para extrair o body (text/plain ou text/html). Adicionar funcao auxiliar para encontrar a parte de texto na `bodyStructure`. Se for HTML, converter para texto puro (strip tags preservando line breaks). Salvar no campo `corpo` em vez de `null` |
| `src/components/features/emails/email-preview.tsx` | MODIFICAR | Mover o bloco de renderizacao do corpo para **antes** da secao de anexos. Renomear titulo de "Conteudo do Email" para "Mensagem" |

#### Alteracao 2 -- Parcelas editaveis

| Arquivo | Acao | O que muda |
|---------|------|------------|
| `src/components/features/emails/form-aprovacao.tsx` | MODIFICAR | Adicionar estado local para parcelas (`useState` com array de `{ parcela: number, data: string, valor: number }`). Adicionar `useEffect` para regenerar parcelas quando numero de parcelas ou data ou valor total mudam. Renderizar tabela de parcelas com inputs editaveis (data e valor). Adicionar aviso visual de validacao (soma != total). Passar dados das parcelas editadas no `onAprovar` |
| `src/app/(dashboard)/emails/[id]/page.tsx` | MODIFICAR | Alterar a assinatura de `handleAprovar` para receber dados de parcelas editadas. Substituir o loop de geracao de parcelas por uso direto dos dados editados recebidos do formulario |

### 3.4 Fluxo de Dados

#### Alteracao 1 -- Corpo do email

1. A rota `POST /api/emails/sync` conecta ao servidor IMAP e faz `client.fetch()` com `{ envelope, bodyStructure, uid }`
2. **NOVO:** Para cada email, percorrer a `bodyStructure` procurando a parte com tipo `text/plain` (prioridade) ou `text/html` (fallback)
3. **NOVO:** Usar `client.download(message.uid, partId, { uid: true })` para baixar o conteudo da parte identificada
4. **NOVO:** Ler o stream retornado pelo download e converter para string
5. **NOVO:** Se o conteudo for HTML, aplicar funcao `stripHtmlToText()` que converte tags de bloco (`<br>`, `<p>`, `<div>`) em `\n` e remove todas as demais tags
6. O insert no banco agora usa o texto extraido no campo `corpo` em vez de `null`
7. No frontend, `email-preview.tsx` recebe `email.corpo` (agora preenchido) e renderiza como texto com `whitespace-pre-wrap`

#### Alteracao 2 -- Parcelas editaveis

1. O `form-aprovacao.tsx` mantem um estado local `parcelas` (array de objetos `{ parcela, data, valor }`)
2. Quando o formulario carrega (ou quando usuario altera campos "Parcelas", "Valor" ou "Data"), um `useEffect` regenera o array: divide o valor total igualmente, gera datas mensais incrementais
3. O usuario pode editar data e valor de cada parcela diretamente nos inputs da tabela
4. Ao sair do campo (onBlur), o estado local e atualizado com o novo valor
5. A soma das parcelas e calculada em tempo real. Se diferir do valor total, um aviso aparece
6. Ao clicar "Aprovar", o `onAprovar` recebe os dados do formulario **mais** o array de parcelas editadas
7. No `handleAprovar` da page `[id]/page.tsx`, ao inves de recalcular parcelas com divisao igual, usa diretamente o array recebido para construir os lancamentos inseridos na tabela `gastos`

### 3.5 Banco de Dados

Nenhuma alteracao de schema necessaria.

- O campo `corpo` (tipo `text | null`) ja existe na tabela `emails_monitorados`. Hoje esta sempre `null` por falta de extracao. A rota de sync passara a preenche-lo
- A tabela `gastos` ja tem todos os campos necessarios para as parcelas (valor, data, parcela_atual, etc.)
- Emails ja sincronizados continuarao com `corpo = null`. Somente novos emails sincronizados terao o corpo preenchido

### 3.6 Impacto Cross-Domain

**N/A** -- Nao existe arquivo `docs/mapa-dependencias.md` no projeto.

Analise manual de impacto:

- **Alteracao 1:** impacto isolado no dominio de emails. A rota de sync e o componente de preview sao os unicos afetados. Nenhum outro dominio consome o campo `corpo`
- **Alteracao 2:** impacto leve no fluxo email -> financeiro (gastos). A forma como as parcelas sao criadas na tabela `gastos` muda (de calculo automatico para dados editados pelo usuario), mas a estrutura dos dados inseridos permanece identica. Nenhuma outra tela ou service consome esses dados de forma diferente

---

## 4. Decisoes Importantes

| # | Decisao | Motivo |
|---|---------|--------|
| 1 | Opcao B -- texto sem formatacao para corpo do email | Simplicidade, sem risco de XSS, sem dependencia de DOMPurify. Line breaks preservados via strip de tags HTML |
| 2 | Priorizar text/plain sobre text/html na extracao | text/plain e mais limpo e nao requer conversao. HTML so como fallback |
| 3 | Tabela de parcelas aparece sempre (mesmo com 1 parcela) | Permite editar data de vencimento ate de pagamento avista |
| 4 | Apenas data e valor editaveis por parcela | Demais campos (descricao, categoria, fornecedor, forma pagamento) sao herdados do formulario principal -- nao faz sentido diferir por parcela |
| 5 | Estado de parcelas em memoria (in-memory) | Parcelas so existem no banco apos aprovacao. Nao ha necessidade de persistencia intermediaria |
| 6 | Aviso visual (nao bloqueante) quando soma diverge | Usuario pode aprovar mesmo com divergencia (flexibilidade), mas e alertado visualmente |
| 7 | Edicao on blur (sem botao salvar por campo) | Experiencia mais fluida, consistente com auto-save solicitado |
| 8 | Nenhuma alteracao de schema no banco | Campo `corpo` ja existe. Tabela `gastos` ja suporta os campos necessarios |

---

## 5. Checkpoints

#### Checkpoint 2026-02-12
**Status atual:** Proposta de implementacao completa, aguardando aprovacao
**Decisoes tomadas:**
- Alteracao 1: extrair corpo do email na sync IMAP, exibir como texto puro com line breaks
- Alteracao 2: tabela de parcelas editaveis (data e valor), estado local, aviso de divergencia

**Proximo passo:** Aprovacao da proposta pelo usuario -> Criar spec-alteracao06.md
