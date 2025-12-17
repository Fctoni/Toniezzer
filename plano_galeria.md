# Plano de Implementacao - Galeria de Fotos da Obra

## Visao Geral

Criar uma galeria de fotos com **4 modos de visualizacao** diferentes, permitindo acompanhar a evolucao da obra de formas variadas.

---

## Estrutura de Abas

```
┌──────────────────────────────────────────────────────────────────┐
│  [📅 Timeline]  [🏗️ Por Etapa]  [↔️ Antes/Depois]  [📷 Grid]     │
├──────────────────────────────────────────────────────────────────┤
│                    (conteudo dinamico)                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

### Novos Componentes

| Arquivo | Descricao |
|---------|-----------|
| `galeria-timeline.tsx` | Visualizacao cronologica vertical |
| `galeria-etapas.tsx` | Visualizacao por etapas da obra |
| `galeria-comparacao.tsx` | Comparacao antes/depois |
| `galeria-grid.tsx` | Grid atual (extrair de galeria-fotos.tsx) |

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `galeria-fotos.tsx` | Adicionar sistema de abas + importar componentes |
| `documentos/page.tsx` | Passar dados adicionais (tags) para GaleriaFotos |

---

## Interface de Dados

### Foto (atualizada)

```typescript
interface Foto {
  id: string;
  nome: string;
  url: string;
  created_at: string;
  etapa_relacionada_id: string | null;
  etapas: { nome: string } | null;
  tags: string[] | null;  // ADICIONAR
}
```

### Props dos Componentes

```typescript
interface GaleriaProps {
  fotos: Foto[];
  etapas: Etapa[];
  onFotoClick: (foto: Foto) => void;
  onFotoDelete: (foto: Foto) => void;
}
```

---

## Detalhamento das Visualizacoes

---

### 1. Timeline Vertical (📅)

**Objetivo**: Mostrar evolucao cronologica da obra

**Layout**:
```
📅 Dezembro 2025
│
├── 17/12 - Terça-feira
│   ┌─────┐ ┌─────┐ ┌─────┐
│   │foto1│ │foto2│ │foto3│
│   └─────┘ └─────┘ └─────┘
│   🏷️ fundacao, concreto
│   🏗️ Etapa: Fundacao
│
├── 15/12 - Domingo
│   ┌─────┐ ┌─────┐
│   │foto1│ │foto2│
│   └─────┘ └─────┘
│   🏷️ escavacao
│
📅 Novembro 2025
│
├── 28/11 - Quinta-feira
│   ┌─────┐
│   │foto1│
│   └─────┘
│   🏷️ terreno, limpeza
```

**Funcionalidades**:
- [ ] Agrupar fotos por mes
- [ ] Dentro do mes, agrupar por dia
- [ ] Mostrar dia da semana
- [ ] Miniaturas horizontais (scroll se necessario)
- [ ] Mostrar tags abaixo das fotos
- [ ] Mostrar etapa relacionada
- [ ] Contador de fotos por dia
- [ ] Linha vertical conectando os dias
- [ ] Animacao suave ao expandir/colapsar mes

**Filtros**:
- [ ] Por periodo (data inicio/fim)
- [ ] Por etapa
- [ ] Por tag

---

### 2. Por Etapa da Obra (🏗️)

**Objetivo**: Visualizar progresso por etapas do cronograma

**Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│ Progresso Geral: ████████████░░░░░░░░ 60% (18/30 fotos)        │
└────────────────────────────────────────────────────────────────┘

[●]━━━━━━━━━[●]━━━━━━━━━[●]━━━━━━━━━[○]━━━━━━━━━[○]
Fundacao     Alvenaria    Eletrica    Acabamento   Pintura
✓ 12 fotos   ✓ 8 fotos    ✓ 3 fotos    0 fotos      0 fotos

┌─────────────────────────────────────────────────────────────┐
│ 📂 Fundacao (12 fotos)                              [v] [-] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │     │ │     │ │     │ │     │ │     │ │     │ ...        │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘            │
│ 01/12    03/12   05/12   08/12   10/12   12/12             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📂 Alvenaria (8 fotos)                              [v] [-] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │     │ │     │ │     │ │     │ │     │ │     │ ...        │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📂 Sem Etapa Definida (5 fotos)                     [v] [-] │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades**:
- [ ] Barra de progresso horizontal por etapa
- [ ] Indicador visual (circulo cheio/vazio)
- [ ] Cards colapsaveis por etapa
- [ ] Fotos ordenadas por data dentro de cada etapa
- [ ] Mostrar data abaixo de cada foto
- [ ] Secao "Sem Etapa Definida" para fotos nao classificadas
- [ ] Contador total de fotos

**Filtros**:
- [ ] Por etapa especifica
- [ ] Mostrar/ocultar vazias

---

### 3. Comparacao Antes/Depois (↔️)

**Objetivo**: Comparar evolucao visual lado a lado

**Layout - Modo Slider**:
```
┌─────────────────────────────────────────────────────────────┐
│ Selecione as fotos para comparar:                           │
│                                                             │
│ 🏷️ Tag "antes": [dropdown com fotos]                        │
│ 🏷️ Tag "depois": [dropdown com fotos]                       │
│                                                             │
│ OU                                                          │
│                                                             │
│ 📅 Data inicial: [____] → 📅 Data final: [____]             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     ┌─────────────┬─────────────┐                          │
│     │             │             │                          │
│     │   ANTES     │   DEPOIS    │                          │
│     │             │             │                          │
│     │  [imagem]  ←|→ [imagem]   │  ← slider interativo     │
│     │             │             │                          │
│     │             │             │                          │
│     └─────────────┴─────────────┘                          │
│                                                             │
│     Nov/2025              Dez/2025                          │
│     Fundacao              Fundacao                          │
│                                                             │
│     [< Anterior]  1/5  [Proximo >]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Layout - Modo Grade Comparativa**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Novembro 2025          →          📅 Dezembro 2025       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐                          ┌─────────┐          │
│  │  ANTES  │          →→→            │ DEPOIS  │          │
│  │ foto 1  │                          │ foto 2  │          │
│  └─────────┘                          └─────────┘          │
│  Fundacao                             Fundacao              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐                          ┌─────────┐          │
│  │  ANTES  │          →→→            │ DEPOIS  │          │
│  │ foto 3  │                          │ foto 4  │          │
│  └─────────┘                          └─────────┘          │
│  Alvenaria                            Alvenaria             │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades**:
- [ ] Selecao por tags (antes/depois)
- [ ] Selecao por periodo de datas
- [ ] Slider interativo para comparacao
- [ ] Navegacao entre pares de fotos
- [ ] Mostrar data e etapa de cada foto
- [ ] Modo lado a lado (sem slider)
- [ ] Zoom sincronizado em ambas imagens

