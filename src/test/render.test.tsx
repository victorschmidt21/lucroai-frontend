import { useQuery } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { mockApi } from './api';
import { makeInsumo } from './factories/insumo.factory';
import { renderWithQuery } from './render';
import { server } from './server';

function NomeDoInsumo() {
  const { data } = useQuery({
    queryKey: ['teste'],
    queryFn: async () => {
      const resposta = await fetch(
        new URL('/api/backend/catalog/insumos/1', window.location.origin),
      );
      return ((await resposta.json()) as { data: { nome: string } }).data;
    },
  });

  return <p>{data?.nome ?? 'carregando'}</p>;
}

it('renderiza com um QueryClient próprio e atende pelo MSW', async () => {
  server.use(mockApi('GET catalog /insumos/:id', makeInsumo()));

  const { queryClient } = renderWithQuery(<NomeDoInsumo />);

  expect(await screen.findByText('Farinha de Trigo')).toBeInTheDocument();
  expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
});
