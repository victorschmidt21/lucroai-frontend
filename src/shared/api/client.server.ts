import 'server-only';
import { getServerEnv } from '@/shared/config/env.server';
import type { ServerEnv } from '@/shared/config/env.schema';
import {
  aplicarQuery,
  requisitar,
  validarCaminho,
  type ApiFetchOptions,
} from './request';
import type { Servico } from './servicos';

const VARIAVEL_DO_SERVICO = {
  auth: 'AUTH_API_URL',
  catalog: 'CATALOG_API_URL',
  recipe: 'RECIPE_API_URL',
  operations: 'OPERATIONS_API_URL',
  sales: 'SALES_API_URL',
} as const satisfies Record<Servico, keyof ServerEnv>;

export type ServerApiFetchOptions = ApiFetchOptions & {
  /**
   * JWT do usuário, enviado como `Authorization: Bearer`. É parâmetro, e não
   * lido aqui, porque nem toda chamada tem sessão (o login) e o cookie de
   * sessão é da FE-07, que passa o token lido dele.
   */
  token?: string;
};

/** URL base do serviço, sempre da variável de ambiente, nunca da requisição. */
export function urlDoServico(servico: Servico) {
  return getServerEnv()[VARIAVEL_DO_SERVICO[servico]];
}

/**
 * `apiFetch` do servidor: chama o serviço direto (`<SERVICO>_API_URL` +
 * caminho). Use em Server Components e Route Handlers, inclusive no proxy.
 *
 * Resolve com o corpo JSON (ou `undefined`, se vazio); rejeita com `ApiError`.
 */
export function apiFetch(
  servico: Servico,
  caminho: string,
  { token, ...opcoes }: ServerApiFetchOptions = {},
): Promise<unknown> {
  validarCaminho(caminho);

  const base = urlDoServico(servico).replace(/\/+$/, '');
  const url = aplicarQuery(new URL(`${base}${caminho}`), opcoes.query);

  return requisitar({
    ...opcoes,
    servico,
    url,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
