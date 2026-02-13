# Especificacao: Alteracao 16 - Eliminar queries Supabase inline e mover storage para services

| Aspecto | Detalhe |
|---------|---------|
| Status | 🔵 Pronto para executar |
| Conversa | [alteracao16.md](../alteracao/alteracao16.md) |
| Data criacao | 2026-02-13 |
| Complexidade | 🟢 Baixa |

**Status possiveis:**
- 🔵 Pronto para executar
- 🔴 Em execucao
- 🟠 Aguardando testes
- 🟢 Concluido
- ❌ Cancelado

---

## 1. Resumo

Refatorar 12 violacoes do padrao "queries Supabase inline em componentes". Mover todas as queries `supabase.from("etapas")` e operacoes de `supabase.storage` para services dedicados, criando `buscarEtapasParaDropdown()` e o novo service `storage.ts`.

---

## 2. O que sera feito

- [ ] Criar funcao `buscarEtapasParaDropdown()` em `src/lib/services/etapas.ts`
- [ ] Criar service `src/lib/services/storage.ts` com `uploadFile()` e `getPublicUrl()`
- [ ] Substituir 4 queries inline `select("id, nome")` por `buscarEtapasParaDropdown()`
- [ ] Substituir 5 queries inline `select("*")` por `buscarEtapas()`
- [ ] Substituir 1 update inline por `atualizarTarefa()`
- [ ] Substituir 2 operacoes de storage inline pelo novo service
- [ ] Validar com `npx tsc --noEmit`

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- 10 paginas/componentes fazem `supabase.from("etapas").select(...)` diretamente
- 1 componente faz `supabase.from("tarefas").update(...)` diretamente
- 2 componentes fazem `supabase.storage.from(...).upload(...)` diretamente
- Nao existe service generico de storage

**Depois (comportamento proposto):**
- Todas as queries passam por services
- Nova funcao `buscarEtapasParaDropdown(supabase)` no service de etapas
- Novo service `src/lib/services/storage.ts` com funcoes `uploadFile()` e `getPublicUrl()`
- 12 arquivos atualizados para usar services

### 3.2 UI Proposta

N/A - alteracao sem impacto visual (mesmos dados, mesma logica, apenas refatoracao da camada de dados)

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A - sem alteracoes no banco

### 4.2 Arquivos a Modificar/Criar

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| MODIFICAR | `src/lib/services/etapas.ts` | Adicionar `buscarEtapasParaDropdown()` |
| CRIAR | `src/lib/services/storage.ts` | Novo service com `uploadFile()` e `getPublicUrl()` |
| MODIFICAR | `src/app/(dashboard)/tarefas/page.tsx` | Substituir query inline por `buscarEtapasParaDropdown()` |
| MODIFICAR | `src/app/(dashboard)/documentos/page.tsx` | Substituir query inline por `buscarEtapasParaDropdown()` |
| MODIFICAR | `src/app/(dashboard)/compras/nova/page.tsx` | Substituir query inline por `buscarEtapasParaDropdown()` |
| MODIFICAR | `src/app/(dashboard)/compras/[id]/editar/page.tsx` | Substituir query inline por `buscarEtapasParaDropdown()` |
| MODIFICAR | `src/app/(dashboard)/financeiro/page.tsx` | Substituir query inline por `buscarEtapas()` |
| MODIFICAR | `src/app/(dashboard)/financeiro/lancamentos/novo/page.tsx` | Substituir query inline por `buscarEtapas()` |
| MODIFICAR | `src/app/(dashboard)/financeiro/orcamento/page.tsx` | Substituir query inline por `buscarEtapas()` |
| MODIFICAR | `src/components/features/emails/form-aprovacao.tsx` | Substituir query inline por `buscarEtapas()` |
| MODIFICAR | `src/components/features/ocr/form-ocr.tsx` | Substituir query inline por `buscarEtapas()` |
| MODIFICAR | `src/components/features/cronograma/editar-tarefa-dialog.tsx` | Substituir update inline por `atualizarTarefa()` |
| MODIFICAR | `src/app/(dashboard)/financeiro/lancamentos/foto/page.tsx` | Usar service de storage |
| MODIFICAR | `src/components/features/documentos/upload-form.tsx` | Usar service de storage |

