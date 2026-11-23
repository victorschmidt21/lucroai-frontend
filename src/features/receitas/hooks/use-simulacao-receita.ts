import { useMutation } from '@tanstack/react-query';
import { simularCenario, simularReceitaCusto } from '../api/receitas.api';

// Simulação (FE-20): só calcula, não grava. Mutações sem invalidação
// (docs/api-integration.md#invalidação-após-mutações).

export function useSimularCenario() {
  return useMutation({ mutationFn: simularCenario });
}

export function useSimularReceitaCusto() {
  return useMutation({ mutationFn: simularReceitaCusto });
}
