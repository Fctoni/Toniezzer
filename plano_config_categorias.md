# 📋 Plano de Implementacao - Configuracao de Categorias

**Data:** 17/12/2024  
**Versao:** 1.1  
**Status:** Aguardando Revisao (Revisao 2)

---

## 🎯 Objetivo

Implementar a pagina `/configuracoes/categorias` para permitir o gerenciamento completo de **categorias** e **subcategorias** utilizadas em todo o sistema financeiro (compras e gastos).

---

## 📊 Contexto Atual

### O que JA existe no banco de dados:

#### Tabela `categorias`
```sql
- id (uuid)
- nome (text)
- cor (text) -- hex color
- icone (text) -- emoji
- ordem (integer) -- para ordenacao customizada
- orcamento (decimal) -- DEPRECATED (null em todos os registros, usar orcamento_detalhado por etapa)
- ativo (boolean)
- created_by (uuid FK users)
- created_at, updated_at
```

#### Tabela `subcategorias`
```sql
- id (uuid)
- categoria_id (uuid FK categorias)
- nome (text)
- ativo (boolean)
- created_at, updated_at
```

### Uso no sistema:
- `compras.categoria_id` (obrigatorio) e `compras.subcategoria_id` (opcional)
- `gastos.categoria_id` (obrigatorio) e `gastos.subcategoria_id` (opcional)
- Matriz de Gastos (agrupamento e analises)
- Orcamento por Etapa (vinculo categoria → etapa)
- Relatorios e graficos financeiros

### Estado atual da pagina:
- Arquivo existe: `src/app/(dashboard)/configuracoes/categorias/page.tsx`
- Status: placeholder "Funcionalidade em desenvolvimento"
- Tab ja configurada no layout de configuracoes

---

## ✨ Funcionalidades a Implementar

### 1. Visualizacao de Categorias

**Exibicao:**
- Tabela ordenada pelo campo `ordem` (crescente)
- Colunas: Badge visual (cor+icone), Nome, Status, Acoes
- Cada linha pode ser expandida para mostrar subcategorias
- Visual: categorias inativas com opacidade reduzida

**Badge Visual:**
- Circulo ou pill com cor de fundo (`categoria.cor`)
- Icone emoji dentro do badge (`categoria.icone`)
- Exemplo: 🏗️ em fundo laranja para "Construcao"

**Status:**
- Badge "Ativo" (verde) ou "Inativo" (cinza)
- Categorias inativas nao aparecem em selects de nova compra/gasto

### 2. Expandir/Recolher Subcategorias

**Comportamento:**
- Icone chevron (▼/▶) ao lado do nome da categoria
- Click expande linha mostrando subcategorias como sub-tabela indentada
- Estado expandido mantido em state local (nao persiste no refresh)

**Exibicao de Subcategorias:**
- Sub-tabela indentada visualmente
- Colunas: Nome, Status, Acoes
- Herda cor/icone da categoria pai (sem repeticao visual)
- Botao "Adicionar Subcategoria" no topo da secao expandida

### 3. Criar Nova Categoria

**Trigger:**
- Botao "Nova Categoria" no header do card (direita superior)
- Permissao: Admin ou Editor

**Dialog/Modal:**
- Titulo: "Nova Categoria"
- Campos:
  1. **Nome** (Input text, obrigatorio)
  2. **Cor** (Color picker - paleta de 13 cores pre-definidas)
  3. **Icone** (Grid de emojis selecionaveis - 12 opcoes)

**Paleta de Cores (13 opcoes):**
```javascript
[
  { valor: '#ef4444', nome: 'Vermelho' },
  { valor: '#f97316', nome: 'Laranja' },
  { valor: '#f59e0b', nome: 'Amarelo' },
  { valor: '#84cc16', nome: 'Verde Limao' },
  { valor: '#22c55e', nome: 'Verde' },
  { valor: '#14b8a6', nome: 'Teal' },
  { valor: '#06b6d4', nome: 'Ciano' },
  { valor: '#3b82f6', nome: 'Azul' },
  { valor: '#6366f1', nome: 'Indigo' },
  { valor: '#8b5cf6', nome: 'Roxo' },
  { valor: '#a855f7', nome: 'Purpura' },
  { valor: '#ec4899', nome: 'Rosa' },
  { valor: '#64748b', nome: 'Cinza' },
]
```

