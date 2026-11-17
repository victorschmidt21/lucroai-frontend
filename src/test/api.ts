import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw';
import type { LoginResponse } from '@/shared/api/contracts/auth';
import type { GastoIndireto, Insumo } from '@/shared/api/contracts/catalog';
import type {
  Estoque,
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
import type { Servico } from '@/shared/api/servicos';

/** URL do proxy BFF, sem depender da origem: `*\/api/backend/catalog/insumos`. */
export function apiUrl(servico: Servico, caminho: string) {
  return `*/api/backend/${servico}${caminho}`;
}

/** Corpo como o `HateoasInterceptor` devolve (os `links` são ignorados pela web). */
export function envelope<T>(data: T) {
  return { data, links: {} };
}

/** Erro no formato padrão do NestJS. */
export function nestError(
  statusCode: number,
  message: string | string[],
  error?: string,
) {
  return { statusCode, message, ...(error ? { error } : {}) };
}

/**
 * Rotas da web (docs/api-integration.md#rotas-usadas-pela-web) e o `data` de
 * cada resposta, tipado pelo contrato: se o contrato mudar, o `typecheck`
 * aponta os testes desatualizados. `undefined` é resposta vazia (204).
 */
export type RotasDaApi = {
  'POST auth /auth/login': LoginResponse;
  'GET catalog /insumos': Insumo[];
  'GET catalog /insumos/:id': Insumo;
  'POST catalog /insumos': Insumo;
  'PATCH catalog /insumos/:id': Insumo;
  'DELETE catalog /insumos/:id': undefined;
  'GET catalog /gastos-indiretos': GastoIndireto[];
  'GET catalog /gastos-indiretos/:id': GastoIndireto;
  'POST catalog /gastos-indiretos': GastoIndireto;
  'PUT catalog /gastos-indiretos/:id': GastoIndireto;
  'DELETE catalog /gastos-indiretos/:id': undefined;
  'GET recipe /receitas': Receita[];
  'GET recipe /receitas/:id': Receita;
  'POST recipe /receitas': Receita;
  'PUT recipe /receitas/:id': Receita;
  'DELETE recipe /receitas/:id': undefined;
  'GET recipe /receitas/:id/custo': ReceitaCusto;
  'POST recipe /receitas/:id/custo/simular': ReceitaCusto;
  'POST recipe /receitas/:id/simular': SimulacaoCenario;
  'POST recipe /receitas/:id/preco-venda': PrecoVenda;
  'GET operations /estoque/insumos/:id': Estoque;
  'POST operations /estoque/insumos/:id/entrada': Estoque;
  'GET operations /estoque/insumos/:id/movimentacoes': MovimentacaoEstoque[];
  'GET operations /producoes': Producao[];
  'GET operations /producoes/:id': Producao;
  'POST operations /producoes': Producao;
  'GET sales /vendas': Venda[];
  'GET sales /vendas/:id': Venda;
  'POST sales /vendas': Venda;
  'PATCH sales /vendas/:id/status': Venda;
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
  const [method, servico, caminho] = rota.split(' ') as [
    keyof typeof STATUS_PADRAO,
    Servico,
    string,
  ];

  return { method, servico, caminho };
}

function handlerDe(
  rota: RotaDaApi,
  responder: (contexto: Contexto) => Promise<Response> | Response,
) {
  const { method, servico, caminho } = separarRota(rota);
  const criar = {
    GET: http.get,
    POST: http.post,
    PUT: http.put,
    PATCH: http.patch,
    DELETE: http.delete,
  }[method];

  return criar(apiUrl(servico, caminho), ({ request, params }) =>
    responder({ request, params }),
  );
}

/**
 * Handler do MSW de uma rota da API, com a resposta no envelope e o status
 * padrão do NestJS (201 nos `POST`, 204 nos `DELETE`). A resposta pode ser uma
 * função, para ler o corpo ou os parâmetros da requisição:
 *
 * ```ts
 * server.use(mockApi('GET catalog /insumos', [makeInsumo()]));
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

    return HttpResponse.json(envelope(data) as DefaultBodyType, { status });
  });
}

/** Handler que responde o erro padrão do NestJS na rota. */
export function mockApiErro(
  rota: RotaDaApi,
  statusCode: number,
  message: string | string[],
  error?: string,
) {
  return handlerDe(rota, () =>
    HttpResponse.json(nestError(statusCode, message, error), {
      status: statusCode,
    }),
  );
}

/** Handler que simula a falha de rede (servidor fora do ar). */
export function mockApiSemConexao(rota: RotaDaApi) {
  return handlerDe(rota, () => HttpResponse.error());
}
