import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCanal } from '../api/configuracoes.api';
import { invalidarAposMutacaoDeConfiguracao } from './invalidacoes';

export function useDeleteCanal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCanal,
    onSettled: () => invalidarAposMutacaoDeConfiguracao(queryClient),
  });
}