**Icones Disponiveis (12 opcoes):**
```javascript
[
  { icone: '🏗️', nome: 'Construcao' },
  { icone: '🔨', nome: 'Ferramentas' },
  { icone: '🧱', nome: 'Material' },
  { icone: '⚡', nome: 'Eletrica' },
  { icone: '💧', nome: 'Hidraulica' },
  { icone: '🎨', nome: 'Pintura' },
  { icone: '🪟', nome: 'Esquadrias' },
  { icone: '🚪', nome: 'Portas' },
  { icone: '🔧', nome: 'Manutencao' },
  { icone: '📦', nome: 'Geral' },
  { icone: '💰', nome: 'Financeiro' },
  { icone: '📄', nome: 'Documentacao' },
]
```

**Ao Salvar:**
- Validacao: nome obrigatorio
- **Validacao: verificar se nome ja existe (bloquear duplicatas)**
  ```sql
  SELECT COUNT(*) FROM categorias WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?))
  ```
  - Se COUNT > 0: toast de erro "Ja existe uma categoria com este nome"
- Campo `ordem`: buscar MAX(ordem) + 1 (nova categoria vai para o final)
- Campo `ativo`: sempre TRUE para nova categoria
- Campo `created_by`: id do usuario logado
- Toast de sucesso/erro
- Fechar dialog e recarregar lista

### 4. Editar Categoria Existente

**Trigger:**
- Icone de lapiz no menu dropdown de acoes de cada categoria
- Permissao: Admin ou Editor

**Dialog:**
- Mesmo formulario da criacao, mas titulo "Editar Categoria"
- Campos pre-preenchidos com valores atuais
- Campo `ordem` nao e editavel aqui (usar setas de reordenacao)

**Ao Salvar:**
- **Validacao: verificar se nome ja existe em OUTRA categoria (bloquear duplicatas)**
  ```sql
  SELECT COUNT(*) FROM categorias 
  WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?)) 
  AND id != ?
  ```
  - Se COUNT > 0: toast de erro "Ja existe outra categoria com este nome"
- UPDATE apenas campos editaveis
- Campo `updated_at` atualizado automaticamente
- Toast de sucesso/erro

### 5. Ativar/Desativar Categoria

**Trigger:**
- Opcao no dropdown de acoes: "Desativar" ou "Ativar"
- Permissao: Admin

**Comportamento:**
- Alert/Confirmacao antes de executar
- Toggle do campo `ativo` (true ↔ false)
- Nao deleta dados, apenas esconde de selects
- Subcategorias herdam status? **NAO** (cada subcategoria tem status proprio)

**Validacao:**
- Permitir desativar mesmo com gastos/compras vinculados (apenas oculta)
- Aviso visual: "X gastos/compras usam esta categoria"

**Efeito em Subcategorias:**
- Quando categoria.ativo = false, TODAS as subcategorias dela ficam automaticamente ocultas nos selects
- Nao alterar campo subcategoria.ativo (manter valor original)
- Logica nos selects de compras/gastos:
  ```sql
  SELECT s.* FROM subcategorias s
  INNER JOIN categorias c ON s.categoria_id = c.id
  WHERE s.ativo = true AND c.ativo = true
  ```

### 6. Reordenar Categorias (Drag and Drop)

**Trigger:**
- Cursor grab/move ao passar mouse sobre linha da categoria
- Permissao: Admin ou Editor

**Biblioteca:**
- `@dnd-kit` - Moderna, acessivel, performatica
- Vantagens vs react-beautiful-dnd: 
  - Melhor performance
  - Sem warnings do React 18
  - Mais flexivel
  - Melhor suporte a touch devices
- Componentes principais: 
  - `DndContext` (wrapper)
  - `SortableContext` (lista ordenavel)
  - `useSortable` (hook para cada item)

**Comportamento:**
- Usuario arrasta linha da categoria para nova posicao
- Feedback visual durante drag (linha levemente transparente)
- Drop area destacada visualmente
- Ao soltar: recalcular todas as ordens e fazer UPDATE em lote

