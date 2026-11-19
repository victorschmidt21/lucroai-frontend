import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInsumo } from '../api/insumos.api';
import {
  invalidarAposMutacaoDeInsumo,
  recarregarSeNaoEncontrado,
} from './invalidacoes';

export function useDeleteInsumo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInsumo,
    onSuccess: () => invalidarAposMutacaoDeInsumo(queryClient),
    onError: (error) => recarregarSeNaoEncontrado(queryClient, error),
  });
}
