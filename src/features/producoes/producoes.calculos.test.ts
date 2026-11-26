import { describe, expect, it } from 'vitest';
import { makeGastoIndireto } from '@/test/factories/gasto-indireto.factory';
import {
  calcularPreviaProducao,
  calcularTotalUnidades,
  calcularUsoDoEstoquePronto,
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

describe('calcularUsoDoEstoquePronto', () => {
  // Brownie Dois Amores do seed: 1 brownie e 150 g de cada brigadeiro por lote.
  const dentro = [
    { receitaId: 158, nome: 'Brownie', quantidade: 1, unidade: 'UN' as const },
    {
      receitaId: 157,
      nome: 'Brigadeiro branco',
      quantidade: 150,
      unidade: 'G' as const,
    },
  ];

  it('vai usar quantidade × lotes; você tem o saldo pronto', () => {
    const [brownie, branco] = calcularUsoDoEstoquePronto(dentro, 2, [
      { receitaId: 158, quantidadeDisponivel: 20 },
      { receitaId: 157, quantidadeDisponivel: 100 },
    ]);

    expect(brownie).toMatchObject({
      vaiUsar: 2,
      voceTem: 20,
      saldoDepois: 18,
      ficaNegativo: false,
    });
    expect(branco).toEqual({
      receitaId: 157,
      nome: 'Brigadeiro branco',
      unidade: 'G',
      vaiUsar: 300,
      voceTem: 100,
      saldoDepois: -200,
      ficaNegativo: true,
    });
  });

  it('sem saldo pronto, você tem 0 e fica negativo', () => {
    const [, branco] = calcularUsoDoEstoquePronto(dentro, 2, []);

    expect(branco).toMatchObject({
      voceTem: 0,
      saldoDepois: -300,
      ficaNegativo: true,
    });
  });

  it('usar exatamente o saldo zera sem ficar negativo', () => {
    const [brownie] = calcularUsoDoEstoquePronto(dentro, 3, [
      { receitaId: 158, quantidadeDisponivel: 3 },
    ]);

    expect(brownie).toMatchObject({ saldoDepois: 0, ficaNegativo: false });
  });

  it('arredonda a 6 casas, como o backend', () => {
    const [usoDoBrigadeiro] = calcularUsoDoEstoquePronto(
      [{ receitaId: 1, nome: 'Calda', quantidade: 0.1, unidade: 'L' }],
      3,
      [{ receitaId: 1, quantidadeDisponivel: 0.3 }],
    );

    expect(usoDoBrigadeiro).toMatchObject({ vaiUsar: 0.3, saldoDepois: 0 });
  });

  it('receita só com ingredientes não usa nada do estoque pronto', () => {
    expect(calcularUsoDoEstoquePronto([], 5, [])).toEqual([]);
  });
});
