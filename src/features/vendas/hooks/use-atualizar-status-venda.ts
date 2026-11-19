import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateVendaStatusBody } from '@/shared/api/contracts/sales';
import { updateVendaStatus } from '../api/vendas.api';
import { vendasKeys } from '../api/vendas.queries';

type Variaveis = { id: number } & UpdateVendaStatusBody;

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: `vendas` (lista,
 * detalhe, painel e o estoque disponível de produto acabado, calculado das vendas
 * concluídas). Invalida também no erro: um 400 ("Venda já finalizada...") quer
 * dizer que a tela está desatualizada.
 */
export function useAtualizarStatusVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: Variaveis) =>
      updateVendaStatus(id, { status }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: vendasKeys.all }),
  });
}
