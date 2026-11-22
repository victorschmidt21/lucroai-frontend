import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCanal } from '../api/configuracoes.api';
import { invalidarAposMutacaoDeConfiguracao } from './invalidacoes';

export function useCreateCanal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCanal,
    onSuccess: () => invalidarAposMutacaoDeConfiguracao(queryClient),
  });
}
