# Integração com a API

> **Status:** o cliente, os contratos, os erros, o TanStack Query e o MSW **existem** desde a **FE-05** (`src/shared/api/` e `src/test/`). O proxy autenticado `/api/backend` e a sessão **existem** desde a **FE-07** (`src/app/api/backend/`, `src/app/api/auth/` e `src/shared/auth/`). As funções de `features/<modulo>/api/` chegam com as telas: a primeira foi `features/insumos/api/` (**FE-09**). Ao mudar algo, atualize este documento no mesmo PR. Desde a **FE-39**, o backend é o monolito modular [`lucroai-backend`](https://github.com/victorschmidt21/lucroai-backend), numa URL única (`API_URL`). A fonte da verdade do contrato é o código dele (DTOs e controllers em `src/modules/`) e o `docs/api.md` dele; se uma issue divergir dele, vale o backend, e a divergência entra em [Divergências entre as issues e o backend](#divergências-entre-as-issues-e-o-backend).

## A API

O backend é um monolito modular NestJS (`auth`, `insumos`, `gastos-indiretos`, `receitas`, `estoque`, `producoes` e `vendas`), com um Postgres e o Swagger em `/docs`. O front conhece só a URL base, pela variável de servidor `API_URL` (porta 3100 no local; ver o [README](../README.md#variáveis-de-ambiente)). Até a FE-38 eram cinco microsserviços, um por variável (`AUTH_API_URL` e as outras), que não são mais lidas.

- **Sem prefixo de versão.** As rotas são `/insumos`, não `/v1/insumos`.
- **JSON puro.** A resposta é o recurso ou a lista, sem o envelope `{ data, links }` dos microsserviços.
- **Autenticação.** `Authorization: Bearer <jwt>` em todas as rotas, menos `POST /auth/login`, `POST /auth/empresa` e `GET /health`.
- **Não há rotas `/internal/*`.** O proxy continua recusando qualquer segmento `internal`, por segurança (ver [security.md](security.md#proxy-bff)).
- **Multiempresa.** A API tira o `empresa.id` do JWT; recurso de outra empresa responde `404`. O front nunca envia `empresaId` em URL, query ou corpo.

### Rotas usadas pela web

Corpo e resposta com os nomes exatos do contrato.

| Método e rota                              | Corpo                                                                                                                                                            | Resposta                                        | Tela                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------- |
| `POST /auth/login`                         | `{ email, senha }`                                                                                                                                               | `{ access_token }`                              | FE-07 (no servidor)               |
| `POST /auth/empresa`                       | `{ nome_empresa, cnpj?, segmento?, nome_usuario?, email, senha, token_cadastro }`                                                                                | `{ sub, email, nome, empresa, access_token }`   | FE-48 (no servidor)               |
| `GET /insumos`                             | —                                                                                                                                                                | `Insumo[]`                                      | FE-09, FE-12, FE-13               |
| `GET /insumos/:id`                         | —                                                                                                                                                                | `Insumo`                                        | FE-09                             |
| `POST /insumos`                            | `{ nome, quantidadeBaseCusto, unidade, valorPago, quantidadeDisponivelInicial? }`                                                                                | `Insumo`                                        | FE-09                             |
| `PATCH /insumos/:id`                       | `{ nome?, quantidadeBaseCusto?, unidade?, valorPago?, precoMercado? }`                                                                                           | `Insumo`                                        | FE-09, FE-43                      |
| `DELETE /insumos/:id`                      | —                                                                                                                                                                | vazio (204)                                     | FE-09                             |
| `GET /insumos/:id/compras`                 | —                                                                                                                                                                | `CompraInsumo[]` (mais recentes primeiro)       | FE-43                             |
| `POST /insumos/:id/compras`                | `{ quantidade, valorTotal, observacao? }`                                                                                                                        | `CompraInsumo` (201)                            | FE-43                             |
| `GET /alertas`                             | —                                                                                                                                                                | `Alertas` (estoque negativo e preço defasado)   | FE-47                             |
| `GET /gastos-indiretos`                    | —                                                                                                                                                                | `GastoIndireto[]`                               | FE-10, FE-15                      |
| `GET /gastos-indiretos/:id`                | —                                                                                                                                                                | `GastoIndireto`                                 | —                                 |
| `POST /gastos-indiretos`                   | `{ descricao, valor, tipo }` (FE-42)                                                                                                                             | `GastoIndireto`                                 | FE-10                             |
| `PUT /gastos-indiretos/:id`                | `{ descricao?, valor?, tipo? }` (FE-42)                                                                                                                          | `GastoIndireto`                                 | FE-10                             |
| `DELETE /gastos-indiretos/:id`             | —                                                                                                                                                                | vazio (204)                                     | FE-10                             |
| `GET /receitas`                            | —                                                                                                                                                                | `Receita[]`                                     | FE-11, FE-15, FE-16, FE-21, FE-22 |
| `GET /receitas/:id`                        | —                                                                                                                                                                | `Receita` (com `custo` e `precos`, FE-44)       | FE-12, FE-20, FE-44               |
| `POST /receitas`                           | `{ nome, rendimento, unidadeRendimento, uso_por_lote, embalagem_por_unidade, perda_percentual, lucro_percentual, insumos: [{ insumo_id, quantidade }] }` (FE-44) | `Receita`                                       | FE-12, FE-44                      |
| `PUT /receitas/:id`                        | os mesmos campos, todos opcionais                                                                                                                                | `Receita`                                       | FE-12                             |
| `DELETE /receitas/:id`                     | —                                                                                                                                                                | vazio (204)                                     | FE-11                             |
| `GET /receitas/:id/custo`                  | —                                                                                                                                                                | `ReceitaCusto`                                  | FE-20                             |
| `POST /receitas/:id/custo/simular`         | `{ quantidadeLotes }`                                                                                                                                            | `ReceitaCusto`                                  | FE-20                             |
| `POST /receitas/:id/simular`               | `{ novoCusto?, novoPreco?, volume?, canalId? }` (FE-45)                                                                                                          | `SimulacaoCenario`                              | FE-20, FE-21, FE-45               |
| `GET /estoque/insumos`                     | —                                                                                                                                                                | `Estoque[]`                                     | FE-13, FE-22 (FE-39)              |
| `POST /estoque/insumos/:id/entrada`        | `{ quantidade, observacao? }`                                                                                                                                    | `Estoque`                                       | FE-14                             |
| `PATCH /estoque/insumos/:id/minimo`        | `{ quantidadeMinima }`                                                                                                                                           | `Estoque`                                       | FE-14 (FE-39)                     |
| `GET /estoque/insumos/:id/movimentacoes`   | —                                                                                                                                                                | `MovimentacaoEstoque[]`                         | FE-14                             |
| `GET /estoque/produtos`                    | —                                                                                                                                                                | `EstoqueProduto[]`                              | FE-17 (FE-39)                     |
| `GET /producoes?receitaId=`                | —                                                                                                                                                                | `Producao[]`                                    | FE-15                             |
| `GET /producoes/:id`                       | —                                                                                                                                                                | `Producao`                                      | FE-15                             |
| `POST /producoes`                          | `{ receita_id, quantidade, gasto_indireto_ids? }`                                                                                                                | `Producao`                                      | FE-15                             |
| `GET /vendas?status=&dataInicio=&dataFim=` | —                                                                                                                                                                | `Venda[]`                                       | FE-17, FE-18, FE-21, FE-22        |
| `GET /vendas/resumo`                       | —                                                                                                                                                                | `ResumoVendas` (ponto de equilíbrio da empresa) | FE-45                             |
| `GET /vendas/:id`                          | —                                                                                                                                                                | `Venda`                                         | FE-17                             |
| `POST /vendas`                             | `{ canal_id?, itens: [{ receita_id, quantidade, preco_unitario_real }] }` (`canal_id` desde a FE-46)                                                             | `Venda`                                         | FE-16, FE-46                      |
| `PATCH /vendas/:id/status`                 | `{ status }`                                                                                                                                                     | `Venda`                                         | FE-17                             |

`GET /estoque/insumos/:id` continua existindo, mas a web não o usa desde a FE-39.

Use as rotas e os campos desta tabela, conferidos no código. Se o backend mudar, atualize a tabela e o contrato no mesmo PR.

### Formas das respostas

Conferidas nos DTOs do monolito (`src/modules/<modulo>/application/dto/`) e nas respostas reais com o seed. "omitido" quer dizer que, sem valor, o campo **não vem** no JSON (o repositório converte `null` em `undefined`); "`null`" quer dizer que ele vem como `null`.

| Tipo                  | Campos                                                                                                                                                                                                                                                                                                                     | Origem (monolito, `src/modules/`)                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `Insumo`              | `id`, `empresaId`, `nome`, `quantidadeBaseCusto`, `quantidadeDisponivel`, `quantidadeMinima` (FE-39), `unidade`, `valorPago`, `custoUnitario`, `precoUnitario` (alias de `custoUnitario`), `dataCriacao`                                                                                                                   | `insumos/application/dto/insumo.dto.ts`                           |
| `GastoIndireto`       | `id`, `empresaId`, `descricao`, `valor`, `tipo` (FE-42; o `metodoRateio` legado que a API ainda devolve é descartado)                                                                                                                                                                                                      | `gastos-indiretos/domain/models/gasto-indireto.entity.ts`         |
| `Receita`             | `id`, `empresaId`, `nome`, `rendimento` (inteiro), `unidadeRendimento`, `custoProducao`, `custoUnitario`, `precoSugerido` (os três omitidos sem valor; o `margemLucro` legado não é lido desde a FE-45), `dataCriacao`, `itens: [{ insumoId, quantidade, custoCalculado (omitido sem valor) }]`                            | `receitas/domain/models/receita.entity.ts` e o repositório Prisma |
| `ReceitaCusto`        | `quantidade_lotes`, `total_unidades`, `custo_invisivel`, `custo_total_producao`, `custo_por_unidade` (**snake_case**, ao contrário do OVERVIEW)                                                                                                                                                                            | `custos/application/dto/receita-custo.dto.ts`                     |
| `SimulacaoCenario`    | `canalId`, `canal`, `custoUnitario`, `custoSemGastosMensais`, `percentuaisSemLucro`, `precoVenda`, `volume`, `margemContribuicao`, `lucroPorUnidade`, `lucroReal`, `lucroMes`, `gastosMensais`, `pontoEquilibrio: { unidades, motivo }` (FE-45; os legados `lucroEstimado`, `margemProjetada` e `breakEven` não são lidos) | `simulacao-cenario-resultado.dto.ts`                              |
| `Estoque`             | `id` (nunca 0 no monolito), `insumoId`, `quantidadeDisponivel` (pode ser negativa), `quantidadeMinima`, `estoqueNegativo` (FE-47), `dataAlteracao` (`null` sem alteração)                                                                                                                                                  | `estoque/application/dto/estoque.dto.ts`                          |
| `MovimentacaoEstoque` | `id`, `insumoId`, `tipo` (`ENTRADA \| SAIDA`), `origem` (`COMPRA \| PRODUCAO`), `quantidade`, `referenciaId` (`null`), `observacao` (`null`, FE-39), `dataMovimentacao`                                                                                                                                                    | `movimentacao-estoque.dto.ts`                                     |
| `EstoqueProduto`      | `receitaId`, `quantidadeDisponivel`, `dataAlteracao`; um por receita que já teve produção (FE-39)                                                                                                                                                                                                                          | `estoque/application/dto/estoque-produto.dto.ts`                  |
| `Producao`            | `id`, `receitaId`, `empresaId`, `quantidade` (lotes), `totalUnidades` (FE-39), `custoTotal` (`null`), `custoUnitario` (`null`), `dataProducao`, `rateios: [{ gastoIndiretoId, descricao (FE-39), valorRateado }]`                                                                                                          | `producoes/domain/models/producao.entity.ts`                      |
| `Venda`               | `id`, `empresaId`, `total` (`null`), `status`, `dataVenda`, `canalId` (`null` nas vendas antigas, FE-46), `itens: [{ id, vendaId, receitaId, quantidade, precoUnitarioReal, custoUnitario (`null`), lucroReal (`null`, FE-46) }]`; a `margemRealizada` legada ainda vem e é ignorada                                       | `vendas/domain/models/venda.entity.ts`                            |

Os nomes misturam convenções: o corpo das requisições de receitas, gastos, produções e vendas usa `snake_case` (`margem_lucro`, `receita_id`, `preco_unitario_real`), o de insumos usa `camelCase` (`quantidadeBaseCusto`, `valorPago`), e as respostas usam `camelCase`, menos `ReceitaCusto` e `PrecoVenda`. Use sempre o nome do contrato, sem converter (ver [conventions.md](conventions.md#idioma)).

## Contratos tipados (estratégia da FE-05)

Os contratos são **schemas Zod escritos à mão, num lugar só**. O monolito já documenta os DTOs no Swagger (lacuna 1 resolvida), mas a troca pelo `openapi-typescript` fica para a [migração](#migração-para-o-openapi). Os arquivos mantêm a divisão dos antigos serviços:

```text
src/shared/api/contracts/
├── enums.ts         # UnidadeMedida, TipoGasto, StatusVenda, tipos de movimentação, com rótulos
├── auth.ts          # login e payload do JWT
├── catalog.ts       # insumos e gastos indiretos
├── recipe.ts        # receitas, custo, simulação e preço de venda
├── operations.ts    # estoque, movimentações e produções
└── sales.ts         # vendas
```

Regras:

1. **Escreva o schema a partir do backend**: `src/modules/*/application/dto/` do monolito, nunca a partir do `data/models` do mobile, que tem campos de fallback que não existem (`valor_pago`, `valor_total`).
2. **Um schema de resposta por recurso**, com o nome do contrato (`insumoSchema`), e o tipo inferido com `z.infer` (`type Insumo = z.infer<typeof insumoSchema>`). Corpos de requisição viram tipos (`CreateInsumoBody`), também nesses arquivos.
3. **Nenhum tipo de DTO fora de `src/shared/api/contracts/`.** Funcionalidades importam os tipos de lá.
4. **Campo omitido sem valor** é `.optional()`; campo que vem `null` é `.nullable()`. Não use os dois "por garantia": o teste com a resposta real é que confere.
5. **Datas** da API são ISO 8601 em UTC: `z.iso.datetime()`, mantidas como string. Converta só ao exibir.
6. **Validação em tempo de execução.** Toda resposta passa pelo schema em `api/` (ver [Cliente](#cliente)). Uma mudança de contrato quebra o teste da função, em vez de virar `undefined` na tela.
7. Cada schema tem um teste que aceita uma resposta real do seed (fixture em `src/test/fixtures/`) e rejeita uma inválida.
8. **Enums** ficam em `enums.ts`, cada um com o schema, o tipo e os rótulos de tela de [business-rules.md](business-rules.md#enumerações-e-rótulos): `unidadeMedidaSchema`, `UnidadeMedida` e `UNIDADE_MEDIDA_ROTULOS`; `tipoGastoSchema`, `TipoGasto`, `TIPO_GASTO_ROTULOS` e `TIPO_GASTO_DESCRICOES` (FE-42); `statusVendaSchema`, `StatusVenda` e `STATUS_VENDA_ROTULOS`; `tipoMovimentacaoSchema`, `origemMovimentacaoSchema` e seus rótulos.

```ts
// src/shared/api/contracts/catalog.ts (FE-05)
import { z } from 'zod';
import { unidadeMedidaSchema } from './enums';

/** `src/modules/insumos/application/dto/insumo.dto.ts` do monolito (resumido) */
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

`openapi-typescript`, `openapi-fetch` e `openapi-msw` já estão no `package.json`, mas **não** são usados. O `/docs-json` do monolito já traz corpos e respostas; para migrar:

1. Crie `api:generate` no `package.json` (`openapi-typescript http://localhost:3100/docs-json -o src/shared/api/schemas/api.d.ts`).
2. Troque os tipos de `contracts/` pelos gerados (`components['schemas']['InsumoDto']`), um grupo por PR, mantendo os schemas Zod de resposta enquanto o OpenAPI não for confiável.
3. Troque o `apiFetch` por um cliente `openapi-fetch`, com o `baseUrl` do proxy, e os handlers do MSW pelo `openapi-msw`.
4. Atualize este documento, a regra 5 do [AGENTS.md](../AGENTS.md#regras-obrigatórias) e o checklist do template de PR.

## Cliente

Há um único jeito de chamar o backend: `apiFetch(caminho, opcoes)`, com duas variantes de mesma assinatura (FE-05; sem o `servico` desde a FE-39).

Arquivos de `src/shared/api/`:

| Arquivo              | Exporta                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `client.ts`          | `apiFetch` do navegador (pelo proxy)                                                                                                            |
| `client.server.ts`   | `apiFetch` do servidor (direto na API) e `urlDaApi()`, com `import 'server-only'`                                                               |
| `request.ts`         | `unwrap()`, o tipo `ApiFetchOptions`, `requisitar()` (o núcleo comum às duas variantes), `validarCaminho()` e `TIMEOUT_MS`                      |
| `errors.ts`          | `ApiError`, `ApiNetworkError`, `ContratoInvalidoError`, `apiErrorFromResponse()`, `temCodigo()`, `getErrorMessage()`, `isEstoqueInsuficiente()` |
| `filtros.ts`         | `normalizarTexto()`, `filtrarPorTexto()`, `lerFiltros()`, `atualizarFiltros()` e `hrefComFiltros()`                                             |
| `query-client.ts`    | `makeQueryClient()`, `getQueryClient()`, `shouldRetryQuery()`, `isSessaoExpirada()`                                                             |
| `query-provider.tsx` | `QueryProvider`, com o `QueryClient` de `getQueryClient()`                                                                                      |
| `contracts/`         | os contratos ([acima](#contratos-tipados-estratégia-da-fe-05))                                                                                  |

| Variante  | Arquivo                                                | Usado em                          | Destino                                                                        |
| --------- | ------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------ |
| navegador | `shared/api/client.ts`                                 | Client Components, hooks          | proxy BFF: `/api/backend/<caminho>`                                            |
| servidor  | `shared/api/client.server.ts` (`import 'server-only'`) | Server Components, Route Handlers | `API_URL` + caminho (`getServerEnv()`), com o token recebido em `opcoes.token` |

```ts
type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; // padrão: GET
  body?: unknown; // serializado como JSON
  query?: Record<string, string | number | undefined>; // vazios são omitidos
  signal?: AbortSignal; // o do TanStack Query
};

// Resolve com o corpo JSON (ou undefined, se vazio); rejeita com ApiError.
function apiFetch(caminho: string, opcoes?: ApiFetchOptions): Promise<unknown>;

// Valida o JSON puro com o schema; rejeita com ContratoInvalidoError.
function unwrap<S extends z.ZodType>(corpo: unknown, schema: S): z.output<S>;
```

A variante do servidor aceita também `opcoes.token`, enviado como `Authorization: Bearer`. O token é parâmetro, e não lido do cookie dentro do `apiFetch`, porque o login não tem token. Em Server Components, passe o de `getTokenDaSessao()` (`shared/auth/usuario-atual.server.ts`), como o `getServerApi(accessToken)` da Urbizzi.

As rotas do próprio Next em `/api/auth` (login, logout e sessão) são chamadas por `bffFetch` (`shared/auth/bff-client.ts`), com o mesmo núcleo (`requisitar`): timeout de 10 s e erro como `ApiError`.

Cada funcionalidade expõe funções em `features/<modulo>/api/<modulo>.api.ts`, que chamam `apiFetch` e `unwrap`. Componentes e hooks chamam essas funções, nunca `apiFetch` nem `fetch` direto:

```ts
// src/features/insumos/api/insumos.api.ts (FE-09)
export async function listInsumos(signal?: AbortSignal) {
  const corpo = await apiFetch('/insumos', { signal });
  return unwrap(corpo, z.array(insumoSchema));
}

export async function deleteInsumo(id: number) {
  await apiFetch(`/insumos/${id}`, { method: 'DELETE' });
}
```

Cuidados:

- **Timeout de 10 s**, como o mobile (`lib/core/network/api_client.dart`), somado ao `signal` de quem chamou por um `AbortController` próprio (e não `AbortSignal.any`/`timeout`, que se comportam diferente no jsdom). Timeout vira `ApiNetworkError` (`isTimeout: true`); cancelamento continua como `AbortError`, que o TanStack Query trata.
- **Caminho conferido** por `validarCaminho` nas duas variantes: precisa começar com `/` e não pode ter segmento `internal` nem `..` (lança `Error`, porque é erro de programação).
- **Corpo de sucesso que não é JSON** (ex.: HTML de um intermediário) vira `ContratoInvalidoError`; corpo de erro fora do formato da API vira `ApiError` com o texto do status.
- **URL absoluta no navegador**: `new URL('/api/backend/...', window.location.origin)`, porque o `Request` do Node (testes) não aceita URL relativa.
- **`fetch` lido a cada chamada** (`globalThis.fetch(...)`), e não guardado no import, para o MSW interceptar nos testes.
- **Ids na URL** são números do contrato; monte o caminho com template string e nunca com texto digitado pelo usuário.
- `DELETE` responde 204 sem corpo: não chame `unwrap`.

### Proxy BFF

O navegador fala só com o Next. O Route Handler `src/app/api/backend/[...path]/route.ts` (FE-07; sem o segmento do serviço desde a FE-39, com a lógica em `shared/auth/backend-proxy.server.ts`):

1. repassa `/api/backend/<caminho>` para `API_URL/<caminho>`; rota que a API não tem volta com o `404` dela;
2. recusa qualquer caminho com um segmento `internal`, como `/insumos/internal/1` (→ 403), caminhos malformados, com `..` (→ 400), e o login e o cadastro de empresa (→ 404);
3. monta a URL a partir da variável de ambiente `API_URL`, nunca de algo vindo da requisição;
4. injeta `Authorization: Bearer <token do cookie>` e repassa método, query, corpo e status;
5. em `401`, apaga o cookie e devolve `401`, para o cliente levar ao login; sem sessão em vigor, responde `401` sem chamar a API;
6. com a API fora do ar, `502` ("O sistema falhou agora. Tente de novo em instantes." na tela).

Detalhes de segurança em [security.md](security.md#proxy-bff).

## Sem envelope

Os microsserviços envolviam as respostas em `{ data, links }` (`HateoasInterceptor`). O monolito responde **JSON puro**, e a FE-39 tirou o desembrulho do `unwrap()`: um corpo `{ data, links }` agora falha no contrato. `DELETE` responde 204 sem corpo, que chega como `undefined`.

## Tratamento de erros

Formato único, do `AllExceptionsFilter` do monolito (`docs/api.md#erros` do backend):

```json
{ "statusCode": 404, "code": "INSUMO_NAO_ENCONTRADO", "message": "Insumo não encontrado", "path": "/insumos/99", "timestamp": "2026-11-19T12:00:00.000Z" }
{ "statusCode": 400, "code": "DADOS_INVALIDOS", "message": "Os dados enviados são inválidos", "details": [{ "field": "nome", "messages": ["nome should not be empty"] }], "path": "/insumos", "timestamp": "..." }
{ "statusCode": 422, "code": "ESTOQUE_INSUFICIENTE", "message": "Estoque insuficiente para a receita 25: disponível 10, solicitado 20", "path": "/vendas/7/status", "timestamp": "..." }
```

- `message` é sempre uma string em português. Validação traz `details` (em inglês, do `class-validator`), que a web não mostra: o schema Zod do formulário valida antes.
- **`code` é estável** e é o que a web usa para decidir: `temCodigo(error, 'INSUMO_EM_USO')` e `isEstoqueInsuficiente` (que confere `ESTOQUE_INSUFICIENTE` e, sem ele, o texto, como o mobile). Sem `code` (corpo de um intermediário), vale o `statusCode`.
- Códigos que a web pode encontrar: `DADOS_INVALIDOS` (400), `NAO_AUTENTICADO`, `TOKEN_INVALIDO` e `CREDENCIAIS_INVALIDAS` (401), `<ENTIDADE>_NAO_ENCONTRADO` (404), `INSUMO_EM_USO` e `RECEITA_EM_USO` (409), `ESTOQUE_INSUFICIENTE`, `VENDA_FINALIZADA` e `TRANSICAO_INVALIDA` (422), `MUITAS_REQUISICOES` (429), `ERRO_INTERNO` (500).
- Os erros do próprio BFF seguem o mesmo formato, sem `path`: `ORIGEM_NAO_PERMITIDA` e `ROTA_NAO_PERMITIDA` (403), `DADOS_INVALIDOS` (400), `RECURSO_NAO_ENCONTRADO` (404), `NAO_AUTENTICADO` (401) e `SERVICO_INDISPONIVEL` (502).

Todo erro vira um `ApiError` (`shared/api/errors.ts`):

```ts
class ApiError extends Error {
  statusCode: number; // 0 em falha de rede ou timeout
  message: string; // texto pronto para a tela, em português
  mensagens: string[]; // mensagens originais do backend (sempre lista)
  code?: string; // "INSUMO_NAO_ENCONTRADO", "ESTOQUE_INSUFICIENTE"...
}

// Rede ou timeout: um ApiError com statusCode 0 e "Sem conexão. Confira a internet e tente de novo.".
class ApiNetworkError extends ApiError {
  isTimeout: boolean;
}
```

Resposta fora do contrato vira `ContratoInvalidoError`, com a lista de problemas do Zod para o teste (`issues`, `detalhes` e o `ZodError` em `cause`) e a mensagem "O sistema respondeu algo inesperado. Tente de novo em instantes." para a tela.

Como o `message` é montado (`apiErrorFromResponse`): `401`, `5xx` e rede têm texto fixo; nos outros status, as mensagens do backend vêm juntas, separadas por `; `, desde que não sejam as mensagens padrão em inglês do NestJS (`Not Found`, `Cannot GET /x`, `Bad Request` etc., que o monolito já não repassa); sem mensagem própria, `404` usa "Não encontrei esse item. Ele pode ter sido excluído." e os demais, "Não deu para concluir agora. Tente de novo." (também o texto de `getErrorMessage` para qualquer erro que não seja da API). Mostre qualquer erro com `getErrorMessage(error)`, que também cobre o que não é `ApiError`.

| HTTP     | Situação                                      | `message` do `ApiError` (tela)                                                                     | Na interface                                               |
| -------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 400      | validação (`DADOS_INVALIDOS`)                 | "Os dados enviados são inválidos"; o schema Zod deve ter barrado antes                             | `Alert` no formulário                                      |
| 400, 422 | regra de negócio (`code` próprio)             | a mensagem do backend                                                                              | `Alert` ou Toast; `ESTOQUE_INSUFICIENTE` abre o diálogo    |
| 401      | token ausente, inválido ou expirado           | "Sessão expirada. Faça login novamente."                                                           | o `QueryClient` leva a `/login?redirect=<rota>&expirada=1` |
| 404      | registro inexistente ou de outra empresa      | "Não encontrei esse item. Ele pode ter sido excluído." (ou a mensagem do backend, se em português) | estado de não encontrado; em lista, recarrega              |
| 409      | duplicado ou em uso (`INSUMO_EM_USO`...)      | a mensagem do backend                                                                              | no formulário ou no diálogo de exclusão                    |
| 500, 503 | erro interno ou serviço dependente fora do ar | "O sistema falhou agora. Tente de novo em instantes."                                              | `ErrorState` com "Tentar de novo"                          |
| 0        | rede ou timeout                               | "Sem conexão. Confira a internet e tente de novo."                                                 | `ErrorState` com "Tentar de novo"                          |

Regras:

1. Nunca exiba corpo bruto, stack ou mensagem de exceção do JavaScript.
2. Mensagens em inglês do `class-validator` são a última barreira: o schema Zod do formulário valida antes, com texto em português.
3. Um `400` ou `422` de regra de negócio pode chegar em qualquer mutação (ex.: `VENDA_FINALIZADA`, "Venda já finalizada não pode ser alterada"); mostre a mensagem e invalide as queries, porque a tela está desatualizada.

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

| Funcionalidade     | Raiz                   | Chaves                                                                                                         |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `insumos`          | `['insumos']`          | `list()`, `detail(id)`                                                                                         |
| `gastos-indiretos` | `['gastos-indiretos']` | `list()`                                                                                                       |
| `receitas`         | `['receitas']`         | `list()`, `detail(id)`, `custo(id)`                                                                            |
| `estoque`          | `['estoque']`          | `insumos()`, `movimentacoes(insumoId)`, `produtos()` (a listagem combina `insumosKeys.list()` com `insumos()`) |
| `producoes`        | `['producoes']`        | `list({ receitaId? })`, `detail(id)`                                                                           |
| `vendas`           | `['vendas']`           | `list({ dataInicio?, dataFim?, status? })`, `detail(id)`                                                       |

O painel (FE-22) e a simulação (FE-21) não têm chave própria: usam as queries de `vendas`, `receitas` e `estoque`. Quando uma issue diz "invalidar o painel", isso já acontece ao invalidar essas raízes.

### Invalidação após mutações

Toda mutação invalida, no `onSuccess`, o que ela pode ter alterado **no sistema inteiro**, devolvendo a `Promise`. A invalidação compara por prefixo: invalidar a raiz (`insumosKeys.all`) alcança listas e detalhes. Para invalidar a chave de outra funcionalidade, importe as chaves do `api/<outro>.queries.ts` dela, que é a única importação permitida entre funcionalidades (ver [architecture.md](architecture.md#regras-de-dependência)).

| Mutação                                          | Invalida                          | Por quê                                                                                                                 |
| ------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| criar, editar ou excluir insumo                  | `insumos`, `estoque`, `receitas`  | insumo novo cria estoque; o custo das receitas depende do custo do insumo                                               |
| criar, editar ou excluir gasto indireto          | `gastos-indiretos`                | a lista também alimenta os chips do formulário de produção                                                              |
| criar, editar ou excluir receita                 | `receitas`                        | a mesma lista alimenta Vendas, Produções, Simulação e Painel                                                            |
| registrar compra de insumo                       | `insumos`, `estoque`, `receitas`  | entrada no estoque, custo médio e preço de hoje, que forma o preço das receitas; `insumos` cobre o histórico de compras |
| registrar entrada de estoque ou definir o mínimo | `estoque`, `insumos`              | saldo, mínimo, status e histórico; `quantidadeDisponivel` e `quantidadeMinima` do insumo                                |
| registrar produção                               | `producoes`, `estoque`, `insumos` | baixa dos insumos (saldo e histórico) e entrada de produto acabado (`estoque.produtos()`), numa transação só            |
| registrar venda                                  | `vendas`                          | histórico, painel e simulação                                                                                           |
| concluir ou cancelar venda                       | `vendas`, `estoque`               | histórico, painel e a baixa do produto acabado (também no erro, que indica tela desatualizada)                          |
| simular cenário ou custo de N lotes              | nada                              | não grava                                                                                                               |
| criar, editar ou excluir receita; configuração   | também `alertas` (FE-47)          | as receitas afetadas por um insumo mais caro e o preço novo delas                                                       |

Os alertas (`GET /alertas`, FE-47) ficam em `alertasKeys.all = ['insumos', 'alertas']`, debaixo da raiz `insumos`: toda mutação que já invalida `insumos` (insumo, compra, entrada de estoque e produção) os atualiza também.

```ts
// src/features/producoes/hooks/use-create-producao.ts (FE-15)
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
| Insumos   | `q`, `novo=1`, `compra=<id>` (FE-47)                                         | cliente                                   |
| Receitas  | `q`                                                                          | cliente                                   |
| Gastos    | `novo=1`                                                                     | —                                         |
| Estoque   | `baixo=1`                                                                    | cliente                                   |
| Produções | `receitaId`, `novo=1`                                                        | backend                                   |
| Vendas    | `aba=registrar\|historico`, `dataInicio`, `dataFim` (`YYYY-MM-DD`), `status` | backend (com a conversão de datas abaixo) |
| Simulação | `receitaId`                                                                  | cliente                                   |

`novo=1` abre o formulário de criação ao carregar a página (ações rápidas do painel); ao fechar, remova o parâmetro com `router.replace`. Do mesmo jeito, `compra=<id>` (link do aviso de estoque negativo, FE-47) abre o detalhe do insumo com "Registrar compra".

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

Encontradas na análise dos microsserviços. Cada uma diz o que a web faz. Desde a FE-39, o contrato é o monolito, e as lacunas que ele resolveu estão marcadas **Resolvida**, conforme `docs/business-rules.md#lacunas-do-backend-atual` do backend; as que a web contornava deixaram de ter contorno.

1. **Resolvida.** ~~DTOs sem `@ApiProperty`~~: o Swagger do monolito documenta os DTOs (BE-04). Os contratos continuam à mão até a [migração para o OpenAPI](#migração-para-o-openapi).
2. **Sem prefixo `/v1`** (`globalPrefix: ''` em todos os `main.ts`). → As rotas da web não usam versão.
3. **Sem `refresh`, `logout` nem `/auth/me`.** O JWT dura 4 h e carrega `sub`, `email`, `nome` e `empresa`. → Sessão sem renovação; logout só apaga o cookie; os dados do usuário vêm do payload ([security.md](security.md)).
4. **Sem endpoint de painel.** O mobile chama `/vendas/dashboard`, que não existe. → Painel calculado no cliente (FE-22).
5. **Resolvida.** ~~Sem listagem de estoque~~: `GET /estoque/insumos` e `quantidadeMinima` no `Insumo`. A tela de estoque e o painel fazem uma chamada só (FE-39), no lugar de uma por insumo.
6. **Resolvida.** ~~Estoque de produto acabado não exposto~~: `GET /estoque/produtos`. A conferência antes de concluir a venda usa o saldo da API (FE-39), no lugar do cálculo por produções − vendas.
7. **Resolvida.** ~~Filtro de data das vendas~~: a API só aceita data e hora ISO 8601 completas, comparadas como instantes, que é o que a web já envia (início e fim do dia local).
8. **Resolvida.** ~~Filtros inválidos derrubam o serviço~~: a API responde `400` `DADOS_INVALIDOS`. A web continua validando os search params com Zod.
9. **Resolvida.** ~~Venda concluída sem estoque continua `CONCLUIDA`~~: a conclusão baixa o produto acabado na mesma transação; sem saldo, `422` `ESTOQUE_INSUFICIENTE` e a venda continua `PENDENTE`. A web não reconsulta mais a venda depois de concluir e abre o diálogo "Estoque insuficiente" também com esse erro (FE-39); a conferência antes de concluir fica só para dar a mensagem com o nome da receita.
10. **Produção não confere o estoque de insumos** (mantida no monolito). A baixa aceita saldo negativo (`prisma-estoque.repository.ts`, `aplicarMovimentacao`). → A web não bloqueia (decisão de produto de 2026-11-21): mostra o status Crítico e o selo "Estoque negativo" (`estoqueNegativo`, BE-32) e avisa ao entrar (`GET /alertas`, FE-47).
11. **Resolvida.** ~~`POST /producoes` não confere a empresa da receita nem dos gastos~~: receita ou gasto de outra empresa → `404`.
12. **Resolvida.** ~~Sem limite de tamanho do nome do insumo~~: `@MaxLength(80)`. O formulário continua limitando a 80.
13. **Resolvida.** ~~Exclusão de insumo não confere uso em receitas~~: `409` `INSUMO_EM_USO`, cuja mensagem a tela de insumos mostra.
14. **Resolvida.** ~~Sem endpoint para definir o estoque mínimo~~: `PATCH /estoque/insumos/:id/minimo`. O cartão do estoque tem "Definir mínimo" (FE-39).
15. **`ReceitaCusto` em `snake_case`**, ao contrário do exemplo do OVERVIEW de receitas (`quantidadeLotes`, `custoProducao`). → O contrato segue o DTO.
16. **Resolvida.** ~~Links HATEOAS incorretos~~: não há mais envelope.
17. **Resolvida.** ~~Seed com empresa fixa~~: um seed só, idempotente, pelos ids reais.
18. **Custo invisível soma todos os gastos da empresa** (mantida no monolito; o seed agora grava com a mesma regra). O custo invisível soma, no custo de produção de **toda** receita, o rateio de **todos** os gastos indiretos da empresa para 1 lote (com Aluguel de R$ 1.800 fixo, o Pão Francês passou de R$ 3,31 para R$ 2.253,31). → A prévia da FE-12 incluía o custo invisível; desde a FE-44 a web não tem prévia e mostra o custo e os preços da API ([business-rules.md](business-rules.md#receitas-formulário-e-custo)).
19. **`GET /estoque/insumos/:id` de insumo inexistente** responde `404` `INSUMO_NAO_ENCONTRADO` (mantida: é o comportamento certo). A web não usa mais essa rota.
20. **Resolvida.** ~~`POST /receitas/:id/preco-venda` sem arredondamento~~: `round2` no backend. A web continua formatando com `formatMoeda`.
21. **Resolvida.** ~~`PUT /receitas/:id` não remove a margem~~: `margem_lucro: null` limpa a margem e o preço sugerido. A web ainda não oferece apagar a margem (fica para uma issue de tela).
22. **Resolvida.** ~~Entrada sem `observacao`~~: a API aceita e grava `observacao` (até 200 caracteres). A entrada tem o campo "Observação", e o histórico a mostra (FE-39).
23. **Resolvida.** ~~Produção não grava o total de unidades~~: `totalUnidades` e a `descricao` de cada rateio vêm na produção. O detalhe da FE-15 usa os valores gravados (FE-39).
24. **`POST /vendas` não confere o estoque de produto acabado** (mantida; a barreira é a conclusão, lacuna 9). O `venda.service.ts` (`create`) só busca a receita e grava a venda `PENDENTE`; nenhum erro de "estoque insuficiente" sai do registro. → A tela da FE-16 trata `isEstoqueInsuficiente` como o mobile, mas esse caso não acontece no registro; a barreira é a conclusão (FE-17).
25. **Resolvida.** ~~`POST /vendas` aceita a lista de itens vazia~~: `@ArrayNotEmpty()`. O botão continua desabilitado com o carrinho vazio.
26. **Resolvida.** ~~`POST /vendas` não confere a empresa da receita~~: receita de outra empresa → `404`.
27. **Resolvida.** ~~Simulação divide por preço 0~~: `400` `PRECO_INVALIDO`, cuja mensagem a tela da FE-20 mostra.

## Divergências entre as issues e o backend

Vale o backend. As issues citadas devem seguir esta tabela.

| Issue | O que a issue diz                                                                                                                       | O que o backend faz                                                                                                                                       | O que a web faz                                                                                                                                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FE-48 | "seu nome" obrigatório; 409 só no e-mail                                                                                                | `nome_usuario` é opcional; o 409 pode ser `EMAIL_JA_CADASTRADO` ou `CNPJ_JA_CADASTRADO` (o CNPJ é conferido primeiro)                                     | o formulário exige o nome; o 409 vai para o campo do CNPJ com o `code` dele e para o e-mail nos outros casos                                                       |
| FE-14 | `observacao` opcional "aceita pelo DTO do backend"                                                                                      | aceita desde o monolito (lacuna 22)                                                                                                                       | mostra e envia "Observação" (FE-39)                                                                                                                                |
| FE-13 | "confirme se `GET /insumos` já traz o estoque embutido"                                                                                 | traz `quantidadeDisponivel` e, no monolito, `quantidadeMinima`                                                                                            | `GET /estoque/insumos` numa chamada só (FE-39), pela data de alteração                                                                                             |
| FE-15 | "mensagem de erro do backend (ex.: estoque de insumo insuficiente)"                                                                     | não há essa validação (lacuna 10)                                                                                                                         | mostra qualquer erro devolvido; não há esse caso hoje                                                                                                              |
| FE-15 | invalidar `vendas/estoque-disponivel` (FE-17) e o `painel`                                                                              | não há rota de estoque de produto acabado (lacuna 6) nem de painel (lacuna 4)                                                                             | invalida `producoes`, `estoque` e `insumos`, que são as fontes desses cálculos no cliente                                                                          |
| FE-16 | erro de estoque insuficiente ao registrar (`isEstoqueInsuficiente`)                                                                     | `POST /vendas` não confere estoque (lacuna 24)                                                                                                            | trata o erro como o mobile, com o link para Produções; hoje não acontece                                                                                           |
| FE-16 | invalidar `vendas` e `painel`                                                                                                           | não há rota de painel (lacuna 4)                                                                                                                          | invalida `vendas`, a fonte do painel calculado no cliente                                                                                                          |
| FE-17 | "o backend valida de novo ao processar o evento"                                                                                        | valida na conclusão e responde 422 `ESTOQUE_INSUFICIENTE` (lacuna 9)                                                                                      | confere antes pelo `GET /estoque/produtos` e trata o 422 com o mesmo diálogo (FE-39)                                                                               |
| FE-20 | resposta de custo de N lotes conforme o OVERVIEW                                                                                        | `snake_case` (lacuna 15)                                                                                                                                  | segue o DTO                                                                                                                                                        |
| FE-42 | "% da venda" sem limite citado                                                                                                          | `PERCENTUAL_VENDA` é fração do preço de 0 a menos de 1 (`validarGasto`)                                                                                   | o formulário recebe o percentual (> 0 e < 100) e envia a fração                                                                                                    |
| FE-42 | só o formulário e a lista de gastos                                                                                                     | a produção rateia só os gastos `MENSAL`, por `usoPorLote ÷ capacidadeMensal` (BE-30)                                                                      | a prévia da produção segue a fórmula nova; a prévia do custo invisível da receita saiu na FE-44 (o custo vem da API)                                               |
| FE-43 | a compra tem data, quantidade e valor pago                                                                                              | `POST /insumos/:id/compras` não aceita data: a `dataCompra` é a do registro, e a compra é imutável (BE-29)                                                | o formulário pede quantidade, valor pago e observação; o histórico mostra a data gravada                                                                           |
| FE-43 | valor pago da compra                                                                                                                    | `valorTotal ≥ 0`                                                                                                                                          | o formulário pede > 0, como no cadastro do insumo                                                                                                                  |
| FE-46 | remover a "margem realizada" antiga do contrato                                                                                         | `ItemVendaDto` ainda devolve a `margemRealizada` (legada), ao lado do `lucroReal` (BE-30)                                                                 | o `itemVendaSchema` não a declara (o Zod a descarta) e a tela mostra só o lucro real                                                                               |
| FE-10 | valor > 0                                                                                                                               | aceita 0 (`@Min(0)`)                                                                                                                                      | mantém > 0 no formulário (mais restrito, compatível)                                                                                                               |
| FE-09 | valor pago > 0                                                                                                                          | aceita 0 (`@Min(0)`)                                                                                                                                      | mantém > 0 no formulário                                                                                                                                           |
| FE-09 | erro de exclusão "ex.: insumo usado em receita, se o backend recusar"                                                                   | `DELETE /insumos/:id` não confere o uso em receitas (lacuna 13)                                                                                           | mostra a mensagem de qualquer recusa; hoje só há o `404`                                                                                                           |
| FE-07 | e-mail válido como no mobile (só confere o `@`)                                                                                         | `LoginDto` tem `@IsEmail()`; `joao@x` dá 400 em inglês                                                                                                    | o formulário usa `z.email()` ("Informe um e-mail válido")                                                                                                          |
| FE-44 | preços de "Balcão, iFood, iFood com entrega"; barra com ingredientes, contas do mês, embalagem e perdas, imposto, taxa do canal e lucro | `precos` traz só os canais **ativos** (no seed, "iFood com entrega" nasce inativo); a `composicao` tem também `gastosPorUnidade` e `gastosPercentuais`    | mostra um cartão por canal de `precos`; os gastos por unidade entram em "Embalagem e perdas", e os `PERCENTUAL_VENDA` viram "Gastos em % da venda" (só quando > 0) |
| FE-45 | "preço abaixo do custo mostra o aviso e nenhum ponto de equilíbrio"                                                                     | `pontoEquilibrio.unidades` só é `null` com margem de contribuição ≤ 0; com o preço entre o custo sem as contas do mês e o custo inteiro, devolve unidades | com lucro por unidade negativo, mostra o aviso e esconde o ponto de equilíbrio                                                                                     |
| FE-45 | "Simulação da receita": preço, canal e unidades por mês                                                                                 | o campo de preço tem 2 casas e o sugerido tem 4 (iFood 0,5513), o que tira o lucro real do configurado                                                    | preço igual ao sugerido arredondado não é enviado: a API usa o sugerido exato                                                                                      |
| FE-12 | "custo invisível = 0 na implementação padrão"                                                                                           | soma o rateio de todos os gastos da empresa para 1 lote (lacuna 18)                                                                                       | desde a FE-44 não há prévia: o custo e os preços vêm de `GET /receitas/:id`                                                                                        |
| FE-39 | "`totalUnidades` no detalhe da produção (FE-15)"                                                                                        | vem em toda `Producao`, junto com a `descricao` de cada rateio                                                                                            | o detalhe usa os dois e não busca mais os gastos indiretos                                                                                                         |
| FE-39 | ler os erros pelo `code` "quando existir"                                                                                               | o `code` vem em todo erro da API                                                                                                                          | `ApiError.code`, `temCodigo()`; o `statusCode` fica de fallback                                                                                                    |
| FE-39 | as rotas `/internal` "continuam bloqueadas, mesmo sem existir"                                                                          | não existem                                                                                                                                               | o proxy recusa com 403, como antes                                                                                                                                 |
