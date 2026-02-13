# Especificacao: Alteracao 15 - Instalar Vitest e criar testes para funcoes puras

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Concluido |
| Conversa | [alteracao15.md](../alteracao/alteracao15.md) |
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

Instalar Vitest como framework de testes e criar testes unitarios para as 5 funcoes puras existentes no projeto (`calcularProgressoEtapa`, `calcularDatasEtapa`, `calcularProgressoSubetapa`, `formatDateToString`, `parseDateString`), cumprindo a secao 8 dos padroes de codigo.

---

## 2. O que sera feito

- [x] Instalar `vitest` como devDependency
- [x] Criar `vitest.config.ts` com resolucao do alias `@/` -> `src/`
- [x] Adicionar scripts `test` e `test:run` no `package.json`
- [x] Criar `src/lib/services/etapas.test.ts` com testes para `calcularProgressoEtapa` e `calcularDatasEtapa`
- [x] Criar `src/lib/services/subetapas.test.ts` com testes para `calcularProgressoSubetapa`
- [x] Criar `src/lib/utils.test.ts` com testes para `formatDateToString` e `parseDateString`
- [x] Rodar `npx vitest run` e confirmar que todos os testes passam

---

## 3. Proposta

### 3.1 Antes vs Depois

**Antes (comportamento atual):**
- Nenhum framework de testes instalado
- 0 arquivos de teste no projeto
- Nenhum script de teste no `package.json`
- 5 funcoes puras sem cobertura de testes

**Depois (comportamento proposto):**
- Vitest instalado como devDependency
- `vitest.config.ts` configurado para o projeto
- Scripts `test` e `test:run` no `package.json`
- 3 arquivos de teste cobrindo todas as 5 funcoes puras
- Conformidade com secao 8 dos padroes de codigo

### 3.2 UI Proposta

N/A - alteracao sem impacto visual

---

## 4. Implementacao Tecnica

### 4.1 Banco de Dados

N/A - sem alteracoes no banco

### 4.2 Arquivos a Modificar/Criar

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| MODIFICAR | `package.json` | Adicionar `vitest` em `devDependencies` + scripts `test` e `test:run` |
| CRIAR | `vitest.config.ts` | Configuracao do Vitest com resolucao de path alias `@/` -> `./src/` |
| CRIAR | `src/lib/services/etapas.test.ts` | Testes para `calcularProgressoEtapa` e `calcularDatasEtapa` |
| CRIAR | `src/lib/services/subetapas.test.ts` | Testes para `calcularProgressoSubetapa` |
| CRIAR | `src/lib/utils.test.ts` | Testes para `formatDateToString` e `parseDateString` |

#### Detalhamento por arquivo

