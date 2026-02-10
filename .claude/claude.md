# INTERAÇÕES COM O USUÁRIO

- Seção nova: NUNCA EXECUTE CÓDIGOS NA PRIMEIRA INTERAÇÃO.

Retorne com perguntas para ter 100% de certeza que entendeu as intenções do usuário. Nunca parta para a edição de códigos na primeira interação.

- Sempre use o agent [Planejador](agents/Planejador-Alteracoes.md) quando o usuário pedir alguma mudança.

# PADROES DE CODIGO

- Operacoes de banco DEVEM usar services (`src/lib/services/`)
- Services usam Dependency Injection (client Supabase como 1o parametro)
- Services sao funcoes puras (sem React, sem estado)
- NUNCA faca queries Supabase inline em componentes — use services
- Padroes detalhados com exemplos: ver `.claude/padroes-codigo.md`

# REGRAS FERRAMENTAS DO PROJETO

## Supabase MCP

### Gerar lista de tabelas:

- NUNCA utilize 'list tables', pois o resultado vêm muito grande e não cabe no seu contexto.
- Utilize:
---
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
---

## GIT

- É TOTALMENTE PROIBIDO rodar qualquer comando DE ESCRITA, CHECKOUT, COMMIT, ETC, no Git. Se for necessário, peça para o usuário executar manualmente.
- Comandos de LEITURA no GIT são permitidos, mas sempre peça autorização para o usuário antes de executar.

## FERRAMENTAS CLAUDE

- Dê preferência a tools nativas da sua base de skills. Use comandos bash somente quando for totalmente necessário.

## AGENTES

### Mapa de agentes

| Agente | Arquivo | Propósito |
|--------|---------|-----------|
| Planejador de Alterações | `.claude/agents/Planejador-Alteracoes.md` | Discute e documenta novas alterações, propõe UI e plano técnico, cria spec |
| Executor de Alterações | `.claude/agents/Executor-Alteracoes.md` | Implementa alterações a partir da spec com validação TypeScript |
| PRD Editor | `.claude/agents/PRD-editor.md` | Atualiza o PRD-FINAL.md após alterações implementadas |
| Gerador de Commits | `.claude/agents/Gerador-Commits.md` | Gera mensagens de commit a partir dos arquivos de alteração |



### Regras de uso

- **SEMPRE** leia o arquivo do agente (`.claude/agents/Nome-Agente.md`) antes de iniciar qualquer tarefa como agente
- **NUNCA** misture papéis: o Planejador NÃO implementa código, o Executor NÃO planeja alterações
- **SEMPRE** siga os templates definidos em `.claude/templates/` ao criar arquivos de alteração ou spec
- **SEMPRE** leia `.claude/templates/regras-alteracoes.md` ao trabalhar em alterações

