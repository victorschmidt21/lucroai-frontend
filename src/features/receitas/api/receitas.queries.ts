import { queryOptions } from '@tanstack/react-query';
import { getReceita, getReceitaCusto, listReceitas } from './receitas.api';

export const receitasKeys = {
  all: ['receitas'] as const,
  list: () => [...receitasKeys.all, 'list'] as const,
  detail: (id: number) => [...receitasKeys.all, 'detail', id] as const,
  custo: (id: number) => [...receitasKeys.all, 'custo', id] as const,
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

/** Custo de 1 lote (FE-20); recarrega junto com a raiz `receitas`. */
export function receitaCustoOptions(id: number) {
  return queryOptions({
    queryKey: receitasKeys.custo(id),
    queryFn: ({ signal }) => getReceitaCusto(id, signal),
  });
}
