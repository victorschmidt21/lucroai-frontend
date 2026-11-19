import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigateTo } from '@/shared/auth/navigation';
import { expectNoA11yViolations } from '@/test/a11y';
import { nestError } from '@/test/api';
import { renderWithQuery } from '@/test/render';
import { server } from '@/test/server';
import { LoginForm } from './login-form';

vi.mock('@/shared/auth/navigation', () => ({
  navigateTo: vi.fn<(path: string) => void>(),
  isNavegando: vi.fn<() => boolean>(() => false),
}));

afterEach(() => {
  vi.mocked(navigateTo).mockClear();
});

/** Registra o corpo enviado a `/api/auth/login` e responde com `resposta`. */
function mockLogin(resposta: () => Response) {
  const corpos: unknown[] = [];
  server.use(
    http.post('*/api/auth/login', async ({ request }) => {
      corpos.push(await request.json());
      return resposta();
    }),
  );

  return corpos;
}

async function preencher(email: string, senha: string) {
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('E-mail'));
  await user.clear(screen.getByLabelText('Senha'));
  if (email) await user.type(screen.getByLabelText('E-mail'), email);
  if (senha) await user.type(screen.getByLabelText('Senha'), senha);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));

  return user;
}

describe('LoginForm', () => {
  it('mostra os campos sem violações de acessibilidade', async () => {
    const { container } = renderWithQuery(<LoginForm redirectTo="/" />);

    expect(screen.getByLabelText('E-mail')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    await expectNoA11yViolations(container);
  });

  it('pede o e-mail e a senha, sem chamar a API, e foca o primeiro campo', async () => {
    renderWithQuery(<LoginForm redirectTo="/" />);

    await preencher('', '');

    expect(screen.getByText('Informe seu e-mail')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
  });

  it('recusa o e-mail inválido e foca a senha quando só ela falta', async () => {
    renderWithQuery(<LoginForm redirectTo="/" />);

    await preencher('joao@padariapaofeliz.com.br', '');
    expect(screen.getByLabelText('Senha')).toHaveFocus();

    await preencher('x', '1');
    expect(screen.getByText('Informe um e-mail válido')).toBeInTheDocument();
  });

  it('mostra e oculta a senha', async () => {
    const user = userEvent.setup();
    renderWithQuery(<LoginForm redirectTo="/" />);

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
  });

  it('envia as credenciais e vai para o destino', async () => {
    const corpos = mockLogin(() => new HttpResponse(null, { status: 204 }));
    renderWithQuery(<LoginForm redirectTo="/insumos?q=acucar" />);

    await preencher(' joao@padariapaofeliz.com.br ', '123456');

    await waitFor(() => {
      expect(navigateTo).toHaveBeenCalledWith('/insumos?q=acucar');
    });
    expect(corpos).toEqual([
      { email: 'joao@padariapaofeliz.com.br', senha: '123456' },
    ]);
  });

  it('mostra "E-mail ou senha inválidos" no 401', async () => {
    mockLogin(() =>
      HttpResponse.json(nestError(401, 'Credenciais inválidas'), {
        status: 401,
      }),
    );
    renderWithQuery(<LoginForm redirectTo="/" sessaoExpirada />);

    await preencher('joao@padariapaofeliz.com.br', 'errada');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou senha inválidos',
    );
    expect(navigateTo).not.toHaveBeenCalled();
    // O erro substitui o aviso de sessão expirada.
    expect(
      screen.queryByText('Sessão expirada. Faça login novamente.'),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['erro do servidor', () => HttpResponse.json({}, { status: 502 })],
    ['falha de rede', () => HttpResponse.error()],
  ])('mostra a falha ao entrar com %s', async (_caso, resposta) => {
    mockLogin(resposta);
    renderWithQuery(<LoginForm redirectTo="/" />);

    await preencher('joao@padariapaofeliz.com.br', '123456');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível entrar. Verifique o servidor e tente novamente.',
    );
  });

  it('mostra o aviso de sessão expirada', async () => {
    const { container } = renderWithQuery(
      <LoginForm redirectTo="/insumos" sessaoExpirada />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Sessão expirada. Faça login novamente.',
    );
    await expectNoA11yViolations(container);
  });
});
