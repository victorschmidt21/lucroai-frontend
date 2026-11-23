import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/errors';
import { deleteReceita } from '../api/receitas.api';
import { alertasKeys } from '@/features/alertas/api/alertas.queries';
import { receitasKeys } from '../api/receitas.queries';

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: a raiz `receitas`
 * também alimenta as opções de Vendas e Produções, a Simulação e o Painel.
 * Um 404 também recarrega: a receita já não existe, e a lista está velha.
 */
export function useDeleteReceita() {
  const queryClient = useQueryClient();
  // `alertas`: as receitas afetadas pelo preço defasado e o preço delas (FE-47).
  const invalidar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: receitasKeys.all }),
      queryClient.invalidateQueries({ queryKey: alertasKeys.all }),
    ]);

  return useMutation({
    mutationFn: deleteReceita,
    onSuccess: invalidar,
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 404) {
        return invalidar();
      }
      return undefined;
    },
  });
}
