# Testes

> **Status:** Vitest, Testing Library, MSW, Playwright e `@axe-core/playwright` estão instalados e configurados desde a FE-01 (`vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`), com testes de `src/shared/config`, de `/api/health` e da página inicial. Os utilitários de `src/test/` (servidor do MSW, `api.ts` com os handlers tipados, `renderWithQuery`, factories e fixtures) existem desde a **FE-05**; o `axe` nos componentes (`src/test/a11y.ts`) e o e2e de `/design-system` existem desde a **FE-04**; `src/test/next-navigation.ts` e o e2e de `/design-system/listagem` (`e2e/listagem-formulario.spec.ts`), desde a **FE-06**; o CI e a base da API falsa dos e2e são da **FE-03**; o login e a sessão nos e2e (`e2e/auth.spec.ts`, `e2e/support/sessao.ts`, as rotas de login da API falsa) e `src/test/bff.ts`, da **FE-07**; o e2e do layout e da navegação (`e2e/navegacao.spec.ts`), da **FE-08**; o spec de fumaça do fluxo principal (`e2e/fluxo-principal.spec.ts`) e as rotas da API falsa que ele usa, da **FE-23**. Itens marcados como "previsto" ainda não existem.

## Política atual: produto inicial (desde 2026-11-19)

O LucroAI ainda está validando o produto, então os testes cobrem **o que é caro errar** e nada além disso. Esta seção prevalece sobre o resto deste documento, que descreve a infraestrutura disponível.

| Obrigatório em toda issue                                                                                                       | Opcional (só quando a issue pede)                                                                                           | Não fazer por enquanto                                       |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Teste unitário de cada fórmula de [business-rules.md](business-rules.md) usada (`*.calculos.ts`) e de cada schema de formulário | Teste de componente com MSW em telas de interação complexa (formulário de receita, carrinho de venda, confirmação de venda) | e2e novo por tela (o único e2e novo é o de fumaça da FE-23)  |
| Contrato Zod do recurso com teste e fixture                                                                                     |                                                                                                                             | `axe` em componente ou rota nova                             |
| `lint`, `format:check`, `typecheck`, `test` e `build` passando                                                                  |                                                                                                                             | Meta de cobertura (não há mais limite no `vitest.config.ts`) |
| Teste manual rápido do fluxo principal contra o backend real                                                                    |                                                                                                                             | Capturas de tela commitadas em `docs/capturas/`              |

Os e2e que já existem (sessão, layout e design system) continuam rodando no CI como testes de fumaça. Se uma mudança quebrar um deles, corrija o teste ou a tela; não acrescente specs novos.

Ferramentas: **Vitest** com **Testing Library** em testes unitários e de componente, **MSW** para simular a API e **Playwright** nos e2e.

| Comando                    | O que roda                                           | Config                 |
| -------------------------- | ---------------------------------------------------- | ---------------------- |
| `npm test`                 | unitários e de componente (`src/**/*.test.{ts,tsx}`) | `vitest.config.ts`     |
| `npm run test:cov`         | os mesmos, com cobertura (v8)                        | `vitest.config.ts`     |
| `npx vitest run <arquivo>` | um arquivo                                           | —                      |
| `npm run test:e2e`         | e2e (`e2e/**/*.spec.ts`)                             | `playwright.config.ts` |

Os testes rodam no fuso `America/Sao_Paulo` (`test.env.TZ` no `vitest.config.ts`), para os testes de data darem o mesmo resultado em qualquer máquina e no CI.

Route Handlers e o proxy BFF são testados no ambiente `node` com `makeNextRequest()` (com cookie de sessão e `Origin`) e `stubAmbienteDoBff()` (`API_URL` e `NEXT_PUBLIC_APP_URL`), de `src/test/bff.ts`; o JWT de teste vem de `makeJwt()` (`src/test/factories/auth.factory.ts`). Componentes que navegam com `navigateTo` mockam `@/shared/auth/navigation`.

