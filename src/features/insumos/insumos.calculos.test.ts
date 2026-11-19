import { describe, expect, it } from 'vitest';
import { calcularCustoUnitario } from './insumos.calculos';

describe('calcularCustoUnitario', () => {
  it('divide o valor pago pela quantidade, sem arredondar', () => {
    expect(calcularCustoUnitario(12, 500)).toBeCloseTo(0.024, 10);
    expect(calcularCustoUnitario(8.8, 3)).toBe(8.8 / 3);
  });

  it('confere com o seed: farinha, 5 kg por R$ 15,00, custa 3/kg', () => {
    expect(calcularCustoUnitario(15, 5)).toBe(3);
  });

  it('devolve zero com quantidade zero ou negativa', () => {
    expect(calcularCustoUnitario(15, 0)).toBe(0);
    expect(calcularCustoUnitario(15, -1)).toBe(0);
  });

  it('devolve zero sem valor pago', () => {
    expect(calcularCustoUnitario(0, 5)).toBe(0);
  });
});
