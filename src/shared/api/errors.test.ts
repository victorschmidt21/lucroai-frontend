import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import erro400Regra from '@/test/fixtures/erros/400-regra-de-negocio.json';
import erro400 from '@/test/fixtures/erros/400-validacao.json';
import erro401 from '@/test/fixtures/erros/401.json';
import erro404 from '@/test/fixtures/erros/404.json';
import erro500 from '@/test/fixtures/erros/500.json';
import {
  ApiError,
  ApiNetworkError,
  apiErrorFromResponse,
  ContratoInvalidoError,
  getErrorMessage,
  isEstoqueInsuficiente,
} from './errors';

describe('apiErrorFromResponse', () => {
  it('400 com lista: junta as mensagens de validação', () => {
    const erro = apiErrorFromResponse('catalog', 400, erro400);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.statusCode).toBe(400);
    expect(erro.servico).toBe('catalog');
    expect(erro.error).toBe('Bad Request');
    expect(erro.mensagens).toHaveLength(7);
    expect(erro.message).toBe(erro400.message.join('; '));
  });

  it('400 de regra de negócio: mostra a mensagem do backend', () => {
    const erro = apiErrorFromResponse('sales', 400, erro400Regra);

    expect(erro.message).toBe('Venda já finalizada não pode ser alterada');
    expect(erro.mensagens).toEqual([
      'Venda já finalizada não pode ser alterada',
    ]);
  });

  it('400 sem mensagem própria usa o texto genérico', () => {
    const erro = apiErrorFromResponse('sales', 400, {
      statusCode: 400,
      message: 'Bad Request',
    });

    expect(erro.message).toBe(
      'Não foi possível concluir a ação. Tente novamente.',
    );
  });

  it('401: sessão expirada, mesmo com outra mensagem do backend', () => {
    expect(apiErrorFromResponse('catalog', 401, erro401).message).toBe(
      'Sessão expirada. Faça login novamente.',
    );
    expect(
      apiErrorFromResponse('catalog', 401, {
        statusCode: 401,
        message: 'Credenciais inválidas',
        error: 'Unauthorized',
      }).message,
    ).toBe('Sessão expirada. Faça login novamente.');
  });

  it('404 com mensagem em português: usa a do backend', () => {
    const erro = apiErrorFromResponse('catalog', 404, erro404);

    expect(erro.message).toBe('Insumo não encontrado');
    expect(erro.error).toBe('Not Found');
  });

  it('404 com a mensagem padrão do NestJS: "Registro não encontrado."', () => {
    expect(
      apiErrorFromResponse('catalog', 404, {
        statusCode: 404,
        message: 'Cannot GET /naoexiste',
        error: 'Not Found',
      }).message,
    ).toBe('Registro não encontrado.');
    expect(
      apiErrorFromResponse('catalog', 404, {
        statusCode: 404,
        message: 'Not Found',
      }).message,
    ).toBe('Registro não encontrado.');
  });

  it('409: mostra a mensagem do backend', () => {
    const erro = apiErrorFromResponse('auth', 409, {
      statusCode: 409,
      message: 'CNPJ já cadastrado',
      error: 'Conflict',
    });

    expect(erro.message).toBe('CNPJ já cadastrado');
  });

  it.each([500, 502, 503])('%i: erro no servidor', (status) => {
    expect(apiErrorFromResponse('recipe', status, erro500).message).toBe(
      'Erro no servidor. Tente novamente.',
    );
  });

  it('corpo fora do formato do NestJS usa o texto do status', () => {
    const erro = apiErrorFromResponse('sales', 502, '<html>Bad Gateway</html>');

    expect(erro.message).toBe('Erro no servidor. Tente novamente.');
    expect(erro.mensagens).toEqual([]);
  });

  it('corpo vazio num 403 usa o texto genérico', () => {
    expect(apiErrorFromResponse('sales', 403, undefined).message).toBe(
      'Não foi possível concluir a ação. Tente novamente.',
    );
  });
});

describe('ApiNetworkError', () => {
  it('é um ApiError com status 0 e a mensagem de sem conexão', () => {
    const erro = new ApiNetworkError({ servico: 'sales' });

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.statusCode).toBe(0);
    expect(erro.isTimeout).toBe(false);
    expect(erro.message).toBe('Sem conexão com o servidor.');
  });

  it('marca o timeout', () => {
    expect(
      new ApiNetworkError({ servico: 'sales', isTimeout: true }).isTimeout,
    ).toBe(true);
  });
});

describe('getErrorMessage', () => {
  it('usa a mensagem do ApiError', () => {
    expect(getErrorMessage(apiErrorFromResponse('catalog', 404, erro404))).toBe(
      'Insumo não encontrado',
    );
  });

  it('usa a mensagem de contrato inválido', () => {
    const erro = new ContratoInvalidoError(
      z.string().safeParse(1).error as z.ZodError,
    );

    expect(getErrorMessage(erro)).toBe('Resposta inesperada do servidor.');
  });

  it('nunca expõe a mensagem de uma exceção do JavaScript', () => {
    expect(getErrorMessage(new TypeError('x is undefined'))).toBe(
      'Não foi possível concluir a ação. Tente novamente.',
    );
    expect(getErrorMessage('qualquer coisa')).toBe(
      'Não foi possível concluir a ação. Tente novamente.',
    );
  });
});

describe('isEstoqueInsuficiente', () => {
  function erroDeVenda(message: string | string[]) {
    return apiErrorFromResponse('sales', 400, {
      statusCode: 400,
      message,
      error: 'Bad Request',
    });
  }

  it.each([
    'Estoque insuficiente para a receita 1',
    'ESTOQUE INSUFICIENTE',
    'Produto indisponível no estoque',
    'Não há estoque do produto',
    'Item sem estoque',
    'estoque indisponivel',
    'Não há quantidade em estoque',
  ])('reconhece "%s"', (mensagem) => {
    expect(isEstoqueInsuficiente(erroDeVenda(mensagem))).toBe(true);
  });

  it.each([
    'Venda já finalizada não pode ser alterada',
    'Saldo insuficiente',
    'Estoque atualizado',
    'Receita não encontrada',
  ])('ignora "%s"', (mensagem) => {
    expect(isEstoqueInsuficiente(erroDeVenda(mensagem))).toBe(false);
  });

  it('procura em todas as mensagens da lista', () => {
    expect(
      isEstoqueInsuficiente(
        erroDeVenda(['quantidade inválida', 'sem estoque']),
      ),
    ).toBe(true);
  });

  it('aceita Error e texto, como o mobile', () => {
    expect(isEstoqueInsuficiente(new Error('Estoque insuficiente'))).toBe(true);
    expect(isEstoqueInsuficiente('estoque insuficiente')).toBe(true);
    expect(isEstoqueInsuficiente(null)).toBe(false);
  });
});