O Vitest roda **sem** `globals`: importe `describe`, `it`, `expect` e `vi` de `vitest` em cada arquivo. O ambiente padrão é `jsdom`; para Route Handlers e código de servidor, comece o arquivo com `// @vitest-environment node`. O jsdom não implementa as APIs de layout que o Radix chama; os substitutos ficam em `vitest.setup.ts`.

Antes do primeiro e2e, instale o navegador: `npx playwright install chromium`.

O Playwright sobe sozinho a API falsa e o Next. Variáveis que mudam isso:

| Variável                 | Efeito                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `E2E_USAR_BUILD=true`    | serve o build de produção (`e2e/support/servir-build.mjs`) em vez do `next dev`; rode `npm run build` antes. O CI usa                                                           |
| `E2E_API_REAL=true`      | não sobe a API falsa e aponta `API_URL` para o monolito local (`localhost:3100`), com o seed                                                                                    |
| `E2E_BASE_URL`           | URL do front nos e2e (padrão `http://localhost:3000`), para rodar com um `npm run dev` aberto na 3000; com `E2E_USAR_BUILD`, faça o build com `NEXT_PUBLIC_APP_URL` igual a ela |
| `E2E_REUSE_SERVERS=true` | reaproveita servidores já abertos nas portas 3000 e 3999 (fora do CI). Sem ela, uma porta ocupada faz o Playwright parar com erro                                               |

## O que testar em cada nível

### Unitário (`*.test.ts`, ao lado do arquivo testado)

Sem navegador real e sem rede. Rápido e determinístico.

| Alvo                                                | O que cobrir                                                                                                                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cálculos (`<modulo>.calculos.ts`, `shared/domain/`) | **cada fórmula e cada ramo** de [business-rules.md](business-rules.md): divisão por zero, listas vazias, limites, arredondamento, virada de mês e de ano; com pelo menos um caso com os números do seed |
| Schemas Zod de formulário                           | entrada válida, cada regra violada com a mensagem em português, e a função `to...Body` (nomes do contrato, margem em fração, campos vazios omitidos)                                                    |
| Schemas de search params                            | valor válido, ausente e inválido (o `.catch()` não derruba a tela)                                                                                                                                      |
| Contratos (`shared/api/contracts/`)                 | aceita a resposta real do seed (fixture) e rejeita uma inválida                                                                                                                                         |
| Funções de `api/`                                   | com MSW: caminho e método corretos, corpo enviado, resposta validada, resposta fora do contrato vira erro                                                                                               |
| Hooks de mutação                                    | as queries invalidadas, inclusive as de outras funcionalidades                                                                                                                                          |
| Formatadores e `parseNumeroBR`                      | todos os ramos: vírgula, ponto, milhar, vazio, negativo, letras; datas sem deslocar o fuso                                                                                                              |
| `apiFetch`, `unwrap`, `ApiError`                    | JSON puro, corpo vazio; `code` e `message`; 400, 401, 404, 409, 422, 500, rede e timeout                                                                                                                |
| Route Handlers                                      | status, corpo e falhas de dependência (ex.: `/api/health` com a API fora do ar)                                                                                                                         |

### Componente (`*.test.tsx`, ao lado do componente)

Renderiza com Testing Library e interage como o usuário: busque por papel e nome acessível (`getByRole`), não por classe nem por detalhe de implementação. Simule a API com MSW; não faça mock dos hooks, das funções de `api/` nem do `apiFetch`.

Para cada componente com dados, cubra o que se aplicar:

1. Carregando, vazio, erro (com "Tentar novamente") e sucesso.
2. Busca e filtros na URL, sem diferenciar acentos ("acucar" encontra "Açúcar").
3. Validação do formulário, com a mensagem no campo certo.
4. Envio: o corpo que chegou à API (nomes do contrato) e o Toast de sucesso.
5. Erro da API: mensagem do backend no formulário ou no diálogo.
6. Prévias de cálculo ao vivo (custo unitário, custos da receita, rateio).

Server Components `async` não são renderizados pelo Testing Library: cubra-os no e2e e extraia a lógica para funções testáveis.

### Acessibilidade

