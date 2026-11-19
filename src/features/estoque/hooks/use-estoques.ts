'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { insumosListOptions } from '@/features/insumos/api/insumos.queries';
import { estoqueDoInsumoOptions } from '../api/estoque.queries';

/**
 * Estoque de cada insumo: `GET /insumos` (nome e unidade) e, para cada um,
 * `GET /estoque/insumos/:id`, em paralelo. Cada saldo tem a própria query, então a
 * falha de um insumo não derruba os outros. Origem: estoque_remote_datasource.dart.
 */
export function useEstoques() {
  const insumos = useQuery(insumosListOptions());
  const lista = insumos.data ?? [];
  const estoques = useQueries({
    queries: lista.map((insumo) => estoqueDoInsumoOptions(insumo.id)),
  });

  return {
    insumos,
    itens: lista.map((insumo, indice) => ({
      insumo,
      estoque: estoques[indice],
    })),
  };
}

export type ItemEstoque = ReturnType<typeof useEstoques>['itens'][number];
