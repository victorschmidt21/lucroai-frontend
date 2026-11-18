import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigateTo } from '@/shared/auth/navigation';
import { toUsuarioAtual } from '@/shared/auth/usuario-atual';
import { expectNoA11yViolations } from '@/test/a11y';
import { makeJwtPayload } from '@/test/factories/auth.factory';
import { renderWithQuery } from '@/test/render';
import { server } from '@/test/server';
import { UserMenu } from './user-menu';

vi.mock('@/shared/auth/navigation', () => ({
  navigateTo: vi.fn<(path: string) => void>(),
}));

afterEach(() => {
  vi.mocked(navigateTo).mockClear();
});

function mockSessao(nome: string | null = 'João da Silva') {
  server.use(
    http.get('*/api/auth/sessao', () =>
      HttpResponse.json(toUsuarioAtual(makeJwtPayload({ nome }))),
    ),
  );
}

describe('UserMenu', () => {
  it('mostra nome, e-mail e empresa da sessão', async () => {
    mockSessao();
    const { container } = renderWithQuery(<UserMenu />);

    expect(screen.getByLabelText('Carregando usuário')).toBeInTheDocument();
    expect(await screen.findByText('João da Silva')).toBeInTheDocument();
    expect(screen.getByText('joao@padariapaofeliz.com.br')).toBeInTheDocument();
    expect(screen.getByText('Padaria Pão Feliz Ltda')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('usa o e-mail quando o token não traz o nome', async () => {
    mockSessao(null);
    renderWithQuery(<UserMenu />);

    expect(
      await screen.findAllByText('joao@padariapaofeliz.com.br'),
    ).toHaveLength(2);
  });

  it('sai: apaga o cookie, limpa o cache e vai para o login', async () => {
    mockSessao();
    let saiu = false;
    server.use(
      http.post('*/api/auth/logout', () => {
        saiu = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { queryClient } = renderWithQuery(<UserMenu />);
    const limpar = vi.spyOn(queryClient, 'clear');
    await screen.findByText('João da Silva');

    await user.click(screen.getByRole('button', { name: 'Sair' }));

    await waitFor(() => {
      expect(navigateTo).toHaveBeenCalledWith('/login');
    });
    expect(saiu).toBe(true);
    expect(limpar).toHaveBeenCalled();
  });

  it('mostra o erro quando não consegue sair', async () => {
    mockSessao();
    server.use(http.post('*/api/auth/logout', () => HttpResponse.error()));
    const user = userEvent.setup();
    renderWithQuery(<UserMenu />);

    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sem conexão com o servidor.',
    );
    expect(navigateTo).not.toHaveBeenCalled();
  });
});
