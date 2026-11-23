import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserMenu } from '@/features/auth/components/user-menu';
import { toUsuarioAtual } from '@/shared/auth/usuario-atual';
import { makeJwtPayload } from '@/test/factories/auth.factory';
import { setTestUrl } from '@/test/next-navigation';
import { renderWithQuery } from '@/test/render';
import { ToastProvider } from '@/shared/ui/toast';
import { server } from '@/test/server';
import { AppShell } from './app-shell';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

beforeEach(() => {
  setTestUrl('/estoque');
  server.use(
    http.get('*/api/auth/sessao', () =>
      HttpResponse.json(toUsuarioAtual(makeJwtPayload())),
    ),
  );
});

function renderShell() {
  return renderWithQuery(
    <ToastProvider>
      <AppShell userMenu={<UserMenu />}>
        <h1>Estoque</h1>
      </AppShell>
    </ToastProvider>,
  );
}

describe('AppShell', () => {
  it('põe a tela no main, com o atalho para pular o menu', () => {
    renderShell();

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'conteudo');
    expect(
      within(main).getByRole('heading', { name: 'Estoque' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Pular para o conteúdo' }),
    ).toHaveAttribute('href', '#conteudo');
  });

  it('tem o menu lateral e a barra inferior, com o item ativo nos dois', () => {
    renderShell();

    const menus = screen.getAllByRole('navigation', {
      name: 'Menu principal',
    });
    expect(menus).toHaveLength(2);
    for (const menu of menus) {
      expect(
        within(menu).getByRole('link', { name: 'Estoque' }),
      ).toHaveAttribute('aria-current', 'page');
    }
  });

  it('mostra o menu do usuário com "Sair" no rodapé do menu lateral', async () => {
    renderShell();

    const lateral = screen.getByRole('complementary');
    expect(
      await within(lateral).findByText('João da Silva'),
    ).toBeInTheDocument();
    expect(
      within(lateral).getByText('Padaria Pão Feliz Ltda'),
    ).toBeInTheDocument();
    expect(
      within(lateral).getByRole('button', { name: 'Sair' }),
    ).toBeInTheDocument();
  });

  it('no celular, abre o menu do usuário pelo botão "Conta"', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Conta' }));

    const gaveta = await screen.findByRole('dialog', { name: 'Conta' });
    expect(
      await within(gaveta).findByText('João da Silva'),
    ).toBeInTheDocument();
    expect(
      within(gaveta).getByRole('button', { name: 'Sair' }),
    ).toBeInTheDocument();
  });
});
