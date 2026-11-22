import { queryOptions } from '@tanstack/react-query';
import { getConfiguracaoCustos, listCanais } from './configuracoes.api';

export const configuracoesKeys = {
  all: ['configuracoes'] as const,
  custos: () => [...configuracoesKeys.all, 'custos'] as const,
  canais: () => [...configuracoesKeys.all, 'canais'] as const,
};

export function configuracaoCustosOptions() {
  return queryOptions({
    queryKey: configuracoesKeys.custos(),
    queryFn: ({ signal }) => getConfiguracaoCustos(signal),
  });
}

export function canaisOptions() {
  return queryOptions({
    queryKey: configuracoesKeys.canais(),
    queryFn: ({ signal }) => listCanais(signal),
  });
}