- **Componente:** `expectNoA11yViolations()` (`src/test/a11y.ts`) roda o `axe` na árvore renderizada, com o componente aberto quando for o caso (Dialog, Drawer, Combobox, Toast). O jsdom não calcula cores, então o contraste fica de fora. O `oxlint` aceita `expectNoA11yViolations` como asserção (`vitest/expect-expect`).
- **Contraste dos tokens:** `src/shared/ui/tokens.test.ts` lê `globals.css` e calcula as combinações de [ui.md](ui.md#contraste), inclusive o fundo translúcido dos Badges. Token novo entra nessa lista.
- **Cores fixas:** `src/shared/ui/sem-cores-fixas.test.ts` falha se houver hex, `rgb()` ou paleta pronta do Tailwind fora de `globals.css`.
- **Navegador real:** `e2e/design-system.spec.ts` roda o `@axe-core/playwright` na página `/design-system`, **com contraste**, e com o Dialog e o Drawer abertos; `e2e/listagem-formulario.spec.ts` faz o mesmo em `/design-system/listagem`, com o `FormDialog` aberto e com erros. Como a página só existe em desenvolvimento (no build, 404, como na Urbizzi), esses testes rodam com `npm run test:e2e` local (`next dev`); com `E2E_USAR_BUILD=true` (o CI) eles são pulados e só se confere o 404.
- **Layout:** `e2e/navegacao.spec.ts` roda o `axe` com contraste no layout em 1280px e em 360px (com a gaveta "Conta" aberta) e no 404 (FE-08); também roda no build.

### E2E (`e2e/<funcionalidade>.spec.ts`)

Abre o navegador e percorre o sistema como o usuário. **Pela [política atual](#política-atual-produto-inicial-desde-2026-11-19), não se escrevem specs novos por tela**: o único novo é o de fumaça da FE-23, `e2e/fluxo-principal.spec.ts` (em 1280px: login → cadastrar insumo → criar receita com ele → registrar produção → registrar e concluir a venda → ver o produto em "Produtos mais rentáveis" na Home). A lista abaixo descreve o que os specs existentes cobrem:

1. Caminho principal de cada funcionalidade (criar, editar, buscar, excluir).
2. Sessão: login, senha errada, logout, rota protegida, sessão expirada (401) preservando o destino.
3. Fluxos entre telas: produção baixa o estoque; venda concluída aparece no histórico e no painel; concluir sem produção mostra "Estoque insuficiente".
4. Estado na URL que sobrevive a recarregar (busca, filtro "Baixo", período de vendas).
5. Celular (360px e 390px) e desktop (1280px), sem rolagem horizontal. Os dois menus (lateral e barra inferior) ficam no DOM e só um aparece por vez: para escolher um deles, use `getByRole('navigation', { name: 'Menu principal', includeHidden: true })` com `.first()` (lateral) ou `.last()` (barra), como em `e2e/navegacao.spec.ts`.

O CI não sobe o monolito. Os e2e rodam contra uma **API falsa**, um servidor Node em `e2e/support/fake-api.mjs` (porta 3999) que o Playwright sobe junto com o Next; o `playwright.config.ts` aponta `API_URL` para ela. A API falsa implementa o contrato de [api-integration.md](api-integration.md#rotas-usadas-pela-web), com JSON puro, erros `{ statusCode, code, message }`, um JWT de teste e os dados do seed. Localmente, os mesmos testes podem rodar contra o backend real com o seed, com `E2E_API_REAL=true`.

Hoje a API falsa responde `GET /health` (para o Playwright saber que ela subiu), `GET /docs-json` (sondado pelo `/api/health`), `POST /auth/login` (FE-07: o usuário do seed recebe um JWT de 4 h com assinatura falsa; outra senha, `401 "Credenciais inválidas"`) e, desde a FE-23, as rotas do spec de fumaça: `GET`/`POST /insumos`, `GET /insumos/:id`, `GET /gastos-indiretos` (sempre vazio), `GET`/`POST /receitas`, `GET /receitas/:id`, `GET /estoque/insumos/:id` (e `/movimentacoes`, vazio), `GET`/`POST /producoes`, `GET /producoes/:id`, `GET`/`POST /vendas` (com `status`, `dataInicio` e `dataFim`), `GET /vendas/:id` e `PATCH /vendas/:id/status`. Todas exigem um Bearer emitido por ela e dentro do `exp` (senão, `401`), guardam o estado **em memória** (começa vazio a cada subida; com `E2E_REUSE_SERVERS=true` ele sobrevive entre execuções, por isso o spec usa nomes com sufixo) e repetem os cálculos do backend sem gastos indiretos (custo da receita, preço sugerido, custo da produção, baixa dos insumos, snapshot do custo na venda). As rotas de simulação e custo da receita (`/receitas/:id/custo`, `/simular`, `/preco-venda`), a entrada de estoque e as mutações de gastos não existem; o resto devolve `404` no formato do NestJS. **Sessão nos e2e.** Toda tela, exceto `/login` e `/design-system`, exige sessão desde a FE-07: comece o teste com `entrar(page)` (`e2e/support/sessao.ts`), que usa o usuário do seed e funciona com a API falsa e com `E2E_API_REAL=true`. Ele espera o botão "Sair" do menu lateral (até 30 s, porque o `next dev` compila o layout na primeira visita), então entre com a largura de desktop e só depois mude para a do celular (`page.setViewportSize`). O layout não chama a API (a sessão vem do cookie), por isso a FE-08 não acrescentou rotas à API falsa. `tokenFalso(exp)` e `definirCookie()` simulam um cookie vencido ou recusado pelo backend.

As issues de tela **não** acrescentam rotas à API falsa; a **FE-23** acrescentou só as que o spec de fumaça usa, com JSON puro e os contratos de `src/shared/api/contracts/`. O MSW fica nos testes de componente: no e2e, quem chama a API é o servidor do Next, num processo à parte, e um servidor HTTP de verdade é o jeito mais simples de atendê-lo.

## Uso do MSW

O servidor do MSW é um só, em `src/test/server.ts`, e a preparação fica em `src/test/msw-setup.ts`, registrado em `setupFiles` no `vitest.config.ts`. Requisição sem handler **falha o teste**, para não deixar uma chamada passar despercebida:

```ts
// src/test/server.ts
import { setupServer } from 'msw/node';

export const server = setupServer();
```

```ts
// src/test/msw-setup.ts
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

No MSW 3, a opção se chama `onUnhandledFrame` (no MSW 2 era `onUnhandledRequest`).

Cada teste declara as respostas de que precisa com `server.use(...)`. Os ajudantes de `src/test/api.ts` montam a URL do proxy e o corpo, para os handlers seguirem o contrato. Prefira `mockApi`, tipado pela rota: o `data` da resposta tem o tipo do contrato (`RotasDaApi`), e o status padrão é o da API (201 no `POST`, 204 no `DELETE` com `undefined`):

```ts
server.use(
  mockApi('GET /insumos', [makeInsumo()]),
  mockApi('POST /insumos', async ({ request }) => {
    corpos.push(await request.json());
    return makeInsumo();
  }),
  mockApiErro(
    'DELETE /insumos/:id',
    409,
    'Insumo em uso em receitas',
    'INSUMO_EM_USO',
  ),
  mockApiSemConexao('GET /vendas'),
);
```

Para casos fora do contrato (corpo inválido, HTML, atraso), use o `http` do MSW com `apiUrl` e `apiErrorBody`:

```ts
// src/test/api.ts (trecho)
/** URL do proxy BFF, sem depender da origem: `*\/api/backend/insumos`. */
export function apiUrl(caminho: string) {
  return `*/api/backend${caminho}`;
}

/** Erro no formato da API (`AllExceptionsFilter`). */
export function apiErrorBody(
  statusCode: number,
  message: string | string[],
  code?: string,
) {
  return {
    statusCode,
    ...(code ? { code } : {}),
    message,
    path: '/',
    timestamp: '...',
  };
}
```

Use as factories tipadas pelos contratos (abaixo): se o contrato mudar, o `npm run typecheck` aponta os testes desatualizados.

Componentes que usam a URL (`ListPage`, filtros) precisam de `next/navigation`, que só existe dentro do Next. `src/test/next-navigation.ts` (existe desde a FE-06) o substitui usando a URL do jsdom: `router.replace` e `router.push` trocam a URL e avisam os componentes, e `setTestUrl()` define a URL inicial (chame-o num `beforeEach`, porque a URL do jsdom passa de um teste para o outro):

```ts
vi.mock('next/navigation', () => import('@/test/next-navigation'));
```

`QueryClient` novo a cada teste, sem retry, para o cache não vazar entre testes:

```tsx
// src/test/render.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

export function renderWithQuery(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  };
}
```

O `user-event` trava com os timers falsos do Vitest: nesses testes (debounce da busca), use `fireEvent`.

## Dados de teste

Os dados de teste são baseados no seed **"Padaria Pão Feliz"** do backend (`prisma/seed.ts` do monolito), que é fictício. Assim, os números dos testes podem ser conferidos no app Flutter e no backend rodando.

- Login: `joao@padariapaofeliz.com.br`, senha `123456` (empresa Padaria Pão Feliz Ltda, CNPJ fictício `45.678.901/0001-23`).
- O seed do monolito é idempotente: recria os dados da empresa do seed, achada pelo CNPJ (a lacuna 17 foi resolvida).
- Nunca use dados reais de clientes nem de empresas, nem para um teste "rápido".

| Recurso          | Do seed (valores para factories e fixtures)                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Insumos          | Farinha de Trigo (5 kg, R$ 15,00, custo 3/kg); Açúcar Cristal (2 kg, R$ 8,80); Manteiga sem Sal (500 g, R$ 12,00, custo 0,024/g); Ovos (12 un, R$ 9,00); Leite Integral (1 L, R$ 5,00); Fermento Biológico Seco (500 g, R$ 8,50); Cacau em Pó 100% (200 g, R$ 9,00); Sal (1 kg, R$ 2,50); Creme de Leite (200 ml, R$ 5,50); Chocolate ao Leite Gotas (1 kg, R$ 35,00); Coco Ralado (100 g, R$ 4,50); Granulado de Chocolate (100 g, R$ 3,50) |
| Gastos indiretos | Energia Elétrica R$ 450,00 PROPORCIONAL; Aluguel do Espaço R$ 1.800,00 FIXO; Gás de Cozinha (P45) R$ 185,00 PROPORCIONAL; Material de Embalagem R$ 120,00 POR_UNIDADE                                                                                                                                                                                                                                                                        |
| Receitas         | Pão Francês (50 un, margem 60%, custo de produção 3,31, unitário 0,07, preço 0,11); Bolo de Chocolate (12 un, 50%, 9,70, 0,81, 1,22); Brigadeiro Gourmet (40 un, 60%, 15,48, 0,39, 0,62); Quindim (12 un, 55%, 10,80, 0,90, 1,40)                                                                                                                                                                                                            |
| Vendas           | três `CONCLUIDA`, uma `PENDENTE` e uma `CANCELADA`, com `margemRealizada` de 0,28 a 0,86                                                                                                                                                                                                                                                                                                                                                     |

Fixtures de respostas reais ficam em `src/test/fixtures/<grupo>/<recurso>.json` (JSON puro, sem envelope) e são usadas nos testes de contrato (`src/shared/api/contracts/contracts.test.ts`); as respostas de erro da API (`{ statusCode, code, message, path, timestamp }`) ficam em `src/test/fixtures/erros/`. Desde a FE-39, elas são capturadas do monolito em execução com o seed (`localhost:3100`). O `access_token` de `auth/login.json` tem a assinatura trocada e não vale em servidor nenhum. Ao recapturar, faça o mesmo. Factories ficam em `src/test/factories/<entidade>.factory.ts`, com valores do seed e sobrescritas, tipadas pelo contrato: `makeInsumo` e `makeInsumosDoSeed`, `makeGastoIndireto` e `makeGastosDoSeed`, `makeReceita`, `makeReceitasDoSeed`, `makeReceitaCusto`, `makeSimulacaoCenario`, `makePrecoVenda`, `makeEstoque`, `makeMovimentacaoEstoque`, `makeEstoqueProduto`, `makeProducao`, `makeVenda`, `makeItemVenda`, `makeJwtPayload` e `makeLoginResponse`. O teste de contrato confere que toda factory segue o schema:

```ts
// src/test/factories/insumo.factory.ts
import type { Insumo } from '@/shared/api/contracts/catalog';

export function makeInsumo(overrides: Partial<Insumo> = {}): Insumo {
  return {
    id: 1,
    empresaId: 1,
    nome: 'Farinha de Trigo',
    quantidadeBaseCusto: 5,
    quantidadeDisponivel: 10,
    unidade: 'KG',
    valorPago: 15,
    custoUnitario: 3,
    precoUnitario: 3,
    dataCriacao: '2026-06-01T10:00:00.000Z',
    ...overrides,
  };
}
```

## Exemplos

Os exemplos usam a funcionalidade `insumos` do [exemplo completo](architecture.md#exemplo-completo-funcionalidade-insumos) (prevista na FE-09).

### Cálculo

```ts
// src/features/insumos/insumos.calculos.test.ts
import { describe, expect, it } from 'vitest';
import { calcularCustoUnitario } from './insumos.calculos';

describe('calcularCustoUnitario', () => {
  it('divide o valor pago pela quantidade', () => {
    expect(calcularCustoUnitario(12, 500)).toBeCloseTo(0.024);
  });

  it('devolve zero com quantidade zero ou negativa', () => {
    expect(calcularCustoUnitario(15, 0)).toBe(0);
    expect(calcularCustoUnitario(15, -1)).toBe(0);
  });
});
```

### Schema de formulário

```ts
// src/features/insumos/schemas/insumo-form.schema.test.ts
import { expect, it } from 'vitest';
import {
  insumoFormSchema,
  toCreateInsumoBody,
  toUpdateInsumoBody,
} from './insumo-form.schema';

const valido = {
  nome: 'Manteiga sem Sal',
  quantidadeBaseCusto: '500',
  unidade: 'G',
  valorPago: '12,00',
  quantidadeDisponivelInicial: '',
};

it('converte os números digitados no padrão brasileiro', () => {
  const values = insumoFormSchema.parse({ ...valido, valorPago: '1.234,56' });

  expect(values.valorPago).toBe(1234.56);
});

it('pede uma quantidade maior que zero', () => {
  const result = insumoFormSchema.safeParse({
    ...valido,
    quantidadeBaseCusto: '0',
  });

  expect(result.error?.issues[0]?.message).toBe(
    'Informe uma quantidade maior que zero',
  );
});

it('não envia a quantidade inicial vazia nem na edição', () => {
  const values = insumoFormSchema.parse({
    ...valido,
    quantidadeDisponivelInicial: '',
  });

  expect(toCreateInsumoBody(values)).not.toHaveProperty(
    'quantidadeDisponivelInicial',
  );
  expect(
    toUpdateInsumoBody({ ...values, quantidadeDisponivelInicial: 3 }),
  ).not.toHaveProperty('quantidadeDisponivelInicial');
});
```

### Função da API e contrato

```ts
// src/features/insumos/api/insumos.api.test.ts
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { apiUrl } from '@/test/api';
import { makeInsumo } from '@/test/factories/insumo.factory';
import { server } from '@/test/server';
import { listInsumos } from './insumos.api';

it('valida a listagem com o contrato', async () => {
  server.use(
    http.get(apiUrl('/insumos'), () => HttpResponse.json([makeInsumo()])),
  );

  await expect(listInsumos()).resolves.toEqual([makeInsumo()]);
});

it('rejeita uma resposta fora do contrato', async () => {
  server.use(
    http.get(apiUrl('/insumos'), () =>
      HttpResponse.json([{ ...makeInsumo(), custoUnitario: '3' }]),
    ),
  );

  await expect(listInsumos()).rejects.toThrow();
});
```

### Listagem com MSW

```tsx
// src/features/insumos/components/insumos-lista.test.tsx
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { apiErrorBody, apiUrl } from '@/test/api';
import { makeInsumo } from '@/test/factories/insumo.factory';
import { setTestUrl } from '@/test/next-navigation';
import { renderWithQuery } from '@/test/render';
import { server } from '@/test/server';
import { InsumosLista } from './insumos-lista';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

it('lista os insumos com o custo unitário de 4 casas', async () => {
  server.use(
    http.get(apiUrl('/insumos'), () =>
      HttpResponse.json([
        makeInsumo({
          nome: 'Manteiga sem Sal',
          unidade: 'G',
          custoUnitario: 0.024,
        }),
      ]),
    ),
  );

  renderWithQuery(<InsumosLista />);

  expect(await screen.findByText('Manteiga sem Sal')).toBeInTheDocument();
  expect(screen.getByText('R$ 0,0240/g')).toBeInTheDocument();
});

it('busca sem diferenciar acentos', async () => {
  setTestUrl('/insumos?q=acucar');
  server.use(
    http.get(apiUrl('/insumos'), () =>
      HttpResponse.json([
        makeInsumo({ id: 1, nome: 'Açúcar Cristal' }),
        makeInsumo({ id: 2, nome: 'Sal' }),
      ]),
    ),
  );

  renderWithQuery(<InsumosLista />);

  expect(await screen.findByText('Açúcar Cristal')).toBeInTheDocument();
  expect(screen.queryByText('Sal')).not.toBeInTheDocument();
});

it('mostra o erro com "Tentar novamente"', async () => {
  server.use(
    http.get(apiUrl('/insumos'), () =>
      HttpResponse.json(
        apiErrorBody(500, 'Erro interno do servidor', 'ERRO_INTERNO'),
        {
          status: 500,
        },
      ),
    ),
  );

  renderWithQuery(<InsumosLista />);

  expect(
    await screen.findByText('Não foi possível carregar os insumos.'),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Tentar novamente' }),
  ).toBeInTheDocument();
});
```

### Formulário

```tsx
// src/features/insumos/components/insumo-form-dialog.test.tsx
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { apiUrl } from '@/test/api';
import { makeInsumo } from '@/test/factories/insumo.factory';
import { renderWithQuery } from '@/test/render';
import { server } from '@/test/server';
import { ToastProvider } from '@/shared/ui/toast';
import { InsumoFormDialog } from './insumo-form-dialog';

function preencher(rotulo: string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

it('mostra a prévia do custo unitário enquanto digita', () => {
  renderWithQuery(
    <ToastProvider>
      <InsumoFormDialog open onOpenChange={vi.fn()} />
    </ToastProvider>,
  );

  preencher('Quantidade', '5');
  preencher('Valor pago', '15,00');

  expect(screen.getByText('Custo unitário: R$ 3,0000/kg')).toBeInTheDocument();
});

it('envia o corpo com os nomes do contrato', async () => {
  const corpos: unknown[] = [];
  server.use(
    http.post(apiUrl('/insumos'), async ({ request }) => {
      corpos.push(await request.json());
      return HttpResponse.json(makeInsumo(), { status: 201 });
    }),
  );
  const onOpenChange = vi.fn();
  renderWithQuery(
    <ToastProvider>
      <InsumoFormDialog open onOpenChange={onOpenChange} />
    </ToastProvider>,
  );

  preencher('Nome', 'Farinha de Trigo');
  preencher('Quantidade', '5');
  preencher('Valor pago', '15,00');
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  expect(corpos).toEqual([
    {
      nome: 'Farinha de Trigo',
      quantidadeBaseCusto: 5,
      unidade: 'KG',
      valorPago: 15,
    },
  ]);
  expect(
    await screen.findByText('Insumo criado com sucesso.'),
  ).toBeInTheDocument();
});
```

### E2E

```ts
// e2e/insumos.spec.ts
import { expect, test } from '@playwright/test';

test('cadastra, busca e exclui um insumo', async ({ page }) => {
  await page.goto('/insumos');

  await page.getByRole('button', { name: 'Novo insumo' }).click();
  await page.getByLabel('Nome').fill('Polvilho Doce');
  await page.getByLabel('Quantidade', { exact: true }).fill('1');
  await page.getByLabel('Valor pago').fill('7,90');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Insumo criado com sucesso.')).toBeVisible();

  await page.getByRole('searchbox', { name: 'Buscar insumo' }).fill('polvilho');
  await expect(page).toHaveURL(/q=polvilho/);

  await page.getByRole('button', { name: 'Excluir Polvilho Doce' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Excluir' })
    .click();
  await expect(page.getByText('Insumo excluído com sucesso.')).toBeVisible();
});
```

## Cobertura mínima

- **Sem meta numérica** desde 2026-11-19 ([política atual](#política-atual-produto-inicial-desde-2026-11-19)). `npm run test:cov` continua disponível para consulta, mas não falha por cobertura, e o CI roda `npm test`.
- **Cada fórmula e cada ramo** de [business-rules.md](business-rules.md) usados no cliente precisam de um teste unitário.
- Todo bug corrigido ganha um teste que falhava antes da correção.

## Integração contínua

O workflow `.github/workflows/ci.yml` tem dois jobs, que rodam em paralelo:

| Job                             | Limite | Etapas                                                                                                                                                                                                                                                  |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lint, tipos, testes e build** | 10 min | `npm ci` (com cache do npm) → `lint` → `format:check` → `typecheck` → `test` → `build`                                                                                                                                                                  |
| **Testes e2e**                  | 15 min | `npm ci` → Chromium do Playwright (cache por versão do Playwright) → `build` → `test:e2e` com `E2E_USAR_BUILD=true`, contra o build de produção e a API falsa → relatório e traces publicados como artefato `playwright-report` quando falhar (14 dias) |

Gatilhos:

```yaml
on:
  pull_request: # sem filtro de branch de base
  push:
    branches: [main]
```

- **O gatilho `pull_request` não filtra a branch de base.** Os PRs deste repositório são **empilhados**: o PR de uma issue aponta para a branch da issue que a bloqueia (ex.: o da FE-02 aponta para `chore/fe-01-inicializacao-nextjs`), não para a `main`. Com `pull_request: { branches: [main] }`, esses PRs ficariam sem CI. Não acrescente esse filtro.
- O `push` fica restrito à `main`, para não rodar duas vezes em cada push de branch com PR aberto.
- Um novo push no mesmo PR cancela a execução anterior (`concurrency`).
- O build e os testes usam variáveis de ambiente fictícias, declaradas no `env` do workflow (nunca segredos reais): `NEXT_PUBLIC_APP_URL=http://localhost:3000` e `API_URL` apontando para a API falsa. Variável nova no schema de `src/shared/config/` entra também ali.
- O limite do e2e cobre o build, a instalação do navegador com o cache frio e a suíte com os retries do CI. A Urbizzi estourou os 10 minutos quando a suíte cresceu ([grupo7-biopark/urbizzi-frontend#71](https://github.com/grupo7-biopark/urbizzi-frontend/issues/71)); se acontecer aqui, aumente o `timeout-minutes` do job e2e sem mexer nos testes.
- O cache do Playwright guarda só os navegadores; com ele, o job instala apenas as bibliotecas do sistema (`playwright install-deps`).

**Proteção da `main`:** em _Settings → Branches_, exija como verificações obrigatórias `Lint, tipos, testes e build` e `Testes e2e`. Se renomear um job, atualize também essas verificações.

Para reproduzir localmente o que o CI faz:

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run build && E2E_USAR_BUILD=true npm run test:e2e
```

## Boas práticas

- Nome do teste em português, descrevendo o comportamento: `it('mostra o estado vazio')`.
- Estrutura Arrange / Act / Assert, separada por linha em branco.
- Um comportamento por `it`.
- Prefira `findBy*` e `waitFor` a esperas fixas.
- Não dependa do relógio real: use `vi.useFakeTimers()` e `vi.setSystemTime()` em "últimos 7 dias", "mês atual" e "últimos 6 meses", incluindo a virada do ano.
- Compare dinheiro com `toBeCloseTo(valor, 2)`, nunca com `toBe` depois de uma soma.
- Não teste detalhes de implementação (estado interno, classes CSS, ordem de chamadas).
