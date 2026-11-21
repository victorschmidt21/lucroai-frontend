import 'server-only';
import { getServerEnv } from '@/shared/config/env.server';
import {
  aplicarQuery,
  requisitar,
  validarCaminho,
  type ApiFetchOptions,
} from './request';

export type ServerApiFetchOptions = ApiFetchOptions & {
  /**
   * JWT do usuário, enviado como `Authorization: Bearer`. É parâmetro, e não
   * lido aqui, porque nem toda chamada tem sessão (o login) e o cookie de
   * sessão é da FE-07, que passa o token lido dele.
   */
  token?: string;
};

/** URL base da API, sempre da variável de ambiente, nunca da requisição. */
export function urlDaApi() {
  return getServerEnv().API_URL.replace(/\/+$/, '');
}

/**
 * `apiFetch` do servidor: chama a API direto (`API_URL` + caminho). Use em
 * Server Components e Route Handlers.
 *
 * Resolve com o corpo JSON (ou `undefined`, se vazio); rejeita com `ApiError`.
 */
export function apiFetch(
  caminho: string,
  { token, ...opcoes }: ServerApiFetchOptions = {},
): Promise<unknown> {
  validarCaminho(caminho);

  const url = aplicarQuery(new URL(`${urlDaApi()}${caminho}`), opcoes.query);

  return requisitar({
    ...opcoes,
    url,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
