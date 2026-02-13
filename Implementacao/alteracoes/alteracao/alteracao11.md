# Alteracao 07 - Melhorias na pagina de emails: corpo do email e parcelas editaveis

| Aspecto | Detalhe |
|---------|---------|
| Status | Especificacao criada |
| Origem | Solicitacao do usuario |
| Complexidade | Media |
| Especificacao | [spec-alteracao11.md](../spec-alteracao11.md) |

**Status possiveis:**
- Em planejamento
- Especificacao criada 

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

**Status:** Aguardando aprovacao

### 3.1 Antes vs Depois

**Antes (comportamento atual):**

*Alteracao 1 -- Corpo do email:*
- A rota de sincronizacao IMAP (`api/emails/sync/route.ts`) seta `corpo: null` ao criar o email no banco
- O campo `corpo` existe na tabela `emails_monitorados` (tipo `string | null`) mas nunca e preenchido
- O componente `email-preview.tsx` tem codigo de renderizacao para o corpo (linhas 216-228), mas como o valor e sempre `null`, nada aparece
- A secao "Conteudo do Email" esta posicionada APOS os anexos

*Alteracao 2 -- Parcelas editaveis:*
- O formulario de aprovacao (`form-aprovacao.tsx`) tem um campo "Parcelas" que e apenas um `<Input type="number">` (min 1, max 48, default 1)
- Ao aprovar, o `handleAprovar` em `emails/[id]/page.tsx` divide o valor total igualmente entre as N parcelas, com datas mensais incrementais
- O usuario nao tem visibilidade nem controle sobre os valores e datas individuais de cada parcela antes de aprovar
- A ultima parcela absorve a diferenca de arredondamento

**Depois (comportamento proposto):**

*Alteracao 1 -- Corpo do email:*
- A rota de sincronizacao IMAP extrai o corpo da mensagem usando `client.download()` do ImapFlow
- Prioriza `text/plain`; usa `text/html` como fallback (convertendo para texto puro, preservando line breaks)
- O campo `corpo` e salvo no banco com o conteudo textual do email
- No frontend, a secao e renomeada para "Mensagem" e reposicionada ANTES dos anexos
- Renderizacao continua com `whitespace-pre-wrap` (line breaks e paragrafos preservados)

*Alteracao 2 -- Parcelas editaveis:*
- Abaixo do campo "Parcelas" no formulario, aparece uma tabela com a pre-visualizacao das parcelas que serao criadas
- A tabela e gerada automaticamente quando o numero de parcelas >= 1 (sempre visivel)
- Campos editaveis por parcela: **data** e **valor** (numero da parcela e read-only)
- Edicao via onBlur: ao sair do campo, o estado local e atualizado
- Validacao visual: aviso quando a soma dos valores das parcelas difere do valor total
- Ao aprovar, o `handleAprovar` usa os dados editados (nao recalcula dividindo igualmente)

### 3.2 UI Proposta

#### Alteracao 1 -- Secao "Mensagem" no Email Preview

Reposicionar a secao existente para ANTES dos anexos e renomear:

```
┌─────────────────────────────────────────────────────────────┐
│  Email Original                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  De: remetente@email.com                                     │
│  Assunto: Nota Fiscal #1234                                  │
│  Recebido: 13/02/2026                                        │
│                                                              │
│  ┌─ Mensagem ─────────────────────────────────────────────┐ │
│  │ Boa tarde,                                              │ │
│  │                                                         │ │
│  │ Segue em anexo a nota fiscal referente ao pedido...     │ │
│  │ (ScrollArea h-[150px])                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  Anexos:                                                     │
│  [PDF] nota-fiscal-1234.pdf (45 KB)                         │
│                                                              │
│  Resposta da IA:                                             │
│  [conteudo da resposta...]                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Comportamentos:**
- Exibido somente quando `email.corpo` nao e null (mesmo comportamento atual)
- Titulo alterado de "Conteudo do Email" para "Mensagem"
- Posicao: apos "Recebido" e antes de "Anexos"
- Estilo `whitespace-pre-wrap` preserva line breaks e paragrafos

#### Alteracao 2 -- Tabela de Parcelas no Formulario de Aprovacao

Abaixo do campo "Parcelas" no formulario, adicionar tabela editavel:

```
┌─────────────────────────────────────────────────────────────┐
│  Dados Extraidos                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [...campos existentes: descricao, valor, data, etc...]      │
│                                                              │
│  Parcelas                                                    │
│  ┌───────────────────┐                                       │
│  │ 3                 │                                       │
│  └───────────────────┘                                       │
│                                                              │
│  ┌──────────┬──────────────────┬────────────────┐           │
│  │ Parcela  │ Data             │ Valor (R$)     │           │
│  ├──────────┼──────────────────┼────────────────┤           │
│  │ 1/3      │ [13/02/2026    ] │ [1.000,00    ] │           │
│  │ 2/3      │ [13/03/2026    ] │ [1.000,00    ] │           │
│  │ 3/3      │ [13/04/2026    ] │ [1.000,00    ] │           │
│  ├──────────┴──────────────────┼────────────────┤           │
│  │                      Total: │ R$ 3.000,00    │           │
│  └─────────────────────────────┴────────────────┘           │
│                                                              │
│  [!] Aviso: soma (R$ 2.900,00) difere do valor              │
│      total (R$ 3.000,00)                                     │
│                                                              │
│                                         [Aprovar]            │
└─────────────────────────────────────────────────────────────┘
```

**Comportamentos:**
- A tabela e gerada automaticamente quando o campo "Parcelas" tem valor >= 1
- Coluna "Parcela": read-only, formato "X/N" (ex: 1/3, 2/3, 3/3)
- Coluna "Data": input editavel (date picker ou input type date), atualiza estado no onBlur
- Coluna "Valor": input editavel (numerico), atualiza estado no onBlur
- Linha "Total": soma dos valores das parcelas (calculada automaticamente)
- Aviso amarelo: aparece quando soma das parcelas != valor total do formulario. Nao bloqueia o botao "Aprovar"
- Ao alterar o numero de parcelas, a tabela e recalculada (divide igualmente, datas mensais). Edicoes anteriores sao perdidas
- Ao alterar o campo "Valor" do formulario, a tabela e recalculada (redistribui igualmente)
- Ao alterar o campo "Data" do formulario, a tabela e recalculada (novas datas mensais a partir da nova data)

### 3.3 Arquivos Afetados

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/api/emails/sync/route.ts` | Extrair corpo do email via `client.download()` do ImapFlow; identificar partes text/plain e text/html no bodyStructure; converter HTML para texto puro |
| MODIFICAR | `src/components/features/emails/email-preview.tsx` | Reposicionar secao do corpo para antes dos anexos; renomear de "Conteudo do Email" para "Mensagem" |
| MODIFICAR | `src/components/features/emails/form-aprovacao.tsx` | Adicionar tabela de parcelas editaveis abaixo do campo "Parcelas"; estado local para parcelas; validacao soma vs valor total; callbacks onBlur |
| MODIFICAR | `src/app/(dashboard)/emails/[id]/page.tsx` | Adaptar `handleAprovar` para receber parcelas editadas do formulario em vez de recalcular; passar parcelas como prop ou callback |

