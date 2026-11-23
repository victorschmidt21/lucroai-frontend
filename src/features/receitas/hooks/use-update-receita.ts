import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/errors';
import { updateReceita } from '../api/receitas.api';
import { alertasKeys } from '@/features/alertas/api/alertas.queries';
import { receitasKeys } from '../api/receitas.queries';

/**
 * Invalida a raiz `receitas` (lista, detalhe, opções de Vendas e Produções e
 * Painel). Um 404 também recarrega: a receita já não existe.
 */
export function useUpdateReceita() {
  const queryClient = useQueryClient();
  // `alertas`: as receitas afetadas pelo preço defasado e o preço delas (FE-47).
  const invalidar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: receitasKeys.all }),
      queryClient.invalidateQueries({ queryKey: alertasKeys.all }),
    ]);

  return useMutation({
    mutationFn: updateReceita,
    onSuccess: invalidar,
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 404) {
        return invalidar();
      }
      return undefined;
    },
  });
}
