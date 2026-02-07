# Regras da conversa

Todas interações da conversa devem ser feitas dentro do **arquivo de alteração** que referencia estas regras.
No Chat, limite-se a dizer 'OK' todas vez que você preencher sua resposta, *não gaste tokens escrevendo texto no chat.*

## Formatação das respostas

- Faça um resumo da minha pergunta ao lado de '# usuário', em no máximo 1 linha
- Responda abaixo, dentro do arquivo de alteração, no campo # IA:, adicionando um resumo da sua resposta de 1 linha também
- Após dar sua resposta, preencha '# usuário: ' nas linhas seguintes, para já ficar pronto para o usuário preencher sua próxima resposta
- Não exclua o texto das minhas respostas. Faça o resumo ao lado de # usuário:, mas mantenha o que eu escrevi
- Mantenha a estrutura de markdown para ficar fácil indexar a conversa posteriormente. Se tiver que separar em subtópicos, siga o fluxo # IA: -> ## Subtópico 1 -> ### Subtópico 2, e assim sucessivamente
- NUNCA estime o tempo estimado para realização de tarefas. Isso é totalmente irrelevante e gasta tokens.

---

# Regras de código

## Padrões do projeto

Antes de implementar qualquer funcionalidade, SEMPRE:

1. **Pesquise exemplos existentes** no projeto que façam algo similar ao que será implementado
2. **Siga os padrões encontrados**: estrutura de arquivos, nomenclatura, organização de componentes, hooks, tipos, etc.
3. **Mantenha consistência** com o estilo de código existente (indentação, aspas, imports, etc.)
4. **Reutilize** componentes, hooks e funções utilitárias já existentes ao invés de criar novos

## Validação

- NUNCA utilizar 'any' nas declarações typescript
- Após qualquer execução, SEMPRE teste o typescript através do comando: `npx tsc --noEmit 2>&1 | Select-Object`
- Se houver erros de TypeScript, corrija-os antes de prosseguir

## Exemplos de onde buscar padrões

| O que implementar | Onde buscar referência |
|-------------------|------------------------|
| Novo hook | `src/lib/hooks/` - ver hooks existentes |
| Nova página | `src/app/(dashboard)/` - ver páginas existentes |
| Novo componente | `src/components/` - ver componentes existentes |
| Novo tipo | `src/lib/types/` - ver tipos existentes |
| Nova validação | `src/lib/validations/` - ver validações existentes |

## Modais que alteram dados

Ao implementar modais (Dialog) que criam, editam ou excluem dados:

1. **SEMPRE** chamar a função de recarregar dados quando o modal fecha / é salvo / alterado
2. Usar o padrão `onOpenChange` para garantir refresh em TODOS os cenários de fechamento (sucesso, cancelamento, clique fora, ESC)

### Padrão obrigatório:

```tsx
<MeuModal
  open={modalAberto}
  onOpenChange={(open) => {
    setModalAberto(open)
    if (!open) carregarDados()  // Recarrega ao fechar
  }}
/>
```

### Referência de implementação:
' Preencher aqui referências com os padrões encontrados. '
```
