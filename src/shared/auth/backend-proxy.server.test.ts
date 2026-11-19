// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { envelope, nestError } from '@/test/api';
import { makeNextRequest, stubAmbienteDoBff } from '@/test/bff';
import { makeJwt } from '@/test/factories/auth.factory';
import { makeInsumo } from '@/test/factories/insumo.factory';
import { server } from '@/test/server';
import { proxyParaBackend, validarSegmentos } from './backend-proxy.server';
import { SESSION_COOKIE } from './session-paths';

vi.mock('server-only', () => ({}));

beforeEach(() => {
  stubAmbienteDoBff();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const TOKEN = makeJwt();

type Recebido = {
  url: string;
  method: string;
  authorization: string | null;
  cookie: string | null;
  contentType: string | null;
  outros: string | null;
  corpo: string;
};

/** Registra o que chegou ao serviço e responde com o que o teste pedir. */
function espionar(
  url: string,
  responder: () => Response = () => HttpResponse.json(envelope([])),
) {
  const recebidos: Recebido[] = [];
  server.use(
    http.all(url, async ({ request }) => {
      recebidos.push({
        url: request.url,
        method: request.method,
        authorization: request.headers.get('authorization'),
        cookie: request.headers.get('cookie'),
        contentType: request.headers.get('content-type'),
        outros: request.headers.get('x-outro'),
        corpo: await request.text(),
      });
      return responder();
    }),
  );

  return recebidos;
}

function cookieDaSessao(response: Response) {
  return response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
}

describe('validarSegmentos', () => {
  it('junta um caminho válido', () => {
    expect(validarSegmentos(['estoque', 'insumos', '1'])).toEqual({
      ok: true,
      caminho: 'estoque/insumos/1',
    });
  });

  it.each([
    [['insumos', 'internal', '1']],
    [['gastos-indiretos', 'internal', 'empresa', '1']],
    [['receitas', 'Internal', '1']],
    [['INTERNAL']],
  ])('recusa as rotas internal com 403: %j', (segmentos) => {
    expect(validarSegmentos(segmentos)).toEqual({ ok: false, status: 403 });
  });

  it.each([
    [[]],
    [['insumos', '..', 'vendas']],
    [['.']],
    [['insumos', '']],
    [['insumos/internal']],
    [['insumos\\1']],
  ])('recusa caminho malformado com 400: %j', (segmentos) => {
    expect(validarSegmentos(segmentos)).toEqual({ ok: false, status: 400 });
  });

  it.each([[['auth', 'login']], [['auth', 'empresa']], [['Auth', 'LOGIN']]])(
    'esconde o login e o cadastro de empresa com 404: %j',
    (segmentos) => {
      expect(validarSegmentos(segmentos)).toEqual({ ok: false, status: 404 });
    },
  );
});

describe('proxyParaBackend', () => {
  it('monta a URL do serviço, injeta o Bearer e repassa status e corpo', async () => {
    const insumos = [makeInsumo()];
    const recebidos = espionar('http://catalog.test/insumos', () =>
      HttpResponse.json(envelope(insumos)),
    );

    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/catalog/insumos', {
        token: TOKEN,
        headers: { 'x-outro': 'nao-repassar' },
      }),
      'catalog',
      ['insumos'],
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(envelope(insumos));
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(recebidos).toEqual([
      expect.objectContaining({
        url: 'http://catalog.test/insumos',
        method: 'GET',
        authorization: `Bearer ${TOKEN}`,
        cookie: null,
        outros: null,
      }),
    ]);
  });

  it.each([
    ['auth', 'http://auth.test/x'],
    ['recipe', 'http://recipe.test/x'],
    ['operations', 'http://operations.test/x'],
    ['sales', 'http://sales.test/x'],
  ])('usa a variável de ambiente do serviço %s', async (servico, url) => {
    const recebidos = espionar(url);

    await proxyParaBackend(
      makeNextRequest(`/api/backend/${servico}/x`, { token: TOKEN }),
      servico,
      ['x'],
    );

    expect(recebidos).toHaveLength(1);
  });

  it('repassa método, query e corpo', async () => {
    const recebidos = espionar('http://sales.test/vendas/7/status', () =>
      HttpResponse.json(envelope({ id: 7 })),
    );

    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/sales/vendas/7/status?origem=web', {
        method: 'PATCH',
        token: TOKEN,
        body: JSON.stringify({ status: 'CONCLUIDA' }),
        headers: { 'content-type': 'application/json' },
      }),
      'sales',
      ['vendas', '7', 'status'],
    );

    expect(response.status).toBe(200);
    expect(recebidos[0]).toMatchObject({
      url: 'http://sales.test/vendas/7/status?origem=web',
      method: 'PATCH',
      contentType: 'application/json',
      corpo: JSON.stringify({ status: 'CONCLUIDA' }),
    });
  });

  it('codifica os segmentos ao montar a URL', async () => {
    const recebidos = espionar('http://catalog.test/insumos/a%3Fb');

    await proxyParaBackend(
      makeNextRequest('/api/backend/catalog/insumos/a%3Fb', { token: TOKEN }),
      'catalog',
      ['insumos', 'a?b'],
    );

    expect(recebidos[0]?.url).toBe('http://catalog.test/insumos/a%3Fb');
  });

  it('repassa o 204 sem corpo', async () => {
    espionar(
      'http://catalog.test/insumos/1',
      () => new HttpResponse(null, { status: 204 }),
    );

    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/catalog/insumos/1', {
        method: 'DELETE',
        token: TOKEN,
      }),
      'catalog',
      ['insumos', '1'],
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('repassa o erro do serviço sem alterar', async () => {
    const erro = nestError(400, 'Venda já finalizada não pode ser alterada');
    espionar('http://sales.test/vendas/1/status', () =>
      HttpResponse.json(erro, { status: 400 }),
    );

    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/sales/vendas/1/status', {
        method: 'PATCH',
        token: TOKEN,
        body: '{}',
      }),
      'sales',
      ['vendas', '1', 'status'],
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(erro);
    expect(cookieDaSessao(response)).toBeUndefined();
  });

  it('apaga o cookie quando o serviço responde 401', async () => {
    espionar('http://catalog.test/insumos', () =>
      HttpResponse.json(nestError(401, 'Unauthorized'), { status: 401 }),
    );

    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/catalog/insumos', { token: TOKEN }),
      'catalog',
      ['insumos'],
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual(nestError(401, 'Unauthorized'));
    expect(cookieDaSessao(response)).toMatch(/Max-Age=0/);
  });

  it.each([
    ['sem cookie', undefined],
    ['com token ilegível', 'lixo'],
    ['com token vencido', makeJwt({}, Date.now() - 5 * 60 * 60 * 1000)],
  ])('responde 401 %s, sem chamar o serviço', async (_caso, token) => {
    const recebidos = espionar('http://catalog.test/insumos');

    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/catalog/insumos', { token }),
      'catalog',
      ['insumos'],
    );

    expect(response.status).toBe(401);
    expect(cookieDaSessao(response)).toMatch(/Max-Age=0/);
    expect(recebidos).toHaveLength(0);
  });

  it('recusa serviço desconhecido com 404', async () => {
    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/pagamentos/x', { token: TOKEN }),
      'pagamentos',
      ['x'],
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ statusCode: 404 });
  });

  it('recusa as rotas internal com 403, sem chamar o serviço', async () => {
    const recebidos = espionar('http://catalog.test/insumos/internal/1');

    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/catalog/insumos/internal/1', {
        token: TOKEN,
      }),
      'catalog',
      ['insumos', 'internal', '1'],
    );

    expect(response.status).toBe(403);
    expect(recebidos).toHaveLength(0);
  });

  it('recusa caminho malformado com 400', async () => {
    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/catalog/x', { token: TOKEN }),
      'catalog',
      ['insumos', '..', 'x'],
    );

    expect(response.status).toBe(400);
  });

  it('esconde o login do backend com 404', async () => {
    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/auth/auth/login', {
        method: 'POST',
        token: TOKEN,
        body: '{}',
      }),
      'auth',
      ['auth', 'login'],
    );

    expect(response.status).toBe(404);
  });

  it.each([
    ['de outro site', 'http://outro.test'],
    ['ausente', null],
    ['inválida', 'nao-e-url'],
  ])(
    'recusa com 403 método que altera dados com origem %s',
    async (_c, origin) => {
      const recebidos = espionar('http://catalog.test/insumos');

      const response = await proxyParaBackend(
        makeNextRequest('/api/backend/catalog/insumos', {
          method: 'POST',
          token: TOKEN,
          origin,
          body: '{}',
        }),
        'catalog',
        ['insumos'],
      );

      expect(response.status).toBe(403);
      expect(recebidos).toHaveLength(0);
    },
  );

  it('aceita GET sem o header Origin', async () => {
    espionar('http://catalog.test/insumos');

    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/catalog/insumos', {
        token: TOKEN,
        origin: null,
      }),
      'catalog',
      ['insumos'],
    );

    expect(response.status).toBe(200);
  });

  it('responde 502 quando o serviço está fora do ar', async () => {
    server.use(
      http.get('http://catalog.test/insumos', () => HttpResponse.error()),
    );

    const response = await proxyParaBackend(
      makeNextRequest('/api/backend/catalog/insumos', { token: TOKEN }),
      'catalog',
      ['insumos'],
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ statusCode: 502 });
  });
});
