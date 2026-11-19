import { queryOptions } from '@tanstack/react-query';
import { listGastosIndiretos } from './gastos-indiretos.api';

export const gastosIndiretosKeys = {
  all: ['gastos-indiretos'] as const,
  list: () => [...gastosIndiretosKeys.all, 'list'] as const,
};

/**
 * Lista de gastos, na ordem do backend (`id` decrescente). Também alimenta a
 * seleção de gastos do formulário de produção (FE-15).
 */
export function gastosIndiretosListOptions() {
  return queryOptions({
    queryKey: gastosIndiretosKeys.list(),
    queryFn: ({ signal }) => listGastosIndiretos(signal),
  });
}