**Filtros**:
- [ ] Por tag
- [ ] Por periodo
- [ ] Por etapa

**Dependencias**:
- Fotos precisam ter tags "antes" e "depois" para funcionar
- Mostrar mensagem se nao houver fotos com essas tags

---

### 4. Grid Classico (📷)

**Objetivo**: Visualizacao rapida em grade (atual, melhorada)

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Filtros: [Etapa ▼] [Data inicio] [Data fim] [Tags ▼]        │
│          [Limpar filtros]          12 de 30 foto(s)         │
└─────────────────────────────────────────────────────────────┘

┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│         │ │         │ │         │ │         │
│ [imagem]│ │ [imagem]│ │ [imagem]│ │ [imagem]│
│         │ │         │ │         │ │         │
├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤
│Nome foto│ │Nome foto│ │Nome foto│ │Nome foto│
│17/12/25 │ │16/12/25 │ │15/12/25 │ │14/12/25 │
│Fundacao │ │Fundacao │ │Alvenaria│ │Alvenaria│
│#tag1    │ │#tag2    │ │#tag1    │ │         │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│   ...   │ │   ...   │ │   ...   │ │   ...   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

**Funcionalidades**:
- [ ] Grid responsivo (2/3/4 colunas)
- [ ] Mostrar nome da foto
- [ ] Mostrar data
- [ ] Mostrar etapa (badge)
- [ ] Mostrar tags (badges pequenos)
- [ ] Hover com overlay escuro
- [ ] Filtro por etapa
- [ ] Filtro por data (inicio/fim)
- [ ] Filtro por tags (multi-select)
- [ ] Contador de fotos filtradas

