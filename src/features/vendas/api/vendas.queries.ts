import { queryOptions } from '@tanstack/react-query';
import type { ListVendasQuery } from '@/shared/api/contracts/sales';
import { getVenda, listVendas } from './vendas.api';

/**
 * Chaves de vendas (docs/api-integration.md#chaves). Os filtros de período e de
 * status são aplicados pelo backend, então entram na chave da lista (FE-18).
 */
export const vendasKeys = {
  all: ['vendas'] as const,
  list: (filtros: ListVendasQuery = {}) =>
    [...vendasKeys.all, 'list', filtros] as const,
  detail: (id: number) => [...vendasKeys.all, 'detail', id] as const,
};

export function vendasListOptions(filtros: ListVendasQuery = {}) {
  return queryOptions({
    queryKey: vendasKeys.list(filtros),
    queryFn: ({ signal }) => listVendas(filtros, signal),
  });
}

export function vendaDetailOptions(id: number) {
  return queryOptions({
    queryKey: vendasKeys.detail(id),
    queryFn: ({ signal }) => getVenda(id, signal),
  });
}
