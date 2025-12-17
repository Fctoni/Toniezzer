# Auditoria UX Mobile - Toniezzer Manager

> **Data**: 17/12/2024  
> **Versao**: 1.1  
> **Status**: ✅ APROVADO - Implementacao iniciada

### Decisoes Aprovadas (17/12/2024)
- [x] Bottom Tab: 5 itens (Dashboard, Foto, Cronograma, Comunicacao, Mais)
- [x] Cronograma mobile: versao simplificada com lista colapsavel
- [x] Financeiro: scroll horizontal aceitavel
- [x] PWA: incluir manifest para instalacao
- [x] Ordem: Lote 1 primeiro (navegacao)

---

## 1. Sumario Executivo

### Objetivo
Tornar o Toniezzer Manager responsivo para uso em **celulares e tablets**, mantendo a experiencia desktop intacta.

### Prioridades do Usuario (em ordem)
1. 📷 **Compras via foto** (OCR/camera)
2. 🖼️ **Galeria** (upload de fotos, documentos)
3. 📅 **Cronograma** (versao simplificada para uso na obra)
4. 💬 **Comunicacao** (topicos e mensagens)

### Diagnostico Geral

| Categoria | Status | Esforco |
|-----------|--------|---------|
| Layout/Navegacao | ❌ Bloqueante | Alto |
| Compras (OCR) | ✅ 90% pronto | Baixo |
| Galeria | ✅ 80% ok | Baixo |
| Cronograma | ❌ Nao funciona | Alto |
| Comunicacao | ✅ 70% ok | Medio |
| Financeiro | ⚠️ Tabelas complexas | Alto |
| Dashboard | ✅ Parcial | Baixo |

### Conclusao
O app tem uma **base solida** com Tailwind CSS e Shadcn/UI, o que facilita a responsividade. O maior bloqueio e o **layout fixo** (sidebar 256px). Uma vez resolvido isso, ~60% do app ja funciona razoavelmente em mobile.

---

## 2. Stack e Pontos de Partida

### Tecnologias
- **Framework**: Next.js 15+ (App Router)
- **UI Library**: Shadcn/UI
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Icones**: Lucide React