---

#### Detalhamento por arquivo

**1. `src/lib/services/etapas.ts` (MODIFICAR)**

Adicionar a funcao abaixo na secao `// ===== SELECT =====`, apos `buscarEtapaNome()` (apos linha 20):

```typescript
export async function buscarEtapasParaDropdown(
  supabase: TypedSupabaseClient
): Promise<Pick<Etapa, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('etapas')
    .select('id, nome')
    .order('ordem')
  if (error) throw error
  return data
}
```

---

**2. `src/lib/services/storage.ts` (CRIAR)**

Novo arquivo seguindo o padrao de `padroes-codigo.md` secao 4 (Storage):

```typescript
import { TypedSupabaseClient } from '@/lib/types/supabase'

// ===== UPLOAD =====

export async function uploadFile(
  supabase: TypedSupabaseClient,
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ===== URL =====

export function getPublicUrl(
  supabase: TypedSupabaseClient,
  bucket: string,
  path: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ===== DELETE =====

export async function deleteFile(
  supabase: TypedSupabaseClient,
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}
```

---

**3. `src/app/(dashboard)/tarefas/page.tsx` (MODIFICAR)**

Linha 1-6 - Adicionar import:
```typescript
import { buscarEtapasParaDropdown } from "@/lib/services/etapas";
```

Linha 43-53 - Substituir o `Promise.all`:
```typescript
// ANTES:
const [
  tarefasRaw,
  subetapasRaw,
  { data: etapasData },
  usersData,
] = await Promise.all([
  buscarTarefas(supabase),
  buscarSubetapasResumidas(supabase),
  supabase.from("etapas").select("id, nome").order("ordem"),
  buscarUsuariosParaDropdown(supabase),
]);

// DEPOIS:
const [
  tarefasRaw,
  subetapasRaw,
  etapasData,
  usersData,
] = await Promise.all([
  buscarTarefas(supabase),
  buscarSubetapasResumidas(supabase),
  buscarEtapasParaDropdown(supabase),
  buscarUsuariosParaDropdown(supabase),
]);
```

Linha 56 - Ajustar a variavel `etapas` (remover desestruturacao e cast):
```typescript
// ANTES:
const etapas = (etapasData || []) as EtapaDB[];

// DEPOIS:
const etapas = etapasData;
```

Remover a interface `EtapaDB` (linhas 14-17) pois nao sera mais necessaria - o tipo vem do retorno do service (`Pick<Etapa, 'id' | 'nome'>`).

---

**4. `src/app/(dashboard)/documentos/page.tsx` (MODIFICAR)**

Linha 1-2 - Adicionar import:
```typescript
import { buscarEtapasParaDropdown } from "@/lib/services/etapas";
```

Linha 12-16 - Substituir a chamada:
```typescript
// ANTES:
const [documentos, { data: etapas }] = await Promise.all([
  buscarDocumentosComEtapa(supabase),
  supabase.from("etapas").select("id, nome").order("ordem"),
]);

// DEPOIS:
const [documentos, etapas] = await Promise.all([
  buscarDocumentosComEtapa(supabase),
  buscarEtapasParaDropdown(supabase),
]);
```

Linha 134 - Ajustar uso (remover fallback `|| []` pois o service ja garante array):
```typescript
// ANTES:
<GaleriaFotos fotos={fotos} etapas={etapas || []} />

// DEPOIS:
<GaleriaFotos fotos={fotos} etapas={etapas} />
```

---

**5. `src/app/(dashboard)/compras/nova/page.tsx` (MODIFICAR)**

