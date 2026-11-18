import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { TelaProvisoria } from './tela-provisoria';

it('mostra o cabeçalho da tela e o aviso de construção', () => {
  render(
    <TelaProvisoria
      title="Insumos"
      subtitle="Gerencie quantidade, valor pago e custo unitário"
    />,
  );

  expect(
    screen.getByRole('heading', { level: 1, name: 'Insumos' }),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Gerencie quantidade, valor pago e custo unitário'),
  ).toBeInTheDocument();
  expect(screen.getByText('Em construção')).toBeInTheDocument();
});
