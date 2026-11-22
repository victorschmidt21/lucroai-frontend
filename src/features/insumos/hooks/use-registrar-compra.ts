import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCompraInsumo } from '../api/insumos.api';
import {
  invalidarAposMutacaoDeInsumo,
  recarregarSeNaoEncontrado,
} from './invalidacoes';

/**
 * A compra muda o saldo e o histórico do estoque, o custo médio, o preço de
 * hoje e, com ele, o preço das receitas: as mesmas chaves das outras mutações
 * de insumo (`insumos` cobre também o histórico de compras).
 */
export function useRegistrarCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompraInsumo,
    onSuccess: () => invalidarAposMutacaoDeInsumo(queryClient),
    onError: (error) => recarregarSeNaoEncontrado(queryClient, error),
  });
}
