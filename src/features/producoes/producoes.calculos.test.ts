import { describe, expect, it } from 'vitest';
import { makeGastoIndireto } from '@/test/factories/gasto-indireto.factory';
import {
  calcularPreviaProducao,
  calcularTotalUnidades,
  calcularValorRateado,
} from './producoes.calculos';

describe('calcularTotalUnidades', () => {
  it('multiplica os lotes pelo rendimento', () => {
    expect(calcularTotalUnidades(3, 50)).toBe(150);
  });
});

describe('calcularValorRateado', () => {
  it('PROPORCIONAL: valor × lotes', () => {
    expect(
      calcularValorRateado(
        { valor: 450, metodoRateio: 'PROPORCIONAL' },
        2,
        100,
      ),
    ).toBe(900);
  });

  it('POR_UNIDADE: valor × total de unidades', () => {
    expect(
      calcularValorRateado({ valor: 120, metodoRateio: 'POR_UNIDADE' }, 1, 50),
    ).toBe(6000);
  });

  it('FIXO: o valor integral, independente do volume', () => {
    expect(
      calcularValorRateado({ valor: 1800, metodoRateio: 'FIXO' }, 5, 250),
    ).toBe(1800);
  });

  it('arredonda a centavos como o backend', () => {
    expect(
      calcularValorRateado(
        { valor: 0.333, metodoRateio: 'POR_UNIDADE' },
        1,
        10,
      ),
    ).toBe(3.33);
  });
});

describe('calcularPreviaProducao', () => {
  it('soma o rateio estimado dos gastos (exemplo do OVERVIEW do catalog)', () => {
    const energia = makeGastoIndireto({
      id: 1,
      valor: 450,
      metodoRateio: 'PROPORCIONAL',
    });
    const aluguel = makeGastoIndireto({
      id: 2,
      valor: 1800,
      metodoRateio: 'FIXO',
    });
    const embalagem = makeGastoIndireto({
      id: 3,
      valor: 120,
      metodoRateio: 'POR_UNIDADE',
    });

    const previa = calcularPreviaProducao([energia, aluguel, embalagem], 1, 50);

    expect(previa.totalUnidades).toBe(50);
    expect(previa.rateios.map((r) => r.valorRateado)).toEqual([
      450, 1800, 6000,
    ]);
    expect(previa.totalRateio).toBe(8250);
  });

  it('sem gastos, não há rateio', () => {
    expect(calcularPreviaProducao([], 2, 10)).toEqual({
      totalUnidades: 20,
      rateios: [],
      totalRateio: 0,
    });
  });
});
