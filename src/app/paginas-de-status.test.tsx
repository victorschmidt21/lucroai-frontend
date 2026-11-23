import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AppError from './(app)/error';
import AppNotFound from './(app)/not-found';
import RootError from './error';
import NotFound from './not-found';

describe('404', () => {
  it.each([
    ['dentro do layout', AppNotFound, false],
    ['fora do layout', NotFound, true],
  ])('%s, leva ao início', (_, Pagina, comMain) => {
    render(<Pagina />);

    expect(
      screen.getByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Voltar ao início' }),
    ).toHaveAttribute('href', '/');
    expect(screen.queryByRole('main') !== null).toBe(comMain);
  });
});

describe('erro', () => {
  it.each([
    ['dentro do layout', AppError],
    ['fora do layout', RootError],
  ])('%s, anuncia e tenta de novo', async (_, Pagina) => {
    const retry = vi.fn<() => void>();
    const user = userEvent.setup();
    render(<Pagina retry={retry} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Tente de novo em instantes.',
    );
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(retry).toHaveBeenCalledOnce();
  });
});
