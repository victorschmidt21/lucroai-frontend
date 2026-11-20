import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw';
import type { LoginResponse } from '@/shared/api/contracts/auth';
import type { GastoIndireto, Insumo } from '@/shared/api/contracts/catalog';
import type {
  Estoque,
  EstoqueProduto,
  MovimentacaoEstoque,
  Producao,
} from '@/shared/api/contracts/operations';
import type {
  PrecoVenda,
  Receita,
  ReceitaCusto,
  SimulacaoCenario,
} from '@/shared/api/contracts/recipe';
import type { Venda } from '@/shared/api/contracts/sales';

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
    timestamp: '2026-11-19T12:00:00.000Z',
  };
}

/**
 * Rotas da web (docs/api-integration.md#rotas-usadas-pela-web) e o `data` de
 * cada resposta, tipado pelo contrato: se o contrato mudar, o `typecheck`
 * aponta os testes desatualizados. `undefined` é resposta vazia (204).
 */
export type RotasDaApi = {
  'POST /auth/login': LoginResponse;
  'GET /insumos': Insumo[];
  'GET /insumos/:id': Insumo;
  'POST /insumos': Insumo;
  'PATCH /insumos/:id': Insumo;
  'DELETE /insumos/:id': undefined;
  'GET /gastos-indiretos': GastoIndireto[];
  'GET /gastos-indiretos/:id': GastoIndireto;
  'POST /gastos-indiretos': GastoIndireto;
  'PUT /gastos-indiretos/:id': GastoIndireto;
  'DELETE /gastos-indiretos/:id': undefined;
  'GET /receitas': Receita[];
  'GET /receitas/:id': Receita;
  'POST /receitas': Receita;
  'PUT /receitas/:id': Receita;
  'DELETE /receitas/:id': undefined;
  'GET /receitas/:id/custo': ReceitaCusto;
  'POST /receitas/:id/custo/simular': ReceitaCusto;
  'POST /receitas/:id/simular': SimulacaoCenario;
  'POST /receitas/:id/preco-venda': PrecoVenda;
  'GET /estoque/insumos': Estoque[];
  'POST /estoque/insumos/:id/entrada': Estoque;
  'PATCH /estoque/insumos/:id/minimo': Estoque;
  'GET /estoque/insumos/:id/movimentacoes': MovimentacaoEstoque[];
  'GET /estoque/produtos': EstoqueProduto[];
  'GET /producoes': Producao[];
  'GET /producoes/:id': Producao;
  'POST /producoes': Producao;
  'GET /vendas': Venda[];
  'GET /vendas/:id': Venda;
  'POST /vendas': Venda;
  'PATCH /vendas/:id/status': Venda;
};

export type RotaDaApi = keyof RotasDaApi;

type Contexto = {
  request: Request;
  params: PathParams;
};

type Resposta<R extends RotaDaApi> =
  | RotasDaApi[R]
  | ((contexto: Contexto) => RotasDaApi[R] | Promise<RotasDaApi[R]>);

const STATUS_PADRAO = {
  GET: 200,
  POST: 201,
  PUT: 200,
  PATCH: 200,
  DELETE: 204,
};

function separarRota(rota: RotaDaApi) {
  const [method, caminho] = rota.split(' ') as [
    keyof typeof STATUS_PADRAO,
    string,
  ];

  return { method, caminho };
}

function handlerDe(
  rota: RotaDaApi,
  responder: (contexto: Contexto) => Promise<Response> | Response,
) {
  const { method, caminho } = separarRota(rota);
  const criar = {
    GET: http.get,
    POST: http.post,
    PUT: http.put,
    PATCH: http.patch,
    DELETE: http.delete,
  }[method];

  return criar(apiUrl(caminho), ({ request, params }) =>
    responder({ request, params }),
  );
}

/**
 * Handler do MSW de uma rota da API, com a resposta em JSON puro e o status
 * padrão do NestJS (201 nos `POST`, 204 nos `DELETE`). A resposta pode ser uma
 * função, para ler o corpo ou os parâmetros da requisição:
 *
 * ```ts
 * server.use(mockApi('GET /insumos', [makeInsumo()]));
 * ```
 */
export function mockApi<R extends RotaDaApi>(
  rota: R,
  resposta: Resposta<R>,
  init: { status?: number } = {},
) {
  const { method } = separarRota(rota);
  const status = init.status ?? STATUS_PADRAO[method];

  return handlerDe(rota, async (contexto) => {
    const data =
      typeof resposta === 'function'
        ? await (resposta as (c: Contexto) => unknown)(contexto)
        : resposta;

    if (data === undefined) {
      return new HttpResponse(null, { status });
    }

    return HttpResponse.json(data as DefaultBodyType, { status });
  });
}

/** Handler que responde o erro no formato da API na rota. */
export function mockApiErro(
  rota: RotaDaApi,
  statusCode: number,
  message: string | string[],
  code?: string,
) {
  return handlerDe(rota, () =>
    HttpResponse.json(apiErrorBody(statusCode, message, code), {
      status: statusCode,
    }),
  );
}

/** Handler que simula a falha de rede (servidor fora do ar). */
export function mockApiSemConexao(rota: RotaDaApi) {
  return handlerDe(rota, () => HttpResponse.error());
}