Linha 1-8 - Adicionar import:
```typescript
import { buscarEtapasParaDropdown } from "@/lib/services/etapas";
```

Linha 14-18 - Substituir a chamada:
```typescript
// ANTES:
const [categorias, fornecedores, etapasRes] = await Promise.all([
  buscarCategoriasParaDropdown(supabase),
  buscarFornecedoresParaDropdown(supabase),
  supabase.from("etapas").select("id, nome").order("ordem"),
]);

const etapas = etapasRes.data || [];

// DEPOIS:
const [categorias, fornecedores, etapas] = await Promise.all([
  buscarCategoriasParaDropdown(supabase),
  buscarFornecedoresParaDropdown(supabase),
  buscarEtapasParaDropdown(supabase),
]);
```

Remover a linha `const etapas = etapasRes.data || [];` (linha 20).

---

**6. `src/app/(dashboard)/compras/[id]/editar/page.tsx` (MODIFICAR)**

Linha 1-10 - Adicionar import:
```typescript
import { buscarEtapasParaDropdown } from "@/lib/services/etapas";
```

Linha 106-110 - Substituir a chamada dentro de `carregarDados()`:
```typescript
// ANTES:
const [categoriasData, fornecedoresData, etapasRes] = await Promise.all([
  buscarCategoriasParaDropdown(supabase),
  buscarFornecedoresParaDropdown(supabase),
  supabase.from("etapas").select("id, nome").order("ordem"),
]);

setCategorias(categoriasData);
setFornecedores(fornecedoresData);
if (etapasRes.data) setEtapas(etapasRes.data);

// DEPOIS:
const [categoriasData, fornecedoresData, etapasData] = await Promise.all([
  buscarCategoriasParaDropdown(supabase),
  buscarFornecedoresParaDropdown(supabase),
  buscarEtapasParaDropdown(supabase),
]);

setCategorias(categoriasData);
setFornecedores(fornecedoresData);
setEtapas(etapasData);
```

---

**7. `src/app/(dashboard)/financeiro/page.tsx` (MODIFICAR)**

Linha 1-17 - Adicionar import:
```typescript
import { buscarEtapas } from "@/lib/services/etapas";
```

Linha 22-26 - Substituir a chamada:
```typescript
// ANTES:
const [categorias, gastos, { data: etapas }] = await Promise.all([
  buscarCategoriasAtivas(supabase),
  buscarGastosAprovados(supabase),
  supabase.from("etapas").select("*").order("ordem"),
]);

// DEPOIS:
const [categorias, gastos, etapas] = await Promise.all([
  buscarCategoriasAtivas(supabase),
  buscarGastosAprovados(supabase),
  buscarEtapas(supabase),
]);
```

Linha 30 - Ajustar acesso ao orcamento (remover optional chaining `?.` pois `etapas` ja e array garantido):
```typescript
// ANTES:
const orcamentoTotal =
  etapas?.reduce((acc, etapa) => acc + (Number(etapa.orcamento) || 0), 0) || 0;

// DEPOIS:
const orcamentoTotal =
  etapas.reduce((acc, etapa) => acc + (Number(etapa.orcamento) || 0), 0);
```

Linha 54 - Ajustar `dadosEtapas` (remover optional chaining):
```typescript
// ANTES:
const dadosEtapas = etapas?.map((etapa) => {

// DEPOIS:
const dadosEtapas = etapas.map((etapa) => {
```

Remover o `|| []` no final do bloco `dadosEtapas` (por volta da linha 68).

---

**8. `src/app/(dashboard)/financeiro/lancamentos/novo/page.tsx` (MODIFICAR)**

Linha 1-5 - Adicionar import:
```typescript
import { buscarEtapas } from "@/lib/services/etapas";
```

