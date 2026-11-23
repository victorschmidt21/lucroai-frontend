import { queryOptions } from '@tanstack/react-query';
import { getInsumo, listComprasInsumo, listInsumos } from './insumos.api';

export const insumosKeys = {
  all: ['insumos'] as const,
  list: () => [...insumosKeys.all, 'list'] as const,
  detail: (id: number) => [...insumosKeys.all, 'detail', id] as const,
  compras: (id: number) => [...insumosKeys.all, 'compras', id] as const,
};

/** Ordem da listagem: por nome, como o leitor espera (docs/business-rules.md#ordem-e-busca). */
export function ordenarPorNome<T extends { nome: string }>(insumos: T[]) {
  return insumos.toSorted((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// A busca é feita no cliente: `q` não entra na chave.
export function insumosListOptions() {
  return queryOptions({
    queryKey: insumosKeys.list(),
    queryFn: ({ signal }) => listInsumos(signal),
    // GET /insumos não tem ordem garantida.
    select: ordenarPorNome,
  });
}

export function insumoDetailOptions(id: number) {
  return queryOptions({
    queryKey: insumosKeys.detail(id),
    queryFn: ({ signal }) => getInsumo(id, signal),
  });
}

export function comprasInsumoOptions(insumoId: number) {
  return queryOptions({
    queryKey: insumosKeys.compras(insumoId),
    queryFn: ({ signal }) => listComprasInsumo(insumoId, signal),
  });
}
