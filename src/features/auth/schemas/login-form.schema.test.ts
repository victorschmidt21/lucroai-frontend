import { describe, expect, it } from 'vitest';
import { ApiError, ApiNetworkError } from '@/shared/api/errors';
import {
  getLoginErrorMessage,
  loginFormSchema,
  MENSAGEM_CREDENCIAIS_INVALIDAS,
  MENSAGEM_ERRO_LOGIN,
} from './login-form.schema';

function erros(valores: unknown) {
  const resultado = loginFormSchema.safeParse(valores);

  return resultado.success
    ? {}
    : Object.fromEntries(
        resultado.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
}

describe('loginFormSchema', () => {
  it('aceita e-mail e senha, aparando só o e-mail', () => {
    expect(
      loginFormSchema.parse({
        email: '  joao@padariapaofeliz.com.br ',
        senha: ' 123456 ',
      }),
    ).toEqual({ email: 'joao@padariapaofeliz.com.br', senha: ' 123456 ' });
  });

  it('pede o e-mail e a senha', () => {
    expect(erros({ email: '   ', senha: '' })).toEqual({
      email: 'Informe seu e-mail',
      senha: 'Informe sua senha',
    });
  });

  it.each(['joao', 'joao@', '@padaria.com', 'joao padaria@x.com'])(
    'recusa o e-mail inválido %s',
    (email) => {
      expect(erros({ email, senha: '1' })).toEqual({
        email: 'Informe um e-mail válido',
      });
    },
  );
});

describe('getLoginErrorMessage', () => {
  it('trata 401 como credencial errada', () => {
    expect(getLoginErrorMessage(new ApiError({ statusCode: 401 }))).toBe(
      MENSAGEM_CREDENCIAIS_INVALIDAS,
    );
  });

  it.each([
    ['400', new ApiError({ statusCode: 400 })],
    ['502', new ApiError({ statusCode: 502 })],
    ['rede', new ApiNetworkError()],
    ['erro qualquer', new Error('x')],
  ])('trata %s como falha ao entrar', (_caso, erro) => {
    expect(getLoginErrorMessage(erro)).toBe(MENSAGEM_ERRO_LOGIN);
  });
});
