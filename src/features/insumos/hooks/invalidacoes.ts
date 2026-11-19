import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/errors';
import { insumosKeys } from '../api/insumos.queries';

// `estoque` (FE-13) e `receitas` (FE-11) ainda não existem: as raízes vão pelo
// literal. Troque por `estoqueKeys.all` e `receitasKeys.all` quando elas chegarem.
const ESTOQUE_KEY = ['estoque'] as const;
const RECEITAS_KEY = ['receitas'] as const;

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: o insumo novo cria
 * estoque, e o custo das receitas depende do custo do insumo.
 */
export function invalidarAposMutacaoDeInsumo(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: insumosKeys.all }),
    queryClient.invalidateQueries({ queryKey: ESTOQUE_KEY }),
    queryClient.invalidateQueries({ queryKey: RECEITAS_KEY }),
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
