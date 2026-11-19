import { queryOptions } from '@tanstack/react-query';
import type { ListProducoesQuery } from '@/shared/api/contracts/operations';
import { getProducao, listProducoes } from './producoes.api';

export const producoesKeys = {
  all: ['producoes'] as const,
  list: (filtros: ListProducoesQuery = {}) =>
    [...producoesKeys.all, 'list', filtros] as const,
  detail: (id: number) => [...producoesKeys.all, 'detail', id] as const,
};

/** O filtro `receitaId` é aplicado pelo backend, então entra na chave. */
export function producoesListOptions(filtros: ListProducoesQuery = {}) {
  return queryOptions({
    queryKey: producoesKeys.list(filtros),
    queryFn: ({ signal }) => listProducoes(filtros, signal),
  });
}

export function producaoDetailOptions(id: number) {
  return queryOptions({
    queryKey: producoesKeys.detail(id),
    queryFn: ({ signal }) => getProducao(id, signal),
  });
}
