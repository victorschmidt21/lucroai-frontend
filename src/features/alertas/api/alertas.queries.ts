import { queryOptions } from '@tanstack/react-query';
import { insumosKeys } from '@/features/insumos/api/insumos.queries';
import { getAlertas } from './alertas.api';

/**
 * Debaixo da raiz `insumos`: toda mutação que muda saldo ou custo de insumo
 * (insumo, compra, entrada de estoque e produção) já invalida essa raiz e,
 * com ela, os alertas. As mutações de receita e de configuração, que mudam só
 * o preço sugerido das receitas afetadas, invalidam `alertasKeys.all` à parte.
 */
export const alertasKeys = {
  all: [...insumosKeys.all, 'alertas'] as const,
};

export function alertasOptions() {
  return queryOptions({
    queryKey: alertasKeys.all,
    queryFn: ({ signal }) => getAlertas(signal),
  });
}
