import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insumosKeys } from '@/features/insumos/api/insumos.queries';
import { registrarEntradaEstoque } from '../api/estoque.api';
import { estoqueKeys } from '../api/estoque.queries';

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: `estoque` cobre o
 * saldo, o histórico e o painel (que não tem chave própria); `insumos`, o
 * `quantidadeDisponivel` da lista de insumos.
 */
export function useRegistrarEntrada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registrarEntradaEstoque,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: estoqueKeys.all }),
        queryClient.invalidateQueries({ queryKey: insumosKeys.all }),
      ]),
  });
}