**Melhorias vs atual**:
- [x] Filtro por data (ja implementado)
- [ ] Mostrar info abaixo de cada foto (nao so no hover)
- [ ] Filtro por tags
- [ ] Mostrar tags na listagem

---

## Modal de Visualizacao (Compartilhado)

Todas as abas usam o mesmo modal ao clicar em uma foto:

```
┌─────────────────────────────────────────────────────────────┐
│ nome-da-foto.jpg                    [Download] [Excluir]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      [IMAGEM GRANDE]                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 🏗️ Etapa: Fundacao                                          │
│ 📅 Data: 17/12/2025 14:30                                   │
│ 🏷️ Tags: fundacao, concreto, dia-1                          │
│ 📦 Tamanho: 2.3 MB                                          │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades do Modal**:
- [ ] Imagem em tamanho grande
- [ ] Botao download
- [ ] Botao excluir (com confirmacao)
- [ ] Mostrar etapa
- [ ] Mostrar data/hora
- [ ] Mostrar tags
- [ ] Mostrar tamanho do arquivo
- [ ] Navegacao entre fotos (setas)

---

## Checklist de Implementacao

### Fase 1 - Preparacao ✅
- [x] Atualizar interface `Foto` para incluir `tags`
- [x] Atualizar query no `page.tsx` para trazer `tags`
- [x] Criar estrutura de abas em `galeria-fotos.tsx`

### Fase 2 - Grid Melhorado ✅
- [x] Extrair grid atual para `galeria-grid.tsx`
- [x] Adicionar exibicao de tags
- [x] Adicionar filtro por tags
- [x] Mostrar info abaixo das fotos (nao so hover)

### Fase 3 - Timeline Vertical ✅
- [x] Criar `galeria-timeline.tsx`
- [x] Agrupar fotos por mes
- [x] Agrupar fotos por dia
- [x] Linha vertical de conexao
- [x] Miniaturas horizontais
- [x] Exibir tags e etapa

### Fase 4 - Por Etapa ✅
- [x] Criar `galeria-etapas.tsx`
- [x] Barra de progresso por etapa
- [x] Cards colapsaveis
- [x] Secao "Sem Etapa"

### Fase 5 - Comparacao ✅
- [x] Criar `galeria-comparacao.tsx`
- [x] Selecao por tags
- [x] Slider interativo
- [x] Modo lado a lado

### Fase 6 - Modal Melhorado ✅
- [x] Adicionar exibicao de tags
- [x] Adicionar tamanho do arquivo
- [x] Navegacao entre fotos (setas)
- [x] Contador de fotos (X de Y)

### Fase 7 - Testes
- [ ] Testar com fotos reais
- [ ] Testar filtros
- [ ] Testar exclusao
- [ ] Testar responsividade

---

## Estimativa

| Fase | Tempo estimado |
|------|----------------|
| Fase 1 - Preparacao | 15 min |
| Fase 2 - Grid Melhorado | 30 min |
| Fase 3 - Timeline | 45 min |
| Fase 4 - Por Etapa | 45 min |
| Fase 5 - Comparacao | 60 min |
| Fase 6 - Modal | 20 min |
| Fase 7 - Testes | 15 min |
| **Total** | **~4 horas** |

---

## Observacoes Tecnicas

1. **Performance**: Para muitas fotos, considerar paginacao/lazy loading
2. **Responsividade**: Todas as visualizacoes devem funcionar em mobile
3. **Acessibilidade**: Manter navegacao por teclado
4. **Estado**: Usar URL params para manter filtros ao navegar

---

## Dependencias

- Componentes shadcn/ui ja instalados: Tabs, Dialog, Badge, Button, Select, Input
- date-fns para manipulacao de datas
- next/image para otimizacao de imagens

