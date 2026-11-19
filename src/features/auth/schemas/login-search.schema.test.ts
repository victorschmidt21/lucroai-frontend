import { describe, expect, it } from 'vitest';
import { loginSearchSchema } from './login-search.schema';

describe('loginSearchSchema', () => {
  it('lê o destino e o aviso de sessão expirada', () => {
    expect(
      loginSearchSchema.parse({ redirect: '/insumos?q=a', expirada: '1' }),
    ).toEqual({ redirect: '/insumos?q=a', expirada: true });
  });

  it('usa a página inicial e nenhum aviso quando faltam', () => {
    expect(loginSearchSchema.parse({})).toEqual({
      redirect: '/',
      expirada: false,
    });
  });

  it('não derruba a tela com valores inválidos', () => {
    expect(
      loginSearchSchema.parse({
        redirect: ['/a', '/b'],
        expirada: 'sim',
      }),
    ).toEqual({ redirect: '/', expirada: false });
    expect(
      loginSearchSchema.parse({ redirect: 'https://outro.test' }).redirect,
    ).toBe('/');
  });
});
