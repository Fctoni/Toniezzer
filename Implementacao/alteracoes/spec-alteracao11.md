# Especificacao: Alteracao 11 - Melhorias na pagina de emails: corpo do email e parcelas editaveis

| Aspecto | Detalhe |
|---------|---------|
| Status | Aguardando testes |
| Conversa | [alteracao11.md](./alteracao/alteracao11.md) |
| Data criacao | 13/02/2026 |
| Complexidade | Media |

**Status possiveis:**
- Pronto para executar
- Em execucao
- Aguardando testes
- Concluido
- Cancelado

---

## 1. Resumo

Duas melhorias na pagina de emails: (1) extrair e exibir o corpo/mensagem do email durante a sincronizacao IMAP, e (2) adicionar tabela de parcelas editaveis no formulario de aprovacao para que o usuario possa ajustar datas e valores antes de salvar.

---

## 2. O que sera feito

- [ ] Extrair corpo do email na rota de sincronizacao IMAP (backend)
- [ ] Converter HTML para texto puro preservando line breaks (backend)
- [ ] Reposicionar secao do corpo para antes dos anexos e renomear para "Mensagem" (frontend)
- [ ] Criar tabela de parcelas editaveis no formulario de aprovacao (frontend)
- [ ] Implementar estado local para parcelas com auto-save on blur (frontend)
- [ ] Adicionar validacao visual: aviso quando soma das parcelas difere do valor total (frontend)
- [ ] Adaptar handleAprovar para usar parcelas editadas em vez de recalcular (frontend)

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**

*Corpo do email:*
- A rota de sincronizacao IMAP (`api/emails/sync/route.ts`) seta `corpo: null` ao criar o email no banco
- O campo `corpo` existe na tabela `emails_monitorados` (tipo `string | null`) mas nunca e preenchido
- O componente `email-preview.tsx` tem codigo de renderizacao para o corpo, mas como o valor e sempre `null`, nada aparece
- A secao "Conteudo do Email" esta posicionada APOS os anexos

*Parcelas editaveis:*
- O formulario de aprovacao tem um campo "Parcelas" que e apenas um `<Input type="number">`
- Ao aprovar, o sistema divide o valor total igualmente entre N parcelas, com datas mensais incrementais
- O usuario nao tem visibilidade nem controle sobre valores e datas individuais antes de aprovar

**Depois (comportamento proposto):**

*Corpo do email:*
- A rota de sincronizacao IMAP extrai o corpo via `client.download()` do ImapFlow
- Prioriza `text/plain`; usa `text/html` como fallback (convertido para texto puro preservando line breaks)
- O campo `corpo` e salvo no banco com o conteudo textual
- No frontend, secao renomeada para "Mensagem" e reposicionada ANTES dos anexos

*Parcelas editaveis:*
- Tabela editavel abaixo do campo "Parcelas" no formulario de aprovacao
- Gerada automaticamente quando parcelas >= 1 (sempre visivel)
- Campos editaveis: data e valor (numero da parcela e read-only)
- Aviso visual quando soma diverge do valor total (nao bloqueia)
- handleAprovar usa dados editados em vez de recalcular

### 3.2 UI Proposta

#### Secao "Mensagem" no Email Preview

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

#### Tabela de Parcelas no Formulario de Aprovacao

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
- Tabela gerada automaticamente quando parcelas >= 1
- Coluna "Parcela": read-only, formato "X/N" (ex: 1/3, 2/3, 3/3)
- Coluna "Data": input editavel, atualiza estado no onBlur
- Coluna "Valor": input numerico editavel, atualiza estado no onBlur
- Linha "Total": soma automatica dos valores
- Aviso amarelo: aparece quando soma != valor total. Nao bloqueia "Aprovar"
- Ao alterar numero de parcelas, valor total ou data no formulario: tabela recalculada (edicoes manuais anteriores sao perdidas)

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A -- sem alteracoes no banco. O campo `corpo` ja existe na tabela `emails_monitorados` (tipo `string | null`). A tabela `gastos` ja tem `parcela_atual`, `parcelas`, `data` e `valor`.

