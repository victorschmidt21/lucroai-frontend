// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import loginFixture from '@/test/fixtures/auth/login.json';
import { server } from '@/test/server';
import { apiFetch, urlDoServico } from './client.server';
import { loginResponseSchema } from './contracts/auth';
import { ApiError } from './errors';
import { unwrap } from './request';

vi.mock('server-only', () => ({}));

const ENV = {
  AUTH_API_URL: 'http://auth.test',
  CATALOG_API_URL: 'http://catalog.test/',
  RECIPE_API_URL: 'http://recipe.test',
  OPERATIONS_API_URL: 'http://operations.test',
  SALES_API_URL: 'http://sales.test',
};

beforeEach(() => {
  for (const [nome, valor] of Object.entries(ENV)) vi.stubEnv(nome, valor);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('apiFetch (servidor)', () => {
  it('lê a URL de cada serviço do ambiente', () => {
    expect(urlDoServico('sales')).toBe('http://sales.test');
    expect(urlDoServico('operations')).toBe('http://operations.test');
  });

  it('chama o serviço direto, com o token como Bearer', async () => {
    const recebidos: unknown[] = [];
    server.use(
      http.get('http://catalog.test/insumos', ({ request }) => {
        recebidos.push({
          url: request.url,
          authorization: request.headers.get('authorization'),
        });
        return HttpResponse.json({ data: [], links: {} });
      }),
    );

    await apiFetch('catalog', '/insumos', { token: 'jwt-de-teste' });

    expect(recebidos).toEqual([
      {
        url: 'http://catalog.test/insumos',
        authorization: 'Bearer jwt-de-teste',
      },
    ]);
  });

  it('faz o login sem token e devolve o envelope', async () => {
    const autorizacoes: (string | null)[] = [];
    server.use(
      http.post('http://auth.test/auth/login', ({ request }) => {
        autorizacoes.push(request.headers.get('authorization'));
        return HttpResponse.json(loginFixture);
      }),
    );

    const corpo = await apiFetch('auth', '/auth/login', {
      method: 'POST',
      body: { email: 'joao@padariapaofeliz.com.br', senha: '123456' },
    });

    expect(autorizacoes).toEqual([null]);
    expect(unwrap(corpo, loginResponseSchema).access_token).toBe(
      loginFixture.data.access_token,
    );
  });

  it('rejeita com ApiError no erro do serviço', async () => {
    server.use(
      http.post('http://auth.test/auth/login', () =>
        HttpResponse.json(
          {
            message: 'Credenciais inválidas',
            error: 'Unauthorized',
            statusCode: 401,
          },
          { status: 401 },
        ),
      ),
    );

    const erro = await apiFetch('auth', '/auth/login', {
      method: 'POST',
      body: {},
    }).catch((cause: unknown) => cause);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({ statusCode: 401, servico: 'auth' });
  });

  it('recusa as rotas /internal', () => {
    expect(() => apiFetch('recipe', '/receitas/internal/1')).toThrow(
      'Caminho de API não permitido',
    );
  });
});
