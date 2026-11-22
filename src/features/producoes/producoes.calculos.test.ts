import { describe, expect, it } from 'vitest';
import { makeGastoIndireto } from '@/test/factories/gasto-indireto.factory';
import {
  calcularPreviaProducao,
  calcularTotalUnidades,
  calcularValorRateado,
} from './producoes.calculos';

const uso = { usoPorLote: 1, capacidadeMensal: 100 };

describe('calcularTotalUnidades', () => {
  it('multiplica os lotes pelo rendimento', () => {
    expect(calcularTotalUnidades(3, 50)).toBe(150);
  });
});

describe('calcularValorRateado', () => {
  it('MENSAL: valor × usoPorLote × lotes ÷ capacidade do mês', () => {
    expect(
      calcularValorRateado({ valor: 1800, tipo: 'MENSAL' }, 2, {
        usoPorLote: 0.5,
        capacidadeMensal: 100,
      }),
    ).toBe(18);
  });

  it('POR_UNIDADE e PERCENTUAL_VENDA não entram na produção', () => {
    expect(
      calcularValorRateado({ valor: 0.05, tipo: 'POR_UNIDADE' }, 3, uso),
    ).toBe(0);
    expect(
      calcularValorRateado({ valor: 0.12, tipo: 'PERCENTUAL_VENDA' }, 3, uso),
    ).toBe(0);
  });

  it('arredonda a centavos como a resposta do backend', () => {
    expect(
      calcularValorRateado({ valor: 450, tipo: 'MENSAL' }, 1, {
        usoPorLote: 0.2,
        capacidadeMensal: 70,
      }),
    ).toBe(1.29);
  });
});

describe('calcularPreviaProducao', () => {
  it('soma só as contas do mês (seed: capacidade de 100 fornadas)', () => {
    const energia = makeGastoIndireto({ id: 1, valor: 450 });
    const aluguel = makeGastoIndireto({ id: 2, valor: 1800 });
    const saquinho = makeGastoIndireto({
      id: 3,
      valor: 0.05,
      tipo: 'POR_UNIDADE',
    });

    const previa = calcularPreviaProducao(
      [energia, aluguel, saquinho],
      2,
      50,
      uso,
    );

    expect(previa.totalUnidades).toBe(100);
    expect(previa.rateios.map((r) => [r.gasto.id, r.valorRateado])).toEqual([
      [1, 9],
      [2, 36],
    ]);
    expect(previa.totalRateio).toBe(45);
  });

  it('sem a configuração de custos, não estima as contas', () => {
    expect(
      calcularPreviaProducao([makeGastoIndireto()], 2, 10, undefined),
    ).toEqual({ totalUnidades: 20, rateios: [], totalRateio: 0 });
  });

  it('sem gastos, não há rateio', () => {
    expect(calcularPreviaProducao([], 2, 10, uso)).toEqual({
      totalUnidades: 20,
      rateios: [],
      totalRateio: 0,
    });
  });
});
