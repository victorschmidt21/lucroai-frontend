import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { toUsuarioAtual } from '@/shared/auth/usuario-atual';
import { getUsuarioAtual } from '@/shared/auth/usuario-atual.server';
import { makeJwtPayload } from '@/test/factories/auth.factory';
import { server } from '@/test/server';
import HomePage from './page';

vi.mock('@/shared/auth/usuario-atual.server', () => ({
  getUsuarioAtual: vi.fn<() => Promise<unknown>>(),
}));

it('confere a sessão e mostra o nome do sistema e o menu do usuário', async () => {
  const usuario = toUsuarioAtual(makeJwtPayload());
  vi.mocked(getUsuarioAtual).mockResolvedValue(usuario);
  server.use(http.get('*/api/auth/sessao', () => HttpResponse.json(usuario)));

  render(await HomePage());

  expect(getUsuarioAtual).toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: 'LucroAI' })).toBeInTheDocument();
  expect(await screen.findByText('João da Silva')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
});