Linha 10-15 - Substituir a chamada:
```typescript
// ANTES:
const [categorias, fornecedores, { data: etapas }] =
  await Promise.all([
    buscarCategoriasAtivas(supabase),
    buscarFornecedoresAtivos(supabase),
    supabase.from("etapas").select("*").order("ordem"),
  ]);

// DEPOIS:
const [categorias, fornecedores, etapas] =
  await Promise.all([
    buscarCategoriasAtivas(supabase),
    buscarFornecedoresAtivos(supabase),
    buscarEtapas(supabase),
  ]);
```

Linha 34 - Ajustar prop (remover fallback `|| []`):
```typescript
// ANTES:
etapas={etapas || []}

// DEPOIS:
etapas={etapas}
```

---

**9. `src/app/(dashboard)/financeiro/orcamento/page.tsx` (MODIFICAR)**

Linha 1-6 - Adicionar import:
```typescript
import { buscarEtapas } from "@/lib/services/etapas";
```

Linha 11-21 - Substituir a chamada:
```typescript
// ANTES:
const [
  { data: etapas },
  categorias,
  gastos,
  detalhamentos,
] = await Promise.all([
  supabase.from("etapas").select("*").order("ordem"),
  buscarCategoriasParaDropdown(supabase),
  buscarGastosPorEtapa(supabase),
  buscarDetalhamentoPorEtapa(supabase),
]);

// DEPOIS:
const [
  etapas,
  categorias,
  gastos,
  detalhamentos,
] = await Promise.all([
  buscarEtapas(supabase),
  buscarCategoriasParaDropdown(supabase),
  buscarGastosPorEtapa(supabase),
  buscarDetalhamentoPorEtapa(supabase),
]);
```

Linha 24 - Ajustar acesso (remover optional chaining):
```typescript
// ANTES:
const etapasComGastos = etapas?.map((etapa) => {

// DEPOIS:
const etapasComGastos = etapas.map((etapa) => {
```

Remover o `|| []` no final do bloco `etapasComGastos` (por volta da linha 40).

---

**10. `src/components/features/emails/form-aprovacao.tsx` (MODIFICAR)**

Linha 28-33 - Adicionar import:
```typescript
import { buscarEtapas } from '@/lib/services/etapas'
```

Linha 169-172 - Substituir query dentro de `loadData()`:
```typescript
// ANTES:
const [categoriasData, fornecedoresData, etapasRes] = await Promise.all([
  buscarCategoriasAtivas(supabase),
  buscarFornecedoresAtivos(supabase),
  supabase.from('etapas').select('*').order('ordem'),
])

// (mais adiante, linha 199):
if (etapasRes.data) setEtapas(etapasRes.data)

// DEPOIS:
const [categoriasData, fornecedoresData, etapasData] = await Promise.all([
  buscarCategoriasAtivas(supabase),
  buscarFornecedoresAtivos(supabase),
  buscarEtapas(supabase),
])

// (ajuste correspondente):
setEtapas(etapasData)
```

---

**11. `src/components/features/ocr/form-ocr.tsx` (MODIFICAR)**

Linha 26-33 - Adicionar import:
```typescript
import { buscarEtapas } from '@/lib/services/etapas'
```

Linha 94-98 - Substituir query dentro de `loadData()`:
```typescript
// ANTES:
const [categoriasData, fornecedoresData, etapasRes] = await Promise.all([
  buscarCategoriasAtivas(supabase),
  buscarFornecedoresAtivos(supabase),
  supabase.from('etapas').select('*').order('ordem'),
])

// (mais adiante, linha 102):
if (etapasRes.data) setEtapas(etapasRes.data)

// DEPOIS:
const [categoriasData, fornecedoresData, etapasData] = await Promise.all([
  buscarCategoriasAtivas(supabase),
  buscarFornecedoresAtivos(supabase),
  buscarEtapas(supabase),
])

// (ajuste correspondente):
setEtapas(etapasData)
```

---

**12. `src/components/features/cronograma/editar-tarefa-dialog.tsx` (MODIFICAR)**

