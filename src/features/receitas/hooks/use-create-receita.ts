import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReceita } from '../api/receitas.api';
import { receitasKeys } from '../api/receitas.queries';

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: a raiz `receitas`
 * alimenta a lista, o detalhe, as opções de Vendas e Produções e o Painel.
 */
export function useCreateReceita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReceita,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: receitasKeys.all }),
  });
}
