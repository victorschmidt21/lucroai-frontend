import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import HomePage from './page';

it('exibe o nome do sistema', () => {
  render(<HomePage />);

  expect(screen.getByRole('heading', { name: 'LucroAI' })).toBeInTheDocument();
});
