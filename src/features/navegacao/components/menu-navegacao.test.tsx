import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { setTestUrl } from '@/test/next-navigation';
import { MenuNavegacao } from './menu-navegacao';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

function linksMarcados() {
  return screen
    .getAllByRole('link')
    .filter((link) => link.hasAttribute('aria-current'));
}

function linksDoMenu() {
  const menu = screen.getByRole('navigation', { name: 'Menu principal' });
  return within(menu)
    .getAllByRole('link')
    .map((link) => [link.textContent, link.getAttribute('href')]);
}

beforeEach(() => {
  setTestUrl('/');
});

describe('MenuNavegacao lateral', () => {
  it('mostra os oito destinos e os ajustes de preço, na ordem do mobile', async () => {
    const { container } = render(<MenuNavegacao variante="lateral" />);

    expect(linksDoMenu()).toEqual([
      ['Início', '/'],
      ['Ingredientes', '/insumos'],
      ['Receitas', '/receitas'],
      ['Custos', '/custos'],
      ['Vendas', '/vendas'],
      ['Estoque', '/estoque'],
      ['Fornadas', '/producoes'],
      ['Contas do mês', '/gastos-indiretos'],
      ['Ajustes de preço', '/configuracoes'],
    ]);
    await expectNoA11yViolations(container);
  });

  it('marca o item ativo pela rota, inclusive em subtelas', () => {
    setTestUrl('/receitas/nova');

    render(<MenuNavegacao variante="lateral" />);

    const ativo = screen.getByRole('link', { name: 'Receitas' });
    expect(ativo).toHaveAttribute('aria-current', 'page');
    expect(ativo).toHaveClass('text-ink');
    expect(ativo.querySelector('svg')).toHaveClass('text-accent');
    expect(screen.getByRole('link', { name: 'Início' })).toHaveClass(
      'text-ink-muted',
    );
    expect(linksMarcados()).toEqual([ativo]);
  });

  it('não marca nenhum item numa tela fora do menu', () => {
    setTestUrl('/simulacao');

    render(<MenuNavegacao variante="lateral" />);

    expect(linksMarcados()).toEqual([]);
  });
});

describe('MenuNavegacao inferior', () => {
  it('mostra Início, Receitas, Vendas, Estoque e o botão "Mais"', async () => {
    const { container } = render(<MenuNavegacao variante="inferior" />);

    expect(linksDoMenu()).toEqual([
      ['Início', '/'],
      ['Receitas', '/receitas'],
      ['Vendas', '/vendas'],
      ['Estoque', '/estoque'],
    ]);
    expect(screen.getByRole('button', { name: 'Mais' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('abre a gaveta "Mais" com o resto do menu, marcando o item ativo', async () => {
    const user = userEvent.setup();
    setTestUrl('/producoes');
    render(<MenuNavegacao variante="inferior" />);

    const mais = screen.getByRole('button', { name: 'Mais' });
    expect(mais).toHaveClass('text-ink');
    await user.click(mais);

    const gaveta = await screen.findByRole('dialog', { name: 'Mais' });
    expect(
      within(gaveta)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Ingredientes',
      'Custos',
      'Fornadas',
      'Contas do mês',
      'Ajustes de preço',
    ]);
    expect(
      within(gaveta).getByRole('link', { name: 'Fornadas' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('é percorrido pelo teclado, na ordem da barra', async () => {
    const user = userEvent.setup();
    render(<MenuNavegacao variante="inferior" />);

    for (const rotulo of ['Início', 'Receitas', 'Vendas', 'Estoque']) {
      await user.tab();
      expect(screen.getByRole('link', { name: rotulo })).toHaveFocus();
    }
    await user.tab();
    expect(screen.getByRole('button', { name: 'Mais' })).toHaveFocus();
  });
});
