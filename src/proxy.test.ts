// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import {
  CURRENT_PATH_HEADER,
  SESSION_COOKIE,
} from '@/shared/auth/session-paths';
import { makeJwt } from '@/test/factories/auth.factory';
import { config, proxy } from './proxy';

const FRONT = 'http://front.test';
const VENCIDO = makeJwt({}, Date.now() - 5 * 60 * 60 * 1000);

function abrir(caminho: string, token?: string) {
  return proxy(
    new NextRequest(`${FRONT}${caminho}`, {
      headers: token ? { cookie: `${SESSION_COOKIE}=${token}` } : {},
    }),
  );
}

function destino(response: Response) {
  const location = response.headers.get('location');

  return location ? location.replace(FRONT, '') : null;
}

describe('proxy', () => {
  it('leva ao login, com a rota em redirect, quem não tem sessão', () => {
    const response = abrir('/vendas?aba=historico');

    expect(response.status).toBe(307);
    expect(destino(response)).toBe(
      '/login?redirect=%2Fvendas%3Faba%3Dhistorico',
    );
  });

  it('leva ao login com o aviso de sessão expirada quem tem o cookie vencido', () => {
    expect(destino(abrir('/insumos', VENCIDO))).toBe(
      '/login?redirect=%2Finsumos&expirada=1',
    );
    expect(destino(abrir('/', 'lixo'))).toBe('/login?expirada=1');
  });

  it('deixa passar quem tem sessão e informa a rota atual ao servidor', () => {
    const response = abrir('/insumos?q=acucar', makeJwt());

    expect(destino(response)).toBeNull();
    expect(
      response.headers.get(`x-middleware-request-${CURRENT_PATH_HEADER}`),
    ).toBe('/insumos?q=acucar');
  });

  it('mostra o login a quem não tem sessão', () => {
    expect(destino(abrir('/login'))).toBeNull();
    expect(destino(abrir('/login?redirect=%2Finsumos', VENCIDO))).toBeNull();
  });

  it('tira do login quem já tem sessão, para o destino seguro', () => {
    expect(destino(abrir('/login?redirect=%2Finsumos', makeJwt()))).toBe(
      '/insumos',
    );
    expect(
      destino(abrir('/login?redirect=https%3A%2F%2Foutro.test', makeJwt())),
    ).toBe('/');
  });

  it('deixa o design system aberto sem sessão', () => {
    expect(destino(abrir('/design-system'))).toBeNull();
    expect(destino(abrir('/design-system/listagem'))).toBeNull();
    expect(destino(abrir('/design-systemx'))).toBe(
      '/login?redirect=%2Fdesign-systemx',
    );
  });
});

describe('config.matcher', () => {
  const matcher = new RegExp(`^${config.matcher[0]}$`);

  it.each(['/', '/login', '/insumos', '/receitas/1/editar'])(
    'roda nas telas: %s',
    (caminho) => {
      expect(matcher.test(caminho)).toBe(true);
    },
  );

  it.each([
    '/api/backend/insumos',
    '/api/auth/login',
    '/_next/static/chunk.js',
    '/icon.svg',
    '/favicon.ico',
  ])('não roda em API nem em arquivos: %s', (caminho) => {
    expect(matcher.test(caminho)).toBe(false);
  });
});