**`vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**`package.json`** - Adicionar aos scripts:

```json
"test": "vitest",
"test:run": "vitest run"
```

**`src/lib/services/etapas.test.ts`**

Testes para `calcularProgressoEtapa`:

| Cenario | Input | Output esperado |
|---------|-------|-----------------|
| Sem subetapas, sem progresso | `{ subetapas: [] }` | `0` |
| Sem subetapas, com progresso | `{ progresso_percentual: 75, subetapas: [] }` | `75` |
| Sem subetapas, progresso null | `{ progresso_percentual: null, subetapas: [] }` | `0` |
| Todas subetapas concluidas | `{ subetapas: [{ status: 'concluida' }, { status: 'concluida' }] }` | `100` |
| Nenhuma subetapa concluida | `{ subetapas: [{ status: 'em_andamento' }, { status: 'nao_iniciada' }] }` | `0` |
| Parcialmente concluidas | `{ subetapas: [{ status: 'concluida' }, { status: 'em_andamento' }, { status: 'nao_iniciada' }] }` | `33` (arredondado) |
| Uma de duas concluidas | `{ subetapas: [{ status: 'concluida' }, { status: 'em_andamento' }] }` | `50` |

Testes para `calcularDatasEtapa`:

| Cenario | Input | Output esperado |
|---------|-------|-----------------|
| Array vazio | `[]` | `{ inicio: null, fim: null }` |
| Todas datas null | `[{ data_inicio_prevista: null, data_fim_prevista: null }]` | `{ inicio: null, fim: null }` |
| Datas preenchidas, retorna menor inicio e maior fim | `[{ data_inicio_prevista: '2026-03-01', data_fim_prevista: '2026-03-15' }, { data_inicio_prevista: '2026-02-15', data_fim_prevista: '2026-04-01' }]` | `{ inicio: '2026-02-15', fim: '2026-04-01' }` |
| Apenas inicio preenchido | `[{ data_inicio_prevista: '2026-01-10', data_fim_prevista: null }]` | `{ inicio: '2026-01-10', fim: null }` |
| Apenas fim preenchido | `[{ data_inicio_prevista: null, data_fim_prevista: '2026-06-30' }]` | `{ inicio: null, fim: '2026-06-30' }` |
| Datas misturadas (algumas null) | `[{ data_inicio_prevista: '2026-05-01', data_fim_prevista: null }, { data_inicio_prevista: null, data_fim_prevista: '2026-07-01' }]` | `{ inicio: '2026-05-01', fim: '2026-07-01' }` |
| Mesma data em todas subetapas | `[{ data_inicio_prevista: '2026-01-01', data_fim_prevista: '2026-01-01' }, { data_inicio_prevista: '2026-01-01', data_fim_prevista: '2026-01-01' }]` | `{ inicio: '2026-01-01', fim: '2026-01-01' }` |

**`src/lib/services/subetapas.test.ts`**

Testes para `calcularProgressoSubetapa`:

| Cenario | Input | Output esperado |
|---------|-------|-----------------|
| Sem tarefas, sem progresso | `{ tarefas: [] }` | `0` |
| Sem tarefas, com progresso | `{ progresso_percentual: 60, tarefas: [] }` | `60` |
| Sem tarefas, progresso null | `{ progresso_percentual: null, tarefas: [] }` | `0` |
| Todas tarefas concluidas | `{ tarefas: [{ status: 'concluida' }, { status: 'concluida' }] }` | `100` |
| Nenhuma tarefa concluida | `{ tarefas: [{ status: 'em_andamento' }] }` | `0` |
| Parcialmente concluidas | `{ tarefas: [{ status: 'concluida' }, { status: 'em_andamento' }, { status: 'nao_iniciada' }] }` | `33` |

**`src/lib/utils.test.ts`**

Testes para `formatDateToString`:

| Cenario | Input | Output esperado |
|---------|-------|-----------------|
| Data normal | `new Date(2026, 0, 15)` (15 jan 2026) | `'2026-01-15'` |
| Primeiro dia do ano | `new Date(2026, 0, 1)` | `'2026-01-01'` |
| Ultimo dia do ano | `new Date(2026, 11, 31)` | `'2026-12-31'` |
| Dia e mes com zero a esquerda | `new Date(2026, 2, 5)` (5 mar 2026) | `'2026-03-05'` |

Testes para `parseDateString`:

| Cenario | Input | Output esperado |
|---------|-------|-----------------|
| String YYYY-MM-DD | `'2026-01-15'` | Date com ano=2026, mes=0 (jan), dia=15 |
| Primeiro dia do ano | `'2026-01-01'` | Date com ano=2026, mes=0, dia=1 |
| Round-trip (format -> parse) | `formatDateToString(new Date(2026, 5, 20))` -> `parseDateString(resultado)` | Date com ano=2026, mes=5, dia=20 |

### 4.3 Fluxo de Dados

1. Executor instala `vitest` via `npm install -D vitest` dentro de `toniezzer-manager/`
2. Executor cria `vitest.config.ts` na raiz do projeto (`toniezzer-manager/`) com alias `@/` apontando para `./src/`
3. Executor adiciona scripts `test` e `test:run` no `package.json`
4. Executor cria os 3 arquivos `.test.ts` ao lado dos arquivos testados (co-location)
5. Cada arquivo de teste importa as funcoes puras e valida os cenarios listados nas tabelas acima
6. Executor roda `npx vitest run` para confirmar que todos os testes passam
7. Executor roda `npx tsc --noEmit` para confirmar que nao ha erros de TypeScript

### 4.4 Dependencias Externas

- [ ] Instalar `vitest` como devDependency: `npm install -D vitest`
- Nenhuma outra dependencia externa necessaria

### 4.5 Decisoes de Design e Justificativas

- **Vitest em vez de Jest:** Vitest e o framework definido na secao 8 dos padroes de codigo (`padroes-codigo.md`). Alem disso, Vitest e nativamente compativel com ESM e TypeScript, sem necessidade de configuracao extra de transformadores.
- **Co-location (`.test.ts` ao lado do arquivo):** Padrao definido na secao 8 dos padroes de codigo. Facilita encontrar os testes relacionados a cada arquivo.
- **Apenas funcoes puras:** Services de acesso a dados (que dependem de Supabase) NAO serao testados nesta alteracao, conforme padrao: "Services de acesso a dados NAO sao mockados rotineiramente -- ficam cobertos por testes e2e quando necessario."
- **Duck typing nos testes:** Os objetos de teste usam interfaces minimas (ex: `{ subetapas: [{ status: 'concluida' }] }`) em vez de tipos completos do banco, conforme padrao de duck typing para funcoes de calculo.
- **`globals: true` no vitest.config.ts:** Permite usar `describe`, `it`, `expect` sem importar explicitamente em cada arquivo de teste, similar ao comportamento do Jest.

---

## 5. Execucao

*(preenchido pelo Executor)*

### 5.1 Progresso

- [x] Vitest instalado
- [x] `vitest.config.ts` criado
- [x] Scripts adicionados ao `package.json`
- [x] `etapas.test.ts` criado e passando
- [x] `subetapas.test.ts` criado e passando
- [x] `utils.test.ts` criado e passando
- [x] `npx vitest run` sem falhas
- [x] `npx tsc --noEmit` sem erros

### 5.2 Notas de Implementacao

- Vitest v4.0.18 instalado
- Nenhum problema encontrado durante a execucao
- Todos os 27 testes passaram na primeira execucao (7 calcularProgressoEtapa + 7 calcularDatasEtapa + 6 calcularProgressoSubetapa + 4 formatDateToString + 3 parseDateString)
- TypeScript sem erros

### 5.3 Conversa de Execucao

#### IA: Execucao concluida sem problemas

Todos os arquivos foram criados conforme a especificacao. Vitest instalado, configurado, e 27 testes passando em 3 arquivos de teste.

---

## 6. Validacao Final

- [x] `npx tsc --noEmit` sem erros
- [x] `npx vitest run` todos os testes passando
- [ ] Funcionalidade testada manualmente
- [ ] PRD atualizado (via PRD-editor)
