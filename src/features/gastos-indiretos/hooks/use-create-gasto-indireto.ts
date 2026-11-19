import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGastoIndireto } from '../api/gastos-indiretos.api';
import { invalidarAposMutacaoDeGasto } from './invalidacoes';

export function useCreateGastoIndireto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGastoIndireto,
    onSuccess: () => invalidarAposMutacaoDeGasto(queryClient),
  });
}
