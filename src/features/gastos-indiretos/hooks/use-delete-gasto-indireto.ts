import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteGastoIndireto } from '../api/gastos-indiretos.api';
import {
  invalidarAposMutacaoDeGasto,
  recarregarSeNaoEncontrado,
} from './invalidacoes';

export function useDeleteGastoIndireto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGastoIndireto,
    onSuccess: () => invalidarAposMutacaoDeGasto(queryClient),
    onError: (error) => recarregarSeNaoEncontrado(queryClient, error),
  });
}
