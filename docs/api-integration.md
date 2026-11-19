# Integração com a API

> **Status:** o cliente, os contratos, os erros, o TanStack Query e o MSW **existem** desde a **FE-05** (`src/shared/api/` e `src/test/`). O proxy autenticado `/api/backend` e a sessão **existem** desde a **FE-07** (`src/app/api/backend/`, `src/app/api/auth/` e `src/shared/auth/`). As funções de `features/<modulo>/api/` chegam com as telas: a primeira foi `features/insumos/api/` (**FE-09**). Ao mudar algo, atualize este documento no mesmo PR. A fonte da verdade do contrato é o código do [backend](https://github.com/GrupoDoisENG/lucroai-backend) (DTOs, entidades e controllers); se uma issue divergir dele, vale o backend, e a divergência entra em [Divergências entre as issues e o backend](#divergências-entre-as-issues-e-o-backend).

## Os cinco serviços

O backend são cinco microsserviços NestJS, cada um com a sua porta, o seu banco e o seu Swagger em `/docs`. Não há API gateway: o front conhece a URL de cada um pelas variáveis de ambiente de servidor (ver o [README](../README.md#variáveis-de-ambiente)).

| Serviço (`servico`) | Porta local | Variável             | Recursos                                               |
| ------------------- | ----------- | -------------------- | ------------------------------------------------------ |
| `auth`              | 3001        | `AUTH_API_URL`       | login (e cadastro de empresa, que a web não usa)       |
| `catalog`           | 3002        | `CATALOG_API_URL`    | insumos e gastos indiretos                             |
| `recipe`            | 3003        | `RECIPE_API_URL`     | receitas, custo, simulação de cenário e preço de venda |
| `operations`        | 3004        | `OPERATIONS_API_URL` | estoque de insumos, movimentações e produções          |
| `sales`             | 3005        | `SALES_API_URL`      | vendas                                                 |

- **Sem prefixo de versão.** Todos os serviços sobem com `globalPrefix: ''` (`services/*/src/main.ts`), então as rotas são `/insumos`, não `/v1/insumos`. O `bootstrap-http-app.ts` usa `v1` como padrão, mas nenhum serviço o adota.
- **Autenticação.** Um guard global (`shared/src/infra/auth/`) exige `Authorization: Bearer <jwt>` em todas as rotas, menos as marcadas com `@Public()` e as `/internal/*`.
- **Rotas `/internal/*` não têm autenticação** (`GET /insumos/internal/:id`, `/gastos-indiretos/internal/...`, `/receitas/internal/:id`). Existem para chamadas entre serviços. A web **nunca** as chama, e o proxy as bloqueia (ver [security.md](security.md#proxy-bff)).
- **Multiempresa.** Cada serviço tira o `empresa.id` do JWT. O front nunca envia `empresaId` em URL, query ou corpo.

### Rotas usadas pela web

Corpo e resposta com os nomes exatos do contrato. A resposta vem sempre dentro do [envelope](#envelope-hateoas); a tabela mostra o conteúdo de `data`.

| Serviço      | Método e rota                              | Corpo                                                                                          | `data` da resposta      | Tela                              |
| ------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------- |
| `auth`       | `POST /auth/login`                         | `{ email, senha }`                                                                             | `{ access_token }`      | FE-07 (no servidor)               |
| `catalog`    | `GET /insumos`                             | —                                                                                              | `Insumo[]`              | FE-09, FE-12, FE-13               |
| `catalog`    | `GET /insumos/:id`                         | —                                                                                              | `Insumo`                | FE-09                             |
| `catalog`    | `POST /insumos`                            | `{ nome, quantidadeBaseCusto, unidade, valorPago, quantidadeDisponivelInicial? }`              | `Insumo`                | FE-09                             |
| `catalog`    | `PATCH /insumos/:id`                       | `{ nome?, quantidadeBaseCusto?, unidade?, valorPago? }`                                        | `Insumo`                | FE-09                             |
| `catalog`    | `DELETE /insumos/:id`                      | —                                                                                              | vazio (204)             | FE-09                             |
| `catalog`    | `GET /gastos-indiretos`                    | —                                                                                              | `GastoIndireto[]`       | FE-10, FE-15                      |
| `catalog`    | `GET /gastos-indiretos/:id`                | —                                                                                              | `GastoIndireto`         | —                                 |
| `catalog`    | `POST /gastos-indiretos`                   | `{ descricao, valor, metodo_rateio }`                                                          | `GastoIndireto`         | FE-10                             |
| `catalog`    | `PUT /gastos-indiretos/:id`                | `{ descricao?, valor?, metodo_rateio? }`                                                       | `GastoIndireto`         | FE-10                             |
| `catalog`    | `DELETE /gastos-indiretos/:id`             | —                                                                                              | vazio (204)             | FE-10                             |
| `recipe`     | `GET /receitas`                            | —                                                                                              | `Receita[]`             | FE-11, FE-15, FE-16, FE-21, FE-22 |
| `recipe`     | `GET /receitas/:id`                        | —                                                                                              | `Receita`               | FE-12, FE-20                      |
| `recipe`     | `POST /receitas`                           | `{ nome, rendimento, unidadeRendimento, margem_lucro?, insumos: [{ insumo_id, quantidade }] }` | `Receita`               | FE-12                             |
| `recipe`     | `PUT /receitas/:id`                        | os mesmos campos, todos opcionais                                                              | `Receita`               | FE-12                             |
| `recipe`     | `DELETE /receitas/:id`                     | —                                                                                              | vazio (204)             | FE-11                             |
| `recipe`     | `GET /receitas/:id/custo`                  | —                                                                                              | `ReceitaCusto`          | FE-20                             |
| `recipe`     | `POST /receitas/:id/custo/simular`         | `{ quantidadeLotes }`                                                                          | `ReceitaCusto`          | FE-20                             |
| `recipe`     | `POST /receitas/:id/simular`               | `{ novoCusto?, novoPreco?, volume? }`                                                          | `SimulacaoCenario`      | FE-20                             |
| `recipe`     | `POST /receitas/:id/preco-venda`           | `{ margem_lucro }`                                                                             | `PrecoVenda`            | FE-20                             |
| `operations` | `GET /estoque/insumos/:id`                 | —                                                                                              | `Estoque`               | FE-13, FE-14, FE-22               |
| `operations` | `POST /estoque/insumos/:id/entrada`        | `{ quantidade }`                                                                               | `Estoque`               | FE-14                             |
| `operations` | `GET /estoque/insumos/:id/movimentacoes`   | —                                                                                              | `MovimentacaoEstoque[]` | FE-14                             |
| `operations` | `GET /producoes?receitaId=`                | —                                                                                              | `Producao[]`            | FE-15, FE-17                      |
| `operations` | `GET /producoes/:id`                       | —                                                                                              | `Producao`              | FE-15                             |
| `operations` | `POST /producoes`                          | `{ receita_id, quantidade, gasto_indireto_ids? }`                                              | `Producao`              | FE-15                             |
| `sales`      | `GET /vendas?status=&dataInicio=&dataFim=` | —                                                                                              | `Venda[]`               | FE-17, FE-18, FE-21, FE-22        |
| `sales`      | `GET /vendas/:id`                          | —                                                                                              | `Venda`                 | FE-17                             |
| `sales`      | `POST /vendas`                             | `{ itens: [{ receita_id, quantidade, preco_unitario_real }] }`                                 | `Venda`                 | FE-16                             |
| `sales`      | `PATCH /vendas/:id/status`                 | `{ status }`                                                                                   | `Venda`                 | FE-17                             |

Use as rotas e os campos desta tabela, conferidos no código. Se o backend mudar, atualize a tabela e o contrato no mesmo PR.

### Formas das respostas

Conferidas nos DTOs e entidades de cada serviço. "omitido" quer dizer que, sem valor, o campo **não vem** no JSON (o repositório converte `null` em `undefined`); "`null`" quer dizer que ele vem como `null`.

| Tipo                  | Campos                                                                                                                                                                                                                                                          | Origem no backend                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Insumo`              | `id`, `empresaId`, `nome`, `quantidadeBaseCusto`, `quantidadeDisponivel`, `unidade`, `valorPago`, `custoUnitario`, `precoUnitario` (alias de `custoUnitario`), `dataCriacao`                                                                                    | `catalog-service/.../insumos/application/dto/insumo.dto.ts`                          |
| `GastoIndireto`       | `id`, `empresaId`, `descricao`, `valor`, `metodoRateio`                                                                                                                                                                                                         | `catalog-service/.../gastos-indiretos/domain/models/gasto-indireto.entity.ts`        |
| `Receita`             | `id`, `empresaId`, `nome`, `rendimento` (inteiro), `unidadeRendimento`, `custoProducao`, `custoUnitario`, `margemLucro`, `precoSugerido` (os quatro omitidos sem valor), `dataCriacao`, `itens: [{ insumoId, quantidade, custoCalculado (omitido sem valor) }]` | `recipe-service/.../receitas/domain/models/receita.entity.ts` e o repositório Prisma |
| `ReceitaCusto`        | `quantidade_lotes`, `total_unidades`, `custo_invisivel`, `custo_total_producao`, `custo_por_unidade` (**snake_case**, ao contrário do OVERVIEW)                                                                                                                 | `recipe-service/.../custos/application/dto/receita-custo.dto.ts`                     |
| `SimulacaoCenario`    | `custoUnitario`, `precoVenda`, `volume`, `lucroEstimado`, `margemProjetada` (fração), `breakEven`                                                                                                                                                               | `simulacao-cenario-resultado.dto.ts`                                                 |
| `PrecoVenda`          | `custo_total_unitario`, `preco_sugerido`, `lucro_por_unidade`                                                                                                                                                                                                   | `recipe-service/.../receitas/application/dto/preco-venda.dto.ts`                     |
| `Estoque`             | `id` (0 quando o registro ainda não existe), `insumoId`, `quantidadeDisponivel` (pode ser negativa), `quantidadeMinima`, `dataAlteracao` (`null` sem alteração)                                                                                                 | `operations-service/.../estoque/application/dto/estoque.dto.ts`                      |
| `MovimentacaoEstoque` | `id`, `insumoId`, `tipo` (`ENTRADA \| SAIDA`), `origem` (`COMPRA \| PRODUCAO`), `quantidade`, `referenciaId` (`null`), `dataMovimentacao`                                                                                                                       | `movimentacao-estoque.dto.ts`                                                        |
| `Producao`            | `id`, `receitaId`, `empresaId`, `quantidade` (lotes), `custoTotal` (`null`), `custoUnitario` (`null`), `dataProducao`, `rateios: [{ gastoIndiretoId, valorRateado }]`                                                                                           | `operations-service/.../producoes/domain/models/producao.entity.ts`                  |
| `Venda`               | `id`, `empresaId`, `total` (`null`), `status`, `dataVenda`, `itens: [{ id, vendaId, receitaId, quantidade, precoUnitarioReal, custoUnitario (`null`), margemRealizada (`null`) }]`                                                                              | `sales-service/.../vendas/domain/models/venda.entity.ts`                             |

Os nomes misturam convenções: o corpo das requisições de receitas, gastos, produções e vendas usa `snake_case` (`margem_lucro`, `metodo_rateio`, `receita_id`, `preco_unitario_real`), o de insumos usa `camelCase` (`quantidadeBaseCusto`, `valorPago`), e as respostas usam `camelCase`, menos `ReceitaCusto` e `PrecoVenda`. Use sempre o nome do contrato, sem converter (ver [conventions.md](conventions.md#idioma)).

## Contratos tipados (estratégia da FE-05)

Os DTOs do backend não têm `@ApiProperty`, então o `/docs-json` de cada serviço não descreve corpos nem respostas e o `openapi-typescript` não gera tipos úteis. Até o backend anotar os DTOs, os contratos são **schemas Zod escritos à mão, num lugar só**:

```text
src/shared/api/contracts/
├── enums.ts         # UnidadeMedida, MetodoRateio, StatusVenda, tipos de movimentação, com rótulos
├── auth.ts          # login e payload do JWT
├── catalog.ts       # insumos e gastos indiretos
├── recipe.ts        # receitas, custo, simulação e preço de venda
├── operations.ts    # estoque, movimentações e produções
└── sales.ts         # vendas
```

Regras:

1. **Escreva o schema a partir do backend**: `services/*/src/modules/*/application/dto/` e `domain/models/`, nunca a partir do `data/models` do mobile, que tem campos de fallback que não existem (`valor_pago`, `valor_total`).
2. **Um schema de resposta por recurso**, com o nome do contrato (`insumoSchema`), e o tipo inferido com `z.infer` (`type Insumo = z.infer<typeof insumoSchema>`). Corpos de requisição viram tipos (`CreateInsumoBody`), também nesses arquivos.
3. **Nenhum tipo de DTO fora de `src/shared/api/contracts/`.** Funcionalidades importam os tipos de lá.
4. **Campo omitido sem valor** é `.optional()`; campo que vem `null` é `.nullable()`. Não use os dois "por garantia": o teste com a resposta real é que confere.
5. **Datas** da API são ISO 8601 em UTC: `z.iso.datetime()`, mantidas como string. Converta só ao exibir.
6. **Validação em tempo de execução.** Toda resposta passa pelo schema em `api/` (ver [Cliente](#cliente)). Uma mudança de contrato quebra o teste da função, em vez de virar `undefined` na tela.
7. Cada schema tem um teste que aceita uma resposta real do seed (fixture em `src/test/fixtures/`) e rejeita uma inválida.
8. **Enums** ficam em `enums.ts`, cada um com o schema, o tipo e os rótulos de tela de [business-rules.md](business-rules.md#enumerações-e-rótulos): `unidadeMedidaSchema`, `UnidadeMedida` e `UNIDADE_MEDIDA_ROTULOS`; `metodoRateioSchema`, `MetodoRateio`, `METODO_RATEIO_ROTULOS` e `METODO_RATEIO_DESCRICOES`; `statusVendaSchema`, `StatusVenda` e `STATUS_VENDA_ROTULOS`; `tipoMovimentacaoSchema`, `origemMovimentacaoSchema` e seus rótulos.

```ts
// src/shared/api/contracts/catalog.ts (FE-05)
import { z } from 'zod';
import { unidadeMedidaSchema } from './enums';

/** `services/catalog-service/src/modules/insumos/application/dto/insumo.dto.ts` */
export const insumoSchema = z.object({
  id: z.number().int(),
  empresaId: z.number().int(),
  nome: z.string(),
  quantidadeBaseCusto: z.number(),
  quantidadeDisponivel: z.number(),
  unidade: unidadeMedidaSchema,
  valorPago: z.number(),
  custoUnitario: z.number(),
  precoUnitario: z.number(),
  dataCriacao: z.iso.datetime(),
});

export type Insumo = z.infer<typeof insumoSchema>;

/** `create-insumo.dto.ts`: o corpo de insumos é camelCase. */
export type CreateInsumoBody = {
  nome: string;
  quantidadeBaseCusto: number;
  unidade: Insumo['unidade'];
  valorPago: number;
  quantidadeDisponivelInicial?: number;
};

/** `update-insumo.dto.ts`: não aceita `quantidadeDisponivelInicial`. */
export type UpdateInsumoBody = Partial<
  Omit<CreateInsumoBody, 'quantidadeDisponivelInicial'>
>;
```

### Migração para o OpenAPI

`openapi-typescript`, `openapi-fetch` e `openapi-msw` já estão no `package.json`, mas **não** são usados enquanto o backend não descrever os DTOs. Quando o `/docs-json` de cada serviço trouxer corpos e respostas:

1. Crie `api:generate:<servico>` no `package.json` (`openapi-typescript http://localhost:300N/docs-json -o src/shared/api/schemas/<servico>.d.ts`) e um `api:generate` que rode os cinco.
2. Troque os tipos de `contracts/<servico>.ts` pelos gerados (`components['schemas']['InsumoDto']`), um serviço por PR, mantendo os schemas Zod de resposta enquanto o OpenAPI não for confiável.
3. Troque o `apiFetch` por um cliente `openapi-fetch` por serviço, com o `baseUrl` do proxy, e os handlers do MSW pelo `openapi-msw`.
4. Atualize este documento, a regra 5 do [AGENTS.md](../AGENTS.md#regras-obrigatórias) e o checklist do template de PR.

## Cliente

Há um único jeito de chamar o backend: `apiFetch(servico, caminho, opcoes)`, com duas variantes de mesma assinatura (FE-05).

Arquivos de `src/shared/api/`:

| Arquivo              | Exporta                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `servicos.ts`        | o tipo `Servico`, a lista `SERVICOS` e `isServico()`                                                                             |
| `client.ts`          | `apiFetch` do navegador (pelo proxy)                                                                                             |
| `client.server.ts`   | `apiFetch` do servidor (direto no serviço), com `import 'server-only'`                                                           |
| `request.ts`         | `unwrap()`, o tipo `ApiFetchOptions`, `requisitar()` (o núcleo comum às duas variantes), `validarCaminho()` e `TIMEOUT_MS`       |
| `errors.ts`          | `ApiError`, `ApiNetworkError`, `ContratoInvalidoError`, `apiErrorFromResponse()`, `getErrorMessage()`, `isEstoqueInsuficiente()` |
| `filtros.ts`         | `normalizarTexto()`, `filtrarPorTexto()`, `lerFiltros()`, `atualizarFiltros()` e `hrefComFiltros()`                              |
| `query-client.ts`    | `makeQueryClient()`, `getQueryClient()`, `shouldRetryQuery()`, `isSessaoExpirada()`                                              |
| `query-provider.tsx` | `QueryProvider`, com o `QueryClient` de `getQueryClient()`                                                                       |
| `contracts/`         | os contratos ([acima](#contratos-tipados-estratégia-da-fe-05))                                                                   |

| Variante  | Arquivo                                                | Usado em                          | Destino                                                                                  |
| --------- | ------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------- |
| navegador | `shared/api/client.ts`                                 | Client Components, hooks          | proxy BFF: `/api/backend/<servico>/<caminho>`                                            |
| servidor  | `shared/api/client.server.ts` (`import 'server-only'`) | Server Components, Route Handlers | `<SERVICO>_API_URL` + caminho (`getServerEnv()`), com o token recebido em `opcoes.token` |

```ts
type Servico = 'auth' | 'catalog' | 'recipe' | 'operations' | 'sales';

type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; // padrão: GET
  body?: unknown; // serializado como JSON
  query?: Record<string, string | number | undefined>; // vazios são omitidos
  signal?: AbortSignal; // o do TanStack Query
};

// Resolve com o corpo JSON (ou undefined, se vazio); rejeita com ApiError.
function apiFetch(
  servico: Servico,
  caminho: string,
  opcoes?: ApiFetchOptions,
): Promise<unknown>;

// Desembrulha o envelope e valida com o schema; rejeita com ContratoInvalidoError.
function unwrap<S extends z.ZodType>(corpo: unknown, schema: S): z.output<S>;
```

A variante do servidor aceita também `opcoes.token`, enviado como `Authorization: Bearer`. O token é parâmetro, e não lido do cookie dentro do `apiFetch`, porque o login não tem token. Em Server Components, passe o de `getTokenDaSessao()` (`shared/auth/usuario-atual.server.ts`), como o `getServerApi(accessToken)` da Urbizzi.

As rotas do próprio Next em `/api/auth` (login, logout e sessão) são chamadas por `bffFetch` (`shared/auth/bff-client.ts`), com o mesmo núcleo (`requisitar`): timeout de 10 s e erro como `ApiError`.

Cada funcionalidade expõe funções em `features/<modulo>/api/<modulo>.api.ts`, que chamam `apiFetch` e `unwrap`. Componentes e hooks chamam essas funções, nunca `apiFetch` nem `fetch` direto:

```ts
// src/features/insumos/api/insumos.api.ts (FE-09)
export async function listInsumos(signal?: AbortSignal) {
  const corpo = await apiFetch('catalog', '/insumos', { signal });
  return unwrap(corpo, z.array(insumoSchema));
}

export async function deleteInsumo(id: number) {
  await apiFetch('catalog', `/insumos/${id}`, { method: 'DELETE' });
}
```

Cuidados:

- **Timeout de 10 s**, como o mobile (`lib/core/network/api_client.dart`), somado ao `signal` de quem chamou por um `AbortController` próprio (e não `AbortSignal.any`/`timeout`, que se comportam diferente no jsdom). Timeout vira `ApiNetworkError` (`isTimeout: true`); cancelamento continua como `AbortError`, que o TanStack Query trata.
- **Caminho conferido** por `validarCaminho` nas duas variantes: precisa começar com `/` e não pode ter segmento `internal` nem `..` (lança `Error`, porque é erro de programação).
- **Corpo de sucesso que não é JSON** (ex.: HTML de um intermediário) vira `ContratoInvalidoError`; corpo de erro fora do formato do NestJS vira `ApiError` com o texto do status.
- **URL absoluta no navegador**: `new URL('/api/backend/...', window.location.origin)`, porque o `Request` do Node (testes) não aceita URL relativa.
- **`fetch` lido a cada chamada** (`globalThis.fetch(...)`), e não guardado no import, para o MSW interceptar nos testes.
- **Ids na URL** são números do contrato; monte o caminho com template string e nunca com texto digitado pelo usuário.
- `DELETE` responde 204 sem corpo: não chame `unwrap`.

### Proxy BFF

O navegador fala só com o Next. O Route Handler `src/app/api/backend/[servico]/[...path]/route.ts` (FE-07, com a lógica em `shared/auth/backend-proxy.server.ts`):

1. aceita só os cinco serviços conhecidos (outro nome → 404);
2. recusa qualquer caminho com um segmento `internal`, como `/insumos/internal/1` (→ 403), caminhos malformados, com `..` (→ 400), e o login e o cadastro de empresa do auth-service (→ 404);
3. monta a URL a partir da variável de ambiente do serviço, nunca de algo vindo da requisição;
4. injeta `Authorization: Bearer <token do cookie>` e repassa método, query, corpo e status;
5. em `401`, apaga o cookie e devolve `401`, para o cliente levar ao login; sem sessão em vigor, responde `401` sem chamar o serviço;
6. com o serviço fora do ar, `502` ("Erro no servidor. Tente novamente." na tela).

Detalhes de segurança em [security.md](security.md#proxy-bff).

## Envelope HATEOAS

Todas as respostas com corpo, inclusive a de login, passam pelo `HateoasInterceptor` (`shared/src/infra/hateoas/hateoas.interceptor.ts`) e chegam assim:

```json
{
  "data": { "access_token": "eyJ..." },
  "links": {
    "getAll": { "href": "/auth", "method": "GET" },
    "create": { "href": "/auth", "method": "POST" },
    "getById": { "href": "/auth/:id", "method": "GET" },
    "update": { "href": "/auth/:id", "method": "PATCH" },
    "delete": { "href": "/auth/:id", "method": "DELETE" }
  }
}
```

- **Desembrulhe sempre** com `unwrap()`, que devolve `data`. Para resiliência, um corpo sem `data`/`links` é usado como está, e um corpo vazio vira `undefined` (o interceptor não envolve `undefined`, então `DELETE` com 204 chega vazio).
- **Ignore `links`.** Eles são montados só pelo primeiro segmento da rota e não refletem o contrato real: `update` é sempre `PATCH`, mesmo em recursos que usam `PUT` (gastos, receitas), e aparecem links para rotas que não existem (`/auth/:id`, `DELETE /vendas/:id`). As rotas válidas são as da [tabela](#rotas-usadas-pela-web).
- Erros **não** vêm no envelope (ver abaixo).

## Tratamento de erros

O backend não tem filtro de exceção próprio, então o erro é o padrão do NestJS. Formatos reais, conferidos nos serviços:

```json
{ "message": ["property extra should not exist", "email must be an email"], "error": "Bad Request", "statusCode": 400 }
{ "message": "Insumo não encontrado", "error": "Not Found", "statusCode": 404 }
{ "message": "Unauthorized", "statusCode": 401 }
{ "statusCode": 500, "message": "Internal server error" }
```

- `message` é **string ou lista**. A lista vem do `ValidationPipe` e está em **inglês** (`class-validator`).
- `error` pode faltar (401 sem token, 500).
- Não há `code` estável, ao contrário da Urbizzi. Trate pelo **`statusCode`**. O texto da mensagem só é usado nos detectores documentados, como `isEstoqueInsuficiente` ([business-rules.md](business-rules.md#detector-de-estoque-insuficiente)).
- As mensagens de negócio do backend já estão em português ("Insumo não encontrado", "Venda já finalizada não pode ser alterada", "CNPJ já cadastrado") e podem ser exibidas.

Todo erro vira um `ApiError` (`shared/api/errors.ts`):

```ts
class ApiError extends Error {
  statusCode: number; // 0 em falha de rede ou timeout
  message: string; // texto pronto para a tela, em português
  mensagens: string[]; // mensagens originais do backend (sempre lista)
  error?: string; // "Bad Request", "Not Found"...
  servico: Servico;
}

// Rede ou timeout: um ApiError com statusCode 0 e "Sem conexão com o servidor.".
class ApiNetworkError extends ApiError {
  isTimeout: boolean;
}
```

Resposta fora do contrato vira `ContratoInvalidoError`, com a lista de problemas do Zod para o teste (`issues`, `detalhes` e o `ZodError` em `cause`) e a mensagem "Resposta inesperada do servidor." para a tela.

Como o `message` é montado (`apiErrorFromResponse`): `401`, `5xx` e rede têm texto fixo; nos outros status, as mensagens do backend vêm juntas, separadas por `; `, desde que não sejam as mensagens padrão em inglês do NestJS (`Not Found`, `Cannot GET /x`, `Bad Request` etc.); sem mensagem própria, `404` usa "Registro não encontrado." e os demais, "Não foi possível concluir a ação. Tente novamente." (também o texto de `getErrorMessage` para qualquer erro que não seja da API). Mostre qualquer erro com `getErrorMessage(error)`, que também cobre o que não é `ApiError`.

| HTTP     | Situação                                          | `message` do `ApiError` (tela)                                         | Na interface                                               |
| -------- | ------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| 400      | validação (`message` lista, em inglês)            | as mensagens juntas; o schema Zod do formulário deve ter barrado antes | `Alert` no formulário                                      |
| 400      | regra de negócio (`message` string, em português) | a mensagem do backend                                                  | `Alert` ou Toast                                           |
| 401      | token ausente, inválido ou expirado               | "Sessão expirada. Faça login novamente."                               | o `QueryClient` leva a `/login?redirect=<rota>&expirada=1` |
| 404      | registro inexistente ou de outra empresa          | "Registro não encontrado." (ou a mensagem do backend, se em português) | estado de não encontrado; em lista, recarrega              |
| 409      | CNPJ ou e-mail duplicado                          | a mensagem do backend                                                  | no formulário                                              |
| 500, 503 | erro interno ou serviço dependente fora do ar     | "Erro no servidor. Tente novamente."                                   | `ErrorState` com "Tentar novamente"                        |
| 0        | rede ou timeout                                   | "Sem conexão com o servidor."                                          | `ErrorState` com "Tentar novamente"                        |

Regras:

1. Nunca exiba corpo bruto, stack ou mensagem de exceção do JavaScript.
2. Mensagens em inglês do `class-validator` são a última barreira: o schema Zod do formulário valida antes, com texto em português.
3. Um `400` de regra de negócio pode chegar em qualquer mutação (ex.: "Venda já finalizada não pode ser alterada"); mostre a mensagem e invalide as queries, porque a tela está desatualizada.

## TanStack Query

### Configuração (FE-05)

`QueryProvider` (`shared/api/query-provider.tsx`), um Client Component renderizado pelos layouts de `(app)` (FE-08) e de `(auth)` (FE-07), com o cliente de `getQueryClient()` (`query-client.ts`): um `QueryClient` novo por requisição no servidor e um único no navegador.

- `retry` de queries: só para erro de rede e 5xx, até 3 vezes. Nunca em 4xx. Mutações não repetem.
- `refetchOnWindowFocus` ligado e `staleTime` de 30 s. Isso equivale ao "recarrega os dados ao trocar de aba" do mobile: ao voltar a uma tela, os dados antigos aparecem na hora e são revalidados.
- `onError` nos caches de query e de mutação: em `401`, `makeQueryClient({ onSessaoExpirada })` chama o callback. O `QueryProvider` passa `handleSessaoExpirada` (FE-07), que leva a `/login?redirect=<rota>&expirada=1` ([security.md](security.md#sessão-bff--cookie-httponly)). As telas não tratam `401`.
- O layout de `(app)` coloca o usuário lido do cookie em `sessaoKeys.usuario()` (`setQueryData` + `HydrationBoundary`), para o `UserMenu` não repetir a busca ao abrir a tela; depois do `staleTime`, a sessão é conferida de novo.
- A sessão usa a chave `['sessao', 'usuario']` (`sessaoKeys`, em `shared/auth/usuario-atual.queries.ts`), com o `staleTime` padrão: voltar à aba confere a sessão de novo.

### Chaves

Cada funcionalidade define as chaves em `api/<modulo>.queries.ts`, em hierarquia, com `queryOptions`. Nunca escreva chaves soltas nos componentes. O primeiro elemento é o nome da funcionalidade.

```ts
export const insumosKeys = {
  all: ['insumos'] as const,
  list: () => [...insumosKeys.all, 'list'] as const,
  detail: (id: number) => [...insumosKeys.all, 'detail', id] as const,
};
```

- **Filtros feitos no cliente não entram na chave.** Como o backend não pagina nem busca, a lista é uma só (`list()`), e a busca `q` filtra o resultado no componente. Mudar a busca não refaz a requisição.
- **Filtros que o backend aplica entram na chave, como objeto**: período e status de vendas (`vendasKeys.list({ dataInicio, dataFim, status })`) e `receitaId` de produções.

| Funcionalidade     | Raiz                   | Chaves                                                                                                                  |
| ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `insumos`          | `['insumos']`          | `list()`, `detail(id)`                                                                                                  |
| `gastos-indiretos` | `['gastos-indiretos']` | `list()`                                                                                                                |
| `receitas`         | `['receitas']`         | `list()`, `detail(id)`, `custo(id)`                                                                                     |
| `estoque`          | `['estoque']`          | `insumo(insumoId)`, `movimentacoes(insumoId)` (a listagem combina `insumosKeys.list()` com `insumo(id)` de cada insumo) |
| `producoes`        | `['producoes']`        | `list({ receitaId? })`, `detail(id)`                                                                                    |
| `vendas`           | `['vendas']`           | `list({ dataInicio?, dataFim?, status? })`, `detail(id)`                                                                |

O painel (FE-22) e a simulação (FE-21) não têm chave própria: usam as queries de `vendas`, `receitas` e `estoque`. Quando uma issue diz "invalidar o painel", isso já acontece ao invalidar essas raízes.

### Invalidação após mutações

Toda mutação invalida, no `onSuccess`, o que ela pode ter alterado **no sistema inteiro**, devolvendo a `Promise`. A invalidação compara por prefixo: invalidar a raiz (`insumosKeys.all`) alcança listas e detalhes. Para invalidar a chave de outra funcionalidade, importe as chaves do `api/<outro>.queries.ts` dela, que é a única importação permitida entre funcionalidades (ver [architecture.md](architecture.md#regras-de-dependência)).

| Mutação                                             | Invalida                          | Por quê                                                                                                                                                                   |
| --------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| criar, editar ou excluir insumo                     | `insumos`, `estoque`, `receitas`  | insumo novo cria estoque; o custo das receitas depende do custo do insumo                                                                                                 |
| criar, editar ou excluir gasto indireto             | `gastos-indiretos`                | a lista também alimenta os chips do formulário de produção                                                                                                                |
| criar, editar ou excluir receita                    | `receitas`                        | a mesma lista alimenta Vendas, Produções, Simulação e Painel                                                                                                              |
| registrar entrada de estoque                        | `estoque`, `insumos`              | saldo, status e histórico; o catalog atualiza `quantidadeDisponivel` por evento, com atraso: `insumos` é revalidado de novo 2 s depois                                    |
| registrar produção                                  | `producoes`, `estoque`, `insumos` | baixa dos insumos (saldo e histórico); as produções alimentam o estoque disponível de produto acabado (FE-17); `insumos` é revalidado de novo 2 s depois, como na entrada |
| registrar venda                                     | `vendas`                          | histórico, painel e simulação                                                                                                                                             |
| concluir ou cancelar venda                          | `vendas`                          | histórico, painel e estoque disponível de produto acabado                                                                                                                 |
| simular cenário, preço de venda ou custo de N lotes | nada                              | não grava                                                                                                                                                                 |

```ts
// src/features/producoes/hooks/use-create-producao.ts (FE-15, resumido: o real
// também revalida `insumos` de novo 2 s depois)
export function useCreateProducao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProducao,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: producoesKeys.all }),
        queryClient.invalidateQueries({ queryKey: estoqueKeys.all }),
        queryClient.invalidateQueries({ queryKey: insumosKeys.all }),
      ]),
  });
}
```

Não faça atualização otimista: o backend recalcula custos, rateios e totais, e a tela deve mostrar o valor dele.

## Sem paginação: busca e filtros no cliente

Nenhuma rota pagina nem busca por texto. As listas vêm inteiras e são pequenas (uma empresa tem dezenas de insumos e receitas).

- A busca e os filtros que o backend não faz rodam no cliente, sobre o resultado da query, com `filtrarPorTexto(lista, campo, termo)` (FE-05), que ignora acentos e maiúsculas. O `campo` é o nome de uma propriedade de texto ou uma função.
- `lerFiltros(schema, searchParams)` lê os filtros com o schema Zod da tela (aceita o `searchParams` da página e o `useSearchParams()`), e `hrefComFiltros(pathname, atual, mudancas)` monta o `href` para `router.replace`; vazio, `null`, `undefined` e `false` removem o parâmetro, e `true` vira `1`.
- O estado de busca e filtros fica nos **search params**, para sobreviver a recarregar e ser compartilhado. Valide-os com Zod e `.catch()`, porque a URL é entrada do usuário.
- A busca textual usa `q`, com debounce de 300 ms antes de alterar a URL.
- Os filtros que o backend aplica (vendas e produções) usam os mesmos nomes da API.
- **Ordem.** Mantenha a ordem do backend quando ele ordena: gastos por `id` decrescente (o mais novo primeiro), receitas por `dataCriacao` decrescente, produções por `dataProducao` decrescente, vendas por `dataVenda` decrescente e movimentações por `dataMovimentacao` decrescente. `GET /insumos` não tem ordem garantida: ordene por nome no cliente (`localeCompare` com `'pt-BR'`).

| Tela      | Search params                                                                | Onde filtra                               |
| --------- | ---------------------------------------------------------------------------- | ----------------------------------------- |
| Insumos   | `q`, `novo=1`                                                                | cliente                                   |
| Receitas  | `q`                                                                          | cliente                                   |
| Gastos    | `novo=1`                                                                     | —                                         |
| Estoque   | `baixo=1`                                                                    | cliente                                   |
| Produções | `receitaId`, `novo=1`                                                        | backend                                   |
| Vendas    | `aba=registrar\|historico`, `dataInicio`, `dataFim` (`YYYY-MM-DD`), `status` | backend (com a conversão de datas abaixo) |
| Simulação | `receitaId`                                                                  | cliente                                   |

`novo=1` abre o formulário de criação ao carregar a página (ações rápidas do painel); ao fechar, remova o parâmetro com `router.replace`.

## Tipos de dados

| Tipo                   | Na API                                       | No front                                                                                                    |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Dinheiro e quantidade  | `number` (ponto flutuante)                   | `number`; arredonde e formate com `shared/format` ([conventions.md](conventions.md#dinheiro-e-quantidades)) |
| Margem                 | fração (`0.6`)                               | digitada e exibida em %, convertida ao enviar                                                               |
| Id                     | inteiro                                      | `number`; na URL da tela, valide com `z.coerce.number().int().positive()`                                   |
| Data e hora            | ISO 8601 UTC (`2026-06-01T07:00:00.000Z`)    | string; converta para o fuso local só ao exibir                                                             |
| Data sem hora (filtro) | `YYYY-MM-DD` na query, lido com `new Date()` | na URL da tela como `YYYY-MM-DD`; envie à API o início e o fim do dia local em ISO (ver lacuna 7)           |
| Campo sem valor        | omitido **ou** `null`, conforme o recurso    | ver [Formas das respostas](#formas-das-respostas); exiba `—`                                                |

## Lacunas do backend

Encontradas na análise do código e da API em execução. Cada uma diz o que a web faz enquanto o backend não muda. Ao corrigir no backend, atualize esta lista e as telas afetadas.

1. **DTOs sem `@ApiProperty`.** O `/docs-json` não descreve corpos nem respostas; `openapi-typescript` não gera tipos úteis. → Contratos Zod à mão ([acima](#contratos-tipados-estratégia-da-fe-05)).
2. **Sem prefixo `/v1`** (`globalPrefix: ''` em todos os `main.ts`). → As rotas da web não usam versão.
3. **Sem `refresh`, `logout` nem `/auth/me`.** O JWT dura 4 h e carrega `sub`, `email`, `nome` e `empresa`. → Sessão sem renovação; logout só apaga o cookie; os dados do usuário vêm do payload ([security.md](security.md)).
4. **Sem endpoint de painel.** O mobile chama `/vendas/dashboard`, que não existe. → Painel calculado no cliente (FE-22).
5. **Sem listagem de estoque.** `GET /insumos` traz `quantidadeDisponivel` (espelho por evento), mas não `quantidadeMinima`. → Uma chamada `GET /estoque/insumos/:id` por insumo, em paralelo (FE-13). Pedido ao backend: `GET /estoque/insumos` ou `quantidadeMinima` no `InsumoDto`.
6. **Sem estoque de produto acabado exposto.** O módulo `estoque-produto-acabado` não tem controller. → Disponível calculado no cliente por produções − vendas concluídas (FE-17).
7. **Filtro de data das vendas.** `GET /vendas` faz `new Date(dataFim)` e compara com `lte`: `dataFim=2026-11-30` é meia-noite UTC e exclui as vendas do dia 30; `dataInicio` em UTC inclui vendas da noite anterior no horário de Brasília. → A web envia o início e o fim do dia local em ISO 8601 (FE-18).
8. **Filtros inválidos derrubam o serviço.** `GET /vendas?status=XYZ` ou `?dataInicio=abc` respondem `500`. → Valide os search params com Zod antes de repassar.
9. **Venda concluída sem estoque continua `CONCLUIDA`.** A baixa do produto acabado é assíncrona (`venda_concluida`); se faltar saldo, o consumidor do operations-service falha e não há compensação no sales-service, ao contrário do que diz o OVERVIEW ("o status permanece PENDENTE"). → A validação no cliente antes de concluir é obrigatória (FE-17).
10. **Produção não confere o estoque de insumos.** A baixa aceita saldo negativo (`prisma-estoque.repository.ts`, `aplicarMovimentacao`). → A web não bloqueia, mas mostra o status Crítico no estoque.
11. **`POST /producoes` não confere a empresa da receita nem dos gastos.** O controller não usa o usuário do token: a receita e os gastos vêm das rotas `/internal` e a produção é gravada com a empresa da receita. → A web só oferece receitas e gastos da própria empresa; a correção é do backend.
12. **Sem limite de tamanho do nome do insumo no DTO.** A coluna tem 80 caracteres; acima disso, o banco falha com `500`. → O schema do formulário limita a 80 (FE-09).
13. **Exclusão de insumo não confere uso em receitas.** A receita (outro serviço) fica com `insumoId` órfão. → A receita mostra "Insumo #<id>" (FE-12); a mensagem de erro do backend é exibida se um dia ele recusar.
14. **Sem endpoint para definir o estoque mínimo.** Todo insumo criado pela API nasce com `quantidadeMinima = 0` e fica sempre Adequado. → A web não cria essa ação (FE-14); pedido ao backend.
15. **`ReceitaCusto` em `snake_case`**, ao contrário do exemplo do OVERVIEW de receitas (`quantidadeLotes`, `custoProducao`). → O contrato segue o DTO.
16. **Links HATEOAS incorretos** (`update` sempre `PATCH`, links para rotas inexistentes). → Ignorados.
17. **Seed com empresa fixa.** Os seeds de catalog, recipe, operations e sales usam `EMPRESA_ID = 1`, mas o id da empresa criada pelo seed do auth depende da sequência do banco. Num banco que já teve empresas, o usuário do seed entra e vê listas vazias. → Rode o seed num banco novo (ver [testing.md](testing.md#dados-de-teste)).
18. **Custo invisível soma todos os gastos da empresa.** O `DefaultCustoInvisivelResultProvider` do recipe-service soma, no custo de produção de **toda** receita, o rateio de **todos** os gastos indiretos da empresa para 1 lote (com Aluguel de R$ 1.800 fixo, o Pão Francês passou de R$ 3,31 para R$ 2.253,31). O seed grava os custos sem isso, então os números do seed não batem com uma receita recriada pela API. → A prévia da FE-12 inclui o custo invisível ([business-rules.md](business-rules.md#receitas-formulário-e-custo)); a regra em si é do backend.
19. **`GET /estoque/insumos/:id` de insumo inexistente** responde `404` "Insumo não encontrado" (não o `id: 0` do insumo sem registro). → Trate como 404 comum.
20. **`POST /receitas/:id/preco-venda` sem arredondamento** devolve ruído de ponto flutuante (`preco_sugerido: 72.11200000000001`). → Formate com `formatMoeda`; não compare com `===`.
21. **`PUT /receitas/:id` não remove a margem.** Campo omitido mantém o valor salvo, e `margem_lucro: null` passa na validação (`@IsOptional`) mas grava a margem nula sem limpar o `precoSugerido` antigo (o repositório Prisma ignora `undefined`). → A web não envia margem vazia (como o mobile), a prévia usa a margem salva nesse caso, e não há como apagar a margem pela tela; pedido ao backend: aceitar `null` e limpar o preço sugerido.
22. **OVERVIEW do estoque documenta `observacao` na entrada**, mas o `RegistrarEntradaEstoqueDto` só tem `quantidade` e a movimentação não guarda observação; enviar o campo dá `400`. → A web não tem o campo "Observação" (FE-14); pedido ao backend: aceitar e guardar a observação, ou corrigir o OVERVIEW.
23. **Produção não grava o rendimento nem o total de unidades.** Só `quantidade` (lotes), custos e rateios. → O detalhe da FE-15 calcula o total de unidades com o rendimento **atual** da receita; se a receita mudou o rendimento depois, o número diverge do usado no custo unitário gravado. Pedido ao backend: gravar `totalUnidades` na produção.

## Divergências entre as issues e o backend

Vale o backend. As issues citadas devem seguir esta tabela.

| Issue | O que a issue diz                                                     | O que o backend faz                                                           | O que a web faz                                                                           |
| ----- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| FE-14 | `observacao` opcional "aceita pelo DTO do backend"                    | `RegistrarEntradaEstoqueDto` só tem `quantidade`, e campos extras dão 400     | não mostra nem envia "Observação"                                                         |
| FE-13 | "confirme se `GET /insumos` já traz o estoque embutido"               | traz `quantidadeDisponivel`, mas não `quantidadeMinima`                       | uma chamada de estoque por insumo (lacuna 5)                                              |
| FE-15 | "mensagem de erro do backend (ex.: estoque de insumo insuficiente)"   | não há essa validação (lacuna 10)                                             | mostra qualquer erro devolvido; não há esse caso hoje                                     |
| FE-15 | invalidar `vendas/estoque-disponivel` (FE-17) e o `painel`            | não há rota de estoque de produto acabado (lacuna 6) nem de painel (lacuna 4) | invalida `producoes`, `estoque` e `insumos`, que são as fontes desses cálculos no cliente |
| FE-17 | "o backend valida de novo ao processar o evento"                      | valida, mas a venda fica `CONCLUIDA` mesmo assim (lacuna 9)                   | a validação no cliente é a barreira real                                                  |
| FE-20 | resposta de custo de N lotes conforme o OVERVIEW                      | `snake_case` (lacuna 15)                                                      | segue o DTO                                                                               |
| FE-10 | valor > 0                                                             | aceita 0 (`@Min(0)`)                                                          | mantém > 0 no formulário (mais restrito, compatível)                                      |
| FE-09 | valor pago > 0                                                        | aceita 0 (`@Min(0)`)                                                          | mantém > 0 no formulário                                                                  |
| FE-09 | erro de exclusão "ex.: insumo usado em receita, se o backend recusar" | `DELETE /insumos/:id` não confere o uso em receitas (lacuna 13)               | mostra a mensagem de qualquer recusa; hoje só há o `404`                                  |
| FE-07 | e-mail válido como no mobile (só confere o `@`)                       | `LoginDto` tem `@IsEmail()`; `joao@x` dá 400 em inglês                        | o formulário usa `z.email()` ("Informe um e-mail válido")                                 |
| FE-12 | "custo invisível = 0 na implementação padrão"                         | soma o rateio de todos os gastos da empresa para 1 lote (lacuna 18)           | a prévia inclui o custo invisível, com a lista de gastos                                  |
