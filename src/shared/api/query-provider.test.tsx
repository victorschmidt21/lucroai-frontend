import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { getQueryClient } from './query-client';
import { QueryProvider } from './query-provider';

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
