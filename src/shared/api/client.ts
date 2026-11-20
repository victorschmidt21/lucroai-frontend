import {
  aplicarQuery,
  requisitar,
  validarCaminho,
  type ApiFetchOptions,
} from './request';

/** Prefixo do proxy BFF (`src/app/api/backend/[...path]/route.ts`, FE-07). */
export const PROXY_PREFIXO = '/api/backend';

/**
 * `apiFetch` do navegador: chama o proxy BFF `/api/backend<caminho>`, que
 * injeta o token do cookie `httpOnly` e repassa à API. Use nos Client
 * Components e hooks, por meio das funções de `features/<modulo>/api/`.
 *
 * Resolve com o corpo JSON (ou `undefined`, se vazio); rejeita com `ApiError`.
 */
export function apiFetch(
  caminho: string,
  opcoes: ApiFetchOptions = {},
): Promise<unknown> {
  validarCaminho(caminho);

  // URL absoluta porque o `Request` do Node (testes) não aceita URL relativa.
  const url = aplicarQuery(
    new URL(`${PROXY_PREFIXO}${caminho}`, window.location.origin),
    opcoes.query,
  );

  return requisitar({ ...opcoes, url });
}
