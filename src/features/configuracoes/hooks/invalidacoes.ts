import type { QueryClient } from '@tanstack/react-query';
import { alertasKeys } from '@/features/alertas/api/alertas.queries';
import { receitasKeys } from '@/features/receitas/api/receitas.queries';
import { configuracoesKeys } from '../api/configuracoes.queries';

/**
 * A capacidade, o lucro, o imposto, a maquininha e as comissões entram no custo
 * e no preço de cada receita, que o backend calcula na leitura (BE-28), e
 * também no preço sugerido dos avisos de preço defasado (FE-47).
 */
export function invalidarAposMutacaoDeConfiguracao(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: configuracoesKeys.all }),
    queryClient.invalidateQueries({ queryKey: receitasKeys.all }),
    queryClient.invalidateQueries({ queryKey: alertasKeys.all }),
  ]);
}
