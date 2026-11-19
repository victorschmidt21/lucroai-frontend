Closes #<!-- número da issue -->

## Objetivo

<!-- O que este PR entrega e por quê, em 2 a 4 frases. Se for um PR empilhado, diga sobre qual branch ele está. -->

## O que mudou

<!-- Lista das principais mudanças (telas, rotas, componentes, contratos, configuração). -->

-

## Capturas de tela

<!-- Opcional. Se quiser, anexe aqui uma imagem da tela principal (não commite em docs/capturas/). -->

## Testes realizados

- [ ] `npm run lint` sem erros
- [ ] `npm run format:check` ok
- [ ] `npm run typecheck` ok
- [ ] `npm run build` ok
- [ ] `npm test` passando (novos/alterados: <!-- quais -->)
- [ ] Cada fórmula de `docs/business-rules.md` usada no PR tem teste unitário
- [ ] Testado manualmente contra o backend com o seed (descreva abaixo, se aplicável)

<!-- Passos manuais executados e resultado. -->

## Acessibilidade e responsividade

- [ ] Navegável só por teclado, com foco visível
- [ ] Campos com rótulo; erros anunciados e ligados ao campo
- [ ] Status não depende só da cor (Badge com cor e texto)
- [ ] Utilizável em 390px, sem rolagem horizontal da página

## Paridade com o mobile

- [ ] Textos iguais aos de `docs/business-rules.md`, com acentuação correta
- [ ] Mesmas regras, fórmulas e validações do app Flutter, ou diferença registrada em "Decisões tomadas" e em `docs/business-rules.md`

## Decisões tomadas

<!-- Escolhas de design, alternativas descartadas, desvios em relação à issue ou aos docs, e divergências entre a issue e o backend. Escreva "Nenhuma" se não houver. -->

## Documentação

- [ ] `docs/` atualizado se mudou arquitetura, padrão, convenção ou regra de negócio
- [ ] Itens "previsto" dos docs atualizados, se este PR os entregou
- [ ] Tabela "O que já existe em `src/`" do `AGENTS.md` atualizada
- [ ] Contratos em `src/shared/api/contracts/` conferidos com os DTOs do backend, se o PR usa rotas novas
- [ ] Lacunas e divergências do backend registradas em `docs/api-integration.md`, se encontrou alguma
- [ ] `.env.example` e README atualizados se criou variável de ambiente

## Checklist de padrões

- [ ] Segue a estrutura de funcionalidade e as regras de dependência entre pastas
- [ ] Usa os componentes e tokens do design system, sem cores fixas
- [ ] Nenhum tipo de DTO fora de `src/shared/api/contracts/`; respostas validadas com Zod
- [ ] Nenhum `fetch` direto em componente
- [ ] Mutações invalidam as queries afetadas, inclusive de outras funcionalidades
- [ ] Dinheiro formatado com `src/shared/format/`, sem `toFixed` na tela
- [ ] Sem token, `empresaId` ou dados pessoais em URL, logs ou `localStorage`
- [ ] Dependência nova justificada em "Decisões tomadas"
- [ ] Commits no padrão Conventional Commits