### Pontos Positivos (ja existentes)
- ✅ Tailwind CSS com breakpoints prontos (`sm:`, `md:`, `lg:`)
- ✅ Componentes Shadcn/UI sao responsivos por padrao
- ✅ Alguns formularios ja usam `sm:grid-cols-2`
- ✅ Galeria ja tem grid responsivo (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`)
- ✅ Camera Capture ja e mobile-first
- ✅ Componente Sheet do Shadcn (drawer) disponivel

### Breakpoints Recomendados
```css
/* Mobile First */
sm: 640px   /* Celulares grandes / phablets */
md: 768px   /* Tablets portrait */
lg: 1024px  /* Tablets landscape / laptops pequenos */
xl: 1280px  /* Desktop */
```

---

## 3. Diagnostico: Layout e Navegacao (BLOQUEANTE)

### 3.1 Problema Atual

**Arquivo**: `src/app/(dashboard)/layout.tsx`
```tsx
<div className="min-h-screen bg-background">
  <Sidebar />
  <div className="pl-64 transition-all duration-300">  // ❌ FIXO
    <Header />
    <main className="p-6">{children}</main>
  </div>
</div>
```

**Arquivo**: `src/components/layout/sidebar.tsx`
```tsx
<aside className={cn(
  "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r",
  collapsed ? "w-16" : "w-64"  // ❌ Sempre visivel
)}>
```

### 3.2 Solucao Proposta

#### Navegacao Mobile: Bottom Tab Bar + Drawer

**Por que Bottom Tab Bar?**
- Padrao iOS/Android mais reconhecido
- Polegar alcanca facilmente
- Itens principais sempre visiveis
- Profissional e moderno

**Estrutura:**
```
┌─────────────────────────────────────┐
│ Header (simplificado)          ☰   │
├─────────────────────────────────────┤
│                                     │
│         CONTEUDO DA PAGINA          │
│                                     │
├─────────────────────────────────────┤
│ 🏠  📷  📅  💬  ⋯                   │  ← Bottom Tab (5 itens)
└─────────────────────────────────────┘
```

**Itens da Bottom Tab (5 principais):**
1. 🏠 Dashboard
2. 📷 Foto/OCR (acesso rapido)
3. 📅 Cronograma
4. 💬 Comunicacao
5. ⋯ Mais (abre drawer com menu completo)

**Drawer lateral (menu completo):**
- Acionado pelo "⋯ Mais" ou hamburguer no header
- Contem todos os itens do menu atual
- Fecha ao selecionar item

### 3.3 Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `layout.tsx` | Condicional mobile/desktop |
| `sidebar.tsx` | Manter para desktop |
| **NOVO** `mobile-nav.tsx` | Bottom Tab Bar |
| **NOVO** `mobile-drawer.tsx` | Menu drawer |
| `header.tsx` | Simplificar para mobile |

---

## 4. Analise por Modulo Prioritario

### 4.1 📷 Compras via Foto (OCR)

**Status**: ✅ 90% pronto

**Componentes analisados:**
- `camera-capture.tsx` - ✅ Ja e mobile-first
- `form-ocr.tsx` - ✅ Funciona bem
- `preview-ocr.tsx` - ✅ OK

**O que funciona:**
- Captura de camera com `facingMode: 'environment'`
- Upload de arquivo
- Preview da imagem
- Aspect ratio 4/3

**Ajustes necessarios:**
| Item | Esforco | Descricao |
|------|---------|-----------|
| Botoes maiores | Baixo | Touch targets de 44px minimo |
| Feedback haptico | Baixo | Vibrar ao capturar (opcional) |

**Risco**: Nenhum

---

### 4.2 🖼️ Galeria de Documentos

**Status**: ✅ 80% ok

**Componentes analisados:**
- `galeria-grid.tsx` - ✅ Ja responsivo
- `galeria-fotos.tsx` - ✅ OK
- `galeria-timeline.tsx` - ⚠️ Verificar
- `galeria-comparacao.tsx` - ⚠️ Verificar
- `upload-form.tsx` - ✅ 80% ok

**O que ja funciona:**
```tsx
// galeria-grid.tsx - JA RESPONSIVO
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

**Ajustes necessarios:**
| Item | Esforco | Descricao |
|------|---------|-----------|
| Touch na galeria | Baixo | Swipe para navegar fotos |
| Modal fullscreen | Baixo | Visualizar foto em tela cheia |
| Upload dropzone | Baixo | Reduzir padding em mobile |
| Timeline vertical | Medio | Adaptar para tela estreita |
| Comparacao lado-a-lado | Medio | Pode virar empilhado ou slider |

**Risco**: Baixo

---

### 4.3 📅 Cronograma

**Status**: ❌ Nao funciona em mobile

**Componente principal**: `cronograma-table.tsx` (1086 linhas)

**Problema:**
```tsx
// Grid de 11 colunas FIXAS
const gridCols = "grid-cols-[40px_40px_minmax(200px,1fr)_150px_100px_100px_150px_100px_100px_80px_50px]";
```

**Por que nao funciona:**
- 11 colunas = ~1100px minimo
- Celular tem ~375px
- Drag-and-drop nao funciona bem em touch
- Muita informacao para tela pequena

**Solucao: Versao Mobile Simplificada**

O usuario quer poder **usar na obra para iniciar/concluir tarefas**. Nao precisa de todas as funcionalidades.

**Proposta de UI Mobile:**

```
┌─────────────────────────────────────┐
│ 📅 Cronograma           [+ Tarefa]  │
├─────────────────────────────────────┤
│ ▼ Fundacao                    75% ● │
│   ├─ Escavacao          ✅ Concluida│
│   ├─ Forma              ✅ Concluida│
│   └─ Concretagem        🔵 Em and.  │  ← Tap para acoes
├─────────────────────────────────────┤
│ ▶ Estrutura                   0%  ○ │  ← Colapsado
├─────────────────────────────────────┤
│ ▶ Alvenaria                   0%  ○ │
└─────────────────────────────────────┘
```

**Interacoes mobile:**
- **Tap na etapa**: Expande/colapsa
- **Tap na tarefa**: Abre bottom sheet com:
  - Status (alterar)
  - Responsavel
  - Datas
  - Botao "Iniciar" / "Concluir"
- **Sem drag-and-drop**: Reordenar apenas no desktop

**Componentes necessarios:**
| Componente | Tipo | Descricao |
|------------|------|-----------|
| `cronograma-mobile.tsx` | NOVO | Lista colapsavel de etapas |
| `tarefa-bottom-sheet.tsx` | NOVO | Acoes da tarefa |
| `cronograma-table.tsx` | MANTER | Desktop only |

**Esforco**: Alto (componente novo)  
**Risco**: Medio (nova logica de UI)

---

### 4.4 💬 Comunicacao

**Status**: ✅ 70% ok

**Componentes analisados:**
- `comunicacao/page.tsx` - ✅ Estrutura ok
- `topico-card.tsx` - ✅ Ja usa flex-wrap
- `topico-linha.tsx` - ✅ OK
- `feed-item.tsx` - ⚠️ Verificar
- `mensagem-topico.tsx` - ⚠️ Verificar
- `novo-topico-dialog.tsx` - ✅ Dialog ok

**O que ja funciona:**
```tsx
// Filtros com flex-wrap
<div className="flex flex-wrap gap-4 items-center">

// Cards com layout flexivel
<div className="flex items-start gap-4">
```

**Ajustes necessarios:**
| Item | Esforco | Descricao |
|------|---------|-----------|
| Input de busca | Baixo | `min-w-[200px]` → `w-full sm:max-w-sm` |
| Avatar menor | Baixo | `h-10 w-10` → `h-8 w-8` em mobile |
| Tabs menores | Baixo | `text-xs` ja aplicado, verificar overflow |
| Mencoes input | Medio | Autocomplete pode precisar ajuste |
| Thread de mensagens | Medio | Verificar scroll e input fixo no bottom |

**Risco**: Baixo

---

## 5. Modulos Secundarios

### 5.1 Dashboard

**Status**: ✅ Parcialmente responsivo

**Arquivo**: `dashboard/page.tsx`

**O que ja funciona:**
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
```

**Ajustes:**
| Item | Esforco |
|------|---------|
| Cards 1 coluna em mobile | Ja funciona |
| Graficos responsivos | Verificar |
| Texto truncado | Baixo |

---

### 5.2 Financeiro

**Status**: ⚠️ Tabelas complexas

**Componentes problematicos:**

#### `matriz-tabela.tsx`
- Matriz pivotada (categorias x etapas)
- N colunas dinamicas
- **Solucao**: Scroll horizontal com coluna fixa (ja implementado parcialmente)

#### `lancamentos-table.tsx`
- ~10 colunas
- **Solucao**: Cards em mobile ou scroll horizontal

#### `fluxo-caixa-chart.tsx`
- Grafico
- **Solucao**: Verificar responsividade do Recharts

**Decisao sugerida:**
> Financeiro pode permanecer **desktop-first** com scroll horizontal aceitavel em mobile. Nao e prioridade para uso na obra.

---

### 5.3 Configuracoes

**Status**: ✅ Simples

Formularios basicos, devem funcionar com ajustes minimos.

---

## 6. Componentes Reutilizaveis

### 6.1 Tabelas → Estrategia Mobile

**Problema geral**: Tabelas com muitas colunas nao cabem.

**Estrategias disponiveis:**

| Estrategia | Quando usar | Exemplo |
|------------|-------------|---------|
| **Cards** | Dados hierarquicos | Compras, Fornecedores |
| **Scroll horizontal** | Dados tabulares puros | Matriz gastos |
| **Colunas colapsaveis** | Algumas colunas opcionais | Lancamentos |
| **Componente diferente** | UI completamente diferente | Cronograma |

**Padrao sugerido:**
```tsx
// Detectar mobile e renderizar componente apropriado
const isMobile = useMediaQuery("(max-width: 768px)");

return isMobile ? <ComprasMobile /> : <ComprasTable />;
```

### 6.2 Formularios

**Status**: ✅ Maioria ok

Ja usam `sm:grid-cols-2`, funcionam em mobile.

**Verificar:**
- Popovers de calendario (podem abrir fora da tela)
- Selects com muitas opcoes (scroll interno)

### 6.3 Modais/Dialogs

**Status**: ✅ Shadcn ja e responsivo

Dialogs do Shadcn/UI ja se adaptam a tela.

**Ajuste sugerido:**
- Em mobile, dialogs podem virar **bottom sheets** (Drawer)

### 6.4 Filtros

**Status**: ⚠️ Alguns precisam ajuste

**Problema comum:**
```tsx
<div className="flex gap-4">  // Pode estourar
```

**Solucao:**
```tsx
<div className="flex flex-wrap gap-4">  // Quebra linha
// ou
<div className="flex flex-col sm:flex-row gap-4">  // Empilha em mobile
```

---

## 7. Decisoes de Design

### 7.1 ✅ Funcionalidades que ficam IGUAIS
- Camera/OCR
- Upload de arquivos
- Visualizacao de fotos
- Notificacoes
- Perfil do usuario
- Login

### 7.2 ⚡ Funcionalidades SIMPLIFICADAS em mobile
- **Cronograma**: Lista colapsavel (sem drag-and-drop, sem todas as colunas)
- **Tabelas grandes**: Scroll horizontal ou cards
- **Header**: Sem campo de busca visivel (abre em modal)
- **Sidebar**: Vira bottom tab + drawer

### 7.3 🖥️ Funcionalidades DESKTOP-ONLY (aceitavel em mobile com scroll)
- Matriz de gastos completa
- Orcamento detalhado por etapa
- Drag-and-drop de etapas/tarefas
- Edicao inline em tabelas

---

## 8. Plano de Implementacao (Lotes)

### Lote 1: Layout e Navegacao (BLOQUEANTE)
**Estimativa**: 4-6 horas

| # | Tarefa | Arquivos |
|---|--------|----------|
| 1.1 | Criar `mobile-nav.tsx` (Bottom Tab) | NOVO |
| 1.2 | Criar `mobile-drawer.tsx` (Menu) | NOVO |
| 1.3 | Modificar `layout.tsx` (condicional) | EXISTENTE |
| 1.4 | Adaptar `header.tsx` para mobile | EXISTENTE |
| 1.5 | CSS: esconder sidebar em mobile | EXISTENTE |

**Entregavel**: Navegacao funcional em mobile

---

### Lote 2: Modulos Prioritarios
**Estimativa**: 6-8 horas

| # | Tarefa | Arquivos |
|---|--------|----------|
| 2.1 | Ajustes finos no OCR/Camera | camera-capture.tsx |
| 2.2 | Galeria: modal fullscreen, touch | galeria-*.tsx |
| 2.3 | Cronograma mobile (NOVO) | cronograma-mobile.tsx |
| 2.4 | Bottom sheet para tarefas | tarefa-bottom-sheet.tsx |
| 2.5 | Comunicacao: ajustes de layout | comunicacao/*.tsx |

**Entregavel**: 4 modulos prioritarios funcionais

---

### Lote 3: Ajustes Gerais
**Estimativa**: 3-4 horas

| # | Tarefa | Arquivos |
|---|--------|----------|
| 3.1 | Dashboard responsivo | dashboard/page.tsx |
| 3.2 | Compras: tabela → cards | compras-*.tsx |
| 3.3 | Fornecedores: tabela → cards | fornecedor-*.tsx |
| 3.4 | Filtros: flex-wrap | varios |
| 3.5 | Formularios: verificar popovers | varios |

**Entregavel**: App completo responsivo

---

### Lote 4: Polimento
**Estimativa**: 2-3 horas

| # | Tarefa |
|---|--------|
| 4.1 | Testes em dispositivos reais |
| 4.2 | Ajustes de touch targets (44px min) |
| 4.3 | Performance mobile |
| 4.4 | PWA manifest (opcional) |

**Entregavel**: App pronto para producao mobile

---

## 9. Estimativa de Esforco Total

| Lote | Horas | Complexidade |
|------|-------|--------------|
| Lote 1 | 4-6h | Alta |
| Lote 2 | 6-8h | Alta |
| Lote 3 | 3-4h | Media |
| Lote 4 | 2-3h | Baixa |
| **TOTAL** | **15-21h** | - |

---

## 10. Proximos Passos

### Perguntas para o usuario:

1. **Bottom Tab**: Concorda com os 5 itens sugeridos (Dashboard, Foto, Cronograma, Comunicacao, Mais)?

2. **Cronograma mobile**: A versao simplificada (lista colapsavel + bottom sheet para acoes) atende a necessidade de "iniciar tarefas na obra"?

3. **Financeiro**: Aceita que fique com scroll horizontal em mobile (nao e prioridade)?

4. **PWA**: Quer que o app possa ser "instalado" no celular como um app nativo?

5. **Ordem dos lotes**: Posso comecar pelo Lote 1 (navegacao) ou prefere outra ordem?

---

## Apendice: Componentes Analisados

### Layout
- [x] `layout.tsx` - Dashboard layout
- [x] `sidebar.tsx` - Menu lateral
- [x] `header.tsx` - Cabecalho

### Compras
- [x] `compras-table.tsx` - Tabela de compras
- [x] `compra-form.tsx` - Formulario
- [x] `compra-card.tsx` - Card individual
- [x] `compras-filters.tsx` - Filtros

### OCR/Camera
- [x] `camera-capture.tsx` - Captura de foto
- [x] `form-ocr.tsx` - Formulario OCR
- [x] `preview-ocr.tsx` - Preview

### Galeria
- [x] `galeria-grid.tsx` - Grid de fotos
- [x] `galeria-fotos.tsx` - Container
- [x] `upload-form.tsx` - Upload
- [ ] `galeria-timeline.tsx` - Verificar
- [ ] `galeria-comparacao.tsx` - Verificar

### Cronograma
- [x] `cronograma-table.tsx` - Tabela principal
- [x] `timeline-etapas.tsx` - Timeline
- [x] `tarefas-list.tsx` - Lista de tarefas

### Comunicacao
- [x] `page.tsx` - Pagina principal
- [x] `topico-card.tsx` - Card de topico
- [x] `topico-linha.tsx` - Linha de topico
- [ ] `feed-item.tsx` - Item do feed
- [ ] `mensagem-topico.tsx` - Mensagem

### Financeiro
- [x] `matriz-tabela.tsx` - Matriz gastos
- [x] `lancamentos-table.tsx` - Tabela
- [ ] `fluxo-caixa-chart.tsx` - Grafico

### Dashboard
- [x] `page.tsx` - Dashboard principal

---

**Fim da Auditoria**
