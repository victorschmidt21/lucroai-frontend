import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insumosKeys } from '@/features/insumos/api/insumos.queries';
import { registrarEntradaEstoque } from '../api/estoque.api';
import { estoqueKeys } from '../api/estoque.queries';

/**
 * O catalog atualiza `quantidadeDisponivel` pelo evento `estoque_movimentado`,
 * com atraso: os insumos são revalidados de novo depois deste intervalo.
 */
const ATRASO_DO_CATALOG_MS = 2000;

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: `estoque` cobre o
 * saldo, o histórico e o painel (que não tem chave própria); `insumos`, o espelho
 * do catalog.
 */
export function useRegistrarEntrada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registrarEntradaEstoque,
    onSuccess: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: insumosKeys.all });
      }, ATRASO_DO_CATALOG_MS);

      return Promise.all([
        queryClient.invalidateQueries({ queryKey: estoqueKeys.all }),
        queryClient.invalidateQueries({ queryKey: insumosKeys.all }),
      ]);
    },
  });
}