### 3.4 Fluxo de Dados

**Alteracao 1 -- Corpo do email:**

1. Rota `api/emails/sync/route.ts` faz `client.fetch()` e obtem `bodyStructure` de cada mensagem
2. Funcao auxiliar percorre `bodyStructure` recursivamente para encontrar partes `text/plain` e `text/html` (similar a `findAttachments` existente)
3. Usa `client.download(message.uid, { uid: true }, partId)` para baixar o conteudo da parte textual
4. Se a parte e `text/plain`, usa diretamente. Se e `text/html`, converte para texto puro (strip tags, preserva `<br>`, `<p>`, `<div>` como `\n`)
5. Salva o texto no campo `corpo` via `criarEmail(supabase, { ..., corpo: textoExtraido })`
6. No frontend, `email-preview.tsx` ja renderiza `email.corpo` com `whitespace-pre-wrap` -- agora o campo tera valor

**Alteracao 2 -- Parcelas editaveis:**

1. Usuario preenche "Parcelas" (numero) no `form-aprovacao.tsx`
2. Um `useEffect` ou handler observa mudancas em `parcelas`, `valor` e `data` do formulario
3. Quando algum desses campos muda, gera array de parcelas em estado local (`useState<Parcela[]>`):
   - Divide valor igualmente entre N parcelas (com arredondamento na ultima)
   - Calcula datas mensais incrementais a partir da data do formulario
4. Tabela renderiza o array de parcelas com inputs editaveis para data e valor
5. OnBlur de cada campo atualiza o item correspondente no array local
6. Validacao: compara `soma(parcelas.valor)` com `valor_total` do formulario; se diverge, exibe aviso
7. Ao clicar "Aprovar", o formulario passa os dados editados das parcelas para o `handleAprovar`
8. `handleAprovar` usa as parcelas editadas (data e valor por parcela) em vez de recalcular

### 3.5 Banco de Dados

N/A -- sem alteracoes no banco. O campo `corpo` ja existe na tabela `emails_monitorados` (tipo `string | null`). A tabela `gastos` ja tem os campos `parcela_atual`, `parcelas`, `data` e `valor`. Nenhuma migracao necessaria.

### 3.6 Impacto Cross-Domain

N/A -- as alteracoes sao contidas no dominio de emails. Nao afetam outros dominios indiretamente.

---

## 4. Decisoes Importantes

- **Corpo como texto puro (opcao B):** Decidido exibir sempre como texto sem formatacao HTML. Quando o email vier em HTML, as tags sao removidas preservando line breaks (`<br>`, `<p>`, `<div>` viram `\n`). Mais simples e sem risco de seguranca (XSS)
- **Conversao HTML->texto no backend:** A conversao de HTML para texto puro e feita na rota de sync (backend), nao no frontend. O campo `corpo` no banco ja armazena o texto limpo
- **Parcelas sempre visiveis:** A tabela de parcelas aparece mesmo com 1 parcela, para permitir editar a data de vencimento
- **Validacao nao-bloqueante:** O aviso de soma divergente nao impede o usuario de aprovar. E apenas um alerta visual
- **Recalculo ao mudar campos-chave:** Alterar o numero de parcelas, valor total ou data no formulario recalcula toda a tabela (edicoes manuais anteriores sao perdidas)
- **Estado local (in-memory):** As parcelas editadas vivem em `useState` do React. Nao sao persistidas em nenhum lugar intermediario antes de aprovar

---

## 5. Checkpoints

#### Checkpoint 13/02/2026
**Status atual:** Proposta de implementacao preenchida, aguardando aprovacao
**Decisoes tomadas:**
- Corpo do email: opcao B (texto puro, sem HTML)
- Conversao HTML->texto no backend (rota de sync)
- Parcelas sempre visiveis (mesmo com 1)
- Campos editaveis: data e valor apenas
- Validacao nao-bloqueante (aviso visual)
- Estado local in-memory para parcelas editadas

**Proximo passo:** Aprovacao da proposta pelo usuario para criar a especificacao tecnica