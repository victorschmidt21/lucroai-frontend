import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setTestUrl } from '@/test/next-navigation';
import { Termo } from './termo';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

const OPCOES = { timeout: 20_000 };

function renderTermo(exemplo?: string) {
  setTestUrl('/receitas');
  render(
    <p>
      Sua{' '}
      <Termo id="margem" exemplo={exemplo}>
        margem 29%
      </Termo>{' '}
      está boa.
    </p>,
  );
  return screen.getByRole('button', { name: 'O que é Margem?' });
}

/** Simula a largura de computador (`md`), onde a Pitada vira balão. */
function simularComputador() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Termo', OPCOES, () => {
  it('mostra o texto da tela num botão que anuncia o termo', () => {
    const termo = renderTermo();

    expect(termo).toHaveAttribute('type', 'button');
    expect(termo).toHaveAttribute('aria-haspopup', 'dialog');
    expect(termo).toHaveAttribute('aria-expanded', 'false');
    expect(termo).toHaveTextContent('margem 29%');
  });

  it('abre por clique, com a explicação, o porquê e a ação', async () => {
    const user = userEvent.setup();
    const termo = renderTermo();

    await user.click(termo);

    const folha = screen.getByRole('dialog', { name: 'Margem' });
    expect(termo).toHaveAttribute('aria-expanded', 'true');
    expect(
      within(folha).getByText(/É o lucro dito em porcentagem/),
    ).toBeVisible();
    expect(
      within(folha).getByText(/Margem baixa deixa pouco espaço/),
    ).toBeVisible();
    expect(
      within(folha).getByRole('link', { name: 'Simular outro preço' }),
    ).toHaveAttribute('href', '/simulacao');
  });

  it('não abre por hover nem por foco', async () => {
    const user = userEvent.setup();
    const termo = renderTermo();

    await user.hover(termo);
    await user.tab();

    expect(termo).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre pelo teclado, fecha com Esc e devolve o foco ao termo', async () => {
    const user = userEvent.setup();
    const termo = renderTermo();

    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Margem' })).toBeVisible();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(termo).toHaveFocus();

    await user.keyboard(' ');
    expect(screen.getByRole('dialog', { name: 'Margem' })).toBeVisible();
  });

  it('fecha com "Entendi"', async () => {
    const user = userEvent.setup();
    const termo = renderTermo();

    await user.click(termo);
    await user.click(screen.getByRole('button', { name: 'Entendi' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(termo).toHaveFocus();
  });

  it('troca de termo pelo chip sem fechar, e reabre no termo da tela', async () => {
    const user = userEvent.setup();
    const termo = renderTermo();

    await user.click(termo);
    await user.click(
      screen.getByRole('button', { name: 'Lucro que você quer' }),
    );

    const folha = screen.getByRole('dialog', { name: 'Lucro que você quer' });
    expect(
      within(folha).getByText(/Você escolhe nos Ajustes de preço/),
    ).toBeVisible();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await user.click(termo);
    expect(screen.getByRole('dialog', { name: 'Margem' })).toBeVisible();
  });

  it('esconde "No seu caso" sem exemplo', async () => {
    const user = userEvent.setup();
    const termo = renderTermo();

    await user.click(termo);
    expect(screen.queryByText('No seu caso')).not.toBeInTheDocument();
  });

  it('mostra "No seu caso" quando há exemplo', async () => {
    const user = userEvent.setup();
    const termo = renderTermo('De cada R$ 100, R$ 29 ficam com você.');

    await user.click(termo);
    const bloco = screen.getByRole('region', { name: 'No seu caso' });
    expect(bloco).toHaveTextContent('De cada R$ 100, R$ 29 ficam com você.');
  });

  it('esconde a ação quando a tela já é a do link', async () => {
    const user = userEvent.setup();
    const termo = renderTermo();
    setTestUrl('/simulacao');

    await user.click(termo);
    expect(
      screen.queryByRole('link', { name: 'Simular outro preço' }),
    ).not.toBeInTheDocument();
  });

  it('no computador, abre o balão ancorado e fecha com Esc', async () => {
    simularComputador();
    const user = userEvent.setup();
    const termo = renderTermo();

    await user.click(termo);
    expect(screen.getByRole('dialog', { name: 'Margem' })).toBeVisible();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(termo).toHaveFocus();
  });
});
