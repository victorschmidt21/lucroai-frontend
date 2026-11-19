import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/errors';
import { updateReceita } from '../api/receitas.api';
import { receitasKeys } from '../api/receitas.queries';

/**
 * Invalida a raiz `receitas` (lista, detalhe, opções de Vendas e Produções e
 * Painel). Um 404 também recarrega: a receita já não existe.
 */
export function useUpdateReceita() {
  const queryClient = useQueryClient();
  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: receitasKeys.all });

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