**Implementacao:**
```typescript
// Estado de categorias e ordenadas
const [categorias, setCategorias] = useState<Categoria[]>([])

// Ao arrastar e soltar
const handleDragEnd = async (event) => {
  const { active, over } = event
  if (!over || active.id === over.id) return

  // Reordenar array local
  const oldIndex = categorias.findIndex(c => c.id === active.id)
  const newIndex = categorias.findIndex(c => c.id === over.id)
  const reordered = arrayMove(categorias, oldIndex, newIndex)
  
  // Atualizar state local imediatamente (otimistic update)
  setCategorias(reordered)

  // Atualizar todas as ordens no banco
  const updates = reordered.map((cat, index) => 
    supabase
      .from('categorias')
      .update({ ordem: index + 1 })
      .eq('id', cat.id)
  )
  
  await Promise.all(updates)
  toast.success('Ordem atualizada!')
}
```

**UX:**
- Icone de "grip" (⋮⋮) no inicio de cada linha indicando drag handle
- Desabilitar drag para usuarios Viewer

### 7. Criar Subcategoria

**Trigger:**
- Botao "Adicionar Subcategoria" dentro da secao expandida de uma categoria
- Permissao: Admin ou Editor

**Dialog:**
- Titulo: "Nova Subcategoria - [Nome da Categoria Pai]"
- Campo: **Nome** (Input text, obrigatorio)
- Nao tem cor/icone/orcamento (herda da categoria pai)

**Ao Salvar:**
- **Validacao: verificar duplicata APENAS dentro da mesma categoria**
  ```sql
  SELECT COUNT(*) FROM subcategorias 
  WHERE categoria_id = ? 
  AND LOWER(TRIM(nome)) = LOWER(TRIM(?))
  ```
  - Se COUNT > 0: toast de erro "Ja existe uma subcategoria com este nome nesta categoria"
  - **Nota**: Permitir subcategorias com mesmo nome em categorias diferentes
- Campo `categoria_id`: id da categoria pai
- Campo `ativo`: sempre TRUE
- Toast de sucesso/erro

### 8. Editar Subcategoria

**Trigger:**
- Icone de lapiz no menu dropdown da subcategoria
- Permissao: Admin ou Editor

**Dialog:**
- Titulo: "Editar Subcategoria"
- Campo: Nome (pre-preenchido)

**Validacao:**
- **Verificar duplicata APENAS dentro da mesma categoria (exceto proprio registro)**
  ```sql
  SELECT COUNT(*) FROM subcategorias 
  WHERE categoria_id = ? 
  AND LOWER(TRIM(nome)) = LOWER(TRIM(?))
  AND id != ?
  ```
- Nao permitir trocar de categoria pai (se necessario, deletar e recriar)

### 9. Ativar/Desativar Subcategoria

**Comportamento identico ao de categoria:**
- Opcao no dropdown: "Desativar" ou "Ativar"
- Alert de confirmacao
- Toggle do campo `ativo`

### 10. Deletar Categoria

**Trigger:**
- Opcao no dropdown: "Deletar" (texto vermelho)
- Permissao: apenas Admin

**Validacao CRITICA:**
```sql
-- Verificar se categoria esta em uso:
SELECT COUNT(*) FROM compras WHERE categoria_id = ?
SELECT COUNT(*) FROM gastos WHERE categoria_id = ?
SELECT COUNT(*) FROM orcamento_detalhado WHERE categoria_id = ?
```

**Comportamento:**
- Se COUNT > 0: **BLOQUEAR** delecao
  - Alert: "Nao e possivel deletar. X compras, Y gastos e Z orcamentos usam esta categoria. Desative-a ao inves de deletar."
  
- Se COUNT = 0: **PERMITIR** com confirmacao
  - Alert: "Tem certeza? Esta acao nao pode ser desfeita. Z subcategorias serao deletadas junto."
  - Ao confirmar: DELETE CASCADE (subcategorias sao deletadas automaticamente pelo FK)

### 11. Deletar Subcategoria

**Validacao CRITICA:**
```sql
SELECT COUNT(*) FROM compras WHERE subcategoria_id = ?
SELECT COUNT(*) FROM gastos WHERE subcategoria_id = ?
```

