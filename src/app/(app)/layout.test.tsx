import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { toUsuarioAtual } from '@/shared/auth/usuario-atual';
import { getUsuarioAtual } from '@/shared/auth/usuario-atual.server';
import { makeJwtPayload } from '@/test/factories/auth.factory';
import { setTestUrl } from '@/test/next-navigation';
import AppLayout from './layout';

vi.mock('next/navigation', () => import('@/test/next-navigation'));
vi.mock('@/shared/auth/usuario-atual.server', () => ({
  getUsuarioAtual: vi.fn<() => Promise<unknown>>(),
}));

it('confere a sessão e abre o menu do usuário já preenchido, sem buscar a sessão de novo', async () => {
  setTestUrl('/insumos');
  vi.mocked(getUsuarioAtual).mockResolvedValue(
    toUsuarioAtual(makeJwtPayload()),
  );

  // Sem handler de `/api/auth/sessao`: uma busca no navegador falharia o teste.
  render(await AppLayout({ children: <h1>Insumos</h1> }));

  expect(getUsuarioAtual).toHaveBeenCalled();
  const lateral = screen.getByRole('complementary');
  expect(within(lateral).getByText('João da Silva')).toBeInTheDocument();
  expect(
    within(lateral).getByRole('button', { name: 'Sair' }),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole('main')).getByRole('heading', { name: 'Insumos' }),
  ).toBeInTheDocument();
});
