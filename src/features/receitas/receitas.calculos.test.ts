import { describe, expect, it } from 'vitest';
import { makeGastoIndireto } from '@/test/factories/gasto-indireto.factory';
import { makeInsumosDoSeed } from '@/test/factories/insumo.factory';
import { makeReceitasDoSeed } from '@/test/factories/receita.factory';
import {
  calcularCustoInvisivel,
  calcularCustoItem,
  calcularPreviaReceita,
} from './receitas.calculos';

const insumos = makeInsumosDoSeed();
const custoDe = (id: number) =>
  insumos.find((insumo) => insumo.id === id)?.custoUnitario ?? null;

const energia = makeGastoIndireto();
const aluguel = makeGastoIndireto({
  id: 2,
  valor: 1800,
  metodoRateio: 'FIXO',
});
const embalagem = makeGastoIndireto({
  id: 4,
  valor: 0.125,
  metodoRateio: 'POR_UNIDADE',
});

describe('calcularCustoItem', () => {
  it('multiplica pela quantidade na unidade do insumo e arredonda a centavos', () => {
    // Manteiga: R$ 12 por 500 g = 0,024/g.
    expect(calcularCustoItem(100, 0.024)).toBe(2.4);
    // Fermento: 8,5 / 500 × 10 = 0,17.
    expect(calcularCustoItem(10, 8.5 / 500)).toBe(0.17);
  });
});

describe('calcularCustoInvisivel', () => {
  it('sem gastos é zero', () => {
    expect(calcularCustoInvisivel([], 12)).toBe(0);
  });

  it('soma o rateio de 1 lote de cada método', () => {
    // FIXO: valor; PROPORCIONAL: valor × 1 lote; POR_UNIDADE: valor × rendimento.
    expect(calcularCustoInvisivel([aluguel], 50)).toBe(1800);
    expect(calcularCustoInvisivel([energia], 50)).toBe(450);
    expect(calcularCustoInvisivel([embalagem], 50)).toBe(6.25);
    expect(calcularCustoInvisivel([energia, aluguel, embalagem], 50)).toBe(
      2256.25,
    );
  });

  it('arredonda cada rateio a centavos, como o backend', () => {
    const gasto = makeGastoIndireto({ valor: 0.333, metodoRateio: 'FIXO' });
    expect(calcularCustoInvisivel([gasto, gasto, gasto], 1)).toBe(0.99);
  });
});

describe('calcularPreviaReceita', () => {
  const bolo = makeReceitasDoSeed()[2]!;
  const itensDoBolo = bolo.itens.map((item) => ({
    quantidade: item.quantidade,
    custoUnitario: custoDe(item.insumoId),
  }));

  it('bate com o Bolo de Chocolate do seed (sem gastos)', () => {
    expect(
      calcularPreviaReceita({
        itens: itensDoBolo,
        rendimento: 12,
        margem: 0.5,
        gastos: [],
      }),
    ).toEqual({
      custoInsumos: 9.7,
      custoInvisivel: 0,
      custoProducao: 9.7,
      custoUnitario: 0.81,
      precoSugerido: 1.22,
    });
  });

  it('inclui o custo invisível, como o backend (Pão Francês, lacuna 18)', () => {
    const pao = makeReceitasDoSeed()[3]!;
    const previa = calcularPreviaReceita({
      itens: pao.itens.map((item) => ({
        quantidade: item.quantidade,
        custoUnitario: custoDe(item.insumoId),
      })),
      rendimento: 50,
      margem: 0.6,
      gastos: [energia, aluguel],
    });

    expect(previa.custoInsumos).toBe(3.31);
    expect(previa.custoProducao).toBe(2253.31);
    expect(previa.custoUnitario).toBe(45.07);
    // A API devolveu 72.112 no preço de venda sem arredondar (lacuna 20).
    expect(previa.precoSugerido).toBe(72.11);
  });

  it('sem margem, não há preço sugerido; margem 0 dá o próprio custo', () => {
    const base = { itens: itensDoBolo, rendimento: 12, gastos: [] };
    expect(
      calcularPreviaReceita({ ...base, margem: undefined }).precoSugerido,
    ).toBeNull();
    expect(calcularPreviaReceita({ ...base, margem: 0 }).precoSugerido).toBe(
      0.81,
    );
  });

  it('sem insumos, o custo é só o dos gastos', () => {
    expect(
      calcularPreviaReceita({
        itens: [],
        rendimento: 10,
        margem: undefined,
        gastos: [energia],
      }),
    ).toEqual({
      custoInsumos: 0,
      custoInvisivel: 450,
      custoProducao: 450,
      custoUnitario: 45,
      precoSugerido: null,
    });
  });

  it('rendimento inválido deixa sem custo de produção e unitário', () => {
    const previa = calcularPreviaReceita({
      itens: itensDoBolo,
      rendimento: null,
      margem: 0.5,
      gastos: [],
    });
    expect(previa.custoInsumos).toBe(9.7);
    expect(previa.custoProducao).toBeNull();
    expect(previa.custoUnitario).toBeNull();
    expect(previa.precoSugerido).toBeNull();
    expect(
      calcularPreviaReceita({
        itens: itensDoBolo,
        rendimento: 0,
        margem: 0.5,
        gastos: [],
      }).custoUnitario,
    ).toBeNull();
  });

  it('quantidade inválida ou insumo fora do catálogo deixa os totais sem valor', () => {
    for (const item of [
      { quantidade: null, custoUnitario: 3 },
      { quantidade: 1, custoUnitario: null },
    ]) {
      const previa = calcularPreviaReceita({
        itens: [item],
        rendimento: 10,
        margem: 0.5,
        gastos: [],
      });
      expect(previa.custoInsumos).toBeNull();
      expect(previa.custoProducao).toBeNull();
      expect(previa.precoSugerido).toBeNull();
    }
  });
});
