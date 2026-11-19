import { queryOptions } from '@tanstack/react-query';
import { getEstoqueDoInsumo } from './estoque.api';

export const estoqueKeys = {
  all: ['estoque'] as const,
  insumo: (insumoId: number) =>
    [...estoqueKeys.all, 'insumo', insumoId] as const,
};

/**
 * Saldo de um insumo. A listagem combina `insumosListOptions()` com esta query
 * para cada insumo, em paralelo (`useQueries`); o painel (FE-22) faz o mesmo.
 */
export function estoqueDoInsumoOptions(insumoId: number) {
  return queryOptions({
    queryKey: estoqueKeys.insumo(insumoId),
    queryFn: ({ signal }) => getEstoqueDoInsumo(insumoId, signal),
  });
}
