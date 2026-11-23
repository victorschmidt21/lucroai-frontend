import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCanal } from '../api/configuracoes.api';
import { invalidarAposMutacaoDeConfiguracao } from './invalidacoes';

/** Editar nome e comissão, ou ativar e desativar (`{ ativo }`). */
export function useUpdateCanal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCanal,
    // No erro também: um 404 indica que a lista está velha.
    onSettled: () => invalidarAposMutacaoDeConfiguracao(queryClient),
  });
}
