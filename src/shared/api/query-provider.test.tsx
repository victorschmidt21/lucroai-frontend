import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { navigateTo } from '@/shared/auth/navigation';
import { ApiError } from './errors';
import { getQueryClient } from './query-client';
import { QueryProvider } from './query-provider';

vi.mock('@/shared/auth/navigation', () => ({
  navigateTo: vi.fn<(path: string) => void>(),
  isNavegando: vi.fn<() => boolean>(() => false),
}));

function ConsumidorDoCliente() {
  const isMesmoCliente = useQueryClient() === getQueryClient();

  return <p>{isMesmoCliente ? 'cliente compartilhado' : 'outro cliente'}</p>;
}

it('entrega o cliente do navegador aos componentes filhos', () => {
  render(
    <QueryProvider>
      <ConsumidorDoCliente />
    </QueryProvider>,
  );

  expect(screen.getByText('cliente compartilhado')).toBeInTheDocument();
});

it('leva ao login com a rota atual quando uma query recebe 401', async () => {
  window.history.replaceState(null, '', '/insumos?q=acucar');
  render(
    <QueryProvider>
      <ConsumidorDoCliente />
    </QueryProvider>,
  );

  await getQueryClient()
    .fetchQuery({
      queryKey: ['teste-401'],
      queryFn: () =>
        Promise.reject(new ApiError({ statusCode: 401, servico: 'catalog' })),
    })
    .catch(() => undefined);

  expect(navigateTo).toHaveBeenCalledWith(
    '/login?redirect=%2Finsumos%3Fq%3Dacucar&expirada=1',
  );
  window.history.replaceState(null, '', '/');
});
