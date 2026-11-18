/** Cookie `httpOnly` com o JWT do backend (docs/security.md#sessão-bff--cookie-httponly). */
export const SESSION_COOKIE = 'lucroai_sessao';

/** Preenchido pelo `src/proxy.ts`, porque um Server Component não sabe qual é a rota atual. */
export const CURRENT_PATH_HEADER = 'x-lucroai-path';

export const LOGIN_PATH = '/login';
export const DEFAULT_PATH = '/';

/** `?expirada=1` no login mostra "Sessão expirada. Faça login novamente.". */
export const PARAM_SESSAO_EXPIRADA = 'expirada';

const BASE_INTERNA = 'http://lucroai.invalid';

/**
 * Aceita só caminho interno, para evitar redirecionamento aberto. Passa pelo
 * `URL` porque o navegador ignora tabulação e quebra de linha: `/\t/site.com`
 * começa com uma barra só, mas leva a outro site.
 */
export function getSafeRedirect(value: unknown) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    !URL.canParse(value, BASE_INTERNA)
  ) {
    return DEFAULT_PATH;
  }

  const url = new URL(value, BASE_INTERNA);

  // Voltar para o login depois de entrar criaria um ciclo de redirecionamentos.
  if (url.origin !== BASE_INTERNA || url.pathname === LOGIN_PATH) {
    return DEFAULT_PATH;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

/** `/login?redirect=<destino>`, com `&expirada=1` quando a sessão acabou no meio do uso. */
export function getLoginPath(
  destino: string,
  { expirada = false }: { expirada?: boolean } = {},
) {
  const params = new URLSearchParams();
  const seguro = getSafeRedirect(destino);

  if (seguro !== DEFAULT_PATH) params.set('redirect', seguro);
  if (expirada) params.set(PARAM_SESSAO_EXPIRADA, '1');

  const query = params.toString();

  return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}
