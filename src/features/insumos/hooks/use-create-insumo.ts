import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInsumo } from '../api/insumos.api';
import { invalidarAposMutacaoDeInsumo } from './invalidacoes';

export function useCreateInsumo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInsumo,
    onSuccess: () => invalidarAposMutacaoDeInsumo(queryClient),
  });
}
