import { queryOptions } from '@tanstack/react-query';
import { unwrap } from '@/shared/api/request';
import { bffFetch } from './bff-client';
import { usuarioAtualSchema } from './usuario-atual';

export const sessaoKeys = {
  all: ['sessao'] as const,
  usuario: () => [...sessaoKeys.all, 'usuario'] as const,
};

/** `GET /api/auth/sessao`: o usuário decodificado do JWT do cookie. Sem sessão, `ApiError` 401. */
export async function getSessao(signal?: AbortSignal) {
  const corpo = await bffFetch('/api/auth/sessao', { signal });

  return unwrap(corpo, usuarioAtualSchema);
}

/**
 * Com o `staleTime` padrão, voltar à aba confere a sessão de novo: um 401 leva
 * ao login pelo `onSessaoExpirada` do `QueryClient`.
 */
export function usuarioAtualOptions() {
  return queryOptions({
    queryKey: sessaoKeys.usuario(),
    queryFn: ({ signal }) => getSessao(signal),
  });
}
