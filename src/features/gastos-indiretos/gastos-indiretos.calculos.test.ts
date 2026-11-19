import { describe, expect, it } from 'vitest';
import { makeGastosDoSeed } from '@/test/factories/gasto-indireto.factory';
import { calcularTotalGastos } from './gastos-indiretos.calculos';

describe('calcularTotalGastos', () => {
  it('soma o valor de todos os gastos do seed', () => {
    expect(calcularTotalGastos(makeGastosDoSeed())).toBe(2555);
  });

  it('soma centavos sem arredondar', () => {
    expect(calcularTotalGastos([{ valor: 0.1 }, { valor: 0.2 }])).toBeCloseTo(
      0.3,
      10,
    );
  });

  it('devolve zero sem gastos', () => {
    expect(calcularTotalGastos([])).toBe(0);
  });
});
