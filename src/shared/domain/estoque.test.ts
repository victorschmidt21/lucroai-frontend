import { describe, expect, it } from 'vitest';
import {
  classificarStatusEstoque,
  fracaoDaBarra,
  isBaixoEstoque,
  percentualEstoque,
  statusEstoque,
} from './estoque';

const saldo = (quantidadeDisponivel: number, quantidadeMinima: number) => ({
  quantidadeDisponivel,
  quantidadeMinima,
});

describe('isBaixoEstoque', () => {
  it('é baixo só quando o disponível fica abaixo do mínimo', () => {
    expect(isBaixoEstoque(saldo(1, 2))).toBe(true);
    expect(isBaixoEstoque(saldo(2, 2))).toBe(false);
    expect(isBaixoEstoque(saldo(3, 2))).toBe(false);
  });

  it('considera o saldo negativo (a produção não confere o estoque)', () => {
    expect(isBaixoEstoque(saldo(-1, 0))).toBe(true);
  });
});

describe('percentualEstoque', () => {
  it('divide o disponível pelo mínimo', () => {
    expect(percentualEstoque(saldo(1, 4))).toBe(25);
    expect(percentualEstoque(saldo(3, 2))).toBe(150);
  });

  it('dá 100 com mínimo 0', () => {
    expect(percentualEstoque(saldo(0, 0))).toBe(100);
    expect(percentualEstoque(saldo(13, 0))).toBe(100);
  });
});

describe('statusEstoque', () => {
  it('mínimo 0: Adequado com 100%', () => {
    expect(statusEstoque(saldo(13, 0))).toBe('adequado');
  });

  it('abaixo do mínimo: Crítico', () => {
    expect(statusEstoque(saldo(1.5, 2))).toBe('critico');
  });

  it('abaixo de 50% do mínimo também é Crítico, como no mobile', () => {
    expect(statusEstoque(saldo(0.5, 2))).toBe('critico');
  });

  it('no mínimo ou acima: Adequado', () => {
    expect(statusEstoque(saldo(2, 2))).toBe('adequado');
  });

  it('confere com o seed: farinha, 10 kg com mínimo de 2 kg, 500% e Adequado', () => {
    expect(percentualEstoque(saldo(10, 2))).toBe(500);
    expect(statusEstoque(saldo(10, 2))).toBe('adequado');
  });
});

describe('classificarStatusEstoque', () => {
  it('segue os ramos do mobile', () => {
    expect(classificarStatusEstoque(true, 30)).toBe('critico');
    expect(classificarStatusEstoque(false, 49.9)).toBe('baixo');
    expect(classificarStatusEstoque(false, 50)).toBe('adequado');
  });
});

describe('fracaoDaBarra', () => {
  it('limita a barra entre 0 e 1', () => {
    expect(fracaoDaBarra(86)).toBe(0.86);
    expect(fracaoDaBarra(500)).toBe(1);
    expect(fracaoDaBarra(-50)).toBe(0);
  });
});
