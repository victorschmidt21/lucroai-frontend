import { useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueKeys } from '@/features/estoque/api/estoque.queries';
import { insumosKeys } from '@/features/insumos/api/insumos.queries';
import { createProducao } from '../api/producoes.api';
import { producoesKeys } from '../api/producoes.queries';

/**
 * Matriz de docs/api-integration.md#invalidação-após-mutações: `producoes` (lista
 * e detalhe), `estoque` (baixa dos insumos, histórico e o estoque de produto
 * acabado da FE-17; o painel usa essas chaves) e `insumos` (`quantidadeDisponivel`).
 * A API grava tudo numa transação só, então não há atraso a esperar.
 */
export function useCreateProducao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProducao,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: producoesKeys.all }),
        queryClient.invalidateQueries({ queryKey: estoqueKeys.all }),
        queryClient.invalidateQueries({ queryKey: insumosKeys.all }),
      ]),
  });
}
