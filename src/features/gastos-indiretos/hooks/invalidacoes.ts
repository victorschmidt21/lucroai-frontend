import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/errors';
import { gastosIndiretosKeys } from '../api/gastos-indiretos.queries';

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: a mesma lista
 * alimenta a tela e a seleção de gastos do formulário de produção (FE-15).
 */
export function invalidarAposMutacaoDeGasto(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: gastosIndiretosKeys.all });
}

/** 404 numa edição ou exclusão: o gasto já não existe, e a lista está velha. */
export function recarregarSeNaoEncontrado(
  queryClient: QueryClient,
  error: unknown,
) {
  if (error instanceof ApiError && error.statusCode === 404) {
    return invalidarAposMutacaoDeGasto(queryClient);
  }
  return undefined;
}
