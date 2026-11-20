import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insumosKeys } from '@/features/insumos/api/insumos.queries';
import { atualizarEstoqueMinimo } from '../api/estoque.api';
import { estoqueKeys } from '../api/estoque.queries';

/** `estoque` (status, filtro "Baixo" e painel) e `insumos` (o `quantidadeMinima` do insumo). */
export function useAtualizarMinimo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: atualizarEstoqueMinimo,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: estoqueKeys.all }),
        queryClient.invalidateQueries({ queryKey: insumosKeys.all }),
      ]),
  });
}
