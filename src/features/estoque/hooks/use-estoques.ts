'use client';

import { useQuery } from '@tanstack/react-query';
import { insumosListOptions } from '@/features/insumos/api/insumos.queries';
import { estoqueInsumosOptions } from '../api/estoque.queries';

/**
 * Estoque de cada insumo: `GET /insumos` (nome e unidade) e `GET /estoque/insumos`
 * (saldo, mínimo e data), duas chamadas para a lista inteira. Origem:
 * estoque_remote_datasource.dart.
 */
export function useEstoques() {
  const insumos = useQuery(insumosListOptions());
  const estoques = useQuery(estoqueInsumosOptions());
  const porInsumo = new Map(
    (estoques.data ?? []).map((estoque) => [estoque.insumoId, estoque]),
  );

  return {
    insumos,
    estoques,
    itens: (insumos.data ?? []).map((insumo) => ({
      insumo,
      /** Todo insumo nasce com o registro de estoque; falta só se a lista mudou no meio. */
      estoque: porInsumo.get(insumo.id),
    })),
  };
}

export type ItemEstoque = ReturnType<typeof useEstoques>['itens'][number];
