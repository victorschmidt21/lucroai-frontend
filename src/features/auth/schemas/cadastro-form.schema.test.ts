import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ApiError, ApiNetworkError } from '@/shared/api/errors';
import {
  cadastroFormSchema,
  getCadastroErro,
  MENSAGEM_CNPJ_JA_CADASTRADO,
  MENSAGEM_EMAIL_JA_CADASTRADO,
  MENSAGEM_ERRO_CADASTRO,
  MENSAGEM_MUITAS_TENTATIVAS,
  MENSAGEM_SENHAS_DIFERENTES,
  MENSAGEM_TOKEN_INVALIDO,
  toCadastroBody,
  type CadastroFormInput,
} from './cadastro-form.schema';

const VALIDO: CadastroFormInput = {
  nome_empresa: '  Padaria da Ana ',
  cnpj: '',
  segmento: ' Padaria ',
  nome_usuario: 'Ana Souza',
  email: ' ana@padariadaana.com.br ',
  senha: ' 123456',
  confirmacao_senha: ' 123456',
  token_cadastro: ' token-ficticio ',
};

/** A primeira mensagem de cada campo, a que a tela mostra. */
function erros(valores: CadastroFormInput) {
  const resultado = cadastroFormSchema.safeParse(valores);

  return resultado.success
    ? {}
    : Object.fromEntries(
        Object.entries(z.flattenError(resultado.error).fieldErrors).map(
          ([campo, mensagens]) => [campo, mensagens?.[0]],
        ),
      );
}

describe('cadastroFormSchema', () => {
  it('apara os textos, sem mexer na senha e no token', () => {
    const valores = cadastroFormSchema.parse(VALIDO);

    expect(toCadastroBody(valores)).toEqual({
      nome_empresa: 'Padaria da Ana',
      segmento: 'Padaria',
      nome_usuario: 'Ana Souza',
      email: 'ana@padariadaana.com.br',
      senha: ' 123456',
      token_cadastro: ' token-ficticio ',
    });
  });

  it('pede os campos obrigatórios e aceita CNPJ e segmento vazios', () => {
    expect(
      erros({
        nome_empresa: '  ',
        cnpj: '',
        segmento: '',
        nome_usuario: ' ',
        email: '',
        senha: '',
        confirmacao_senha: '',
        token_cadastro: '',
      }),
    ).toEqual({
      nome_empresa: 'Informe o nome da empresa',
      nome_usuario: 'Informe seu nome',
      email: 'Informe seu e-mail',
      senha: 'Informe uma senha',
      confirmacao_senha: 'Confirme a senha',
      token_cadastro: 'Informe o token de cadastro',
    });
  });

  it('recusa senhas diferentes na confirmação', () => {
    expect(erros({ ...VALIDO, confirmacao_senha: '1234567' })).toEqual({
      confirmacao_senha: MENSAGEM_SENHAS_DIFERENTES,
    });
  });

  it('recusa e-mail inválido, senha curta e textos acima do limite', () => {
    expect(
      erros({
        ...VALIDO,
        email: 'ana@',
        senha: '12345',
        confirmacao_senha: '12345',
        nome_empresa: 'x'.repeat(101),
        cnpj: '1'.repeat(19),
      }),
    ).toEqual({
      email: 'Informe um e-mail válido',
      senha: 'A senha precisa ter pelo menos 6 caracteres',
      nome_empresa: 'Use até 100 caracteres',
      cnpj: 'Use até 18 caracteres',
    });
  });

  it('envia o CNPJ quando informado', () => {
    expect(
      toCadastroBody(
        cadastroFormSchema.parse({ ...VALIDO, cnpj: '12.345.678/0001-90' }),
      ),
    ).toMatchObject({ cnpj: '12.345.678/0001-90' });
  });
});

describe('getCadastroErro', () => {
  it('põe o 403 do token no campo do token', () => {
    expect(
      getCadastroErro(
        new ApiError({ statusCode: 403, code: 'TOKEN_CADASTRO_INVALIDO' }),
      ),
    ).toEqual({ campos: { token_cadastro: MENSAGEM_TOKEN_INVALIDO } });
  });

  it('põe o 409 no e-mail ou, com o code do CNPJ, no CNPJ', () => {
    expect(
      getCadastroErro(
        new ApiError({ statusCode: 409, code: 'EMAIL_JA_CADASTRADO' }),
      ),
    ).toEqual({ campos: { email: MENSAGEM_EMAIL_JA_CADASTRADO } });
    expect(
      getCadastroErro(
        new ApiError({ statusCode: 409, code: 'CNPJ_JA_CADASTRADO' }),
      ),
    ).toEqual({ campos: { cnpj: MENSAGEM_CNPJ_JA_CADASTRADO } });
  });

  it('avisa o 429 fora dos campos', () => {
    expect(getCadastroErro(new ApiError({ statusCode: 429 }))).toEqual({
      campos: {},
      geral: MENSAGEM_MUITAS_TENTATIVAS,
    });
  });

  it('põe o 400 em cada campo do details, em português', () => {
    expect(
      getCadastroErro(
        new ApiError({
          statusCode: 400,
          code: 'DADOS_INVALIDOS',
          details: [
            { field: 'email', messages: ['email must be an email'] },
            { field: 'extra', messages: ['property extra should not exist'] },
            { field: 'constructor', messages: ['x'] },
          ],
        }),
      ),
    ).toEqual({ campos: { email: 'Informe um e-mail válido' } });
  });

  it.each([
    ['400 sem details', new ApiError({ statusCode: 400 })],
    ['502', new ApiError({ statusCode: 502 })],
    ['rede', new ApiNetworkError()],
    ['erro qualquer', new Error('x')],
  ])('trata %s como falha genérica', (_caso, erro) => {
    expect(getCadastroErro(erro)).toEqual({
      campos: {},
      geral: MENSAGEM_ERRO_CADASTRO,
    });
  });
});
