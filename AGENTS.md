# AGENTS.md

Guia para agentes de IA (Claude Code, Codex, Cursor, Copilot etc.) e para os integrantes do time. **Leia este arquivo inteiro antes de alterar o código.** Os detalhes de cada assunto estão em `docs/`; em caso de conflito, `docs/` prevalece sobre o que você "acha" que é o padrão do Next.js.

## Visão geral

Frontend web do **LucroAI**: sistema de custos e lucro para pequenos produtores de alimentos, como padarias e confeitarias. Cadastro de insumos com custo unitário automático, receitas (ficha técnica) com custo de produção e preço sugerido, gastos indiretos rateados nas produções, estoque de insumos, produções, vendas com confirmação, cálculo do custo real, simulações de preço, custo e volume, e um painel financeiro.

A web **substitui o app Flutter** [`lucroai_mobile`](https://github.com/GrupoDoisENG/lucroai_mobile), com as mesmas telas, regras e textos (corrigindo a acentuação). A migração inteira é feita por agentes de IA, issue por issue (FE-01 a FE-24).

É uma aplicação **Next.js com App Router**, organizada por funcionalidade em `src/features/<modulo>/`. Ela consome os **cinco microsserviços NestJS** do [`lucroai-backend`](https://github.com/GrupoDoisENG/lucroai-backend) (auth, catalog, recipe, operations e sales) por meio de um BFF: o navegador só fala com o Next, que guarda o JWT num cookie `httpOnly` e repassa cada chamada ao serviço certo.

## Stack

| Item              | Tecnologia                                             | Situação                                                                                                                                 |
| ----------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime           | Node.js 24, ESM (`"type": "module"`)                   | em uso                                                                                                                                   |
| Framework         | Next.js 16 (App Router), React 19, TypeScript `strict` | em uso                                                                                                                                   |
| Estilo            | Tailwind CSS v4, com os tokens do LucroAI              | em uso, com os tokens da FE-04                                                                                                           |
| Componentes       | Radix UI (`radix-ui`), só onde há foco e teclado       | em uso no design system (`src/shared/ui/`)                                                                                               |
| Validação         | Zod 4 (ambiente, contratos da API, formulários e URL)  | em uso no ambiente, nos contratos da API (FE-05) e nos formulários (`numeroBR`, FE-06)                                                   |
| Dados             | TanStack Query 5                                       | em uso: `QueryProvider` e padrões do `QueryClient` (FE-05); queries nas telas a partir da FE-09                                          |
| Formulários       | `react-hook-form` + `@hookform/resolvers`              | em uso em `Form` e `FormDialog` (`shared/ui/form.tsx`, FE-06)                                                                            |
| Lint / formatação | oxlint + Prettier                                      | em uso                                                                                                                                   |
| Testes            | Vitest + Testing Library, MSW, Playwright, axe         | em uso, com MSW (FE-05)                                                                                                                  |
| Infra local       | Docker Compose (`web`, porta 3000)                     | em uso                                                                                                                                   |
| OpenAPI           | `openapi-typescript`, `openapi-fetch`, `openapi-msw`   | instalados, **sem uso** até o backend descrever os DTOs (ver [docs/api-integration.md](docs/api-integration.md#migração-para-o-openapi)) |

## Comandos

```bash
docker compose up --build      # sobe o front com hot reload em http://localhost:3000
npm run dev                    # front fora do Docker (precisa de .env)
npm run lint                   # oxlint
npm run format                 # Prettier (escreve; inclui os .md)
npm run format:check           # Prettier (só verifica)
npm run typecheck              # gera os tipos de rota e roda o tsc
npm run build                  # build de produção (precisa de .env)
npm test                       # testes unitários e de componente
npm run test:cov               # os mesmos, com cobertura
npm run test:e2e               # testes e2e (Playwright)
npx vitest run caminho/arquivo.test.ts   # um arquivo só
```

Antes de dizer que terminou: `npm run lint && npm run format:check && npm run typecheck && npm run test:cov && npm run build` precisam passar (é o que o CI roda, em `.github/workflows/ci.yml`; `test:cov` falha com cobertura abaixo de 80% nos caminhos de [docs/testing.md](docs/testing.md#cobertura-mínima)). Se mexeu em tela, rota ou sessão, rode também `npm run test:e2e`.

O backend roda à parte (portas 3001 a 3005), com o seed "Padaria Pão Feliz": login `joao@padariapaofeliz.com.br`, senha `123456`. Como subir os dois está no [README](README.md#subindo-o-ambiente-do-zero).

Depois de `npm install <pacote>` ou `npm uninstall <pacote>`, confira se o `package-lock.json` ainda tem as entradas `@rolldown/binding-*` (ver o [README](README.md#solução-de-problemas)).

## Mapa de documentação

| Arquivo                                                                             | Leia quando for...                                                                                                                                                                      |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                                        | criar ou alterar uma funcionalidade, escolher entre Server e Client Component, criar rotas, mapear o código do mobile, e consultar o **exemplo completo de funcionalidade** (`insumos`) |
| [docs/business-rules.md](docs/business-rules.md)                                    | implementar qualquer tela: fórmulas, validações, mensagens e textos de cada tela, com o arquivo de origem no mobile e no backend                                                        |
| [docs/conventions.md](docs/conventions.md)                                          | nomear arquivos, componentes, hooks e rotas; lidar com dinheiro em `number`; escrever commits, branches e PRs                                                                           |
| [docs/api-integration.md](docs/api-integration.md)                                  | chamar a API: serviços e rotas, contratos Zod, cliente, proxy, envelope `{ data, links }`, erros, query keys, invalidação e **lacunas do backend**                                      |
| [docs/ui.md](docs/ui.md)                                                            | montar telas: tokens, componentes, `ListPage`, `FormDialog`, campos numéricos, confirmação, estados, formatação e acessibilidade                                                        |
| [docs/testing.md](docs/testing.md)                                                  | escrever testes unitários, de componente e e2e; dados do seed; cobertura; CI                                                                                                            |
| [docs/security.md](docs/security.md)                                                | sessão, cookie, proxy, proteção de rotas, multiempresa e o que nunca guardar no navegador                                                                                               |
| `node_modules/next/dist/docs/`                                                      | usar uma API do Next.js: é a documentação da versão instalada                                                                                                                           |
| Backend: `services/<servico>/src/modules/<modulo>/OVERVIEW.md` e `application/dto/` | conferir as regras, as rotas e os campos do módulo que a tela consome (o DTO prevalece sobre o OVERVIEW)                                                                                |
| Mobile: `lib/features/<modulo>/presentation/pages/`                                 | conferir o comportamento e o visual da tela que está sendo migrada                                                                                                                      |

## Regras obrigatórias

1. **Siga a estrutura de funcionalidade** de [docs/architecture.md](docs/architecture.md#estrutura-de-uma-funcionalidade). Não crie pastas ou camadas novas sem atualizar a documentação no mesmo PR.
2. **Uma funcionalidade não importa arquivos de outra**, exceto `api/<outro>.queries.ts` (chaves e `queryOptions`). `src/shared/` nunca importa de `src/features/` (ver [regras de dependência](docs/architecture.md#regras-de-dependência)).
3. **Páginas são finas**: leem a URL com um schema Zod e compõem componentes de `src/features/`.
4. **Server Component por padrão.** Use `'use client'` só onde houver estado, evento, hook ou API do navegador.
5. **Nenhum DTO da API digitado fora de `src/shared/api/contracts/`.** Os contratos são schemas Zod escritos a partir dos DTOs do backend (nunca do mobile), e toda resposta é validada com eles ([docs/api-integration.md](docs/api-integration.md#contratos-tipados-estratégia-da-fe-05)).
6. **Nenhum `fetch` direto em componente.** Chame a API pelas funções de `features/<modulo>/api/`, que usam `apiFetch` e `unwrap`, com TanStack Query no cliente. Query keys ficam em `<modulo>.queries.ts`.
7. **Toda mutação invalida as queries afetadas, inclusive as de outras funcionalidades**, conforme a [matriz de invalidação](docs/api-integration.md#invalidação-após-mutações).
8. **Erros chegam à tela como `ApiError`**, com mensagem em português (`getErrorMessage`). Trate pelo `statusCode`; o texto da mensagem só nos detectores documentados (`isEstoqueInsuficiente`).
9. **Toda tela com dados trata carregamento, vazio e erro** (com "Tentar novamente"), com os componentes e padrões de [docs/ui.md](docs/ui.md).
10. **Regra de negócio calculada no cliente vem de [docs/business-rules.md](docs/business-rules.md)**, fica em função pura (`<modulo>.calculos.ts` ou `shared/domain/`) e tem teste de cada ramo. Valor gravado pelo backend não é recalculado na tela.
11. **Dinheiro é `number`**: formate com `src/shared/format/` (nunca `toFixed` para exibir), arredonde a centavos só na exibição e repita o arredondamento do backend nas prévias ([docs/conventions.md](docs/conventions.md#dinheiro-e-quantidades)).
12. **Use os nomes do contrato** (`margem_lucro`, `custoUnitario`) sem converter; o formulário monta o corpo numa função `to...Body`.
13. **Use o design system e os tokens.** Só tema escuro, sem cores fixas fora de `globals.css`, sem gradientes. Status usa cor **e** texto.
14. **Acessibilidade não é opcional**: teclado, foco visível, rótulos, contraste de 4,5:1, e nenhuma rolagem horizontal em 360px.
15. **Textos de tela em português com acentuação correta**, copiados de [docs/business-rules.md](docs/business-rules.md), mesmo quando o mobile escreve sem acento.
16. **Nunca guarde o token nem dados de negócio no navegador** (`localStorage`, `sessionStorage`, cookie legível) e nunca envie `empresaId`: ele vem do token ([docs/security.md](docs/security.md)).
17. **Código com cookie de sessão ou URL de serviço usa `import 'server-only'`** e sufixo `.server.ts`. Variáveis de ambiente passam pelo schema de `src/shared/config/`.
18. **Nunca chame rotas `/internal/*` do backend**: elas não têm autenticação.
19. **Toda mudança de comportamento vem com teste** (ver [docs/testing.md](docs/testing.md)).
20. **Idioma do código**: termos de domínio em português sem acento (`Insumo`, `custoUnitario`); termos técnicos em inglês (`useCreateInsumo`, `queryKey`).
21. **Não use o que ainda não existe.** Itens marcados como "previsto (FE-NN)" dependem da issue citada. Ao entregar um deles, atualize a documentação no mesmo PR.
22. **Se a issue e o backend divergirem, vale o backend.** Registre a divergência em [docs/api-integration.md](docs/api-integration.md#divergências-entre-as-issues-e-o-backend) e no PR.
23. Não adicione dependências novas sem necessidade clara; se adicionar, justifique no PR.

## Como criar uma tela nova (checklist)

1. Leia a issue, a seção da tela em [docs/business-rules.md](docs/business-rules.md), o [exemplo completo](docs/architecture.md#exemplo-completo-funcionalidade-insumos), o `OVERVIEW.md` e os DTOs do módulo no backend, e a página correspondente no mobile.
2. Confira as rotas e os campos na [tabela de rotas](docs/api-integration.md#rotas-usadas-pela-web) e nas [lacunas do backend](docs/api-integration.md#lacunas-do-backend). Se faltar o contrato do recurso, crie o schema em `src/shared/api/contracts/<servico>.ts`, com teste e fixture do seed.
3. Crie `src/features/<modulo>/` copiando a estrutura do exemplo:
   - `api/<modulo>.api.ts` e `api/<modulo>.queries.ts`
   - `hooks/use-<acao>-<entidade>.ts`, com as invalidações da matriz
   - `schemas/<entidade>-form.schema.ts` (com `to...Body`) e `schemas/<modulo>-search.schema.ts`
   - `<modulo>.calculos.ts`, se a tela calcular algo
   - `components/<modulo>-lista.tsx` e `components/<entidade>-form-dialog.tsx`
4. Crie ou substitua a rota em `src/app/(app)/<rota>/page.tsx` (as rotas do menu nascem provisórias na FE-08), com `metadata.title`.
5. Use os textos exatos de [docs/business-rules.md](docs/business-rules.md), com acentuação.
6. Trate carregamento, vazio, vazio por busca e erro; confira em 360px e em 1280px, só com teclado.
7. Escreva os testes: unitários dos schemas e cálculos, de componente com MSW e e2e do fluxo principal.
8. Rode a verificação completa (seção [Comandos](#comandos)), atualize "O que já existe em `src/`" abaixo e os itens "previsto" que este PR entregou, e abra o PR usando o template, com capturas de tela.

## O que já existe em `src/`

Cada PR mantém esta tabela atualizada.

| Caminho                                                            | O que é                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instrumentation.ts`, `instrumentation-node.ts`                    | validam o ambiente ao subir o servidor e encerram o processo se houver erro                                                                                                                                                                       |
| `shared/config/env.schema.ts`                                      | schemas Zod das variáveis (as cinco URLs de serviço e `NEXT_PUBLIC_APP_URL`) e `parseEnv()`                                                                                                                                                       |
| `shared/config/env.server.ts`                                      | `getServerEnv()`, só no servidor                                                                                                                                                                                                                  |
| `shared/config/env.public.ts`                                      | `publicEnv`, disponível também no navegador                                                                                                                                                                                                       |
| `app/layout.tsx`, `app/fonts.ts`                                   | layout raiz (`lang="pt-BR"`, título "LucroAI", fundo `bg`) com a Roboto via `next/font`                                                                                                                                                           |
| `app/globals.css`                                                  | tokens do LucroAI (cores, status, raios, sombra, tipografia) no tema do Tailwind ([docs/ui.md](docs/ui.md#tokens))                                                                                                                                |
| `app/icon.svg`                                                     | favicon                                                                                                                                                                                                                                           |
| `app/design-system/page.tsx`                                       | `/design-system`, catálogo de tokens e componentes; só em desenvolvimento (404 no build)                                                                                                                                                          |
| `app/design-system/listagem/page.tsx`                              | `/design-system/listagem`, exemplo funcionando de listagem e formulário (FE-06); só em desenvolvimento (404 no build)                                                                                                                             |
| `features/design-system/`                                          | `DesignSystemShowcase` (`/design-system`), `ListFormShowcase` (`/design-system/listagem`) e `exemplo-api.ts`, a API em memória do exemplo                                                                                                         |
| `shared/ui/`                                                       | design system da FE-04: componentes base, `icons/`, `Logo`, `Toast`, `ConfirmDialog` (com `consequence` na FE-06) ([docs/ui.md](docs/ui.md#componentes-srcsharedui))                                                                              |
| `shared/ui/list-page.tsx`, `data-table.tsx`, `use-busca-na-url.ts` | `ListPage` (cabeçalho, busca em `?q=` com debounce, contagem, cartões no celular e tabela no desktop, estados), `DataTable` e `useBuscaNaUrl` (FE-06, [docs/ui.md](docs/ui.md#listpage))                                                          |
| `shared/ui/form.tsx`                                               | `Form`, `FormDialog` (Drawer de baixo no celular, Dialog no desktop) e os campos `FormInput`, `FormMoneyInput`… (FE-06, [docs/ui.md](docs/ui.md#form-e-formdialog))                                                                               |
| `shared/ui/number-input.tsx`, `unidade-select.tsx`                 | `MoneyInput`, `DecimalInput`, `IntegerInput`, `PercentInput` e `UnidadeSelect` (FE-06, [docs/ui.md](docs/ui.md#campos-numéricos-brasileiros))                                                                                                     |
| `test/a11y.ts`                                                     | `expectNoA11yViolations()`, o `axe` dos testes de componente                                                                                                                                                                                      |
| `shared/api/contracts/`                                            | schemas Zod e tipos de corpo dos cinco serviços (`auth`, `catalog`, `recipe`, `operations`, `sales`) e `enums.ts` com os rótulos ([docs/api-integration.md](docs/api-integration.md#contratos-tipados-estratégia-da-fe-05))                       |
| `shared/api/client.ts`, `client.server.ts`                         | `apiFetch` do navegador (proxy `/api/backend/<servico>`) e do servidor (direto no serviço, com `opcoes.token`)                                                                                                                                    |
| `shared/api/request.ts`, `errors.ts`                               | `unwrap()`, timeout de 10 s, `ApiError`, `ApiNetworkError`, `ContratoInvalidoError`, `getErrorMessage()`, `isEstoqueInsuficiente()`                                                                                                               |
| `shared/api/filtros.ts`, `servicos.ts`                             | `filtrarPorTexto()`, `lerFiltros()`, `hrefComFiltros()`; o tipo `Servico`                                                                                                                                                                         |
| `shared/api/query-client.ts`, `query-provider.tsx`                 | `QueryProvider` (com `handleSessaoExpirada`, FE-07) e `makeQueryClient()` (retry só em rede e 5xx, `refetchOnWindowFocus`, `onSessaoExpirada` no 401)                                                                                             |
| `shared/format/`                                                   | `formatMoeda`, `formatCustoUnitario`, `formatNumero`, `formatQuantidade`, `formatPercentual`, `formatData`, `parseDataSemHora`, `inicioDoDia`, `fimDoDia`, `arredondarCentavos`, `percentualParaFracao`                                           |
| `shared/format/numero-br.ts`                                       | `parseNumeroBR`, `parseInteiroBR`, `formatNumeroEditavel` e os schemas `numeroBR()`, `numeroBROpcional()`, `inteiroBR()` (FE-06, [docs/business-rules.md](docs/business-rules.md#leitura-de-números-digitados))                                   |
| `test/server.ts`, `msw-setup.ts`, `api.ts`, `render.tsx`           | servidor do MSW (requisição sem handler falha), `mockApi` tipado pelas rotas, `renderWithQuery` ([docs/testing.md](docs/testing.md#uso-do-msw))                                                                                                   |
| `test/next-navigation.ts`                                          | substituto de `next/navigation` nos testes de componente, com `setTestUrl()` (FE-06)                                                                                                                                                              |
| `test/bff.ts`                                                      | `stubAmbienteDoBff()` e `makeNextRequest()` (com cookie e `Origin`), para testar Route Handlers e o proxy (FE-07); `makeJwt()` fica em `test/factories/auth.factory.ts`                                                                           |
| `test/factories/`, `test/fixtures/`                                | factories do seed tipadas pelos contratos e respostas reais capturadas do backend                                                                                                                                                                 |
| `app/page.tsx`                                                     | página inicial provisória, substituída pelo painel na FE-08 e na FE-22; confere a sessão (`getUsuarioAtual()`) e mostra o `UserMenu` até a FE-08 levá-lo ao layout                                                                                |
| `proxy.ts`                                                         | checagem otimista de sessão (FE-07): sem cookie ou com `exp` vencido, `/login?redirect=...` (com `&expirada=1` se havia cookie); com sessão, tira de `/login`; `/design-system` é aberto ([docs/security.md](docs/security.md#proteção-de-rotas)) |
| `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`               | `/login` (FE-07): marca, subtítulo e o `LoginForm`, com `redirect` e `expirada` lidos por `loginSearchSchema`                                                                                                                                     |
| `app/api/auth/login`, `logout`, `sessao`                           | Route Handlers da sessão (FE-07): login grava o JWT no cookie `httpOnly` `lucroai_sessao`; logout só o apaga; sessão devolve o usuário do JWT, sem o token                                                                                        |
| `app/api/backend/[servico]/[...path]/route.ts`                     | proxy BFF (FE-07): só os cinco serviços (404), bloqueia `internal` (403), injeta o Bearer, apaga o cookie no 401 ([docs/security.md](docs/security.md#proxy-bff))                                                                                 |
| `shared/auth/`                                                     | sessão (FE-07): `jwt.ts` (`decodificarJwt`, `lerSessao`), `session-paths.ts`, `session.server.ts` (cookie), `backend-proxy.server.ts`, `bff.server.ts` (origem), `getUsuarioAtual()`, `useUsuarioAtual()`, `handleSessaoExpirada`                 |
| `features/auth/`                                                   | `LoginForm`, `UserMenu` (nome, e-mail, empresa e "Sair"; vai ao layout na FE-08), `useLogin`, `useLogout`, `login-form.schema.ts` e `login-search.schema.ts` (FE-07)                                                                              |
| `app/api/health/route.ts`                                          | `GET /api/health`, informando se cada um dos cinco serviços foi alcançado                                                                                                                                                                         |
| `e2e/home.spec.ts` (fora de `src/`)                                | e2e da página inicial (com sessão) e do health, contra a API falsa                                                                                                                                                                                |
| `e2e/design-system.spec.ts` (fora de `src/`)                       | `axe` com contraste, teclado e larguras em `/design-system` (só com `next dev`); no build, confere o 404                                                                                                                                          |
| `e2e/listagem-formulario.spec.ts` (fora de `src/`)                 | exemplo da FE-06: busca que sobrevive a recarregar, valores `1.234,56`, margem em fração, teclado, Drawer no celular, `axe` e larguras (só com `next dev`); no build, o 404                                                                       |
| `e2e/auth.spec.ts`, `e2e/support/sessao.ts` (fora de `src/`)       | e2e da sessão (FE-07): login, senha errada, logout, rota protegida, token vencido, proxy (404, 403, 401) e `axe` do login; `entrar(page)` para os outros e2e                                                                                      |
| `e2e/support/fake-api.mjs` (fora de `src/`)                        | API falsa dos e2e (porta 3999), que atende as cinco URLs de serviço: `/health`, `/docs-json`, `POST /auth/login` (seed) e `GET /insumos` (com Bearer)                                                                                             |
| `e2e/support/servir-build.mjs` (fora de `src/`)                    | serve o build standalone nos e2e com `E2E_USAR_BUILD=true` (o CI usa)                                                                                                                                                                             |
| `.github/workflows/ci.yml` (fora de `src/`)                        | CI com os jobs "Lint, tipos, testes e build" e "Testes e2e" ([docs/testing.md](docs/testing.md#integração-contínua))                                                                                                                              |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
