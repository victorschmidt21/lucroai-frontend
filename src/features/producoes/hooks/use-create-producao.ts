import { useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueKeys } from '@/features/estoque/api/estoque.queries';
import { insumosKeys } from '@/features/insumos/api/insumos.queries';
import { createProducao } from '../api/producoes.api';
import { producoesKeys } from '../api/producoes.queries';

/**
 * O catalog atualiza `quantidadeDisponivel` dos insumos pelo evento
 * `estoque_movimentado`, com atraso: os insumos são revalidados de novo depois.
 */
const ATRASO_DO_CATALOG_MS = 2000;

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: `producoes` (lista,
 * detalhe e o estoque disponível de produto acabado da FE-17, calculado das
 * produções), `estoque` (saldo e histórico com a baixa dos insumos; o painel usa
 * essas chaves) e `insumos` (espelho do saldo no catalog).
 */
export function useCreateProducao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProducao,
    onSuccess: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: insumosKeys.all });
      }, ATRASO_DO_CATALOG_MS);

      return Promise.all([
        queryClient.invalidateQueries({ queryKey: producoesKeys.all }),
        queryClient.invalidateQueries({ queryKey: estoqueKeys.all }),
        queryClient.invalidateQueries({ queryKey: insumosKeys.all }),
      ]);
    },
  });
}
