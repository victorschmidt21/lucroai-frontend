import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReceita } from '../api/receitas.api';
import { alertasKeys } from '@/features/alertas/api/alertas.queries';
import { receitasKeys } from '../api/receitas.queries';

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: a raiz `receitas`
 * alimenta a lista, o detalhe, as opções de Vendas e Produções e o Painel.
 */
export function useCreateReceita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReceita,
    // `alertas`: a receita nova pode usar um insumo com preço defasado (FE-47).
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: receitasKeys.all }),
        queryClient.invalidateQueries({ queryKey: alertasKeys.all }),
      ]),
  });
}
