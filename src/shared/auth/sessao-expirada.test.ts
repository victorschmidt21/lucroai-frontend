import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/errors';
import { isNavegando, navigateTo } from './navigation';
import { handleSessaoExpirada } from './sessao-expirada';

vi.mock('./navigation', () => ({
  navigateTo: vi.fn<(path: string) => void>(),
  isNavegando: vi.fn<() => boolean>(() => false),
}));

const ERRO_401 = new ApiError({ statusCode: 401 });

afterEach(() => {
  vi.mocked(navigateTo).mockClear();
  window.history.replaceState(null, '', '/');
});

describe('handleSessaoExpirada', () => {
  it('leva ao login com a rota atual e o aviso de sessão expirada', () => {
    window.history.replaceState(null, '', '/insumos?q=acucar');

    handleSessaoExpirada(ERRO_401);

    expect(navigateTo).toHaveBeenCalledWith(
      '/login?redirect=%2Finsumos%3Fq%3Dacucar&expirada=1',
    );
  });

  it('não faz nada no próprio login, onde 401 é senha errada', () => {
    window.history.replaceState(null, '', '/login?redirect=%2Finsumos');

    handleSessaoExpirada(ERRO_401);

    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('não faz nada com uma navegação em curso, como ao sair', () => {
    window.history.replaceState(null, '', '/insumos');
    vi.mocked(isNavegando).mockReturnValueOnce(true);

    handleSessaoExpirada(ERRO_401);

    expect(navigateTo).not.toHaveBeenCalled();
  });
});
