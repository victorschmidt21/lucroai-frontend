import { afterEach, describe, expect, it } from 'vitest';
import { makeAlertas } from '@/test/factories/insumo.factory';
import {
  deveAbrirAviso,
  idDaSessao,
  lerSessaoVerificada,
  marcarSessaoVerificada,
  totalDeAlertas,
} from './aviso-ao-entrar';

const SESSAO = idDaSessao({ id: 3, expiraEm: '2026-11-22T20:00:00.000Z' });

describe('idDaSessao', () => {
  it('muda a cada login (outro fim de token)', () => {
    expect(SESSAO).toBe('3:2026-11-22T20:00:00.000Z');
    expect(
      idDaSessao({ id: 3, expiraEm: '2026-11-23T08:00:00.000Z' }),
    ).not.toBe(SESSAO);
  });
});

describe('totalDeAlertas', () => {
  it('soma os insumos negativos e os que ficaram mais caros', () => {
    expect(totalDeAlertas(makeAlertas())).toBe(2);
    expect(
      totalDeAlertas(makeAlertas({ estoqueNegativo: [], precoDefasado: [] })),
    ).toBe(0);
  });
});

describe('deveAbrirAviso (uma vez por sessão)', () => {
  it('abre na primeira leitura da sessão com alertas', () => {
    expect(
      deveAbrirAviso({
        sessaoAtual: SESSAO,
        sessaoJaVerificada: null,
        totalAlertas: 1,
      }),
    ).toBe(true);
  });

  it('não abre sem alertas', () => {
    expect(
      deveAbrirAviso({
        sessaoAtual: SESSAO,
        sessaoJaVerificada: null,
        totalAlertas: 0,
      }),
    ).toBe(false);
  });

  it('não reabre na mesma sessão', () => {
    expect(
      deveAbrirAviso({
        sessaoAtual: SESSAO,
        sessaoJaVerificada: SESSAO,
        totalAlertas: 2,
      }),
    ).toBe(false);
  });

  it('abre de novo numa sessão nova (outro login)', () => {
    expect(
      deveAbrirAviso({
        sessaoAtual: SESSAO,
        sessaoJaVerificada: '3:2026-11-21T20:00:00.000Z',
        totalAlertas: 2,
      }),
    ).toBe(true);
  });
});

describe('sessão verificada', () => {
  afterEach(() => window.sessionStorage.clear());

  it('guarda só o id da sessão no sessionStorage', () => {
    marcarSessaoVerificada(SESSAO);

    expect(lerSessaoVerificada()).toBe(SESSAO);
    expect(window.sessionStorage.getItem('lucroai:aviso-ao-entrar')).toBe(
      SESSAO,
    );
  });
});
