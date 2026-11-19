Closes #<!-- número da issue -->

## Objetivo

<!-- O que este PR entrega e por quê, em 2 a 4 frases. Se for um PR empilhado, diga sobre qual branch ele está. -->

## O que mudou

<!-- Lista das principais mudanças (telas, rotas, componentes, contratos, configuração). -->

-

## Capturas de tela

<!-- Antes e depois, em desktop (1280px) e celular (390px), ao lado da tela equivalente do app Flutter quando houver. Use os dados do seed "Padaria Pão Feliz". Escreva "Não se aplica" se não houver mudança visual. -->

## Testes realizados

- [ ] `npm run lint` sem erros
- [ ] `npm run format:check` ok
- [ ] `npm run typecheck` ok
- [ ] `npm run build` ok
- [ ] `npm test` passando (unitários e de componente novos/alterados: <!-- quais -->)
- [ ] `npm run test:e2e` passando (e2e novos/alterados: <!-- quais -->)
- [ ] Cobertura de `shared/` e de `api/`, `hooks/` e `schemas/` da funcionalidade ≥ 80% (`npm run test:cov`)
- [ ] Cada fórmula de `docs/business-rules.md` usada no PR tem teste unitário
- [ ] Estados de carregamento, vazio e erro testados
- [ ] Testado manualmente contra o backend com o seed (descreva abaixo, se aplicável)

<!-- Passos manuais executados e resultado. -->

## Acessibilidade e responsividade

- [ ] Navegável só por teclado, com foco visível
- [ ] Campos com rótulo; erros anunciados e ligados ao campo
- [ ] Status não depende só da cor (Badge com cor e texto)
- [ ] Contraste de pelo menos 4,5:1 no texto
- [ ] Utilizável em 360px, sem rolagem horizontal da página
- [ ] `axe` sem violações nos componentes novos

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
