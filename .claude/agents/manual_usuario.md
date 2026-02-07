# 📖 Manual do Usuário - Agentes

Este manual descreve todos os agentes disponíveis no projeto e como utilizá-los corretamente.

---

## 📋 Índice de Agentes

| Agente | Função | Quando usar |
|--------|--------|-------------|
| [Planejador-Alteracoes](#-planejador-de-alterações) | Discutir e documentar novas alterações | Nova funcionalidade ou mudança |
| [Executor-Alteracoes](#-executor-de-alterações) | Implementar código | Após planejamento aprovado |
| [PRD-editor](#-prd-editor) | Atualizar documentação do PRD | Após implementação concluída |

---

## 🎯 Planejador de Alterações

### Descrição
Responsável por discutir ideias, esclarecer requisitos, desenhar UIs e criar a especificação técnica em arquivo separado para implementação.

### Quando usar
- Você tem uma nova ideia de funcionalidade
- Precisa discutir como algo deve funcionar
- Quer ver um mockup da UI antes de implementar

### Como iniciar

**Nova alteração:**
```
Leia @.claude/agents/Planejador-Alteracoes.md

Crie o arquivo alteracaoXX.md usando o template e vamos planejar: [descrição da ideia]
```

**Continuar alteração existente:**
```
Leia @.claude/agents/Planejador-Alteracoes.md e continue @Implementacao/alteracoes/alteracaoXX.md
```

### Comandos úteis

| Você diz | O que acontece |
|----------|----------------|
| `aprovar UI` | Libera para criar especificação técnica |
| `ajustar UI [descrição]` | Refaz o desenho da UI |
| `preciso mudar [descrição]` | Adiciona novo requisito |

### Fluxo típico

```
1. Você descreve a ideia (alteracaoXX.md)
2. Planejador faz perguntas
3. Planejador desenha UIs
4. Você aprova as UIs
5. Planejador cria spec-alteracaoXX.md
6. Status muda para 🔵 Pronto para executar
```

### Saída esperada
- **Arquivo de conversa** (`alteracaoXX.md`) com discussão e UIs
- **Arquivo de especificação** (`spec-alteracaoXX.md`) com detalhes técnicos
- Índice (`00-indice.md`) atualizado com a nova alteração

---

## ⚡ Executor de Alterações

### Descrição
Responsável por implementar o código seguindo a especificação criada pelo Planejador.

### Quando usar
- Alteração está com status 🔵 Pronto para executar
- Especificação (`spec-alteracaoXX.md`) está completa
- UIs foram aprovadas

### Como iniciar

```
Leia @.claude/agents/Executor-Alteracoes.md e execute @Implementacao/alteracoes/spec-alteracaoXX.md
```

### Comandos úteis

| Você diz | O que acontece |
|----------|----------------|
| `continuar` | Retoma de onde parou |
| `validar typescript` | Executa `npx tsc --noEmit` |
| `pausar` | Salva checkpoint e para |
| `tem um bug: [descrição]` | Executor corrige |
| `quero diferente: [descrição]` | Avalia se é ajuste ou novo escopo |

### Fluxo típico

```
1. Executor lê spec-alteracaoXX.md
2. Você confirma início
3. Executor implementa banco de dados
4. Executor implementa componentes
5. Executor valida TypeScript
6. Status muda para 🟢 Concluído
```

### Saída esperada
- Código implementado e funcionando
- TypeScript sem erros
- Seções 5 e 6 da spec preenchidas
- Status: 🟢 Concluído
- Índice (`00-indice.md`) atualizado para 🟢 Finalizado

---

## 📝 PRD-editor

### Descrição
Responsável por documentar alterações implementadas no PRD-FINAL.md.

### Quando usar
- Alteração foi implementada e testada
- Status é 🟢 Concluído
- Funcionalidade está funcionando em produção

### Como iniciar

```
Leia @.claude/agents/PRD-editor.md e documente @Implementacao/alteracoes/spec-alteracaoXX.md no PRD
```

### Comandos úteis

| Você diz | O que acontece |
|----------|----------------|
| `crie o prd_alteracaoXX.md` | Cria documento intermediário |
| `aplique no PRD` | Atualiza o PRD-FINAL.md |
| `atualize o índice` | Atualiza 00-indice.md |

### Fluxo típico

```
1. PRD-editor lê a alteração
2. Cria prd_alteracaoXX.md
3. Você aprova as mudanças
4. PRD-editor atualiza PRD-FINAL.md
5. PRD-editor atualiza índice
```

### Saída esperada
- Arquivo prd_alteracaoXX.md criado
- PRD-FINAL.md atualizado
- 00-indice.md com status do PRD

---

## 🔄 Fluxo Completo de uma Alteração

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PLANEJADOR    │ ──▶ │    EXECUTOR     │ ──▶ │   PRD-EDITOR    │
│                 │     │                 │     │                 │
│ • Discute ideia │     │ • Lê a spec     │     │ • Documenta     │
│ • Desenha UI    │     │ • Implementa    │     │ • Atualiza PRD  │
│ • Cria spec     │     │ • Valida TS     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
  alteracaoXX.md          spec-alteracaoXX.md      prd_alteracaoXX.md
      🟡 → 🔵                 🔵 → 🟢                 🟢 → ✅
```

---

## 🆘 Resolução de Problemas

### Perda de contexto (modelo "esqueceu" algo)

**Sintomas:**
- Repetindo perguntas já respondidas
- Contradizendo decisões anteriores
- Reimplementando código já feito

**Solução:**
```
Releia completamente @Implementacao/alteracoes/spec-alteracaoXX.md e continue de onde parou
```

### Bug durante execução

**Se for ajuste simples:**
```
Tem um bug: [descrição do problema]
```

**Se mudar o requisito:**
```
Preciso mudar isso: [nova descrição]

Avalie se é ajuste simples ou se precisa voltar ao Planejador.
```

### Conversa muito longa

Se a conversa está ficando muito longa:

1. Peça um checkpoint:
```
Crie um checkpoint do estado atual na seção apropriada
```

2. Inicie nova conversa:
```
Leia @.claude/agents/[Agente].md e continue @Implementacao/alteracoes/spec-alteracaoXX.md
```

### Precisa pausar e continuar depois

```
Pausar - crie um checkpoint com o estado atual
```

Para retomar (pode ser em nova conversa):
```
Leia @.claude/agents/Executor-Alteracoes.md e continue @Implementacao/alteracoes/spec-alteracaoXX.md
```

---

## 📁 Estrutura de Arquivos

```
.claude/agents/
├── manual_usuario.md          ← Este arquivo
├── Planejador-Alteracoes.md   ← Agente de planejamento
├── Executor-Alteracoes.md     ← Agente de execução
├── Gerador-Commits.md         ← Agente de commits
└── PRD-editor.md              ← Agente de documentação

Implementacao/
├── alteracoes/
│   ├── 0-regras_conversas_alteracoes.md  ← Regras gerais
│   ├── 00-indice.md                      ← Índice de alterações
│   ├── template-alteracao.md             ← Template de conversa
│   ├── template-spec.md                  ← Template de especificação
│   ├── alteracaoXX.md                    ← Conversa de planejamento
│   └── spec-alteracaoXX.md               ← Especificação técnica
└── alteracoes-prd/
    └── prd_alteracaoXX.md                ← Docs intermediários PRD
```

---

## 💡 Dicas

1. **Sempre aponte o agente + o arquivo de alteração** para dar contexto completo

2. **Use o template** para novas alterações - garante estrutura consistente

3. **Aprove as UIs antes** de pedir especificação técnica - evita retrabalho

4. **Peça checkpoints** em sessões longas - facilita retomada

5. **Teste manualmente** antes de chamar o PRD-editor

6. **Uma alteração por vez** - evita confusão de contexto

---

## 📞 Exemplos Rápidos

### "Quero adicionar uma nova funcionalidade"
```
Leia @.claude/agents/Planejador-Alteracoes.md

Crie alteracao21.md usando o template. Quero adicionar [descrição]
```

### "A alteração 18 está pronta, quero implementar"
```
Leia @.claude/agents/Executor-Alteracoes.md e execute @Implementacao/alteracoes/spec-alteracao18.md
```

### "Implementei a 18, preciso documentar no PRD"
```
Leia @.claude/agents/PRD-editor.md e documente @Implementacao/alteracoes/spec-alteracao18.md
```

### "Tive que parar ontem, quero continuar a execução"
```
Leia @.claude/agents/Executor-Alteracoes.md e continue @Implementacao/alteracoes/spec-alteracao18.md
```

---

*Última atualização: 06/02/2026*
