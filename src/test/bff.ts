import { NextRequest } from 'next/server';
import { vi } from 'vitest';
import { SESSION_COOKIE } from '@/shared/auth/session-paths';

/** Origem do front nos testes do BFF, igual a `NEXT_PUBLIC_APP_URL`. */
export const FRONT = 'http://front.test';

/** URL da API nos testes do BFF (com barra final, que o código remove). */
export const API_URL = 'http://api.test/';

/** A URL da API e a do front; desfaça com `vi.unstubAllEnvs()`. */
export function stubAmbienteDoBff() {
  vi.stubEnv('API_URL', API_URL);
  vi.stubEnv('NEXT_PUBLIC_APP_URL', FRONT);
}

type OpcoesDaRequisicao = {
  method?: string;
  /** Valor do cookie de sessão; sem ele, a requisição não tem cookie. */
  token?: string;
  /** `null` remove o header `Origin`. Padrão: a origem do front. */
  origin?: string | null;
  body?: string;
  headers?: Record<string, string>;
};

/** Requisição do navegador ao Next, como o Route Handler a recebe. */
export function makeNextRequest(
  caminho: string,
  {
    method = 'GET',
    token,
    origin = FRONT,
    body,
    headers = {},
  }: OpcoesDaRequisicao = {},
) {
  return new NextRequest(`${FRONT}${caminho}`, {
    method,
    body,
    headers: {
      ...(origin ? { origin } : {}),
      ...(token === undefined ? {} : { cookie: `${SESSION_COOKIE}=${token}` }),
      ...headers,
    },
  });
}