**Comportamento:**
- Se COUNT > 0: BLOQUEAR
- Se COUNT = 0: PERMITIR com confirmacao

---

## 📦 Dependencias

### Bibliotecas Necessarias
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**@dnd-kit**: Biblioteca moderna de drag-and-drop
- `@dnd-kit/core`: Core do drag-and-drop
- `@dnd-kit/sortable`: Utilitarios para listas ordenadas
- `@dnd-kit/utilities`: Helpers (arrayMove, etc)

---

## 🗂️ Estrutura de Arquivos

### Arquivo Principal (ja existe)
```
src/app/(dashboard)/configuracoes/categorias/page.tsx
```
**Responsabilidade:** Client component com toda a logica da pagina

### Componentes UI Reutilizados (shadcn/ui)
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Table, TableHeader, TableBody, TableRow, TableCell, TableHead
- Dialog, DialogContent, DialogHeader, DialogFooter
- AlertDialog (para confirmacoes)
- Button, Input, Label
- Badge
- DropdownMenu
- Collapsible (para expandir/recolher subcategorias)
- Skeleton (loading states)
- toast (sonner - notificacoes)

### Icones (lucide-react)
- Tags (icone principal)
- Plus (nova categoria)
- Pencil (editar)
- Trash2 (deletar)
- GripVertical (drag handle)
- MoreHorizontal (menu de acoes)
- Eye, EyeOff (ativo/inativo)
- Loader2 (loading)
- List (subcategorias)

---

## 🔄 Fluxos de Dados

### Fetch Inicial
```typescript
// 1. Buscar todas as categorias (ordenadas por ordem ASC)
const { data: categoriasData } = await supabase
  .from('categorias')
  .select('*')
  .order('ordem', { ascending: true })

// 2. Buscar todas as subcategorias
const { data: subcategoriasData } = await supabase
  .from('subcategorias')
  .select('*')
  .order('nome', { ascending: true })

// 3. Agrupar subcategorias por categoria_id (em memoria)
const categoriasComSubs = categoriasData.map(cat => ({
  ...cat,
  subcategorias: subcategoriasData.filter(sub => sub.categoria_id === cat.id)
}))
```

### Criar Categoria
```typescript
// Buscar proxima ordem
const { data: maxOrdem } = await supabase
  .from('categorias')
  .select('ordem')
  .order('ordem', { ascending: false })
  .limit(1)

const novaOrdem = (maxOrdem?.[0]?.ordem || 0) + 1

// Validar nome duplicado
const { count } = await supabase
  .from('categorias')
  .select('id', { count: 'exact', head: true })
  .ilike('nome', formData.nome.trim())

if (count > 0) {
  toast.error('Ja existe uma categoria com este nome')
  return
}

// Inserir
await supabase.from('categorias').insert({
  nome: formData.nome.trim(),
  cor: formData.cor,
  icone: formData.icone,
  ordem: novaOrdem,
  ativo: true,
  created_by: currentUser.id
})
```

### Reordenar (Drag and Drop)
```typescript
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event
  if (!over || active.id === over.id) return

  const oldIndex = categorias.findIndex(c => c.id === active.id)
  const newIndex = categorias.findIndex(c => c.id === over.id)
  
  // Update local state (optimistic)
  const reordered = arrayMove(categorias, oldIndex, newIndex)
  setCategorias(reordered)

  // Update all orders in database
  try {
    const updates = reordered.map((cat, index) => 
      supabase
        .from('categorias')
        .update({ ordem: index + 1 })
        .eq('id', cat.id)
    )
    await Promise.all(updates)
    toast.success('Ordem atualizada!')
  } catch (error) {
    toast.error('Erro ao atualizar ordem')
    fetchCategorias() // Rollback
  }
}
```

