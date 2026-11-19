import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVenda } from '../api/vendas.api';
import { vendasKeys } from '../api/vendas.queries';

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: `vendas` (histórico,
 * simulação e o painel, que não tem chave própria e é calculado das vendas).
 */
export function useCreateVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVenda,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: vendasKeys.all }),
  });
}