Adicionar import:
```typescript
import { atualizarTarefa } from "@/lib/services/tarefas";
```

Linha 128-133 - Substituir update inline:
```typescript
// ANTES:
const { error } = await supabase
  .from("tarefas")
  .update(updatedData)
  .eq("id", tarefa.id);

if (error) throw error;

// DEPOIS:
await atualizarTarefa(supabase, tarefa.id, updatedData);
```

Nota: `atualizarTarefa()` ja faz `.select().single()` e retorna o objeto atualizado, mas como o componente ja usa `onSuccess({ id: tarefa.id, ...updatedData })` com os dados locais, nao precisa usar o retorno.

---

**13. `src/app/(dashboard)/financeiro/lancamentos/foto/page.tsx` (MODIFICAR)**

Linha 9-10 - Adicionar import (substituir `createClient` nao sera necessario pois ja esta importado para outros usos):
```typescript
import { uploadFile, getPublicUrl } from '@/lib/services/storage'
```

Linha 64-73 - Substituir bloco de upload e getPublicUrl:
```typescript
// ANTES:
const supabase = createClient()
const fileName = `ocr/${Date.now()}-${file.name}`
const { error: uploadError } = await supabase.storage
  .from('notas-compras')
  .upload(fileName, file)

let publicUrl = ''
if (!uploadError) {
  const { data } = supabase.storage.from('notas-compras').getPublicUrl(fileName)
  publicUrl = data.publicUrl
}

// DEPOIS:
const supabase = createClient()
const fileName = `ocr/${Date.now()}-${file.name}`

let publicUrl = ''
try {
  publicUrl = await uploadFile(supabase, 'notas-compras', fileName, file)
} catch (uploadError) {
  console.error('Erro no upload:', uploadError)
}
```

---

**14. `src/components/features/documentos/upload-form.tsx` (MODIFICAR)**

Linha 6-7 - Adicionar import:
```typescript
import { uploadFile } from '@/lib/services/storage'
```

Linha 143-152 - Substituir bloco de upload e getPublicUrl no loop:
```typescript
// ANTES:
// Upload para o Storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from(bucket)
  .upload(fileName, file);

if (uploadError) throw uploadError;

// Obter URL publica
const { data: urlData } = supabase.storage
  .from(bucket)
  .getPublicUrl(fileName);

// Salvar no banco
await criarDocumento(supabase, {
  nome: file.name,
  tipo: tipo,
  url: urlData.publicUrl,
  ...

// DEPOIS:
// Upload e obter URL publica
const publicUrl = await uploadFile(supabase, bucket, fileName, file);

// Salvar no banco
await criarDocumento(supabase, {
  nome: file.name,
  tipo: tipo,
  url: publicUrl,
  ...
```

---

### 4.3 Fluxo de Dados

O fluxo da refatoracao segue a ordem abaixo para evitar quebra de compilacao em qualquer ponto:

1. **Criar funcoes novas primeiro** (nao quebra nada existente):
   - Adicionar `buscarEtapasParaDropdown()` em `etapas.ts`
   - Criar `storage.ts` com `uploadFile()`, `getPublicUrl()` e `deleteFile()`

2. **Substituir Categoria 1** - queries `select("id, nome")` de etapas (4 arquivos):
   - Em cada arquivo: adicionar `import { buscarEtapasParaDropdown } from "@/lib/services/etapas"`
   - Remover a chamada `supabase.from("etapas").select("id, nome").order("ordem")`
   - Substituir por `buscarEtapasParaDropdown(supabase)`
   - Ajustar desestruturacao (remover `{ data: etapasData }` para receber diretamente o array)
   - Arquivos: `tarefas/page.tsx`, `documentos/page.tsx`, `compras/nova/page.tsx`, `compras/[id]/editar/page.tsx`