### Validar Antes de Deletar
```typescript
const { count: comprasCount } = await supabase
  .from('compras')
  .select('id', { count: 'exact', head: true })
  .eq('categoria_id', categoriaId)

const { count: gastosCount } = await supabase
  .from('gastos')
  .select('id', { count: 'exact', head: true })
  .eq('categoria_id', categoriaId)

const { count: orcamentoCount } = await supabase
  .from('orcamento_detalhado')
  .select('id', { count: 'exact', head: true })
  .eq('categoria_id', categoriaId)

const totalUsos = (comprasCount || 0) + (gastosCount || 0) + (orcamentoCount || 0)

if (totalUsos > 0) {
  toast.error(`Nao e possivel deletar. Esta categoria e usada em ${totalUsos} registros.`)
  return
}
```

---

## 🔐 Controle de Permissoes

### Visualizacao
- **Todos os usuarios** (admin, editor, viewer) podem visualizar

### Criar/Editar
- **Admin** e **Editor** podem criar e editar categorias/subcategorias

### Deletar
- Apenas **Admin** pode deletar

### Implementacao
```typescript
const { currentUser } = useCurrentUser()
const isAdmin = currentUser?.role === 'admin'
const canEdit = isAdmin || currentUser?.role === 'editor'

// No JSX:
{canEdit && (
  <Button onClick={openNewDialog}>
    <Plus /> Nova Categoria
  </Button>
)}

// No dropdown:
{isAdmin && (
  <DropdownMenuItem onClick={handleDelete}>
    <Trash2 /> Deletar
  </DropdownMenuItem>
)}
```

---

## ⚠️ Validacoes e Regras de Negocio

### Criar/Editar Categoria
- [x] Nome obrigatorio (trim, min 2 caracteres)
- [x] Cor obrigatoria (deve estar na paleta)
- [x] Icone obrigatorio (deve estar na lista)
- [x] **Nomes duplicados: BLOQUEAR (case-insensitive)**
  - Ao criar: verificar se ja existe
  - Ao editar: verificar se ja existe em outra categoria

### Criar/Editar Subcategoria
- [x] Nome obrigatorio (trim, min 2 caracteres)
- [x] categoria_id obrigatorio (hidden no form)
- [x] **Nomes duplicados dentro da mesma categoria: BLOQUEAR**
  ```sql
  SELECT COUNT(*) FROM subcategorias 
  WHERE categoria_id = ? 
  AND LOWER(TRIM(nome)) = LOWER(TRIM(?))
  AND id != ? -- ao editar
  ```

### Deletar
- [x] **HARD DELETE** somente se COUNT(usos) = 0
- [x] Se em uso: exibir totais e sugerir desativacao
- [x] Confirmacao obrigatoria antes de deletar

### Desativar
- [x] Permitir desativar mesmo com usos
- [x] Categorias inativas nao aparecem em <Select> de nova compra/gasto
- [x] Categorias inativas AINDA aparecem em registros historicos

---

## 🎨 Detalhes de UI/UX

### Estados de Loading
- Skeleton no carregamento inicial (3-4 linhas)
- Spinner no botao durante submit
- Desabilitar botoes durante operacoes

### Feedback Visual
- Toast de sucesso (verde): "Categoria criada com sucesso!"
- Toast de erro (vermelho): "Erro ao criar categoria"
- Toast de aviso (amarelo): "Esta categoria ja possui 15 gastos vinculados"

### Responsividade
- Desktop: tabela completa
- Mobile: considerar card list ao inves de tabela (opcional para v1)

### Empty State
- Se nenhuma categoria cadastrada:
  - Icone Tags centralizado (opacidade 50%)
  - Texto: "Nenhuma categoria cadastrada"
  - Botao "Criar Primeira Categoria"

---

## 📝 Checklist de Implementacao

### Estrutura Base
- [ ] Criar state management (useState para categorias, dialogs, forms)
- [ ] Implementar fetchCategorias() com JOIN de subcategorias
- [ ] Criar loading state com Skeleton
- [ ] Implementar empty state

### Visualizacao
- [ ] Tabela de categorias com colunas definidas
- [ ] Badge visual (cor + icone)
- [ ] Badge de status (ativo/inativo)
- [ ] Collapsible para subcategorias
- [ ] Sub-tabela de subcategorias indentada

### Criar Categoria
- [ ] Dialog com formulario
- [ ] Color picker (grid de cores)
- [ ] Icon picker (grid de emojis)
- [ ] Validacao de nome duplicado (bloquear)
- [ ] Validacoes de campo
- [ ] Submit e integracao com Supabase
- [ ] Toast de feedback

