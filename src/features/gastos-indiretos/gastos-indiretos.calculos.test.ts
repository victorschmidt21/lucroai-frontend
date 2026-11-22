import { describe, expect, it } from 'vitest';
import { makeGastosDoSeed } from '@/test/factories/gasto-indireto.factory';
import {
  calcularTotalContasDoMes,
  formatValorDoGasto,
} from './gastos-indiretos.calculos';

describe('calcularTotalContasDoMes', () => {
  it('soma só as contas do mês do seed, sem o saquinho por unidade', () => {
    expect(calcularTotalContasDoMes(makeGastosDoSeed())).toBe(2515);
  });

  it('deixa de fora os gastos por unidade e os percentuais da venda', () => {
    expect(
      calcularTotalContasDoMes([
        { valor: 100, tipo: 'MENSAL' },
        { valor: 0.05, tipo: 'POR_UNIDADE' },
        { valor: 0.12, tipo: 'PERCENTUAL_VENDA' },
      ]),
    ).toBe(100);
  });

  it('soma centavos sem arredondar', () => {
    expect(
      calcularTotalContasDoMes([
        { valor: 0.1, tipo: 'MENSAL' },
        { valor: 0.2, tipo: 'MENSAL' },
      ]),
    ).toBeCloseTo(0.3, 10);
  });

  it('devolve zero sem contas do mês', () => {
    expect(calcularTotalContasDoMes([])).toBe(0);
  });
});

describe('formatValorDoGasto', () => {
  it.each([
    [{ valor: 1800, tipo: 'MENSAL' }, 'R$ 1.800,00 por mês'],
    [{ valor: 0.05, tipo: 'POR_UNIDADE' }, 'R$ 0,05 por unidade'],
    [{ valor: 0.12, tipo: 'PERCENTUAL_VENDA' }, '12% da venda'],
    [{ valor: 0.075, tipo: 'PERCENTUAL_VENDA' }, '7,5% da venda'],
  ] as const)('%o vira "%s"', (gasto, texto) => {
    expect(formatValorDoGasto(gasto)).toBe(texto);
  });
});
