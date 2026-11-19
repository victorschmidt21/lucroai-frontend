import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInsumo } from '../api/insumos.api';
import {
  invalidarAposMutacaoDeInsumo,
  recarregarSeNaoEncontrado,
} from './invalidacoes';

export function useUpdateInsumo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInsumo,
    onSuccess: () => invalidarAposMutacaoDeInsumo(queryClient),
    onError: (error) => recarregarSeNaoEncontrado(queryClient, error),
  });
}
