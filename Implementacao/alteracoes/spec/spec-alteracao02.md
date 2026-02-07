# Especificação: Alteração 02 - Substituir kanban por tabela na página de emails

| Aspecto | Detalhe |
|---------|---------|
| Status | 🔵 Pronto para executar |
| Conversa | [alteracao02.md](./alteracao02.md) |
| Data criação | 07/02/2026 |
| Complexidade | 🟡 Média |

**Status possíveis:**
- 🔵 Pronto para executar
- 🔴 Em execução
- 🟠 Aguardando testes
- 🟢 Concluído
- ❌ Cancelado

---

## 1. Resumo

Substituir o layout kanban (3 colunas verticais com cards) por uma tabela horizontal compacta que permita visualizar mais emails simultaneamente, com filtros avançados, ordenação hierárquica e scroll infinito.

---

## 2. O que será feito

- [ ] Criar componente `EmailsTable` com colunas: Status, Data, Remetente, Assunto, Valor
- [ ] Criar componente `EmailFilters` com filtros por Status, Data (range) e Categoria
- [ ] Criar hook `useEmailSort` para ordenação hierárquica (Shift+Click)
- [ ] Implementar scroll infinito (50 emails por vez)
- [ ] Implementar click na linha para abrir revisão
- [ ] Ocultar emails "ignorados" por padrão (filtro)
- [ ] Adicionar scroll horizontal em mobile
- [ ] Modificar `page.tsx` para usar nova tabela
- [ ] Atualizar exports do index.ts
- [ ] Testar responsividade e funcionalidades

---

## 3. Proposta

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

---

## 4. Implementação Técnica

### 4.1 Banco de Dados

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

### 4.2 Arquivos a Modificar/Criar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| MODIFICAR | `src/app/(dashboard)/emails/page.tsx` | Substituir `<KanbanEmails>` por `<EmailsTable>`. Adicionar estado para filtros (status, data, categoria). Manter lógica de busca e sync. Adicionar lógica de scroll infinito. |
| CRIAR | `src/components/features/emails/emails-table.tsx` | Novo componente de tabela. Colunas: Status, Data, Remetente, Assunto, Valor. Ordenação por headers (click simples + Shift+Click). Click na linha navega para `/emails/[id]`. Usa `useEmailSort` para ordenação. |
| CRIAR | `src/components/features/emails/email-filters.tsx` | Componente de filtros com 3 dropdowns: Status (multi-select), Data (range picker), Categoria. Callback `onFiltersChange()` para notificar mudanças. |
| CRIAR | `src/lib/hooks/useEmailSort.ts` | Hook de ordenação hierárquica. Gerencia array de sorts: `[{ column, direction }]`. Retorna função `handleHeaderClick(column, shiftPressed)` e emails ordenados. |
| MODIFICAR | `src/components/features/emails/index.ts` | Exportar `EmailsTable` e `EmailFilters` ao invés de `KanbanEmails`. |
| OPCIONAL | `src/components/features/emails/kanban-emails.tsx` | Comentar ou remover (manter como backup temporário). |
| OPCIONAL | `src/components/features/emails/email-card.tsx` | Comentar ou remover (manter como backup temporário). |

### 4.3 Fluxo de Dados

**Carregamento inicial:**

1. Usuário acessa `/emails` → Componente `EmailsPage` monta
2. `useEffect` chama `loadEmails()` → Busca todos emails do Supabase (`order by data_recebimento desc`)
3. Dados retornam → `setEmails(data)` armazena no estado
4. Estado inicial dos filtros:
   - `statusFiltro`: array com todos status EXCETO "ignorado"
   - `dataFiltro`: `{ de: null, ate: null }`
   - `categoriaFiltro`: `null` (todas)
   - `visibleCount`: `50`
5. Aplicação de filtros no cliente → `emailsFiltrados = emails.filter(...)` aplica busca, status, data, categoria
6. Aplicação de ordenação → `useEmailSort` ordena por: Status (aguardando_revisao primeiro) → Data (desc)
7. Renderização → `<EmailsTable emails={emailsFiltrados.slice(0, visibleCount)} />` renderiza primeiros 50

**Interação - Filtros:**

