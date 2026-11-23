import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { setTestUrl } from '@/test/next-navigation';
import { MenuNavegacao } from './menu-navegacao';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

const ROTULOS = [
  'Home',
  'Insumos',
  'Receitas',
  'Custos',
  'Vendas',
  'Estoque',
  'Produção',
  'Gastos',
];

function linksMarcados() {
  return screen
    .getAllByRole('link')
    .filter((link) => link.hasAttribute('aria-current'));
}

beforeEach(() => {
  setTestUrl('/');
});

describe.each(['lateral', 'inferior'] as const)(
  'MenuNavegacao %s',
  (variante) => {
    it('mostra os oito destinos, na ordem do mobile', async () => {
      const { container } = render(<MenuNavegacao variante={variante} />);

      const menu = screen.getByRole('navigation', { name: 'Menu principal' });
      expect(
        within(menu)
          .getAllByRole('link')
          .map((link) => [link.textContent, link.getAttribute('href')]),
      ).toEqual([
        [ROTULOS[0], '/'],
        [ROTULOS[1], '/insumos'],
        [ROTULOS[2], '/receitas'],
        [ROTULOS[3], '/custos'],
        [ROTULOS[4], '/vendas'],
        [ROTULOS[5], '/estoque'],
        [ROTULOS[6], '/producoes'],
        [ROTULOS[7], '/gastos-indiretos'],
        // As configurações de custo (FE-41) só cabem no menu lateral.
        ...(variante === 'lateral'
          ? [['Configurações de custo', '/configuracoes']]
          : []),
      ]);
      await expectNoA11yViolations(container);
    });

    it('marca o item ativo pela rota, inclusive em subtelas', () => {
      setTestUrl('/receitas/nova');

      render(<MenuNavegacao variante={variante} />);

      const ativo = screen.getByRole('link', { name: 'Receitas' });
      expect(ativo).toHaveAttribute('aria-current', 'page');
      expect(ativo).toHaveClass('text-ink');
      expect(ativo.querySelector('svg')).toHaveClass('text-accent');
      expect(screen.getByRole('link', { name: 'Home' })).toHaveClass(
        'text-ink-muted',
      );
      expect(linksMarcados()).toEqual([ativo]);
    });

    it('não marca nenhum item numa tela fora do menu', () => {
      setTestUrl('/simulacao');

      render(<MenuNavegacao variante={variante} />);

      expect(linksMarcados()).toEqual([]);
    });

    it('é percorrido pelo teclado, na ordem do menu', async () => {
      const user = userEvent.setup();
      render(<MenuNavegacao variante={variante} />);

      for (const rotulo of ROTULOS) {
        await user.tab();
        expect(screen.getByRole('link', { name: rotulo })).toHaveFocus();
      }
    });
  },
);
