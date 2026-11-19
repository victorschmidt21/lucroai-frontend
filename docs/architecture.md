# Arquitetura

O frontend do LucroAI é uma aplicação Next.js com App Router, organizada **por funcionalidade**. As telas falam com os cinco microsserviços do [backend](https://github.com/GrupoDoisENG/lucroai-backend) por meio de um BFF: o navegador só conversa com o próprio Next, que guarda o token e repassa as chamadas ao serviço certo.

Objetivos:

- **Previsibilidade**: toda funcionalidade tem a mesma forma. Quem conhece uma conhece todas (inclusive a IA).
- **Isolamento**: cada funcionalidade é dona das suas telas, chamadas, regras de formulário e cálculos.
- **Contrato único**: os tipos da API ficam em um só lugar (`src/shared/api/contracts/`), validados em tempo de execução.
- **Paridade com o mobile**: toda tela, regra e texto do app Flutter tem equivalente aqui ([business-rules.md](business-rules.md)).

> **Status:** só a base da FE-01 existe: `src/app` (layout raiz, página provisória e `GET /api/health`), `src/shared/config` (validação de ambiente) e `src/instrumentation*.ts`. Todo o resto deste documento está marcado como **previsto**, com a issue que o entrega. Os exemplos mostram a forma que o código deve ter; ao implementar uma issue, atualize este arquivo no mesmo PR se o resultado for diferente e troque "previsto" por "existe".

## Estrutura de pastas

```text
src/
├── instrumentation.ts            # existe: valida o ambiente ao subir o servidor
├── instrumentation-node.ts       # existe
├── proxy.ts                      # previsto (FE-07): redirecionamento otimista por sessão
├── app/                          # só rotas: páginas finas que compõem funcionalidades
│   ├── layout.tsx                # existe: layout raiz
│   ├── globals.css               # existe; tokens do LucroAI na FE-04
│   ├── page.tsx                  # existe: página provisória, substituída pelo painel em (app) na FE-08
│   ├── (auth)/                   # previsto (FE-07): login
│   ├── (app)/                    # previsto (FE-08): telas internas, com sessão e menu
│   └── api/
│       ├── health/route.ts       # existe: GET /api/health
│       ├── auth/                 # previsto (FE-07): login, logout e sessão
│       └── backend/[servico]/[...path]/  # previsto (FE-07): proxy autenticado por serviço
├── features/                     # funcionalidades de negócio (vazio até a FE-07)
│   └── <modulo>/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       ├── schemas/
│       └── <modulo>.calculos.ts  # regras puras da tela, quando houver
├── shared/                       # código transversal
│   ├── config/                   # existe: validação de ambiente
│   ├── api/                      # previsto (FE-05): contratos, cliente, erros, TanStack Query
│   ├── format/                   # previsto (FE-05, FE-06): formatação e leitura de números e datas
│   ├── domain/                   # previsto: regras de negócio usadas por mais de uma funcionalidade
│   ├── ui/                       # previsto (FE-04, FE-06): design system (ver docs/ui.md)
│   └── auth/                     # previsto (FE-07): sessão e usuário atual
└── test/                         # previsto (FE-05): MSW, renderização e factories
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

| Caminho                | O que é                                                                                                                                                             | Situação                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `config/env.schema.ts` | schemas Zod das variáveis e `parseEnv()`                                                                                                                            | existe                  |
| `config/env.server.ts` | `getServerEnv()`, só no servidor                                                                                                                                    | existe                  |
| `config/env.public.ts` | `publicEnv`, disponível também no navegador                                                                                                                         | existe                  |
| `api/contracts/`       | schemas Zod de resposta e tipos de corpo, por serviço, e os enums com rótulos                                                                                       | previsto (FE-05)        |
| `api/`                 | `apiFetch` (`client.ts`, `client.server.ts`), `unwrap()`, `ApiError`, `getErrorMessage()`, `isEstoqueInsuficiente()`, `filtrarPorTexto()`, `QueryProvider`          | previsto (FE-05)        |
| `format/`              | `formatMoeda`, `formatCustoUnitario`, `formatPercentual`, `formatQuantidade`, `formatData`, `parseDataSemHora`, `arredondarCentavos`, `parseNumeroBR`, `numeroBR()` | previsto (FE-05, FE-06) |
| `domain/`              | regras usadas por mais de uma funcionalidade: `estoque.ts` (`isBaixoEstoque`, `statusEstoque`), `vendas.ts` (`isFaturavel`, `totalItem`)                            | previsto (FE-13, FE-18) |
| `ui/`                  | componentes base, ícones, `Logo`, `PageHeader`, `StatCard`, `Toast`, estados                                                                                        | previsto (FE-04)        |
| `ui/`                  | `ListPage`, `FormDialog`, `Form` e campos, `MoneyInput`, `DecimalInput`, `IntegerInput`, `PercentInput`, `UnidadeSelect`, `ConfirmDialog`                           | previsto (FE-06)        |
| `auth/`                | cookie de sessão, `getUsuarioAtual()`, `useUsuarioAtual()`, decodificação do JWT                                                                                    | previsto (FE-07)        |

Não use o que ainda não existe: implemente a issue correspondente ou combine a mudança de escopo.

## Estrutura de uma funcionalidade

```text
src/features/<modulo>/
├── components/              # componentes da funcionalidade (lista, formulário, detalhe)
├── hooks/                   # use-<acao>-<entidade>.ts: mutação + invalidação
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
- Código que lê o cookie de sessão ou as URLs dos serviços tem sufixo `.server.ts` e `import 'server-only'`. Assim, o build falha se ele for parar no navegador.
- Providers (`QueryClientProvider`, Toast) são Client Components, e o layout de `(app)` os renderiza em volta de `children`.
- Antes de usar uma API do Next, leia o guia da versão instalada em `node_modules/next/dist/docs/`.

## Onde buscar dados

| Situação                                            | Onde                                | Como                                                                   |
| --------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| Listagens, detalhes e tudo que muda com a interação | Client Component                    | TanStack Query, pelo proxy `/api/backend/<servico>`                    |
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
| `(app)`  | todas as outras telas | menu lateral no desktop e barra inferior no celular (FE-08) | obrigatória                     |

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

O layout de `(app)` traz o `<main>`; as páginas começam em `PageHeader`. As rotas do menu nascem provisórias ("Em construção") na FE-08, e cada issue substitui a sua. Páginas `not-found.tsx` e `error.tsx` ficam na raiz de `app/` e em `(app)/`.

O Next 16 renomeou `middleware.ts` para `proxy.ts`. Por isso, a checagem otimista de sessão fica em `src/proxy.ts` (FE-07, ver [security.md](security.md#proteção-de-rotas)). Não confunda com o proxy BFF `/api/backend/[servico]/[...path]`, que é um Route Handler.

## Fluxo de uma requisição

Listagem de insumos no navegador:

```text
InsumosLista (Client Component)
  → useQuery(insumosListOptions())          TanStack Query: cache e estados
  → listInsumos(signal)                     features/insumos/api
  → apiFetch('catalog', '/insumos')         shared/api/client.ts
  → GET /api/backend/catalog/insumos        Route Handler do Next (BFF)
      lê o cookie, confere o serviço e o caminho, injeta Authorization
  → GET {CATALOG_API_URL}/insumos           catalog-service
  ← { data: Insumo[], links }               envelope HATEOAS
  ← unwrap(corpo, z.array(insumoSchema))    desembrulha e valida o contrato
```

O inverso vale para o erro: a resposta do NestJS vira um `ApiError`, que a tela exibe com `getErrorMessage()` (ver [api-integration.md](api-integration.md#tratamento-de-erros)).

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
| `core/network/api_client.dart` (um `Dio` por serviço) e `_buildException` | `apiFetch(servico, ...)` e `ApiError` (FE-05)                                                                  |
| `IndexedStack` + barra inferior                                           | layout `(app)` com menu lateral no desktop e barra inferior no celular (FE-08)                                 |
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

> **Previsto (FE-09).** Modelo a ser copiado para as funcionalidades novas, com o contrato real do backend e as regras de [business-rules.md](business-rules.md#insumos). Ele usa a camada de API da FE-05 e os blocos de tela da FE-06 (`ListPage`, `FormDialog`, campos numéricos, `ConfirmDialog`), com as APIs descritas em [ui.md](ui.md#listagens-e-formulários). Quando a FE-09 for entregue, o código real em `src/features/insumos/` passa a ser a referência, e este exemplo deve ser conferido com ele.

Arquivos:

```text
src/shared/api/contracts/catalog.ts           # insumoSchema, CreateInsumoBody, UpdateInsumoBody (FE-05)
src/features/insumos/
├── api/insumos.api.ts
├── api/insumos.queries.ts
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

// A busca é feita no cliente: `q` não entra na chave.
export function insumosListOptions() {
  return queryOptions({
    queryKey: insumosKeys.list(),
    queryFn: ({ signal }) => listInsumos(signal),
    // GET /insumos não tem ordem garantida.
    select: (insumos) =>
      insumos.toSorted((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  });
}

export function insumoDetailOptions(id: number) {
  return queryOptions({
    queryKey: insumosKeys.detail(id),
    queryFn: ({ signal }) => getInsumo(id, signal),
  });
}
```

### `hooks/use-create-insumo.ts`

As três mutações invalidam as mesmas raízes ([matriz](api-integration.md#invalidação-após-mutações)): o insumo novo cria estoque, e o custo das receitas depende do custo do insumo. `use-update-insumo.ts` e `use-delete-insumo.ts` têm a mesma forma, com `updateInsumo` e `deleteInsumo`.

```ts
// src/features/insumos/hooks/use-create-insumo.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueKeys } from '@/features/estoque/api/estoque.queries';
import { receitasKeys } from '@/features/receitas/api/receitas.queries';
import { createInsumo } from '../api/insumos.api';
import { insumosKeys } from '../api/insumos.queries';

export function useCreateInsumo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInsumo,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: insumosKeys.all }),
        queryClient.invalidateQueries({ queryKey: estoqueKeys.all }),
        queryClient.invalidateQueries({ queryKey: receitasKeys.all }),
      ]),
  });
}
```

Enquanto `estoque` e `receitas` não existirem (FE-13 e FE-11 vêm depois da FE-09), invalide as raízes pelo literal (`{ queryKey: ['estoque'] }`), com um comentário citando a issue, e troque pelo import quando ela for entregue.

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

Campos numéricos guardam o texto digitado e são convertidos pelo schema com `numeroBR()` (FE-06), que aceita vírgula ou ponto ([business-rules.md](business-rules.md#leitura-de-números-digitados)). O formulário usa o tipo de entrada (`z.input`) e recebe o de saída (`z.output`) no envio.

```ts
// src/features/insumos/schemas/insumo-form.schema.ts
import { z } from 'zod';
import type {
  CreateInsumoBody,
  Insumo,
  UpdateInsumoBody,
} from '@/shared/api/contracts/catalog';
import { unidadeMedidaSchema } from '@/shared/api/contracts/enums';
import {
  formatNumeroEditavel,
  numeroBR,
  numeroBROpcional,
} from '@/shared/format/numero-br';

// Os limites repetem os do mobile e do backend para dar resposta imediata; quem decide é a API.
export const insumoFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Informe o nome')
    .max(80, 'Use até 80 caracteres'),
  quantidadeBaseCusto: numeroBR(
    z
      .number({ error: 'Informe uma quantidade maior que zero' })
      .positive('Informe uma quantidade maior que zero'),
  ),
  unidade: unidadeMedidaSchema,
  valorPago: numeroBR(
    z
      .number({ error: 'Informe um valor maior que zero' })
      .positive('Informe um valor maior que zero'),
  ),
  // Só na criação; vazio não é enviado.
  quantidadeDisponivelInicial: numeroBROpcional(
    z
      .number({ error: 'Informe uma quantidade maior ou igual a zero' })
      .min(0, 'Informe uma quantidade maior ou igual a zero'),
  ),
});

export type InsumoFormInput = z.input<typeof insumoFormSchema>;
export type InsumoFormValues = z.output<typeof insumoFormSchema>;

export const insumoFormVazio: InsumoFormInput = {
  nome: '',
  quantidadeBaseCusto: '',
  unidade: 'KG',
  valorPago: '',
  quantidadeDisponivelInicial: '',
};

export function toInsumoFormInput(insumo: Insumo): InsumoFormInput {
  return {
    nome: insumo.nome,
    quantidadeBaseCusto: formatNumeroEditavel(insumo.quantidadeBaseCusto),
    unidade: insumo.unidade,
    valorPago: formatNumeroEditavel(insumo.valorPago),
    quantidadeDisponivelInicial: '',
  };
}

export function toCreateInsumoBody(values: InsumoFormValues): CreateInsumoBody {
  const { quantidadeDisponivelInicial, ...resto } = values;
  return quantidadeDisponivelInicial === undefined
    ? resto
    : { ...resto, quantidadeDisponivelInicial };
}

/** O PATCH não aceita `quantidadeDisponivelInicial`: o backend rejeita campos extras. */
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
  novo: z.literal('1').optional().catch(undefined),
});

export type InsumosSearch = z.infer<typeof insumosSearchSchema>;
```

### `components/insumo-form-dialog.tsx`

```tsx
// src/features/insumos/components/insumo-form-dialog.tsx
'use client';

import { useWatch } from 'react-hook-form';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import { formatCustoUnitario } from '@/shared/format/moeda';
import { parseNumeroBR } from '@/shared/format/numero-br';
import {
  FormDecimalInput,
  FormDialog,
  FormInput,
  FormMoneyInput,
  FormUnidadeSelect,
} from '@/shared/ui/form';
import { useToast } from '@/shared/ui/toast';
import { useCreateInsumo } from '../hooks/use-create-insumo';
import { useUpdateInsumo } from '../hooks/use-update-insumo';
import { calcularCustoUnitario } from '../insumos.calculos';
import {
  insumoFormSchema,
  insumoFormVazio,
  toCreateInsumoBody,
  toInsumoFormInput,
  toUpdateInsumoBody,
} from '../schemas/insumo-form.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sem insumo, é criação. */
  insumo?: Insumo;
};

export function InsumoFormDialog({ open, onOpenChange, insumo }: Props) {
  const toast = useToast();
  const create = useCreateInsumo();
  const update = useUpdateInsumo();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={insumo ? 'Editar insumo' : 'Novo insumo'}
      schema={insumoFormSchema}
      defaultValues={insumo ? toInsumoFormInput(insumo) : insumoFormVazio}
      submitLabel={insumo ? 'Atualizar' : 'Salvar'}
      // Rejeitar com o ApiError mantém o diálogo aberto e mostra o erro nele.
      onSubmit={async (values) => {
        if (insumo) {
          await update.mutateAsync({
            id: insumo.id,
            body: toUpdateInsumoBody(values),
          });
          toast.success('Insumo atualizado com sucesso.');
        } else {
          await create.mutateAsync(toCreateInsumoBody(values));
          toast.success('Insumo criado com sucesso.');
        }
        onOpenChange(false);
      }}
    >
      <FormInput name="nome" label="Nome" maxLength={80} required />
      <FormDecimalInput
        name="quantidadeBaseCusto"
        label="Quantidade"
        required
      />
      <FormUnidadeSelect name="unidade" label="Unidade" />
      <FormMoneyInput name="valorPago" label="Valor pago" required />
      {insumo ? null : (
        <FormDecimalInput
          name="quantidadeDisponivelInicial"
          label="Quantidade disponível inicial"
          hint="Saldo inicial do estoque. Deixe vazio para começar em zero."
        />
      )}
      <PreviaCustoUnitario />
    </FormDialog>
  );
}

function PreviaCustoUnitario() {
  const [quantidade, valorPago, unidade] = useWatch({
    name: ['quantidadeBaseCusto', 'valorPago', 'unidade'],
  });
  const custo = calcularCustoUnitario(
    parseNumeroBR(valorPago) ?? 0,
    parseNumeroBR(quantidade) ?? 0,
  );

  return (
    <p className="text-small text-ink-muted" aria-live="polite">
      Custo unitário:{' '}
      {formatCustoUnitario(custo, UNIDADE_MEDIDA_ROTULOS[unidade])}
    </p>
  );
}
```

### `components/insumos-lista.tsx`

```tsx
// src/features/insumos/components/insumos-lista.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import { formatCustoUnitario, formatMoeda } from '@/shared/format/moeda';
import { formatQuantidade } from '@/shared/format/numero';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { IconEditar, IconExcluir } from '@/shared/ui/icons/acoes';
import { ListPage } from '@/shared/ui/list-page';
import { useToast } from '@/shared/ui/toast';
import { insumosListOptions } from '../api/insumos.queries';
import { useDeleteInsumo } from '../hooks/use-delete-insumo';
import { InsumoFormDialog } from './insumo-form-dialog';

export function InsumosLista({ abrirNovo = false }: { abrirNovo?: boolean }) {
  const query = useQuery(insumosListOptions());
  const toast = useToast();
  const excluir = useDeleteInsumo();
  const [formulario, setFormulario] = useState<{
    aberto: boolean;
    insumo?: Insumo;
  }>({
    aberto: abrirNovo,
  });
  const [paraExcluir, setParaExcluir] = useState<Insumo | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function alternarFormulario(aberto: boolean) {
    setFormulario((atual) => ({ ...atual, aberto }));
    // `?novo=1` (ação rápida do painel) abre a criação uma vez; ao fechar, sai da URL.
    if (!aberto && searchParams.has('novo')) {
      const params = new URLSearchParams(searchParams);
      params.delete('novo');
      router.replace(params.size ? `${pathname}?${params}` : pathname, {
        scroll: false,
      });
    }
  }

  return (
    <>
      <ListPage
        title="Insumos"
        subtitle="Gerencie quantidade, valor pago e custo unitário"
        actions={
          <Button
            variant="primario"
            onClick={() => setFormulario({ aberto: true })}
          >
            Novo insumo
          </Button>
        }
        label="Insumos"
        query={query}
        searchField="nome"
        searchPlaceholder="Buscar insumo"
        emptyTitle="Nenhum insumo encontrado."
        errorTitle="Não foi possível carregar os insumos."
        getRowKey={(insumo) => insumo.id}
        columns={[
          { id: 'nome', header: 'Nome', cell: (insumo) => insumo.nome },
          {
            id: 'quantidade',
            header: 'Quantidade',
            align: 'right',
            cell: (insumo) =>
              formatQuantidade(
                insumo.quantidadeBaseCusto,
                UNIDADE_MEDIDA_ROTULOS[insumo.unidade],
              ),
          },
          {
            id: 'valorPago',
            header: 'Valor pago',
            align: 'right',
            cell: (insumo) => formatMoeda(insumo.valorPago),
          },
          {
            id: 'custoUnitario',
            header: 'Custo unitário',
            align: 'right',
            cell: (insumo) =>
              formatCustoUnitario(
                insumo.custoUnitario,
                UNIDADE_MEDIDA_ROTULOS[insumo.unidade],
              ),
          },
          {
            id: 'acoes',
            header: 'Ações',
            acoes: true,
            cell: (insumo) => (
              <>
                <Button
                  variant="fantasma"
                  size="icone"
                  aria-label={`Editar ${insumo.nome}`}
                  onClick={() => setFormulario({ aberto: true, insumo })}
                >
                  <IconEditar />
                </Button>
                <Button
                  variant="fantasma"
                  size="icone"
                  aria-label={`Excluir ${insumo.nome}`}
                  onClick={() => setParaExcluir(insumo)}
                >
                  <IconExcluir />
                </Button>
              </>
            ),
          },
        ]}
      />

      <InsumoFormDialog
        // A key recria o formulário com os valores do insumo escolhido.
        key={formulario.insumo?.id ?? 'novo'}
        open={formulario.aberto}
        onOpenChange={alternarFormulario}
        insumo={formulario.insumo}
      />

      <ConfirmDialog
        open={paraExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setParaExcluir(null);
        }}
        title="Excluir insumo"
        description={`Deseja excluir "${paraExcluir?.nome}"?`}
        confirmLabel="Excluir"
        // Rejeitar mantém o diálogo aberto, com a mensagem do backend.
        onConfirm={async () => {
          if (!paraExcluir) return;
          await excluir.mutateAsync(paraExcluir.id);
          toast.success('Insumo excluído com sucesso.');
          setParaExcluir(null);
        }}
      />
    </>
  );
}
```

`ListPage` cuida de: `PageHeader`, busca com debounce gravando `q` na URL, filtro sem acentos pelo `searchField`, contagem de resultados, cartões no celular e tabela no desktop, e os estados de carregamento, vazio, vazio por busca e erro com "Tentar novamente".

### `src/app/(app)/insumos/page.tsx`

A página é um Server Component: lê a URL com o schema e compõe a funcionalidade. O layout de `(app)` já garante a sessão.

```tsx
// src/app/(app)/insumos/page.tsx
import { InsumosLista } from '@/features/insumos/components/insumos-lista';
import { insumosSearchSchema } from '@/features/insumos/schemas/insumos-search.schema';

export const metadata = { title: 'Insumos' };

export default async function InsumosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { novo } = insumosSearchSchema.parse(await searchParams);

  return <InsumosLista abrirNovo={novo === '1'} />;
}
```

### Testes

Exemplos em [testing.md](testing.md#exemplos): schema do formulário, cálculo do custo unitário, `listInsumos` com o contrato, lista com MSW (carregando, vazio, erro, busca sem acento) e formulário (criar e editar), e o e2e do fluxo.
