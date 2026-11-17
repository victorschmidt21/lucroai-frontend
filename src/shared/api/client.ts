import {
  aplicarQuery,
  requisitar,
  validarCaminho,
  type ApiFetchOptions,
} from './request';
import type { Servico } from './servicos';

/** Prefixo do proxy BFF (`src/app/api/backend/[servico]/[...path]/route.ts`, FE-07). */
export const PROXY_PREFIXO = '/api/backend';

/**
 * `apiFetch` do navegador: chama o proxy BFF `/api/backend/<servico><caminho>`,
 * que injeta o token do cookie `httpOnly` e repassa ao serviço. Use nos Client
 * Components e hooks, por meio das funções de `features/<modulo>/api/`.
 *
 * Resolve com o corpo JSON (ou `undefined`, se vazio); rejeita com `ApiError`.
 */
export function apiFetch(
  servico: Servico,
  caminho: string,
  opcoes: ApiFetchOptions = {},
): Promise<unknown> {
  validarCaminho(caminho);

  // URL absoluta porque o `Request` do Node (testes) não aceita URL relativa.
  const url = aplicarQuery(
    new URL(`${PROXY_PREFIXO}/${servico}${caminho}`, window.location.origin),
    opcoes.query,
  );

  return requisitar({ ...opcoes, servico, url });
}
