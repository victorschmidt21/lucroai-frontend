import { describe, expect, it } from 'vitest';
import { makeJwt, makeJwtPayload } from '@/test/factories/auth.factory';
import payloadDoSeed from '@/test/fixtures/auth/jwt-payload.json';
import {
  decodificarJwt,
  isJwtExpirado,
  lerSessao,
  segundosAteExpirar,
} from './jwt';

// Token real do auth-service com o seed (assinatura trocada: o front não a confere).
const TOKEN_DO_SEED = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  Buffer.from(JSON.stringify(payloadDoSeed)).toString('base64url'),
  'assinatura',
].join('.');

const AGORA = Date.UTC(2026, 10, 17, 12, 0, 0);

describe('decodificarJwt', () => {
  it('lê o payload do token do seed, com os acentos em UTF-8', () => {
    expect(decodificarJwt(TOKEN_DO_SEED)).toEqual(payloadDoSeed);
    expect(decodificarJwt(TOKEN_DO_SEED)?.empresa.nome).toBe(
      'Padaria Pão Feliz Ltda',
    );
  });

  it('aceita nome, CNPJ e segmento nulos', () => {
    const token = makeJwt({
      nome: null,
      empresa: { id: 3, nome: 'Padaria', cnpj: null, segmento: null },
    });

    expect(decodificarJwt(token)).toMatchObject({
      nome: null,
      empresa: { cnpj: null, segmento: null },
    });
  });

  it.each([
    ['ausente', undefined],
    ['vazio', ''],
    ['sem três partes', 'abc.def'],
    ['com payload que não é base64', 'a.%%%.c'],
    ['com payload que não é JSON', `a.${btoa('não é json')}.c`],
  ])('devolve null com token %s', (_caso, token) => {
    expect(decodificarJwt(token)).toBeNull();
  });

  it('devolve null com payload fora do contrato', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'x' })).toString(
      'base64url',
    );

    expect(decodificarJwt(`a.${payload}.c`)).toBeNull();
  });
});

describe('isJwtExpirado', () => {
  const exp = AGORA / 1000;

  it('vale até o instante anterior ao exp', () => {
    expect(isJwtExpirado(makeJwtPayload({ exp }), AGORA - 1)).toBe(false);
  });

  it('vence no exp', () => {
    expect(isJwtExpirado(makeJwtPayload({ exp }), AGORA)).toBe(true);
    expect(isJwtExpirado(makeJwtPayload({ exp }), AGORA + 1000)).toBe(true);
  });
});

describe('segundosAteExpirar', () => {
  it('é o tempo até o exp, em segundos inteiros (4 h no login)', () => {
    const payload = makeJwtPayload({ exp: AGORA / 1000 + 4 * 60 * 60 });

    expect(segundosAteExpirar(payload, AGORA)).toBe(14_400);
    expect(segundosAteExpirar(payload, AGORA + 1500)).toBe(14_398);
  });

  it('não fica negativo depois do exp', () => {
    expect(
      segundosAteExpirar(makeJwtPayload({ exp: AGORA / 1000 }), AGORA + 5000),
    ).toBe(0);
  });
});

describe('lerSessao', () => {
  it('devolve o payload de um token em vigor', () => {
    expect(lerSessao(makeJwt({}, AGORA), AGORA)).toMatchObject({
      email: 'joao@padariapaofeliz.com.br',
    });
  });

  it('devolve null com o token vencido', () => {
    const token = makeJwt({}, AGORA - 5 * 60 * 60 * 1000);

    expect(lerSessao(token, AGORA)).toBeNull();
  });

  it('devolve null sem token legível', () => {
    expect(lerSessao('lixo', AGORA)).toBeNull();
    expect(lerSessao(undefined, AGORA)).toBeNull();
  });
});