3. **Substituir Categoria 2** - queries `select("*")` de etapas (5 arquivos):
   - Em cada arquivo: adicionar `import { buscarEtapas } from "@/lib/services/etapas"`
   - Remover a chamada `supabase.from("etapas").select("*").order("ordem")`
   - Substituir por `buscarEtapas(supabase)`
   - Ajustar desestruturacao (remover `{ data: etapas }` para receber diretamente o array)
   - Remover optional chaining (`etapas?.map`) e fallbacks (`|| []`) pois o service garante retorno de array
   - Arquivos: `financeiro/page.tsx`, `financeiro/lancamentos/novo/page.tsx`, `financeiro/orcamento/page.tsx`, `form-aprovacao.tsx`, `form-ocr.tsx`

4. **Substituir Categoria 3** - update inline (1 arquivo):
   - Em `editar-tarefa-dialog.tsx`: adicionar `import { atualizarTarefa } from "@/lib/services/tarefas"`
   - Remover o bloco `supabase.from("tarefas").update(...).eq("id", ...)`
   - Substituir por `await atualizarTarefa(supabase, tarefa.id, updatedData)`

5. **Substituir Categoria 4** - storage inline (2 arquivos):
   - Em `foto/page.tsx`: adicionar `import { uploadFile, getPublicUrl } from "@/lib/services/storage"`
   - Remover bloco de `supabase.storage.from().upload()` + `getPublicUrl()` manual
   - Substituir por `await uploadFile(supabase, bucket, path, file)`
   - Em `upload-form.tsx`: mesmo padrao

6. **Validar com `npx tsc --noEmit`** para garantir zero erros de tipagem.

### 4.4 Dependencias Externas

Nenhuma. Todos os buckets de storage ja existem no Supabase. Nao ha novas dependencias npm.

### 4.5 Decisoes de Design e Justificativas

- **`buscarEtapasParaDropdown()` retorna `Pick<Etapa, 'id' | 'nome'>[]`:** Mais eficiente que `buscarEtapas()` para dropdowns pois seleciona apenas 2 campos em vez de todos. Segue o padrao do `padroes-codigo.md` secao 2 (usar `Pick<>` quando a query seleciona campos especificos).

- **`storage.ts` como service generico (nao por entidade):** Storage e transversal a multiplos dominios (documentos, compras/OCR, etc.). Um service unico evita duplicacao e segue o padrao documentado em `padroes-codigo.md` secao 4.

- **Nao alterar logica de negocio:** Essa refatoracao e puramente estrutural. O comportamento visivel ao usuario permanece identico. Cada arquivo mantem a mesma logica, apenas movendo a chamada para o service.

- **`getPublicUrl()` como funcao separada de `uploadFile()`:** Em `foto/page.tsx`, o upload pode falhar mas o fluxo continua (com `publicUrl = ''`). Manter `getPublicUrl()` separado permite que componentes que ja possuem o path busquem a URL sem re-upload. Porem, `uploadFile()` ja retorna a URL publica como conveniencia para o caso mais comum.

- **Ordem de execucao: criar services primeiro, depois consumidores:** Garante que a compilacao nao quebre em nenhum momento intermediario. Se o executor fizer cada passo e compilar, sempre tera um estado valido.

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [ ] `buscarEtapasParaDropdown()` criada em `etapas.ts`
- [ ] `storage.ts` criado
- [ ] Categoria 1 - 4 arquivos com `select("id, nome")` migrados
- [ ] Categoria 2 - 5 arquivos com `select("*")` migrados
- [ ] Categoria 3 - 1 arquivo com update inline migrado
- [ ] Categoria 4 - 2 arquivos com storage inline migrados
- [ ] `npx tsc --noEmit` sem erros
- [ ] Testado manualmente

### 5.2 Notas de Implementacao

[Decisoes tomadas durante a execucao, problemas encontrados, solucoes aplicadas]

### 5.3 Conversa de Execucao

*(problemas encontrados durante execucao, solucoes propostas)*

#### IA:
[mensagem]

---

## 6. Validacao Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
