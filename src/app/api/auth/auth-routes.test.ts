// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE } from '@/shared/auth/session-paths';
import { apiErrorBody } from '@/test/api';
import { makeNextRequest, stubAmbienteDoBff } from '@/test/bff';
import { makeJwt } from '@/test/factories/auth.factory';
import { server } from '@/test/server';
import { POST as login } from './login/route';
import { POST as logout } from './logout/route';
import { GET as sessao } from './sessao/route';

vi.mock('server-only', () => ({}));

beforeEach(() => {
  stubAmbienteDoBff();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

const CREDENCIAIS = {
  email: 'joao@padariapaofeliz.com.br',
  senha: '123456',
};

function cookieDaSessao(response: Response) {
  return response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
}

function postLogin(body: unknown, origin?: string | null) {
  return login(
    makeNextRequest('/api/auth/login', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      origin,
    }),
  );
}

describe('POST /api/auth/login', () => {
  it('grava o token no cookie httpOnly com o maxAge do exp e não o devolve', async () => {
    // Só o `Date`: o MSW continua com os timers reais.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.UTC(2026, 10, 17, 12, 0, 0));
    const token = makeJwt();
    const recebidos: unknown[] = [];
    server.use(
      http.post('http://api.test/auth/login', async ({ request }) => {
        recebidos.push(await request.json());
        return HttpResponse.json({ access_token: token });
      }),
    );

    const response = await postLogin({ ...CREDENCIAIS, extra: 'x' });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    // Só os campos do LoginDto chegam ao backend.
    expect(recebidos).toEqual([CREDENCIAIS]);
    const cookie = cookieDaSessao(response);
    expect(cookie).toContain(`${SESSION_COOKIE}=${token}`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/Max-Age=14400;/);
  });

  it('dispensa o Secure só em desenvolvimento', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    server.use(
      http.post('http://api.test/auth/login', () =>
        HttpResponse.json({ access_token: makeJwt() }),
      ),
    );

    const response = await postLogin(CREDENCIAIS);

    expect(cookieDaSessao(response)).not.toMatch(/Secure/i);
  });

  it('repassa o 401 de credenciais inválidas sem gravar cookie', async () => {
    server.use(
      http.post('http://api.test/auth/login', () =>
        HttpResponse.json(
          apiErrorBody(401, 'Credenciais inválidas', 'CREDENCIAIS_INVALIDAS'),
          { status: 401 },
        ),
      ),
    );

    const response = await postLogin({ ...CREDENCIAIS, senha: 'errada' });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      statusCode: 401,
      code: 'CREDENCIAIS_INVALIDAS',
      message: 'Credenciais inválidas',
    });
    expect(cookieDaSessao(response)).toBeUndefined();
  });

  it('repassa o 400 de validação do backend', async () => {
    server.use(
      http.post('http://api.test/auth/login', () =>
        HttpResponse.json(
          apiErrorBody(
            400,
            'Os dados enviados são inválidos',
            'DADOS_INVALIDOS',
          ),
          { status: 400 },
        ),
      ),
    );

    const response = await postLogin({ ...CREDENCIAIS, email: 'x' });

    expect(response.status).toBe(400);
  });

  it.each([
    ['fora do ar', () => HttpResponse.error()],
    [
      'sem token legível',
      () => HttpResponse.json({ access_token: 'nao-e-jwt' }),
    ],
    ['fora do contrato', () => HttpResponse.json({ token: 'x' })],
  ])('responde 502 com o auth-service %s', async (_caso, responder) => {
    server.use(http.post('http://api.test/auth/login', responder));

    const response = await postLogin(CREDENCIAIS);

    expect(response.status).toBe(502);
    expect(cookieDaSessao(response)).toBeUndefined();
  });

  it.each([
    ['que não é JSON', 'nao-e-json'],
    ['sem a senha', { email: CREDENCIAIS.email }],
    ['com campos de outro tipo', { email: 1, senha: 2 }],
  ])('recusa com 400 o corpo %s', async (_caso, body) => {
    const response = await postLogin(body);

    expect(response.status).toBe(400);
  });

  it('recusa com 403 a origem de outro site', async () => {
    const response = await postLogin(CREDENCIAIS, 'http://outro.test');

    expect(response.status).toBe(403);
  });
});

describe('POST /api/auth/logout', () => {
  it('apaga o cookie sem chamar o backend', async () => {
    const response = logout(
      makeNextRequest('/api/auth/logout', { method: 'POST', token: makeJwt() }),
    );

    expect(response.status).toBe(204);
    expect(cookieDaSessao(response)).toMatch(/Max-Age=0/);
  });

  it('recusa com 403 a origem de outro site', () => {
    const response = logout(
      makeNextRequest('/api/auth/logout', {
        method: 'POST',
        origin: 'http://outro.test',
      }),
    );

    expect(response.status).toBe(403);
    expect(cookieDaSessao(response)).toBeUndefined();
  });
});

describe('GET /api/auth/sessao', () => {
  it('devolve o usuário e a empresa do JWT, sem o token', async () => {
    const token = makeJwt();

    const response = sessao(makeNextRequest('/api/auth/sessao', { token }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const corpo = (await response.json()) as Record<string, unknown>;
    expect(corpo).toMatchObject({
      id: 1,
      nome: 'João da Silva',
      email: 'joao@padariapaofeliz.com.br',
      empresa: { nome: 'Padaria Pão Feliz Ltda' },
    });
    expect(JSON.stringify(corpo)).not.toContain(token);
  });

  it('responde 401 sem cookie, sem mexer no cookie', () => {
    const response = sessao(makeNextRequest('/api/auth/sessao'));

    expect(response.status).toBe(401);
    expect(cookieDaSessao(response)).toBeUndefined();
  });

  it('responde 401 e apaga o cookie com o token vencido', () => {
    const vencido = makeJwt({}, Date.now() - 5 * 60 * 60 * 1000);

    const response = sessao(
      makeNextRequest('/api/auth/sessao', { token: vencido }),
    );

    expect(response.status).toBe(401);
    expect(cookieDaSessao(response)).toMatch(/Max-Age=0/);
  });
});
