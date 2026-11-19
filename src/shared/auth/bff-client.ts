import { requisitar, type ApiFetchOptions } from '@/shared/api/request';

/**
 * Chama as rotas do próprio Next em `/api/auth` (login, logout e sessão), com o
 * mesmo núcleo do `apiFetch`: timeout de 10 s e erro como `ApiError`.
 */
export function bffFetch(
  caminho: `/api/auth/${string}`,
  opcoes: Omit<ApiFetchOptions, 'query'> = {},
): Promise<unknown> {
  // URL absoluta porque o `Request` do Node (testes) não aceita URL relativa.
  return requisitar({
    ...opcoes,
    servico: 'auth',
    url: new URL(caminho, window.location.origin),
  });
}
