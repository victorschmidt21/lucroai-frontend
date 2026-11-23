import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateConfiguracaoCustos } from '../api/configuracoes.api';
import { invalidarAposMutacaoDeConfiguracao } from './invalidacoes';

export function useUpdateConfiguracaoCustos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateConfiguracaoCustos,
    onSuccess: () => invalidarAposMutacaoDeConfiguracao(queryClient),
  });
}
