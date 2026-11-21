import { useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueKeys } from '@/features/estoque/api/estoque.queries';
import type { UpdateVendaStatusBody } from '@/shared/api/contracts/sales';
import { updateVendaStatus } from '../api/vendas.api';
import { vendasKeys } from '../api/vendas.queries';

type Variaveis = { id: number } & UpdateVendaStatusBody;

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: `vendas` (lista,
 * detalhe e painel) e `estoque` (a conclusão baixa o produto acabado na mesma
 * transação). Invalida também no erro: um 422 ("Venda já finalizada...") quer
 * dizer que a tela está desatualizada.
 */
export function useAtualizarStatusVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: Variaveis) =>
      updateVendaStatus(id, { status }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: vendasKeys.all }),
        queryClient.invalidateQueries({ queryKey: estoqueKeys.all }),
      ]),
  });
}
