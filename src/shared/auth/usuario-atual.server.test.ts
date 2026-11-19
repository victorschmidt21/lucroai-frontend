// @vitest-environment node
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeJwt } from '@/test/factories/auth.factory';
import { CURRENT_PATH_HEADER, SESSION_COOKIE } from './session-paths';
import {
  getTokenDaSessao,
  getUsuarioAtual,
  lerUsuarioAtual,
} from './usuario-atual.server';

vi.mock('server-only', () => ({}));
// Fora de uma requisição do React, o `cache` não guarda nada entre chamadas.
vi.mock('next/headers', () => ({
  cookies: vi.fn<typeof cookies>(),
  headers: vi.fn<typeof headers>(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn<(url: string) => never>((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));

function comCookie(token?: string, rota?: string) {
  vi.mocked(cookies).mockResolvedValue({
    get: (nome: string) =>
      nome === SESSION_COOKIE && token !== undefined
        ? { name: nome, value: token }
        : undefined,
  } as Awaited<ReturnType<typeof cookies>>);
  vi.mocked(headers).mockResolvedValue(
    new Headers(rota ? { [CURRENT_PATH_HEADER]: rota } : {}) as Awaited<
      ReturnType<typeof headers>
    >,
  );
}

const VENCIDO = makeJwt({}, Date.now() - 5 * 60 * 60 * 1000);

beforeEach(() => {
  vi.mocked(redirect).mockClear();
});

describe('getUsuarioAtual', () => {
  it('devolve o usuário do JWT do cookie', async () => {
    comCookie(makeJwt());

    await expect(getUsuarioAtual()).resolves.toMatchObject({
      nome: 'João da Silva',
      empresa: { nome: 'Padaria Pão Feliz Ltda' },
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('leva ao login com a rota atual, sem aviso, quem não tem cookie', async () => {
    comCookie(undefined, '/insumos?q=acucar');

    await expect(getUsuarioAtual()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith(
      '/login?redirect=%2Finsumos%3Fq%3Dacucar',
    );
  });

  it('leva ao login com o aviso de sessão expirada quem tem o cookie vencido', async () => {
    comCookie(VENCIDO);

    await expect(getUsuarioAtual()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/login?expirada=1');
  });
});

describe('lerUsuarioAtual', () => {
  it('devolve null sem sessão em vigor, sem redirecionar', async () => {
    comCookie(VENCIDO);

    await expect(lerUsuarioAtual()).resolves.toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('getTokenDaSessao', () => {
  it('devolve o token só com a sessão em vigor', async () => {
    const token = makeJwt();
    comCookie(token);
    await expect(getTokenDaSessao()).resolves.toBe(token);

    comCookie(VENCIDO);
    await expect(getTokenDaSessao()).resolves.toBeUndefined();
  });
});