### 4.2 Arquivos a Modificar/Criar

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| MODIFICAR | `src/app/api/emails/sync/route.ts` | Extrair corpo do email via `client.download()` do ImapFlow. Adicionar funcao `findTextPart()` para percorrer `bodyStructure` e encontrar partes `text/plain` ou `text/html`. Adicionar funcao `stripHtmlToText()` para converter HTML em texto puro preservando line breaks. Salvar resultado no campo `corpo` da chamada `criarEmail()`. |
| MODIFICAR | `src/components/features/emails/email-preview.tsx` | Mover o bloco de renderizacao do corpo (linhas 216-228) para ANTES da secao de anexos. Renomear titulo de "Conteudo do Email" para "Mensagem". |
| MODIFICAR | `src/components/features/emails/form-aprovacao.tsx` | Adicionar `useState<Parcela[]>` para estado local das parcelas. Adicionar `useEffect` que gera parcelas quando `parcelas`, `valor` ou `data` mudam no formulario. Renderizar tabela de parcelas com inputs editaveis (data e valor) com `onBlur`. Calcular e exibir soma total. Exibir aviso quando soma diverge do valor total. Expor parcelas editadas via callback `onParcelasChange` ou incluir na submissao do formulario. |
| MODIFICAR | `src/app/(dashboard)/emails/[id]/page.tsx` | Adaptar `handleAprovar` para receber array de parcelas editadas (com data e valor por parcela) do formulario. Substituir a logica de divisao igualitaria pela construcao dos lancamentos a partir das parcelas editadas, mantendo os demais campos (descricao, categoria_id, fornecedor_id, forma_pagamento, etc.). |

### 4.3 Fluxo de Dados

**Corpo do email:**

1. Rota `api/emails/sync/route.ts` faz `client.fetch()` e obtem `bodyStructure` de cada mensagem
2. Funcao `findTextPart(bodyStructure)` percorre recursivamente a estrutura para encontrar partes `text/plain` (prioridade) ou `text/html` (fallback)
3. Usa `client.download(message.uid, partId, { uid: true })` para baixar o conteudo da parte textual
4. Se a parte e `text/html`, funcao `stripHtmlToText(html)` converte para texto puro:
   - `<br>`, `<br/>` viram `\n`
   - `</p>`, `</div>`, `</tr>`, `</li>` viram `\n`
   - Todas as demais tags sao removidas
   - Entidades HTML sao decodificadas (`&amp;` -> `&`, `&lt;` -> `<`, etc.)
   - Multiplas linhas em branco consecutivas sao colapsadas
5. Salva o texto no campo `corpo` via `criarEmail(supabase, { ..., corpo: textoExtraido })`
6. No frontend, `email-preview.tsx` renderiza `email.corpo` com `whitespace-pre-wrap` (ja existente)

**Parcelas editaveis:**

1. Usuario preenche "Parcelas" (numero), "Valor" e "Data" no `form-aprovacao.tsx`
2. `useEffect` observa mudancas nesses 3 campos via `form.watch(['parcelas', 'valor', 'data'])`
3. Quando algum muda, gera array de parcelas em `useState`:
   - Divide valor igualmente entre N parcelas (arredondamento na ultima)
   - Calcula datas mensais incrementais a partir da data do formulario
4. Tabela renderiza array de parcelas com inputs editaveis (data e valor)
5. `onBlur` de cada input atualiza o item correspondente no array via `setParcelas(prev => ...)`
6. Soma dos valores e calculada em tempo real; aviso exibido se diverge do valor total
7. Ao clicar "Aprovar", formulario inclui as parcelas editadas nos dados submetidos
8. `handleAprovar` constroi lancamentos a partir das parcelas editadas (usa data e valor de cada parcela; herda descricao, categoria, fornecedor, forma_pagamento do formulario)

### 4.4 Dependencias Externas

Nenhuma. Nao e necessario instalar pacotes ou criar recursos externos.

### 4.5 Decisoes de Design e Justificativas

