import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import erro400 from '@/test/fixtures/erros/400-validacao.json';
import erro401 from '@/test/fixtures/erros/401.json';
import erro404 from '@/test/fixtures/erros/404.json';
import erro422 from '@/test/fixtures/erros/422-regra-de-negocio.json';
import erro500 from '@/test/fixtures/erros/500.json';
import {
  ApiError,
  ApiNetworkError,
  apiErrorFromResponse,
  ContratoInvalidoError,
  getErrorMessage,
  isEstoqueInsuficiente,
  temCodigo,
} from './errors';

describe('apiErrorFromResponse', () => {
  it('400 de validação: a mensagem em português e o code', () => {
    const erro = apiErrorFromResponse(400, erro400);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.statusCode).toBe(400);
    expect(erro.code).toBe('DADOS_INVALIDOS');
    expect(erro.message).toBe('Os dados enviados são inválidos');
  });

  it('422 de regra de negócio: mostra a mensagem do backend', () => {
    const erro = apiErrorFromResponse(422, erro422);

    expect(erro.code).toBe('VENDA_FINALIZADA');
    expect(erro.message).toBe('Venda já finalizada não pode ser alterada');
    expect(erro.mensagens).toEqual([
      'Venda já finalizada não pode ser alterada',
    ]);
  });

  it('aceita message em lista e sem code (corpo de outro intermediário)', () => {
    const erro = apiErrorFromResponse(400, {
      statusCode: 400,
      message: ['Primeira', 'Segunda'],
    });

    expect(erro.code).toBeUndefined();
    expect(erro.message).toBe('Primeira; Segunda');
  });

  it('400 sem mensagem própria usa o texto genérico', () => {
    const erro = apiErrorFromResponse(400, {
      statusCode: 400,
      message: 'Bad Request',
    });

    expect(erro.message).toBe('Não deu para concluir agora. Tente de novo.');
  });

  it('401: sessão expirada, mesmo com outra mensagem do backend', () => {
    expect(apiErrorFromResponse(401, erro401).message).toBe(
      'Sessão expirada. Faça login novamente.',
    );
    expect(
      apiErrorFromResponse(401, {
        statusCode: 401,
        code: 'CREDENCIAIS_INVALIDAS',
        message: 'Credenciais inválidas',
      }).message,
    ).toBe('Sessão expirada. Faça login novamente.');
  });

  it('404 com mensagem em português: usa a do backend', () => {
    const erro = apiErrorFromResponse(404, erro404);

    expect(erro.message).toBe('Insumo não encontrado');
    expect(erro.code).toBe('INSUMO_NAO_ENCONTRADO');
  });

  it('404 com a mensagem padrão do NestJS: "Não encontrei esse item. Ele pode ter sido excluído."', () => {
    expect(
      apiErrorFromResponse(404, {
        statusCode: 404,
        message: 'Cannot GET /naoexiste',
      }).message,
    ).toBe('Não encontrei esse item. Ele pode ter sido excluído.');
    expect(
      apiErrorFromResponse(404, {
        statusCode: 404,
        message: 'Not Found',
      }).message,
    ).toBe('Não encontrei esse item. Ele pode ter sido excluído.');
  });

  it('409: mostra a mensagem do backend', () => {
    const erro = apiErrorFromResponse(409, {
      statusCode: 409,
      code: 'INSUMO_EM_USO',
      message: 'Insumo em uso em receitas',
    });

    expect(erro.message).toBe('Insumo em uso em receitas');
    expect(temCodigo(erro, 'INSUMO_EM_USO')).toBe(true);
  });

  it.each([500, 502, 503])('%i: erro no servidor', (status) => {
    expect(apiErrorFromResponse(status, erro500).message).toBe(
      'O sistema falhou agora. Tente de novo em instantes.',
    );
  });

  it('corpo fora do formato da API usa o texto do status', () => {
    const erro = apiErrorFromResponse(502, '<html>Bad Gateway</html>');

    expect(erro.message).toBe(
      'O sistema falhou agora. Tente de novo em instantes.',
    );
    expect(erro.mensagens).toEqual([]);
    expect(erro.code).toBeUndefined();
  });

  it('corpo vazio num 403 usa o texto genérico', () => {
    expect(apiErrorFromResponse(403, undefined).message).toBe(
      'Não deu para concluir agora. Tente de novo.',
    );
  });
});

describe('temCodigo', () => {
  it('confere o code só em ApiError', () => {
    expect(
      temCodigo(apiErrorFromResponse(404, erro404), 'INSUMO_NAO_ENCONTRADO'),
    ).toBe(true);
    expect(
      temCodigo(apiErrorFromResponse(404, erro404), 'RECEITA_NAO_ENCONTRADA'),
    ).toBe(false);
    expect(
      temCodigo(new Error('INSUMO_NAO_ENCONTRADO'), 'INSUMO_NAO_ENCONTRADO'),
    ).toBe(false);
  });
});

describe('ApiNetworkError', () => {
  it('é um ApiError com status 0 e a mensagem de sem conexão', () => {
    const erro = new ApiNetworkError();

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.statusCode).toBe(0);
    expect(erro.isTimeout).toBe(false);
    expect(erro.message).toBe(
      'Sem conexão. Confira a internet e tente de novo.',
    );
  });

  it('marca o timeout', () => {
    expect(new ApiNetworkError({ isTimeout: true }).isTimeout).toBe(true);
  });
});

describe('getErrorMessage', () => {
  it('usa a mensagem do ApiError', () => {
    expect(getErrorMessage(apiErrorFromResponse(404, erro404))).toBe(
      'Insumo não encontrado',
    );
  });

  it('usa a mensagem de contrato inválido', () => {
    const erro = new ContratoInvalidoError(
      z.string().safeParse(1).error as z.ZodError,
    );

    expect(getErrorMessage(erro)).toBe(
      'O sistema respondeu algo inesperado. Tente de novo em instantes.',
    );
  });

  it('nunca expõe a mensagem de uma exceção do JavaScript', () => {
    expect(getErrorMessage(new TypeError('x is undefined'))).toBe(
      'Não deu para concluir agora. Tente de novo.',
    );
    expect(getErrorMessage('qualquer coisa')).toBe(
      'Não deu para concluir agora. Tente de novo.',
    );
  });
});

describe('isEstoqueInsuficiente', () => {
  function erroDeVenda(message: string | string[]) {
    return apiErrorFromResponse(400, { statusCode: 400, message });
  }

  it('reconhece pelo code ESTOQUE_INSUFICIENTE, qualquer que seja o texto', () => {
    expect(
      isEstoqueInsuficiente(
        apiErrorFromResponse(422, {
          statusCode: 422,
          code: 'ESTOQUE_INSUFICIENTE',
          message: 'Saldo de produto acabado acabou',
        }),
      ),
    ).toBe(true);
  });

  it('reconhece a mensagem real da API', () => {
    expect(
      isEstoqueInsuficiente(
        apiErrorFromResponse(422, {
          statusCode: 422,
          code: 'ESTOQUE_INSUFICIENTE',
          message:
            'Estoque insuficiente para a receita 25: disponível 10, solicitado 20',
        }),
      ),
    ).toBe(true);
  });

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
