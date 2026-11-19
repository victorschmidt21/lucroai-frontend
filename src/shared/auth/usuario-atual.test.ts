import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiError, ContratoInvalidoError } from '@/shared/api/errors';
import { nestError } from '@/test/api';
import { makeJwtPayload } from '@/test/factories/auth.factory';
import { server } from '@/test/server';
import { toUsuarioAtual, usuarioAtualSchema } from './usuario-atual';
import { getSessao, usuarioAtualOptions } from './usuario-atual.queries';

const USUARIO = toUsuarioAtual(makeJwtPayload());

describe('toUsuarioAtual', () => {
  it('mapeia o payload do JWT sem iat, com o exp em ISO', () => {
    expect(toUsuarioAtual(makeJwtPayload({ exp: 1_780_014_400 }))).toEqual({
      id: 1,
      nome: 'João da Silva',
      email: 'joao@padariapaofeliz.com.br',
      empresa: {
        id: 1,
        nome: 'Padaria Pão Feliz Ltda',
        cnpj: '45.678.901/0001-23',
        segmento: 'Panificação e Confeitaria',
      },
      expiraEm: '2026-05-29T00:26:40.000Z',
    });
    expect(usuarioAtualSchema.safeParse(USUARIO).success).toBe(true);
  });
});

describe('getSessao', () => {
  it('lê o usuário de GET /api/auth/sessao', async () => {
    server.use(http.get('*/api/auth/sessao', () => HttpResponse.json(USUARIO)));

    await expect(getSessao()).resolves.toEqual(USUARIO);
  });

  it('rejeita com ApiError 401 sem sessão', async () => {
    server.use(
      http.get('*/api/auth/sessao', () =>
        HttpResponse.json(nestError(401, 'Unauthorized'), { status: 401 }),
      ),
    );

    await expect(getSessao()).rejects.toMatchObject({
      constructor: ApiError,
      statusCode: 401,
    });
  });

  it('rejeita resposta fora do contrato', async () => {
    server.use(
      http.get('*/api/auth/sessao', () => HttpResponse.json({ id: 'x' })),
    );

    await expect(getSessao()).rejects.toBeInstanceOf(ContratoInvalidoError);
  });
});

describe('usuarioAtualOptions', () => {
  it('usa a chave da sessão', () => {
    expect(usuarioAtualOptions().queryKey).toEqual(['sessao', 'usuario']);
  });
});
