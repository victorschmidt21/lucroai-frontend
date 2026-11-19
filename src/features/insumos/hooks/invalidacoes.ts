import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/errors';
import { receitasKeys } from '@/features/receitas/api/receitas.queries';
import { insumosKeys } from '../api/insumos.queries';

// `estoque` (FE-13) ainda não existe: a raiz vai pelo literal. Troque por
// `estoqueKeys.all` quando ela chegar.
const ESTOQUE_KEY = ['estoque'] as const;

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: o insumo novo cria
 * estoque, e o custo das receitas depende do custo do insumo.
 */
export function invalidarAposMutacaoDeInsumo(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: insumosKeys.all }),
    queryClient.invalidateQueries({ queryKey: ESTOQUE_KEY }),
    queryClient.invalidateQueries({ queryKey: receitasKeys.all }),
  ]);
}

/** 404 numa edição ou exclusão: o insumo já não existe, e a lista está velha. */
export function recarregarSeNaoEncontrado(
  queryClient: QueryClient,
  error: unknown,
) {
  if (error instanceof ApiError && error.statusCode === 404) {
    return queryClient.invalidateQueries({ queryKey: insumosKeys.all });
  }
  return undefined;
}
