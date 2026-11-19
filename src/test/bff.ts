import { NextRequest } from 'next/server';
import { vi } from 'vitest';
import { SESSION_COOKIE } from '@/shared/auth/session-paths';

/** Origem do front nos testes do BFF, igual a `NEXT_PUBLIC_APP_URL`. */
export const FRONT = 'http://front.test';

export const URLS_DOS_SERVICOS = {
  AUTH_API_URL: 'http://auth.test',
  CATALOG_API_URL: 'http://catalog.test/',
  RECIPE_API_URL: 'http://recipe.test',
  OPERATIONS_API_URL: 'http://operations.test',
  SALES_API_URL: 'http://sales.test',
};

/** As cinco URLs de serviço e a do front; desfaça com `vi.unstubAllEnvs()`. */
export function stubAmbienteDoBff() {
  for (const [nome, valor] of Object.entries(URLS_DOS_SERVICOS)) {
    vi.stubEnv(nome, valor);
  }
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
