import { describe, expect, it } from 'vitest';
import { receitaSchema } from '@/shared/api/contracts/recipe';
import receitaDoSeed from '@/test/fixtures/recipe/receita.json';
import {
  makeComposicaoPreco,
  makePrecoCanal,
} from '@/test/factories/receita.factory';
import { calcularCustoItem, montarBarraDoPreco } from './receitas.calculos';

describe('calcularCustoItem', () => {
  it('multiplica pela quantidade na unidade do insumo e arredonda a centavos', () => {
    // Manteiga: R$ 12 por 500 g = 0,024/g.
    expect(calcularCustoItem(100, 0.024)).toBe(2.4);
    // Fermento: 8,5 / 500 × 10 = 0,17.
    expect(calcularCustoItem(10, 8.5 / 500)).toBe(0.17);
  });
});

describe('montarBarraDoPreco', () => {
  it('monta a barra do Pão Francês do seed no Balcão, somando R$ 1,00', () => {
    const balcao = makePrecoCanal();
    const barra = montarBarraDoPreco(makeComposicaoPreco(), balcao);

    expect(barra).toEqual([
      {
        id: 'ingredientes',
        rotulo: 'Ingredientes',
        valor: 0.1359,
        fracao: 0.2954,
      },
      {
        id: 'contasDoMes',
        rotulo: 'Contas do mês',
        valor: 0.1796,
        fracao: 0.3905,
      },
      // Gastos por unidade (0,05) + embalagem (0) + perdas (0,0192).
      {
        id: 'embalagemEPerdas',
        rotulo: 'Embalagem e perdas',
        valor: 0.0692,
        fracao: 0.1505,
      },
      {
        id: 'taxaCanal',
        rotulo: 'Taxa da maquininha',
        valor: 0.0063,
        fracao: 0.0136,
      },
      { id: 'lucro', rotulo: 'Lucro', valor: 0.069, fracao: 0.15 },
    ]);
    expect(barra.reduce((soma, parte) => soma + parte.fracao, 0)).toBeCloseTo(
      1,
      4,
    );
  });

  it('o lucro da barra é o lucro configurado, em todos os canais do seed', () => {
    const receita = receitaSchema.parse(receitaDoSeed);

    for (const preco of receita.precos) {
      if (!preco.composicao) throw new Error('canal do seed sem preço');
      const lucro = montarBarraDoPreco(preco.composicao, preco).find(
        (parte) => parte.id === 'lucro',
      );
      expect(lucro?.fracao).toBe(0.15);
    }
  });

  it('fora do Balcão, a taxa leva o nome do canal', () => {
    const barra = montarBarraDoPreco(
      makeComposicaoPreco({ taxaCanal: { valor: 0.0838, fracao: 0.152 } }),
      { canal: 'iFood', balcao: false },
    );

    expect(barra.find((parte) => parte.id === 'taxaCanal')?.rotulo).toBe(
      'Taxa do iFood',
    );
  });

  it('mostra imposto e gastos em % da venda quando existem', () => {
    const barra = montarBarraDoPreco(
      makeComposicaoPreco({
        imposto: { valor: 0.03, fracao: 0.06 },
        gastosPercentuais: { valor: 0.01, fracao: 0.02 },
      }),
      makePrecoCanal(),
    );

    expect(barra.map((parte) => parte.id)).toEqual([
      'ingredientes',
      'contasDoMes',
      'embalagemEPerdas',
      'imposto',
      'taxaCanal',
      'percentuaisDaVenda',
      'lucro',
    ]);
  });

  it('esconde as partes zeradas, menos o lucro', () => {
    const zero = { valor: 0, fracao: 0 };
    const barra = montarBarraDoPreco(
      makeComposicaoPreco({
        gastosMensais: zero,
        gastosPorUnidade: zero,
        perdas: zero,
        taxaCanal: zero,
        ingredientes: { valor: 1, fracao: 1 },
        lucro: zero,
      }),
      makePrecoCanal(),
    );

    expect(barra.map((parte) => parte.id)).toEqual(['ingredientes', 'lucro']);
  });
});