### Editar Categoria
- [ ] Reutilizar dialog de criar (modo edit)
- [ ] Pre-preencher campos
- [ ] Validacao de nome duplicado (exceto proprio registro)
- [ ] UPDATE no Supabase

### Reordenar (Drag and Drop)
- [ ] Instalar @dnd-kit/core e @dnd-kit/sortable (se necessario)
- [ ] Configurar DndContext e SortableContext
- [ ] Implementar drag handle (icone GripVertical)
- [ ] Feedback visual durante drag
- [ ] Logica de arrayMove e update em lote
- [ ] Optimistic update (atualizar UI antes do banco)
- [ ] Rollback em caso de erro
- [ ] Desabilitar drag para usuarios Viewer

### Ativar/Desativar
- [ ] Toggle de status
- [ ] AlertDialog de confirmacao
- [ ] UPDATE campo ativo

### Subcategorias
- [ ] Dialog de criar subcategoria
- [ ] Validacao de nome duplicado dentro da mesma categoria
- [ ] Dialog de editar subcategoria
- [ ] Validacao de nome duplicado ao editar
- [ ] Listagem dentro de categoria expandida
- [ ] Botao "Adicionar Subcategoria"
- [ ] Logica de ocultar quando categoria pai inativa

### Deletar
- [ ] Validacao de uso (COUNT query)
- [ ] AlertDialog com mensagem dinamica
- [ ] Bloquear se em uso
- [ ] DELETE CASCADE se permitido

### Permissoes
- [ ] Integrar useCurrentUser
- [ ] Conditional rendering por role
- [ ] Desabilitar acoes para viewer

### Finalizacao
- [ ] Testes manuais de todos os fluxos
- [ ] Validar com linter (sem erros)
- [ ] Testar responsividade
- [ ] Testar estados de erro

---

## 🚀 Proximos Passos

**Apos aprovacao deste plano:**
1. Instalar dependencias `@dnd-kit` (se nao estiver instalado)
2. Implementar arquivo `page.tsx` completo com:
   - Drag-and-drop funcional
   - Validacoes de nome duplicado
   - Logica de ocultar subcategorias quando categoria inativa
   - Remocao completa do campo orcamento (deprecated)
3. Testar todos os fluxos manualmente
4. Validar permissoes (testar com admin, editor, viewer)
5. Verificar integracao com outras telas:
   - Selects de categoria devem respeitar `ativo=true`
   - Selects de subcategoria devem respeitar `subcategoria.ativo=true AND categoria.ativo=true`
6. Commit seguindo padrao: `v3.0-config-categorias: Implementacao completa gestao categorias e subcategorias com drag-and-drop`

---

## ✅ Decisoes Tomadas (Revisao 1)

1. **Orcamento por categoria**: ~~DEPRECATED~~ - Campo existe no DB mas esta NULL em todos. Usar `orcamento_detalhado` por etapa.
2. **Nomes duplicados**: **BLOQUEAR** - Validacao case-insensitive ao criar/editar.
3. **Subcategorias e categoria inativa**: **SIM** - Ocultar automaticamente subcategorias nos selects quando categoria pai inativa.
4. **Ordem inicial**: Todas as categorias ja tem ordenacao no database - **nenhuma acao necessaria**.
5. **Reordenacao**: **Drag-and-drop** usando @dnd-kit.

## ❓ Questoes Pendentes para Aprovacao Final

1. **Biblioteca drag-and-drop**: Confirma uso de `@dnd-kit` ou prefere outra (react-beautiful-dnd, react-dnd)?
2. **Subcategorias duplicadas entre categorias diferentes**: Permitir? Ex: "Elétrica" ter subcategoria "Fiacao" e "Hidraulica" ter subcategoria "Fiacao"?
3. **Limite de categorias/subcategorias**: Definir algum limite maximo ou deixar livre?
4. **Auditoria**: Registrar historico de alteracoes (quem mudou o que e quando) ou apenas updated_at e basta?

---

**Status:** 📋 Aguardando revisao e aprovacao para prosseguir com implementacao