1. Usuário altera filtro (ex: seleciona categoria) → `EmailFilters` atualiza estado interno
2. Callback `onFiltersChange(newFilters)` → Notifica `EmailsPage`
3. `EmailsPage` atualiza estado → `setFiltros(newFilters)`
4. Re-render com novos filtros → Recalcula `emailsFiltrados`
5. Reseta `visibleCount` para 50 (volta ao início)

**Interação - Ordenação:**

1. Usuário clica em header da tabela → `EmailsTable` detecta click e verifica se Shift está pressionado
2. Se **Shift NÃO pressionado** → `useEmailSort` substitui array de sorts (ordenação única)
3. Se **Shift pressionado** → `useEmailSort` adiciona ao array de sorts (ordenação hierárquica)
4. Hook recalcula ordenação → Retorna emails ordenados
5. Re-render → Tabela mostra nova ordem com indicadores ↑/↓ nos headers

**Interação - Click na linha:**

1. Usuário clica em linha da tabela → `onClick` do `TableRow` dispara
2. `router.push(`/emails/${email.id}`)` → Navega para página de revisão
3. Página de revisão `/emails/[id]` carrega (componente já existe, sem alterações)

**Interação - Scroll infinito:**

1. Usuário scrola a página → Listener `onScroll` (ou `IntersectionObserver`) detecta proximidade do fim
2. Se `scrollPosition >= scrollHeight - 100px` → Incrementa `visibleCount`
3. `setVisibleCount(prev => prev + 50)` → Aumenta contador
4. Re-render → `slice(0, visibleCount)` mostra mais 50 emails
5. Se não há mais emails para mostrar → Não incrementa mais

**Sincronização (mantém lógica atual):**

1. Usuário clica em "Sincronizar" → `handleSync()` executa (função já existe)
2. Chama `/api/emails/sync` → Busca novos emails do servidor IMAP
3. Chama `/api/emails/process` → Processa emails com IA
4. Após sucesso → `loadEmails()` recarrega dados do Supabase
5. Estado reseta → Filtros mantidos, `visibleCount` volta para 50
6. Tabela atualiza → Novos emails aparecem respeitando filtros e ordenação

### 4.4 Dependências Externas

**N/A - sem dependências externas**

Todos os componentes necessários já estão instalados:
- `@/components/ui/table` (shadcn/ui) ✅
- `@/components/ui/badge` ✅
- `@/components/ui/button` ✅
- `date-fns` (formatação de datas) ✅
- `lucide-react` (ícones) ✅

---

### 4.5 Decisões de Design e Justificativas

- **Remoção do kanban:** Layout em cards ocupa muito espaço e dificulta navegação. Tabela permite ver mais emails simultaneamente.
- **Ordenação hierárquica (Shift+Click):** Permite sorts complexos (Status → Data → Remetente) mantendo flexibilidade.
- **Scroll infinito:** UX mais fluida que paginação tradicional. Carrega 50 por vez para performance.
- **Click na linha:** Remove necessidade de botões inline, UX mais limpa. Ações ficam na página de revisão.
- **Scroll horizontal mobile:** Mantém consistência visual. Adequado para ferramenta de gestão interna (não app público).
- **Ignorados ocultos por padrão:** Reduz ruído visual. Usuário pode habilitar no filtro quando necessário.


## 5. Execução

*(preenchido pelo Executor)*

### 5.1 Progresso

- [ ] Hook `useEmailSort` criado e testado
- [ ] Componente `EmailFilters` criado
- [ ] Componente `EmailsTable` criado
- [ ] Página `emails/page.tsx` modificada
- [ ] Exports `index.ts` atualizados
- [ ] TypeScript sem erros (`npx tsc --noEmit`)
- [ ] Testado manualmente (filtros, ordenação, scroll, click)
- [ ] Testado em mobile (scroll horizontal)

### 5.2 Notas de Implementação

[Decisões tomadas durante a execução, problemas encontrados, soluções aplicadas]

### 5.3 Conversa de Execução

*(problemas encontrados durante execução, soluções propostas)*

#### IA:
[mensagem]

---

## 6. Validação Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] Filtros funcionando (Status, Data, Categoria)
- [ ] Ordenação simples e hierárquica funcionando
- [ ] Scroll infinito carregando corretamente
- [ ] Click na linha navegando para revisão
- [ ] Emails ignorados ocultos por padrão
- [ ] Responsividade testada (desktop + mobile)
- [ ] PRD atualizado (via PRD-editor)
