# Alteração 02 - Substituir kanban por tabela na página de emails

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificação criada |
| Origem | Navegação confusa e cada informação ocupa muito espaço no modo card |
| Complexidade | 🟡 Média |
| Especificação | [spec-alteracao02.md](./spec-alteracao02.md) |

**Status possíveis:**
- 🟡 Em planejamento
- 🟢 Especificação criada → ver [spec-alteracao02.md](./spec-alteracao02.md)

---

## 1. Ideia Inicial

**Problema identificado:**
O kanban atual (http://localhost:3000/emails) não está bom de usar porque:
- Navegação confusa
- Cada informação ocupa muito espaço no modo card

**Estrutura atual:**
- Kanban com 3 colunas: "Não Processados", "Aguardando Revisão", "Processados"
- Emails agrupados por status (nao_processado, processando, erro, aguardando_revisao, processado, ignorado)
- Cards exibem: status, confiança IA, remetente, assunto, valor, categoria sugerida, anexos, data, ações (Ver/Revisar, Ignorar)

**Proposta:**
Substituir o kanban por uma tabela mais compacta que permita visualizar mais emails de uma vez.

---

## 2. Conversa de Planejamento

#### IA: Entendimento inicial e perguntas sobre a nova estrutura

Compreendi! O kanban ocupa muito espaço e dificulta a navegação. Uma tabela será mais eficiente. Antes de propor a implementação, preciso esclarecer alguns pontos:

### 📊 **Estrutura da Tabela**

#### Questão 1: Quais colunas são essenciais?

**Informações disponíveis:**
- Status (badge colorido) 
- Remetente (nome ou email) 
- Assunto
- Valor extraído (R$)
- Categoria sugerida
- Data de recebimento
- Ações (Ver/Revisar, Ignorar)

**Perguntas:**
R: Deixei somente as colunas que me interessam. Que ordem você sugere? Todas essas colunas você acha que irão caber na UI, ou vai ficar muita informação?

#### Questão 2: Agrupamento por Status

O kanban atual agrupa emails em 3 grupos:
1. **Não Processados** (nao_processado, processando, erro)
2. **Aguardando Revisão** (aguardando_revisao)
3. **Processados** (processado, ignorado)

**Opções para a tabela:**

**Opção A - Tabela única com filtro de status:**
- Todos os emails em uma tabela
- Filtros superiores para selecionar status
- Ordenação por coluna

**Opção B - Abas por grupo:**
- Aba "Não Processados" | "Aguardando Revisão" | "Processados"
- Cada aba mostra a tabela filtrada

**Opção C - Sem agrupamento visual:**
- Apenas uma tabela com todos os emails
- Coluna de status mostra badge colorido
- Ordenação e filtros disponíveis

**Qual opção você prefere?**
1º resposta: esse 'não processados' faz sentido? não tem nenhum email lá. qual a lógica do app para 'não processados'?

2º resposta: Tudo na mesma, mas já vir com sort padrão de aguardando revisão, depois processados Os 'ignorados' podem vir já com um filtro para não aparecerem por padrão

#### Questão 3: Filtros e Busca

O sistema atual já tem:
- Busca por remetente/assunto (campo no topo)

**Para a tabela, adicionar:**
- [V] Filtro por status (dropdown ou checkboxes)
- [V] Filtro por data (range de datas)
- [X] Filtro por valor (range de valores)
- [V] Filtro por categoria
- [X] Filtro por confiança da IA (baixa, média, alta)
- [X] Filtro "tem anexos" / "sem anexos"

**Quais filtros são importantes para você?**

#### Questão 4: Ordenação

**Colunas que devem permitir ordenação:**
- [V] Data de recebimento (padrão: mais recentes primeiro)
- [V] Remetente (alfabética)
- [X] Valor (maior/menor)
- [X] Confiança (maior/menor)
- [V] Status

**Qual deve ser a ordenação padrão?**
R: respondido na pergunta 2. Temos que ter 'sort hierárquico', ou seja, permitir mais de uma variável de sort (sort dentro do sort)
#### Questão 5: Ações na Tabela

O card atual tem:
- Botão "Ver/Revisar" (abre página de detalhes)
- Botão "Ignorar" (marca como ignorado)

**Na tabela, como exibir ações?**

**Opção A - Coluna de ações com botões:**
```
| ... | Ações           |
|-----|-----------------|
| ... | [👁️] [❌]      |
```

**Opção B - Menu dropdown (3 pontos):**
```
| ... | Ações |
|-----|-------|
| ... | [⋮]   | → Ver, Ignorar, Detalhes
```

**Opção C - Click na linha inteira:**
- Clicar na linha abre detalhes
- Ícone "Ignorar" na própria linha

**Qual você prefere?**
R: obrigar o usuário a 'revisar', e os botões de ação ficarem somente na página de revisão
#### Questão 6: Responsividade

**Em telas menores (mobile/tablet):**

**Opção A - Cards em mobile, tabela em desktop:**
- Volta aos cards em telas pequenas
- Mantém tabela só em telas grandes

**Opção B - Tabela responsiva:**
- Oculta algumas colunas em mobile
- Mantém tabela em todas as telas

**Opção C - Tabela com scroll horizontal:**
- Permite scroll lateral em mobile
- Mostra todas as colunas sempre

**Como deve funcionar em mobile?**
R: opção C é viável? o que você acha?

#### Questão 7: Paginação

**Atualmente:** Todos os emails carregam de uma vez (com scroll infinito nas colunas do kanban)

**Para a tabela:**

**Opção A - Paginação tradicional:**
- 25/50/100 itens por página
- Botões "Anterior/Próxima"

**Opção B - Scroll infinito:**
- Carrega mais emails ao rolar até o fim

**Opção C - Carregar tudo:**
- Sem paginação (bom se houver poucos emails)

**Qual você prefere?**
R: opção B

#### Questão 8: Destaque Visual

**Como destacar visualmente os status importantes?**

**Opções:**
- Colorir a linha inteira baseado no status
- Apenas badge colorido na coluna de status
- Ícone + badge na coluna de status
- Borda lateral colorida na linha

**Como você quer ver os status na tabela?**
R: somente a badge
---

#### usuário: Todas as perguntas respondidas inline

tudo respondido abaixo de cada pergunta

---

#### IA: Análise das respostas e esclarecimentos

Perfeito! Analisei suas respostas. Vou esclarecer alguns pontos antes de propor a implementação:

### 📋 **Status "Não Processados" - Explicação da lógica atual**

Entendi sua dúvida! A lógica é:

**Fluxo de processamento de emails:**

1. **Email chega** → Sistema verifica se tem anexo processável (PDF de nota fiscal)
2. **Se tem anexo:** `status = 'nao_processado'` → aguarda processamento da IA
3. **IA processa:** `status = 'processando'` → extrai dados do PDF
4. **Se sucesso:** `status = 'aguardando_revisao'` → você revisa
5. **Se erro:** `status = 'erro'` → falha no processamento

**Ou seja:**
- **Não Processados** = emails que a IA ainda não analisou (nao_processado, processando, erro)
- **Aguardando Revisão** = IA já processou, você precisa revisar
- **Processados** = você já revisou ou ignorou

**Conclusão:** Se não há emails "não processados", é porque a IA está processando tudo automaticamente! Isso é bom. 👍

### 🎨 **Proposta de Ordem das Colunas**

Baseado nas suas preferências, sugiro esta ordem (da esquerda para direita):

| # | Coluna | Largura sugerida | Justificativa |
|---|--------|------------------|---------------|
| 1 | Status | 170px | Primeira info visual importante (badge colorido) |
| 2 | Data | 140px | Segunda info mais importante para ordenar/filtrar |
| 3 | Remetente | 220px | Identificação de quem enviou |
| 4 | Assunto | flex (auto) | Ocupa espaço restante, pode truncar se necessário |
| 5 | Valor | 120px | Compacto, alinhado à direita |

**Total aproximado:** 650px fixo + assunto flexível

**Análise de espaço:**
- ✅ **Desktop (1920px):** Cabe confortavelmente com muito espaço para o assunto
- ✅ **Laptop (1366px):** Cabe bem, assunto terá ~700px
- ✅ **Tablet landscape (1024px):** Cabe, assunto terá ~370px (suficiente)
- ⚠️ **Tablet portrait (768px):** Apertado, assunto terá ~120px (vai truncar)
- ❌ **Mobile (375px):** Vai precisar de scroll horizontal

**Você concorda com essa ordem?** Quer ajustar alguma coisa?

R: Concordo

### 📱 **Sobre Responsividade (Opção C - Scroll Horizontal)**

Você perguntou se é viável. **Sim, é totalmente viável!** E faz sentido para este caso:

**Vantagens:**
- ✅ Mantém consistência visual em todas as telas
- ✅ Usuário vê sempre as mesmas informações
- ✅ Mais simples de implementar (sem lógica de ocultar/mostrar colunas)
- ✅ Funciona bem para dados tabulares que o usuário precisa comparar

**Desvantagens:**
- ⚠️ Usuário precisa fazer scroll horizontal em mobile (pode ser menos intuitivo)
- ⚠️ Não segue padrão mobile-first (cards seriam mais "mobile friendly")

**Minha recomendação:**
Opção C é viável e **ADEQUADA** para seu caso porque:
1. É uma ferramenta de gestão (não app público)
2. Provavelmente será usada mais em desktop
3. Você quer ver as mesmas informações sempre
4. Tabela com scroll horizontal é comum em dashboards administrativos

**Implementação técnica:**
```tsx
<div className="overflow-x-auto">
  <Table className="min-w-[650px]"> {/* largura mínima */}
    {/* conteúdo */}
  </Table>
</div>
```

**Você confirma opção C (scroll horizontal)?**

R: Sim

### 🎯 **Sort Hierárquico (Múltiplas Variáveis)**

Você quer "sort dentro do sort". Perfeito!

**Exemplo do que você quer:**
1. Ordenar por Status (aguardando_revisao → processado → outros)
2. Dentro de cada status, ordenar por Data (mais recente primeiro)

**Comportamento:**
```
📋 Aguardando Revisão
  ↳ 07/02/2026 - Email A
  ↳ 06/02/2026 - Email B
  ↳ 05/02/2026 - Email C

✅ Processado
  ↳ 07/02/2026 - Email D
  ↳ 05/02/2026 - Email E

🚫 Ignorado (ocultos por padrão, só aparecem se filtrar)
```

**Implementação sugerida:**
- **Sort padrão:** Status (aguardando_revisao primeiro) → Data (desc)
- **Usuário pode clicar nos headers** para trocar ordenação principal
- **Shift + Click** para adicionar ordenação secundária (sort hierárquico)

**Ou prefere:**
- Interface com "Ordenar por 1º: [dropdown] | 2º: [dropdown]"?

R: Gostei da implementação sugerida

### ✨ **Resumo das Decisões**

Com base nas suas respostas, a tabela terá:

✅ **Colunas:** Status | Data | Remetente | Assunto | Valor
✅ **Filtros:** Status, Data (range), Categoria
✅ **Busca:** Remetente/Assunto (já existe)
✅ **Ordenação:** Status → Data (padrão) | Permite sort hierárquico
✅ **Ações:** Click na linha = abrir revisão | Sem botões inline
✅ **Status padrão:** Ignorados ocultos por padrão
✅ **Paginação:** Scroll infinito
✅ **Responsividade:** Scroll horizontal em mobile
✅ **Visual:** Badge de status (sem colorir linha inteira)

### ❓ **Antes de criar a proposta completa (seção 3), preciso confirmar:**

1. **Ordem das colunas** está OK? (Status, Data, Remetente, Assunto, Valor)
2. **Sort hierárquico:** prefere Shift+Click ou interface com dropdowns?
3. **Scroll horizontal** confirmado para mobile?
4. **Remover completamente a coluna "Ações"** da tabela? (já que o click na linha abre revisão)
R: Sim, pode remover

---

#### usuário: Confirmações finais respondidas

R: Sim, pode remover

---

#### IA: Criando proposta completa de implementação

Perfeito! Todas as decisões confirmadas. Agora vou criar a proposta completa de implementação na seção 3.

---

## 3. Proposta de Implementação

**Status:** 🟡 Aguardando aprovação

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- Layout em kanban com 3 colunas verticais (Não Processados, Aguardando Revisão, Processados)
- Emails exibidos em cards grandes que ocupam muito espaço
- Navegação confusa entre as colunas
- Difícil visualizar muitos emails ao mesmo tempo
- Scroll vertical dentro de cada coluna
- Filtro de status implícito pela coluna
- Busca por remetente/assunto no topo

**Depois (comportamento proposto):**
- Layout em tabela única horizontal
- Emails exibidos em linhas compactas
- Visualização de múltiplos emails simultaneamente (mais eficiente)
- Navegação simples com scroll vertical
- Click na linha inteira abre página de revisão
- Status visível como badge colorido na primeira coluna
- Ordenação hierárquica (Status → Data por padrão)
- Filtros por: Status, Data (range), Categoria
- Busca mantida no topo
- Emails "ignorados" ocultos por padrão (aparecem apenas ao filtrar)
- Scroll infinito para carregar mais emails
- Scroll horizontal em mobile para manter todas as colunas visíveis

### 3.2 UI Proposta

#### Tela Principal - Tabela de Emails

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📧 Emails Monitorados                                    [🔄 Sincronizar]   │
│  Notas fiscais recebidas em casa@toniezzer.com                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔍 Buscar por remetente ou assunto...                                      │
│                                                                              │
│  Filtros:  [Status ▼]  [Data: 📅 ─── 📅]  [Categoria ▼]                   │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌overflow-x-auto─────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  Status           │ Data       │ Remetente          │ Assunto    │ Valor│ │
│  │  ────────────────────────────────────────────────────────────────────  │ │
│  │  [⚠️ Revisão]     │ 07/02 10h  │ fornecedor@x.com   │ NF 12345   │ R$..│ │
│  │  [⚠️ Revisão]     │ 06/02 15h  │ empresa@y.com      │ Fatura...  │ R$..│ │
│  │  [✅ Processado]  │ 05/02 09h  │ loja@z.com         │ Nota...    │ R$..│ │
│  │  [✅ Processado]  │ 04/02 14h  │ distribuidora@.com │ Pedido...  │ R$..│ │
│  │  [🔄 Processan.]  │ 03/02 11h  │ industria@.com     │ Compra...  │ R$..│ │
│  │  ... (scroll infinito carrega mais ao chegar no fim)                   │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  💡 O sistema verifica novos emails automaticamente a cada 15 minutos.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Comportamentos:**

1. **Colunas (650px fixos + flex para assunto):**
   - Status (170px): Badge colorido com ícone
   - Data (140px): Formato "dd/mm HH:mm"
   - Remetente (220px): Nome ou email, trunca com "..."
   - Assunto (flex): Ocupa espaço restante, trunca com "..."
   - Valor (120px): Formato "R$ 1.234,56", alinhado à direita

2. **Interação com linhas:**
   - Hover na linha: fundo cinza claro (`hover:bg-muted/50`)
   - Click na linha: navega para `/emails/[id]` (página de revisão)
   - Cursor pointer em toda a linha

3. **Ordenação (headers clicáveis):**
   - Click simples: alterna asc/desc na coluna
   - Shift + Click: adiciona ordenação secundária
   - Padrão inicial: Status (aguardando_revisao > processado > outros) → Data (desc)
   - Indicador visual: ícone ↑/↓ no header ativo

4. **Filtros:**
   - **Status:** Dropdown multi-select com checkboxes (ignorados desmarcados por padrão)
   - **Data:** Date range picker com duas datas (de → até)
   - **Categoria:** Dropdown com categorias existentes

5. **Scroll infinito:**
   - Carrega 50 emails inicialmente
   - Ao chegar próximo do fim (~100px do bottom), carrega mais 50
   - Loading spinner discreto no footer durante carregamento

6. **Responsividade:**
   - Desktop/Laptop: tabela normal
   - Mobile: `overflow-x-auto` permite scroll horizontal, mantém todas as colunas
   - Largura mínima da tabela: 650px

7. **Empty state:**
   - Se busca/filtro retornar vazio: "Nenhum email encontrado"
   - Se não há emails: mensagem atual mantida

### 3.3 Arquivos Afetados

| Ação | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `src/app/(dashboard)/emails/page.tsx` | Substituir `<KanbanEmails>` por `<EmailsTable>`. Adicionar estado para filtros (status, data, categoria). Manter lógica de busca e sync. |
| CRIAR | `src/components/features/emails/emails-table.tsx` | Novo componente de tabela principal. Recebe emails filtrados, implementa colunas, ordenação hierárquica, scroll infinito, click nas linhas. |
| CRIAR | `src/components/features/emails/email-filters.tsx` | Componente de filtros (Status, Data, Categoria). Gerencia estado local e callback para filtros aplicados. |
| CRIAR | `src/lib/hooks/useEmailSort.ts` | Hook customizado para ordenação hierárquica. Gerencia array de sorts [{ column, direction }]. |
| MODIFICAR | `src/components/features/emails/index.ts` | Exportar `EmailsTable` e `EmailFilters` ao invés de `KanbanEmails`. |
| DELETAR (opcional) | `src/components/features/emails/kanban-emails.tsx` | Manter comentado ou remover se não for mais usado. |
| DELETAR (opcional) | `src/components/features/emails/email-card.tsx` | Manter comentado ou remover se não for mais usado. |

### 3.4 Fluxo de Dados

**Carregamento inicial:**

1. **Usuário acessa `/emails`** → Componente `EmailsPage` monta
2. **`useEffect` chama `loadEmails()`** → Busca todos emails do Supabase
3. **Dados retornam** → `setEmails(data)` armazena no estado
4. **Estado inicial dos filtros:**
   - Status: todos marcados EXCETO "ignorado"
   - Data: sem filtro (null, null)
   - Categoria: todas
5. **Aplicação de filtros no cliente:**
   - `emailsFiltrados = emails.filter(...)` aplica busca, status, data, categoria
6. **Aplicação de ordenação:**
   - `useEmailSort` ordena por: Status (aguardando_revisao primeiro) → Data (desc)
7. **Renderização:**
   - `<EmailsTable emails={emailsFiltrados.slice(0, visibleCount)} />` renderiza tabela
   - Scroll infinito incrementa `visibleCount` de 50 em 50

**Interação - Filtros:**

1. **Usuário altera filtro** (ex: seleciona categoria) → `EmailFilters` atualiza estado local
2. **Callback `onFiltersChange()`** → Passa filtros para `EmailsPage`
3. **`EmailsPage` atualiza estado** → `setFiltros({ ...filtros, categoria: 'X' })`
4. **Re-render com filtros novos** → Recalcula `emailsFiltrados`

**Interação - Ordenação:**

1. **Usuário clica em header** → `EmailsTable` detecta click
2. **Se Shift pressionado** → Adiciona ao array de sorts (hierárquico)
3. **Se Shift NÃO pressionado** → Substitui array de sorts (só essa coluna)
4. **Hook `useEmailSort`** → Recalcula ordenação e retorna emails ordenados
5. **Re-render** → Tabela mostra nova ordem

**Interação - Click na linha:**

1. **Usuário clica em uma linha** → `onClick` do `TableRow`
2. **`router.push(`/emails/${email.id}`)`** → Navega para página de revisão
3. **Página de revisão carrega** (já existe, sem mudanças)

**Interação - Scroll infinito:**

1. **Usuário scrola até próximo do fim** → Listener `onScroll` detecta
2. **`setVisibleCount(prev => prev + 50)`** → Incrementa contador
3. **Re-render** → Slice maior do array, mostra mais linhas

**Sincronização (mantém lógica atual):**

1. **Usuário clica em "Sincronizar"** → `handleSync()` (já existe)
2. **Chama APIs** → `/api/emails/sync` e `/api/emails/process`
3. **Após sucesso** → `loadEmails()` recarrega dados
4. **Tabela atualiza** → Novos emails aparecem (respeitando filtros e ordenação)

### 3.5 Banco de Dados

**N/A - sem alterações no banco**

Esta alteração é puramente de interface (UI). Não requer mudanças em:
- Estrutura de tabelas
- Colunas existentes
- Índices
- Triggers
- RLS policies

A tabela `emails_monitorados` já possui todos os campos necessários:
- `status` (para filtro e ordenação)
- `data_recebimento` (para filtro e ordenação)
- `remetente`, `remetente_nome` (para busca)
- `assunto` (para busca)
- `dados_extraidos.valor` (para exibição)
- `dados_extraidos.categoria_sugerida` (para filtro)

---

## 4. Decisões Importantes

- **Remoção do kanban:** Usuário confirmou que layout em cards ocupa muito espaço e dificulta navegação. Tabela será mais eficiente.
- **Ordenação hierárquica:** Implementar Shift+Click para adicionar ordenações secundárias, permitindo sort complexo (ex: Status → Data → Remetente).
- **Filtro de ignorados:** Por padrão, emails com `status = 'ignorado'` não aparecerão. Usuário pode marcar checkbox no filtro para vê-los.
- **Scroll infinito:** Escolhido ao invés de paginação tradicional para UX mais fluida. Carrega 50 emails por vez.
- **Click na linha:** Remove necessidade de botões/ícones inline. UX mais limpa. Todas as ações ficam na página de revisão (`/emails/[id]`).
- **Scroll horizontal mobile:** Mantém consistência visual em todas as telas. Adequado para ferramenta de gestão interna.
- **Sem alterações no banco:** Aproveitamento total da estrutura existente.

---

**A proposta de implementação está de acordo? Posso criar a especificação técnica?**

---

#### usuário: Aprovação da proposta

R: pode criar a spec!

---

#### IA: Especificação técnica criada

✅ **Especificação criada com sucesso!**

Arquivos atualizados:
- ✅ Criado: [spec-alteracao02.md](./spec-alteracao02.md)
- ✅ Atualizado: Status da conversa para 🟢 Especificação criada
- ✅ Atualizado: Índice [00-indice.md](./00-indice.md) com nova alteração

**Próximos passos:**
O agente **Executor de Alterações** pode agora iniciar a implementação seguindo a especificação técnica detalhada.

**Resumo do que será implementado:**
- Substituir componente KanbanEmails por EmailsTable
- Criar filtros avançados (Status, Data range, Categoria)
- Implementar ordenação hierárquica com Shift+Click
- Adicionar scroll infinito (50 emails por vez)
- Tornar linhas clicáveis para abrir revisão
- Manter scroll horizontal em mobile