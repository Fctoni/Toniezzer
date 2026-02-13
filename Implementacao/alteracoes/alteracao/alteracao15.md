# Alteracao 15 - Instalar Vitest e criar testes para funcoes puras

| Aspecto | Detalhe |
|---------|---------|
| Status | 🟢 Especificacao criada |
| Origem | Auditoria de padroes de codigo |
| Complexidade | 🟢 Baixa |
| Especificacao | [spec-alteracao15.md](../spec/spec-alteracao15.md) |

---

## 1. Ideia Inicial

Auditoria completa dos padroes de codigo revelou que o projeto NAO tem framework de testes instalado. Vitest nao esta no `package.json`, nao existem scripts de teste, e ha 0 arquivos de teste. O padrao obrigatorio (`padroes-codigo.md` secao 8) exige Vitest e testes unitarios para funcoes puras (calculo/dominio sem Supabase).

Funcoes puras identificadas sem testes:
1. `calcularProgressoEtapa()` em `src/lib/services/etapas.ts:112-118`
2. `calcularDatasEtapa()` em `src/lib/services/etapas.ts:120-142`
3. `calcularProgressoSubetapa()` em `src/lib/services/subetapas.ts:145-151`
4. `formatDateToString()` em `src/lib/utils.ts:14-19`
5. `parseDateString()` em `src/lib/utils.ts:21-23`

---

## 2. Conversa de Planejamento

#### usuario: Analise automatica via auditoria de padroes

#### IA: Analise confirmada - 0% de cobertura de testes

Confirmei lendo o codigo:

- `calcularProgressoEtapa(etapa)`: Recebe objeto com `progresso_percentual` e `subetapas[]`. Se nao ha subetapas, retorna `progresso_percentual ?? 0`. Se ha, calcula % de concluidas.
- `calcularDatasEtapa(subetapas)`: Recebe array de subetapas com datas. Retorna menor `data_inicio_prevista` e maior `data_fim_prevista`. Ignora nulls.
- `calcularProgressoSubetapa(subetapa)`: Mesma logica de `calcularProgressoEtapa` mas para tarefas dentro de subetapa.
- `formatDateToString(date)`: Converte Date para string `YYYY-MM-DD`.
- `parseDateString(dateString)`: Converte string `YYYY-MM-DD` para Date com `T00:00:00`.

Todas sao funcoes puras, sem Supabase, testáveis isoladamente.

---

## 3. Proposta de Implementacao

**Status:** 🟢 Aprovada

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
- 4 arquivos de teste cobrindo todas as funcoes puras
- Conformidade com secao 8 dos padroes de codigo

### 3.2 UI Proposta

N/A - alteracao sem impacto visual

### 3.3 Arquivos Afetados

| Acao | Arquivo | O que muda |
|------|---------|------------|
| MODIFICAR | `package.json` | Adicionar vitest em devDeps + scripts test/test:run |
| CRIAR | `vitest.config.ts` | Configuracao do Vitest com path aliases |
| CRIAR | `src/lib/services/etapas.test.ts` | Testes para calcularProgressoEtapa e calcularDatasEtapa |
| CRIAR | `src/lib/services/subetapas.test.ts` | Testes para calcularProgressoSubetapa |
| CRIAR | `src/lib/utils.test.ts` | Testes para formatDateToString e parseDateString |

### 3.4 Fluxo de Dados

1. Instalar `vitest` como devDependency: `npm install -D vitest`
2. Criar `vitest.config.ts` com resolucao de aliases (`@/` → `src/`)
3. Adicionar scripts no `package.json`: `"test": "vitest"`, `"test:run": "vitest run"`
4. Criar arquivos `.test.ts` ao lado dos arquivos testados (co-location)
5. Cada teste importa a funcao pura e valida cenarios: sem dados, parcial, completo, edge cases
6. Rodar `npx vitest run` para validar todos os testes

### 3.5 Banco de Dados

N/A - sem alteracoes no banco

### 3.6 Impacto Cross-Domain

N/A - nenhum dominio afetado indiretamente

---

## 4. Decisoes Importantes

- **Vitest** escolhido (nao Jest) conforme padrao do projeto (secao 8)
- **Co-location**: arquivos `.test.ts` ao lado do arquivo testado, conforme padrao
- **Apenas funcoes puras**: services de acesso a dados NAO serao testados nesta alteracao (cobertos por testes e2e quando necessario)
- **Duck typing nos testes**: usar interfaces minimas nos objetos de teste, nao tipos completos do banco

---

## 5. Checkpoints

*(nenhum checkpoint necessario - alteracao simples)*
