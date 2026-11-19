import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGastoIndireto } from '../api/gastos-indiretos.api';
import {
  invalidarAposMutacaoDeGasto,
  recarregarSeNaoEncontrado,
} from './invalidacoes';

export function useUpdateGastoIndireto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGastoIndireto,
    onSuccess: () => invalidarAposMutacaoDeGasto(queryClient),
    onError: (error) => recarregarSeNaoEncontrado(queryClient, error),
  });
}
