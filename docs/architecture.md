# Arquitetura

O frontend do LucroAI é uma aplicação Next.js com App Router, organizada **por funcionalidade**. As telas falam com a API do [backend](https://github.com/victorschmidt21/lucroai-backend) (um monolito modular) por meio de um BFF: o navegador só conversa com o próprio Next, que guarda o token e repassa as chamadas à API.

Objetivos:

- **Previsibilidade**: toda funcionalidade tem a mesma forma. Quem conhece uma conhece todas (inclusive a IA).
- **Isolamento**: cada funcionalidade é dona das suas telas, chamadas, regras de formulário e cálculos.
- **Contrato único**: os tipos da API ficam em um só lugar (`src/shared/api/contracts/`), validados em tempo de execução.
- **Paridade funcional com o mobile**: toda tela e regra do app Flutter tem equivalente aqui ([business-rules.md](business-rules.md)). O visual e a voz dos textos seguem a marca Doce Fatia ([marca.md](marca.md)), não o mobile.

> **Status:** existem a base da FE-01 (`src/app` com layout raiz, página provisória e `GET /api/health`; `src/shared/config`; `src/instrumentation*.ts`) o design system da FE-04 (`src/app/globals.css`, `src/shared/ui/`, `/design-system` e `src/test/a11y.ts`), a camada de API da FE-05 (`src/shared/api/`, `src/shared/format/` e os utilitários de teste de `src/test/`), os blocos de listagem e formulário da FE-06 (`ListPage`, `Form`, `FormDialog`, campos numéricos, `numero-br.ts` e `/design-system/listagem`) a sessão da FE-07 (`src/proxy.ts`, `/login` em `(auth)`, `src/app/api/auth/`, o proxy `src/app/api/backend/`, `src/shared/auth/` e `src/features/auth/`) o layout autenticado da FE-08 (`src/app/(app)/`, com as rotas do menu provisórias, o 404 e o erro dentro do layout, e `src/features/navegacao/`) e a primeira tela completa, insumos, da FE-09 (`src/features/insumos/` e `/insumos`, o [exemplo completo](#exemplo-completo-funcionalidade-insumos)). Todo o resto deste documento está marcado como **previsto**, com a issue que o entrega. Os exemplos mostram a forma que o código deve ter; ao implementar uma issue, atualize este arquivo no mesmo PR se o resultado for diferente e troque "previsto" por "existe".

## Estrutura de pastas

```text
src/
├── instrumentation.ts            # existe: valida o ambiente ao subir o servidor
├── instrumentation-node.ts       # existe
├── proxy.ts                      # existe (FE-07): redirecionamento otimista por sessão
├── app/                          # só rotas: páginas finas que compõem funcionalidades
│   ├── layout.tsx                # existe: layout raiz, com Fredoka e Nunito
│   ├── fonts.ts                  # existe: Fredoka e Nunito via next/font
│   ├── icon.svg                  # existe: favicon
│   ├── globals.css               # existe: tokens do LucroAI (FE-04)
│   ├── design-system/            # existe: catálogo do design system e, em listagem/, o exemplo da FE-06; só em desenvolvimento
│   ├── not-found.tsx, error.tsx  # existe (FE-08): 404 e erro fora do layout de (app)
│   ├── (auth)/                   # existe (FE-07): layout com o QueryProvider e login/
│   ├── (app)/                    # existe (FE-08): layout com sessão e menu, as oito rotas do menu (todas definitivas desde a FE-22), [...rota] (404), not-found.tsx e error.tsx
│   └── api/
│       ├── health/route.ts       # existe: GET /api/health
│       ├── auth/                 # existe (FE-07): login, logout e sessao
│       └── backend/[...path]/    # existe (FE-07; URL única desde a FE-39): proxy autenticado
├── features/                     # funcionalidades de negócio
│   ├── design-system/            # existe: catálogo de /design-system (FE-04) e exemplo de listagem (FE-06)
│   ├── auth/                     # existe (FE-07): LoginForm, UserMenu, useLogin, useLogout e os schemas do login
│   ├── navegacao/                # existe (FE-08): menu.ts, MenuNavegacao, AppShell, MenuContaCelular e TelaProvisoria
│   ├── insumos/                  # existe (FE-09): o exemplo completo de funcionalidade
│   └── <modulo>/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       ├── schemas/
│       └── <modulo>.calculos.ts  # regras puras da tela, quando houver
├── shared/                       # código transversal
│   ├── config/                   # existe: validação de ambiente
│   ├── api/                      # existe (FE-05): contratos, cliente, erros, filtros, TanStack Query
│   ├── format/                   # existe: formatação (FE-05) e leitura de números digitados (FE-06)
│   ├── domain/                   # regras de negócio usadas por mais de uma funcionalidade (estoque.ts)
│   ├── ui/                       # existe: design system (FE-04) e blocos de listagem e formulário (FE-06; ver docs/ui.md)
│   └── auth/                     # existe (FE-07): sessão, cookie, proxy BFF e usuário atual
└── test/                         # existe: a11y.ts (FE-04); MSW, api.ts, render.tsx, factories e fixtures (FE-05); next-navigation.ts (FE-06)
e2e/                              # existe: testes do Playwright
docs/                             # esta documentação
```

### Regras de dependência

| Pasta                    | Pode importar                                                                                 | Não pode importar                              |
| ------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `src/app/`               | `features/`, `shared/`                                                                        | —                                              |
| `src/features/<modulo>/` | a própria funcionalidade, `shared/` e **só** `api/<outro>.queries.ts` de outra funcionalidade | qualquer outro arquivo de outra funcionalidade |
| `src/shared/`            | `shared/`                                                                                     | `features/`, `app/`                            |

A exceção do `api/<outro>.queries.ts` existe porque o LucroAI calcula muita coisa no cliente: o painel lê as queries de vendas, receitas e estoque, e uma produção precisa invalidar o estoque. Um `*.queries.ts` exporta só chaves e `queryOptions`, e importa só o próprio `*.api.ts` e `shared/`, então não cria ciclos.

Quando uma funcionalidade precisar de outra coisa de outra (componente, schema, hook), há três caminhos, nesta ordem de preferência:

1. A **página** em `src/app/` compõe as duas e passa os dados por props.
2. A funcionalidade usa o `queryOptions` exportado pela outra (exceção acima).
3. Se o código servir a várias funcionalidades, ele sobe para `shared/`: componente sem regra de negócio vai para `shared/ui/`; regra de negócio pura, para `shared/domain/`.

## O que fica em `src/shared/`

| Caminho                | O que é                                                                                                                                                             | Situação                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `config/env.schema.ts` | schemas Zod das variáveis e `parseEnv()`                                                                                                                            | existe                                                    |
| `config/env.server.ts` | `getServerEnv()`, só no servidor                                                                                                                                    | existe                                                    |
| `config/env.public.ts` | `publicEnv`, disponível também no navegador                                                                                                                         | existe                                                    |
| `api/contracts/`       | schemas Zod de resposta e tipos de corpo, por grupo de recursos, e os enums com rótulos                                                                             | existe (FE-05)                                            |
| `api/`                 | `apiFetch` (`client.ts`, `client.server.ts`), `unwrap()`, `ApiError`, `getErrorMessage()`, `isEstoqueInsuficiente()`, `filtrarPorTexto()`, `QueryProvider`          | existe (FE-05)                                            |
| `format/`              | `formatMoeda`, `formatCustoUnitario`, `formatPercentual`, `formatQuantidade`, `formatData`, `parseDataSemHora`, `arredondarCentavos`                                | existe (FE-05)                                            |
| `format/`              | `numero-br.ts`: `parseNumeroBR`, `parseInteiroBR`, `formatNumeroEditavel`, `numeroBR()`, `numeroBROpcional()`, `inteiroBR()`; `percentualParaFracao` em `numero.ts` | existe (FE-06)                                            |
| `domain/`              | regras usadas por mais de uma funcionalidade: `estoque.ts` (`isBaixoEstoque`, `statusEstoque`), `vendas.ts` (`isFaturavel`, `totalItem`)                            | `estoque.ts` existe (FE-13); `vendas.ts` previsto (FE-18) |
| `ui/`                  | componentes base, ícones, `Logo`, `PageHeader`, `StatCard`, `Toast`, `ConfirmDialog`, estados                                                                       | existe (FE-04)                                            |
| `ui/`                  | `StatusPage` (páginas 404 e de erro)                                                                                                                                | existe (FE-08)                                            |
| `ui/`                  | `ListPage`, `DataTable`, `useBuscaNaUrl`, `FormDialog`, `Form` e campos, `MoneyInput`, `DecimalInput`, `IntegerInput`, `PercentInput`, `UnidadeSelect`              | existe (FE-06)                                            |
| `auth/`                | cookie de sessão, `getUsuarioAtual()`, `useUsuarioAtual()`, decodificação do JWT, proxy BFF (`backend-proxy.server.ts`), `handleSessaoExpirada`                     | existe (FE-07)                                            |

Não use o que ainda não existe: implemente a issue correspondente ou combine a mudança de escopo.

## Estrutura de uma funcionalidade

```text
src/features/<modulo>/
├── components/              # componentes da funcionalidade (lista, formulário, detalhe)
├── hooks/                   # use-<acao>-<entidade>.ts: mutação + invalidação (regra comum às mutações em invalidacoes.ts)
├── api/
│   ├── <modulo>.api.ts      # funções que chamam apiFetch + unwrap, tipadas pelos contratos
│   └── <modulo>.queries.ts  # query keys e queryOptions (a única parte importável por outra funcionalidade)
├── schemas/                 # schemas Zod de formulário e de search params
└── <modulo>.calculos.ts     # funções puras com as fórmulas de business-rules.md, quando a tela calcula algo
```

Crie só as pastas que a funcionalidade usar. Testes ficam ao lado do arquivo testado.

O nome da pasta é o plural do agregado, em `kebab-case`, igual ao módulo do backend quando houver: `insumos`, `gastos-indiretos`, `receitas`, `estoque`, `producoes`, `vendas`. Telas sem módulo próprio no backend: `custos` (cálculo real), `simulacao`, `painel`, `auth` e `navegacao`.

### Regras de negócio no cliente

O backend decide o que ele grava. Mas, como ele não tem painel, listagem de estoque nem estoque de produto acabado, parte das regras roda no cliente. Elas seguem três regras:

1. **A fórmula vem de [business-rules.md](business-rules.md)**, que cita o arquivo de origem no mobile ou no backend. Fórmula nova ou diferente entra lá no mesmo PR.
2. **Fica em função pura**, sem React nem rede, com teste unitário de cada ramo: `features/<modulo>/<modulo>.calculos.ts` (ex.: `painel.calculos.ts`, `simulacao.calculos.ts`, `insumos.calculos.ts`) ou, se mais de uma funcionalidade usa, `shared/domain/<assunto>.ts`.
3. **Valor gravado pelo backend não é recalculado na tela.** O cálculo no cliente serve para prévia (custo da receita enquanto edita, rateio estimado) e para o que o backend não tem.

## Server Component ou Client Component

Tudo é Server Component por padrão. Adicione `'use client'` só onde for necessário, o mais perto possível das folhas da árvore.

| Use                  | Quando                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server Component** | páginas e layouts; ler a sessão, `params` e `searchParams`; `metadata`; conteúdo estático                                                                |
| **Client Component** | estado e eventos (`useState`, `onClick`); hooks, inclusive TanStack Query e `react-hook-form`; `useSearchParams`; `localStorage`; gráficos com interação |

Cuidados:

- `params` e `searchParams` são `Promise` no Next 16: use `await` no servidor. Em Client Components, use `useSearchParams()`.
- Props passadas de Server para Client Component precisam ser serializáveis e ficam visíveis no navegador. Não passe o token nem campos que a tela não usa.
- Código que lê o cookie de sessão ou a URL da API tem sufixo `.server.ts` e `import 'server-only'`. Assim, o build falha se ele for parar no navegador.
- Providers (`QueryClientProvider`, Toast) são Client Components, e o layout de `(app)` os renderiza em volta de `children`.
- Antes de usar uma API do Next, leia o guia da versão instalada em `node_modules/next/dist/docs/`.

## Onde buscar dados

| Situação                                            | Onde                                | Como                                                                   |
| --------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| Listagens, detalhes e tudo que muda com a interação | Client Component                    | TanStack Query, pelo proxy `/api/backend/<caminho>`                    |
| Mutações                                            | Client Component                    | `useMutation` em `hooks/`, pelo proxy, invalidando as queries afetadas |
| Sessão e dados do usuário e da empresa              | Server Component (layout ou página) | `getUsuarioAtual()`, que decodifica o JWT do cookie (FE-07)            |
| Cálculo local sem API (cálculo real)                | Client Component                    | estado local e funções de `<modulo>.calculos.ts`                       |

O padrão das telas internas é buscar no cliente. Assim, cada tela segue um único fluxo, com os estados de carregamento, vazio e erro em um só lugar. Pré-carregar no servidor (`prefetchQuery` + `HydrationBoundary`) é uma otimização a justificar no PR.

Não use Server Actions para falar com a API: as mutações passam pelo proxy, para que erros, sessão expirada e invalidação de cache sigam um único caminho. Não use `fetch` direto em componentes: use as funções de `api/`.

Detalhes do cliente, dos contratos, dos erros e do cache em [api-integration.md](api-integration.md).

## Rotas e grupos de rota

Grupos de rota, com o nome entre parênteses, aplicam layouts diferentes sem aparecer na URL.

| Grupo    | Telas                 | Layout                                                      | Sessão                          |
| -------- | --------------------- | ----------------------------------------------------------- | ------------------------------- |
| `(auth)` | `/login`              | marca, sem menu                                             | quem já tem sessão vai para `/` |
| `(app)`  | todas as outras telas | menu lateral no desktop e barra inferior no celular (FE-08) | obrigatória (`getUsuarioAtual`) |

Não há perfis: o LucroAI tem um único tipo de usuário, e todo usuário logado vê todas as telas da própria empresa.

| Rota                            | Tela                                      | Funcionalidade     | Issue         | No menu  |
| ------------------------------- | ----------------------------------------- | ------------------ | ------------- | -------- |
| `/login`                        | login                                     | `auth`             | FE-07         | —        |
| `/`                             | painel (Home)                             | `painel`           | FE-22         | Home     |
| `/insumos`                      | lista, cadastro e edição em diálogo       | `insumos`          | FE-09         | Insumos  |
| `/receitas`                     | lista                                     | `receitas`         | FE-11         | Receitas |
| `/receitas/nova`                | criação                                   | `receitas`         | FE-12         | —        |
| `/receitas/[receitaId]/editar`  | edição                                    | `receitas`         | FE-12         | —        |
| `/receitas/[receitaId]/simular` | simulação de cenário                      | `receitas`         | FE-20         | —        |
| `/custos`                       | cálculo real                              | `custos`           | FE-19         | Custos   |
| `/vendas`                       | abas Registrar e Histórico (`aba` na URL) | `vendas`           | FE-16 a FE-18 | Vendas   |
| `/estoque`                      | saldo, status, entrada e histórico        | `estoque`          | FE-13, FE-14  | Estoque  |
| `/producoes`                    | lista e registro                          | `producoes`        | FE-15         | Produção |
| `/gastos-indiretos`             | lista, total e cadastro em diálogo        | `gastos-indiretos` | FE-10         | Gastos   |
| `/simulacao`                    | simulação interativa (aberta pelo painel) | `simulacao`        | FE-21         | —        |

O layout de `(app)` (existe desde a FE-08) confere a sessão com `getUsuarioAtual()`, coloca o usuário no cache do TanStack Query (o `UserMenu` abre preenchido, sem uma busca a mais) e renderiza o `QueryProvider`, o `ToastProvider` e o `AppShell` (`features/navegacao/`), que traz o `<main>`; as páginas começam em `PageHeader`. As oito rotas do menu existem desde a FE-08 como telas provisórias (`TelaProvisoria`: o `PageHeader` com o título e o subtítulo da tela definitiva e "Em construção"), e cada issue substitui a sua; `/insumos` já foi substituída (FE-09). Não há `loading.tsx` no grupo: com ele, a resposta começaria antes da conferência da sessão, e o 404 sairia com status 200.

Páginas de status (FE-08, com a `StatusPage` de `shared/ui/`):

| Arquivo                                            | Quando                                                                                                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `(app)/[...rota]/page.tsx` + `(app)/not-found.tsx` | rota inexistente com sessão, ou `notFound()` numa tela: 404 **dentro do layout**, com o menu. O catch-all define o título ("Página não encontrada \| LucroAI") |
| `(app)/error.tsx`                                  | erro inesperado numa tela, dentro do layout, com "Tentar novamente" (`retry`)                                                                                  |
| `not-found.tsx` e `error.tsx` na raiz de `app/`    | fora do layout: `/design-system` no build, falha no próprio layout de `(app)` ou no login                                                                      |

Sem sessão, rota inexistente também leva ao login (o `src/proxy.ts` age antes). Erros de dados da API não chegam a essas páginas: ficam no `ErrorState` de cada bloco.

O Next 16 renomeou `middleware.ts` para `proxy.ts`. Por isso, a checagem otimista de sessão fica em `src/proxy.ts` (existe desde a FE-07, ver [security.md](security.md#proteção-de-rotas)). Ele também preenche o header `x-lucroai-path`, que `getUsuarioAtual()` usa para voltar à rota atual depois do login. Não confunda com o proxy BFF `/api/backend/[...path]`, que é um Route Handler.

## Fluxo de uma requisição

Listagem de insumos no navegador:

```text
InsumosLista (Client Component)
  → useQuery(insumosListOptions())          TanStack Query: cache e estados
  → listInsumos(signal)                     features/insumos/api
  → apiFetch('/insumos')                    shared/api/client.ts
  → GET /api/backend/insumos                Route Handler do Next (BFF)
      lê o cookie, confere o caminho, injeta Authorization
  → GET {API_URL}/insumos                   API (monolito)
  ← Insumo[]                                JSON puro, sem envelope
  ← unwrap(corpo, z.array(insumoSchema))    valida o contrato
```

O inverso vale para o erro: a resposta de erro da API (`{ statusCode, code, message }`) vira um `ApiError`, que a tela exibe com `getErrorMessage()` (ver [api-integration.md](api-integration.md#tratamento-de-erros)).

## Equivalência mobile → web

O app Flutter usa Clean Architecture com Cubit. A web troca as camadas assim:

| Mobile (Flutter)                                                          | Web (Next.js)                                                                                                  |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `data/datasources` + `data/repositories`                                  | `features/<modulo>/api/<modulo>.api.ts`                                                                        |
| `domain/entities` + `data/models`                                         | schemas Zod de resposta em `shared/api/contracts/` e de formulário em `features/<modulo>/schemas/` (ver FE-05) |
| `domain/usecases`                                                         | funções de `api/` + hooks `use-<acao>-<entidade>.ts`                                                           |
| `domain/services` e cálculos em `presentation`                            | funções puras em `<modulo>.calculos.ts` ou `shared/domain/`                                                    |
| `presentation/cubit` (estado de tela)                                     | TanStack Query (estado do servidor) + estado local do componente                                               |
| `presentation/pages` e `widgets`                                          | `app/(app)/<rota>/page.tsx` + `features/<modulo>/components/`                                                  |
| `core/auth/auth_session.dart` + `shared_preferences`                      | BFF com cookie `httpOnly` (FE-07)                                                                              |
| `core/network/api_client.dart` (um `Dio` por serviço) e `_buildException` | `apiFetch(caminho, ...)` e `ApiError` (FE-05; URL única desde a FE-39)                                         |
| `IndexedStack` + barra inferior                                           | layout `(app)` com menu lateral no desktop e barra inferior no celular (FE-08); cada tela monta ao entrar      |
| `showModalBottomSheet`                                                    | `FormDialog`: Dialog no desktop, Drawer de baixo no celular (FE-06)                                            |
| `SnackBar`                                                                | Toast (FE-04)                                                                                                  |
| `RefreshIndicator` e recarga ao trocar de aba                             | `refetchOnWindowFocus` e revalidação ao montar a tela                                                          |

Telas do mobile e suas rotas (`lib/core/presentation/pages/main_screen.dart`):

| Aba no mobile     | Página Flutter                                                                        | Rota web                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Home              | `lib/features/dashboard/presentation/pages/dashboard_page.dart`                       | `/`                                                                                            |
| Insumos           | `lib/features/insumos/presentation/pages/insumos_page.dart`                           | `/insumos`                                                                                     |
| Receitas          | `lib/features/receitas/presentation/pages/receitas_page.dart` e `simulacao_page.dart` | `/receitas`, `/receitas/nova`, `/receitas/[receitaId]/editar`, `/receitas/[receitaId]/simular` |
| Custos            | `lib/features/insumos/presentation/pages/calculo_real_screen.dart`                    | `/custos`                                                                                      |
| Vendas            | `lib/features/vendas/presentation/pages/vendas_page.dart`                             | `/vendas`                                                                                      |
| Estoque           | `lib/features/estoques/presentation/pages/estoques_page.dart`                         | `/estoque`                                                                                     |
| Produção          | `lib/features/producoes/presentation/pages/producoes_page.dart`                       | `/producoes`                                                                                   |
| Gastos            | `lib/features/gastos_indiretos/presentation/pages/gastos_indiretos_page.dart`         | `/gastos-indiretos`                                                                            |
| (botão do painel) | `lib/features/simulacao/presentation/pages/simulacao_page.dart`                       | `/simulacao`                                                                                   |
| (antes do menu)   | `lib/features/auth/presentation/pages/login_page.dart`                                | `/login`                                                                                       |

Não migre o código morto: `lib/features/insumos/presentation/pages/app_shell_page.dart` e `lib/features/custos/presentation/pages/custos_page.dart` não são usados pelo `main_screen.dart`.

## Exemplo completo: funcionalidade `insumos`

> **Existe (FE-09).** Modelo a ser copiado para as funcionalidades novas, com o contrato real do backend e as regras de [business-rules.md](business-rules.md#insumos). Ele usa a camada de API da FE-05, os blocos de tela da FE-06 (`ListPage`, `FormDialog`, campos numéricos) e o `ConfirmDialog` da FE-04, com as APIs descritas em [ui.md](ui.md#listagens-e-formulários). **O código em `src/features/insumos/` é a referência**: os trechos abaixo foram conferidos com ele na FE-09, e os dois componentes estão resumidos (abra os arquivos para o código inteiro). O exemplo da FE-06 em `/design-system/listagem` continua como catálogo dos blocos, com uma API em memória.

Arquivos:

```text
src/shared/api/contracts/catalog.ts           # insumoSchema, CreateInsumoBody, UpdateInsumoBody (FE-05)
src/features/insumos/
├── api/insumos.api.ts                        # listInsumos, getInsumo, createInsumo, updateInsumo, deleteInsumo
├── api/insumos.queries.ts                    # insumosKeys, insumosListOptions, insumoDetailOptions, ordenarPorNome
├── hooks/invalidacoes.ts                     # invalidações comuns às três mutações
├── hooks/use-create-insumo.ts
├── hooks/use-update-insumo.ts
├── hooks/use-delete-insumo.ts
├── schemas/insumo-form.schema.ts
├── schemas/insumos-search.schema.ts
├── insumos.calculos.ts
├── components/insumos-lista.tsx
└── components/insumo-form-dialog.tsx
src/app/(app)/insumos/page.tsx
```

Os testes ficam ao lado de cada arquivo (`*.test.ts` e `*.test.tsx`); os dos três hooks estão juntos em `hooks/invalidacoes.test.tsx`.

Rotas (catalog-service): `GET /insumos`, `GET /insumos/:id`, `POST /insumos`, `PATCH /insumos/:id`, `DELETE /insumos/:id`. O contrato está em [api-integration.md](api-integration.md#contratos-tipados-estratégia-da-fe-05).

### `api/insumos.api.ts`

```ts
// src/features/insumos/api/insumos.api.ts
import { z } from 'zod';
import { apiFetch } from '@/shared/api/client';
import {
  insumoSchema,
  type CreateInsumoBody,
  type UpdateInsumoBody,
} from '@/shared/api/contracts/catalog';
import { unwrap } from '@/shared/api/request';

export async function listInsumos(signal?: AbortSignal) {
  const corpo = await apiFetch('catalog', '/insumos', { signal });
  return unwrap(corpo, z.array(insumoSchema));
}

export async function getInsumo(id: number, signal?: AbortSignal) {
  const corpo = await apiFetch('catalog', `/insumos/${id}`, { signal });
  return unwrap(corpo, insumoSchema);
}

export async function createInsumo(body: CreateInsumoBody) {
  const corpo = await apiFetch('catalog', '/insumos', { method: 'POST', body });
  return unwrap(corpo, insumoSchema);
}

export async function updateInsumo({
  id,
  body,
}: {
  id: number;
  body: UpdateInsumoBody;
}) {
  const corpo = await apiFetch('catalog', `/insumos/${id}`, {
    method: 'PATCH',
    body,
  });
  return unwrap(corpo, insumoSchema);
}

/** Responde 204 sem corpo: não há o que desembrulhar. */
export async function deleteInsumo(id: number) {
  await apiFetch('catalog', `/insumos/${id}`, { method: 'DELETE' });
}
```

### `api/insumos.queries.ts`

```ts
// src/features/insumos/api/insumos.queries.ts
import { queryOptions } from '@tanstack/react-query';
import { getInsumo, listInsumos } from './insumos.api';

export const insumosKeys = {
  all: ['insumos'] as const,
  list: () => [...insumosKeys.all, 'list'] as const,
  detail: (id: number) => [...insumosKeys.all, 'detail', id] as const,
};

export function ordenarPorNome<T extends { nome: string }>(insumos: T[]) {
  return insumos.toSorted((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// A busca é feita no cliente: `q` não entra na chave.
export function insumosListOptions() {
  return queryOptions({
    queryKey: insumosKeys.list(),
    queryFn: ({ signal }) => listInsumos(signal),
    // GET /insumos não tem ordem garantida.
    select: ordenarPorNome,
  });
}

export function insumoDetailOptions(id: number) {
  return queryOptions({
    queryKey: insumosKeys.detail(id),
    queryFn: ({ signal }) => getInsumo(id, signal),
  });
}
```

### `hooks/`

As três mutações invalidam as mesmas raízes ([matriz](api-integration.md#invalidação-após-mutações)): o insumo novo cria estoque, e o custo das receitas depende do custo do insumo. Como a regra é a mesma nas três, ela fica em `hooks/invalidacoes.ts`, junto com a recarga da lista quando uma edição ou exclusão recebe `404` (o insumo já não existe e a tela está desatualizada, ver [api-integration.md](api-integration.md#tratamento-de-erros)).

```ts
// src/features/insumos/hooks/invalidacoes.ts
import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/errors';
import { estoqueKeys } from '@/features/estoque/api/estoque.queries';
import { receitasKeys } from '@/features/receitas/api/receitas.queries';
import { insumosKeys } from '../api/insumos.queries';

export function invalidarAposMutacaoDeInsumo(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: insumosKeys.all }),
    queryClient.invalidateQueries({ queryKey: estoqueKeys.all }),
    queryClient.invalidateQueries({ queryKey: receitasKeys.all }),
  ]);
}

export function recarregarSeNaoEncontrado(
  queryClient: QueryClient,
  error: unknown,
) {
  if (error instanceof ApiError && error.statusCode === 404) {
    return queryClient.invalidateQueries({ queryKey: insumosKeys.all });
  }
  return undefined;
}
```

```ts
// src/features/insumos/hooks/use-update-insumo.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInsumo } from '../api/insumos.api';
import {
  invalidarAposMutacaoDeInsumo,
  recarregarSeNaoEncontrado,
} from './invalidacoes';

export function useUpdateInsumo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInsumo,
    onSuccess: () => invalidarAposMutacaoDeInsumo(queryClient),
    onError: (error) => recarregarSeNaoEncontrado(queryClient, error),
  });
}
```

`use-delete-insumo.ts` tem a mesma forma, com `deleteInsumo`; `use-create-insumo.ts` não tem o `onError`, porque a criação não recebe `404`.

Quando a raiz de outra funcionalidade já existir, importe as chaves do `api/<outro>.queries.ts` dela (`estoqueKeys.all`), em vez do literal.

### `insumos.calculos.ts`

```ts
// src/features/insumos/insumos.calculos.ts
/**
 * Custo por unidade de medida do insumo, sem arredondamento.
 * Origem: lib/features/insumos/domain/services/insumo_custo_calculator.dart
 * e Insumo.calcularCustoUnitario no catalog-service (docs/business-rules.md#insumos).
 */
export function calcularCustoUnitario(valorPago: number, quantidade: number) {
  return quantidade > 0 ? valorPago / quantidade : 0;
}
```

### `schemas/`

Campos numéricos guardam o texto digitado e são convertidos pelo schema com `numeroBR()` (existe desde a FE-06), que aceita vírgula ou ponto ([business-rules.md](business-rules.md#leitura-de-números-digitados)). O formulário usa o tipo de entrada (`z.input`) e recebe o de saída (`z.output`) no envio.

```ts
// src/features/insumos/schemas/insumo-form.schema.ts (trecho)
export const NOME_MAX = 80;

export const insumoFormSchema = z.object({
  nome: z.string().trim().min(1, NOME_OBRIGATORIO).max(NOME_MAX, NOME_LONGO),
  quantidadeBaseCusto: numeroBR(
    z.number({ error: QUANTIDADE }).positive(QUANTIDADE),
  ),
  unidade: unidadeMedidaSchema,
  // O backend aceita 0 (`@Min(0)`); o mobile e a web pedem > 0.
  valorPago: numeroBR(z.number({ error: VALOR }).positive(VALOR)),
  // Só na criação; vazio não é enviado (o backend começa o estoque em 0).
  quantidadeDisponivelInicial: numeroBROpcional(
    z.number({ error: INICIAL }).min(0, INICIAL),
  ),
});

export type InsumoFormInput = z.input<typeof insumoFormSchema>;
export type InsumoFormValues = z.output<typeof insumoFormSchema>;

/** A unidade padrão é grama, como no mobile (`InsumoUnidadeMedida.gramas`). */
export const insumoFormVazio: InsumoFormInput = {
  nome: '',
  quantidadeBaseCusto: '',
  unidade: 'G',
  valorPago: '',
  quantidadeDisponivelInicial: '',
};

export function toInsumoFormInput(insumo: Insumo): InsumoFormInput {
  return {
    nome: insumo.nome,
    quantidadeBaseCusto: formatNumeroEditavel(insumo.quantidadeBaseCusto),
    unidade: insumo.unidade,
    valorPago: formatNumeroEditavel(insumo.valorPago, 2), // dinheiro: 2 casas
    quantidadeDisponivelInicial: '',
  };
}

export function toCreateInsumoBody(values: InsumoFormValues): CreateInsumoBody {
  const { quantidadeDisponivelInicial, ...resto } = values;
  return quantidadeDisponivelInicial === undefined
    ? resto
    : { ...resto, quantidadeDisponivelInicial };
}

/** O PATCH não aceita `quantidadeDisponivelInicial`: o backend rejeita campos extras (400). */
export function toUpdateInsumoBody(values: InsumoFormValues): UpdateInsumoBody {
  const { quantidadeDisponivelInicial: _ignorado, ...body } = values;
  return body;
}
```

```ts
// src/features/insumos/schemas/insumos-search.schema.ts
import { z } from 'zod';

// `.catch()` evita que uma URL editada à mão derrube a tela.
export const insumosSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  /** Abre o cadastro ao carregar (ações rápidas do painel, FE-22). */
  novo: z.literal('1').optional().catch(undefined),
});
```

### `components/insumo-form-dialog.tsx`

Client Component com o `FormDialog`: título "Novo insumo" ou "Editar insumo", `submitLabel` "Salvar" ou "Atualizar", e os campos `FormInput` (Nome, `maxLength={NOME_MAX}`), `FormDecimalInput` (Quantidade) com `FormUnidadeSelect` (Unidade) na mesma linha, `FormMoneyInput` (Valor pago) e, só na criação, `FormDecimalInput` (Quantidade disponível inicial, com dica). O `onSubmit` usa `mutateAsync` (rejeitar mantém o diálogo aberto com o `Alert`), mostra o Toast e fecha:

```tsx
onSubmit={async (values) => {
  if (insumo) {
    await update.mutateAsync({ id: insumo.id, body: toUpdateInsumoBody(values) });
    toast.success('Insumo atualizado com sucesso.');
  } else {
    await create.mutateAsync(toCreateInsumoBody(values));
    toast.success('Insumo criado com sucesso.');
  }
  onOpenChange(false);
}}
```

A prévia é um filho do formulário que lê os campos com `useWatch` e usa a função pura:

```tsx
function PreviaCustoUnitario() {
  const [quantidade, valorPago, unidade] = useWatch<
    InsumoFormInput,
    ['quantidadeBaseCusto', 'valorPago', 'unidade']
  >({ name: ['quantidadeBaseCusto', 'valorPago', 'unidade'] });
  const custo = calcularCustoUnitario(
    parseNumeroBR(valorPago) ?? 0,
    parseNumeroBR(quantidade) ?? 0,
  );

  return (
    <p aria-live="polite" className="... text-accent">
      Custo unitário: {formatCustoUnitario(custo, unidade)}
    </p>
  );
}
```

### `components/insumos-lista.tsx`

Client Component que compõe `ListPage`, `InsumoFormDialog` e `ConfirmDialog`:

- `useQuery(insumosListOptions())` vai direto para a `ListPage`, com `searchField="nome"`, `searchPlaceholder="Buscar insumo"`, `itemLabel` ("12 insumos"), `emptyTitle="Nenhum insumo encontrado."` com a ação "Novo insumo", e `errorTitle="Não foi possível carregar os insumos."`.
- Colunas: Nome; Quantidade (`formatQuantidade(quantidadeBaseCusto, unidade)`); Valor pago (`formatMoeda`); Custo unitário (`formatCustoUnitario(custoUnitario, unidade)`, o valor do backend, sem recalcular); Ações, com `IconButton` "Editar <nome>" e "Excluir <nome>".
- O formulário fica num estado `{ aberto, insumo? }`, e a `key={formulario.insumo?.id ?? 'novo'}` recria o `InsumoFormDialog` com os valores do insumo escolhido.
- `abrirNovo` (de `?novo=1`) abre a criação ao carregar; ao fechar, o parâmetro sai da URL com `router.replace(hrefComFiltros(pathname, searchParams, { novo: null }), { scroll: false })`, mantendo a busca.
- A exclusão usa `ConfirmDialog` com "Excluir insumo", `Deseja excluir "<nome>"?` e "Excluir"; o `onConfirm` chama `mutateAsync`, mostra "Insumo excluído com sucesso." e fecha. Se o backend recusar, o diálogo continua aberto com a mensagem dele.

`ListPage` cuida de: `PageHeader`, busca com debounce gravando `q` na URL, filtro sem acentos pelo `searchField`, contagem de resultados, cartões no celular e tabela no desktop, e os estados de carregamento, vazio, vazio por busca e erro com "Tentar novamente".

### `src/app/(app)/insumos/page.tsx`

A página é um Server Component: lê a URL com o schema e compõe a funcionalidade. O layout de `(app)` já garante a sessão. Ler `searchParams` deixa a rota dinâmica, o que a `ListPage` precisa (ela usa `useSearchParams`).

```tsx
// src/app/(app)/insumos/page.tsx
import type { Metadata } from 'next';
import { InsumosLista } from '@/features/insumos/components/insumos-lista';
import { insumosSearchSchema } from '@/features/insumos/schemas/insumos-search.schema';

export const metadata: Metadata = { title: 'Insumos' };

export default async function InsumosPage({
  searchParams,
}: PageProps<'/insumos'>) {
  const { novo } = insumosSearchSchema.parse(await searchParams);

  return <InsumosLista abrirNovo={novo === '1'} />;
}
```

### Testes

Seguem a [política atual](testing.md#política-atual-produto-inicial-desde-2026-11-19): unitários do schema do formulário e do cálculo do custo unitário. Os de `api/`, dos hooks e de componente (lista e formulário, com MSW) vieram junto e ficam como exemplo; não há e2e da tela.