- **Texto puro (opcao B) em vez de HTML renderizado:** Decidido exibir corpo sempre como texto sem formatacao. Mais simples, sem risco de XSS, e line breaks/paragrafos sao preservados via `whitespace-pre-wrap`. Alternativas descartadas: (A) HTML sanitizado com DOMPurify, (C) texto com botao "Ver HTML"
- **Conversao HTML->texto no backend:** A conversao acontece na rota de sync, nao no frontend. O campo `corpo` no banco ja armazena texto limpo. Vantagem: o frontend nao precisa de logica de conversao e o texto fica pronto para exibicao em qualquer contexto
- **Parcelas sempre visiveis (mesmo com 1):** Permite ao usuario editar a data de vencimento mesmo para pagamentos a vista. Sem essa decisao, nao haveria como ajustar a data de um pagamento unico
- **Validacao nao-bloqueante:** O aviso de soma divergente nao impede aprovacao. O usuario pode intencionalmente querer valores diferentes (ex: desconto em parcela especifica). Apenas um alerta visual
- **Recalculo ao mudar campos-chave:** Alterar parcelas, valor total ou data recalcula toda a tabela, perdendo edicoes manuais. Decisao de simplicidade -- manter sincronizado com os campos principais e evitar estados inconsistentes
- **Estado local in-memory:** Parcelas editadas vivem em `useState` do React. Nao ha persistencia intermediaria. Justificativa: as parcelas so existem no banco apos aprovacao; salvar estado intermediario adicionaria complexidade sem beneficio claro

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [x] Extrair corpo do email na rota de sync IMAP
- [x] Funcao stripHtmlToText para conversao HTML->texto
- [x] Reposicionar e renomear secao "Mensagem" no email-preview
- [x] Estado local de parcelas no form-aprovacao
- [x] Tabela de parcelas editaveis com inputs data/valor
- [x] Validacao visual soma vs valor total
- [x] Adaptar handleAprovar para usar parcelas editadas
- [x] TypeScript sem erros (erros pre-existentes do projeto - resolucao de modulos)
- [ ] Testado manualmente

### 5.2 Notas de Implementacao

**Decisao: Dois passes na rota de sync IMAP**
- O `client.fetch()` do ImapFlow retorna um async iterator que mantem a conexao IMAP ocupada. Chamar `client.download()` dentro do loop causaria deadlock.
- Solucao: primeiro passo coleta metadados (envelopes, attachments, text parts) em array `pendingEmails`; segundo passo faz download do corpo e insere no banco.

**Decisao: Inputs de valor com onBlur + generationKey**
- O campo de valor da parcela usa `defaultValue` (uncontrolled) com `onBlur` para atualizar estado local.
- Um `generationKey` incremental forca remount dos inputs quando as parcelas sao regeneradas (mudanca de numero de parcelas, valor total ou data).
- O campo de data usa `value` (controlled) com `onChange` pois date pickers commitam imediatamente.

**Decisao: useMemo para soma de parcelas**
- A soma das parcelas usa `useMemo` para evitar recalculos desnecessarios a cada render.

**TypeScript: erros pre-existentes**
- Todos os erros de tsc sao pre-existentes (modulos nao resolvidos: react, next, lucide-react, etc.) e afetam TODO o projeto. Nenhum erro novo introduzido.

### 5.3 Conversa de Execucao

#### IA: Implementacao completa dos 4 arquivos

**Arquivos modificados:**

1. `src/app/api/emails/sync/route.ts` (285 linhas)
   - Adicionadas funcoes `findTextPart()` e `stripHtmlToText()` no topo
   - Reestruturado loop em dois passes: coleta de metadados + download/insert
   - Corpo extraido via `client.download()` com prioridade text/plain, fallback text/html
   - Limite de 50KB para corpo armazenado

2. `src/components/features/emails/email-preview.tsx` (252 linhas)
   - Secao de corpo movida para ANTES dos anexos
   - Titulo renomeado de "Conteudo do Email" para "Mensagem"
   - Secao antiga removida (sem duplicacao)

3. `src/components/features/emails/form-aprovacao.tsx` (516 linhas)
   - Exportado tipo `ParcelaEditavel` (parcela_atual, data, valor)
   - Adicionado `useState<ParcelaEditavel[]>` e `generationKey`
   - `useEffect` com `form.watch()` gera parcelas quando campos-chave mudam
   - Tabela editavel com inputs para data (onChange) e valor (onBlur)
   - Soma total e aviso de validacao (nao-bloqueante)
   - Submit passa parcelas para `onAprovar(data, parcelas)`

4. `src/app/(dashboard)/emails/[id]/page.tsx` (298 linhas)
   - Import de `ParcelaEditavel` adicionado
   - `handleAprovar` agora recebe `parcelasEditadas` como 2o parametro
   - Logica de divisao igualitaria substituida por `parcelasEditadas.map()`
   - Import de `formatDateToString` removido (nao mais utilizado)

5. `src/components/features/emails/index.ts`
   - Adicionado `export type { ParcelaEditavel }` no barrel export

---

#### usuario:

---

## 6. Validacao Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] Documentacao atualizada (via Doc Editor)
