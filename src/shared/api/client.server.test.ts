// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import loginFixture from '@/test/fixtures/auth/login.json';
import erroLogin from '@/test/fixtures/erros/401-login.json';
import { server } from '@/test/server';
import { apiFetch, urlDaApi } from './client.server';
import { loginResponseSchema } from './contracts/auth';
import { ApiError } from './errors';
import { unwrap } from './request';

vi.mock('server-only', () => ({}));

beforeEach(() => {
  vi.stubEnv('API_URL', 'http://api.test/');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('apiFetch (servidor)', () => {
  it('lê a URL única da API do ambiente, sem a barra final', () => {
    expect(urlDaApi()).toBe('http://api.test');
  });

  it('chama a API direto, com o token como Bearer', async () => {
    const recebidos: unknown[] = [];
    server.use(
      http.get('http://api.test/insumos', ({ request }) => {
        recebidos.push({
          url: request.url,
          authorization: request.headers.get('authorization'),
        });
        return HttpResponse.json([]);
      }),
    );

    await apiFetch('/insumos', { token: 'jwt-de-teste' });

    expect(recebidos).toEqual([
      {
        url: 'http://api.test/insumos',
        authorization: 'Bearer jwt-de-teste',
      },
    ]);
  });

  it('faz o login sem token e devolve o JSON puro', async () => {
    const autorizacoes: (string | null)[] = [];
    server.use(
      http.post('http://api.test/auth/login', ({ request }) => {
        autorizacoes.push(request.headers.get('authorization'));
        return HttpResponse.json(loginFixture);
      }),
    );

    const corpo = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email: 'joao@padariapaofeliz.com.br', senha: '123456' },
    });

    expect(autorizacoes).toEqual([null]);
    expect(unwrap(corpo, loginResponseSchema).access_token).toBe(
      loginFixture.access_token,
    );
  });

  it('rejeita com ApiError no erro da API, com o code', async () => {
    server.use(
      http.post('http://api.test/auth/login', () =>
        HttpResponse.json(erroLogin, { status: 401 }),
      ),
    );

    const erro = await apiFetch('/auth/login', {
      method: 'POST',
      body: {},
    }).catch((cause: unknown) => cause);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({
      statusCode: 401,
      code: 'CREDENCIAIS_INVALIDAS',
    });
  });

  it('recusa as rotas /internal', () => {
    expect(() => apiFetch('/receitas/internal/1')).toThrow(
      'Caminho de API não permitido',
    );
  });
});
