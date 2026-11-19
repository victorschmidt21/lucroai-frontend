import { queryOptions } from '@tanstack/react-query';
import { getReceita, listReceitas } from './receitas.api';

export const receitasKeys = {
  all: ['receitas'] as const,
  list: () => [...receitasKeys.all, 'list'] as const,
  detail: (id: number) => [...receitasKeys.all, 'detail', id] as const,
};

// A busca é feita no cliente: `q` não entra na chave. A ordem é a do backend.
export function receitasListOptions() {
  return queryOptions({
    queryKey: receitasKeys.list(),
    queryFn: ({ signal }) => listReceitas(signal),
  });
}

export function receitaDetailOptions(id: number) {
  return queryOptions({
    queryKey: receitasKeys.detail(id),
    queryFn: ({ signal }) => getReceita(id, signal),
  });
}
