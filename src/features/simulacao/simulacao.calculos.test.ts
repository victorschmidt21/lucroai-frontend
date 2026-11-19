import { describe, expect, it } from 'vitest';
import {
  calcularBase,
  calcularProjecao,
  cenariosDeVolume,
  faixaPreco,
  faixaVolume,
  limitarNaFaixa,
  precoBaseDaReceita,
} from './simulacao.calculos';

const receita = {
  id: 1,
  rendimento: 10,
  custoUnitario: 2,
  margemLucro: 0.5,
  precoSugerido: 3,
};

function venda(
  status: 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA',
  itens: { receitaId: number; quantidade: number; precoUnitarioReal: number }[],
) {
  return { status, itens };
}

describe('precoBaseDaReceita', () => {
  it('usa o preço sugerido quando é maior que zero', () => {
    expect(precoBaseDaReceita(receita)).toBe(3);
  });

  it('sem preço sugerido, usa custo × (1 + margem)', () => {
    expect(precoBaseDaReceita({ ...receita, precoSugerido: 0 })).toBe(3);
    expect(precoBaseDaReceita({ id: 1, rendimento: 1, custoUnitario: 4 })).toBe(
      4,
    );
  });
});

describe('calcularBase', () => {
  it('com vendas, soma só os itens da receita em vendas CONCLUIDA', () => {
    const base = calcularBase(receita, [
      venda('CONCLUIDA', [
        { receitaId: 1, quantidade: 4, precoUnitarioReal: 5 },
        { receitaId: 2, quantidade: 9, precoUnitarioReal: 99 },
      ]),
      venda('CONCLUIDA', [
        { receitaId: 1, quantidade: 6, precoUnitarioReal: 4 },
      ]),
      venda('PENDENTE', [
        { receitaId: 1, quantidade: 50, precoUnitarioReal: 1 },
      ]),
      venda('CANCELADA', [
        { receitaId: 1, quantidade: 50, precoUnitarioReal: 1 },
      ]),
    ]);

    // receita = 4×5 + 6×4 = 44; quantidade = 10
    expect(base).toEqual({
      custo: 2,
      precoAtual: 4.4,
      receitaAtual: 44,
      volumeAtual: 10,
      lucroAtual: 24,
      margemAtual: (24 / 44) * 100,
    });
  });

  it('sem vendas, usa o preço sugerido e o rendimento, sem dividir por zero', () => {
    const base = calcularBase(receita, []);

    expect(base).toEqual({
      custo: 2,
      precoAtual: 3,
      receitaAtual: 30,
      volumeAtual: 10,
      lucroAtual: 10,
      margemAtual: (10 / 30) * 100,
    });
  });

  it('sem vendas e sem rendimento, o volume é 1; sem preço, a margem é 0', () => {
    const base = calcularBase({ id: 1, rendimento: 0 }, []);

    expect(base.volumeAtual).toBe(1);
    expect(base.receitaAtual).toBe(0);
    expect(base.margemAtual).toBe(0);
  });
});

describe('faixaPreco', () => {
  it('min = max(0,01; min(custo × 0,75; base)) e max = max(base × 2,2; custo × 3)', () => {
    // base = max(3, 2 × 1,25) = 3
    const faixa = faixaPreco(receita);

    expect(faixa.min).toBe(1.5);
    expect(faixa.max).toBeCloseTo(6.6);
    expect(faixa.passo).toBeCloseTo((6.6 - 1.5) / 80);
  });

  it('a base é pelo menos custo × 1,25', () => {
    // base = max(1, 10 × 1,25) = 12,5; max = max(27,5; 30) = 30
    const faixa = faixaPreco({
      ...receita,
      custoUnitario: 10,
      precoSugerido: 1,
    });

    expect(faixa.min).toBe(7.5);
    expect(faixa.max).toBe(30);
  });

  it('sem custo nem preço, a faixa fica em 0,01 (nunca max < min)', () => {
    const faixa = faixaPreco({ id: 1, rendimento: 1 });

    expect(faixa.min).toBe(0.01);
    expect(faixa.max).toBe(0.01);
  });
});

describe('faixaVolume', () => {
  it('vai de 1 a ceil(max(20, volume × 3))', () => {
    expect(faixaVolume(10, 5)).toEqual({ min: 1, max: 30, passo: 1 });
    expect(faixaVolume(3, 5)).toEqual({ min: 1, max: 20, passo: 1 });
  });

  it('sem volume, usa o rendimento', () => {
    expect(faixaVolume(0, 12)).toEqual({ min: 1, max: 36, passo: 1 });
  });
});

describe('limitarNaFaixa', () => {
  it('prende o valor entre min e max', () => {
    const faixa = { min: 1, max: 10, passo: 1 };

    expect(limitarNaFaixa(0, faixa)).toBe(1);
    expect(limitarNaFaixa(5, faixa)).toBe(5);
    expect(limitarNaFaixa(11, faixa)).toBe(10);
  });
});

describe('calcularProjecao', () => {
  it('calcula custo, lucro, receita, margem e diferença projetados', () => {
    const projecao = calcularProjecao({
      base: { custo: 2, lucroAtual: 10 },
      preco: 5,
      variacaoCusto: 50,
      volume: 10,
    });

    expect(projecao).toEqual({
      custoProjetado: 3,
      lucroPorUnidade: 2,
      lucroProjetado: 20,
      receitaProjetada: 50,
      margemProjetada: 40,
      diferenca: 10,
    });
  });

  it('com variação negativa, o custo cai; lucro negativo dá margem negativa', () => {
    const projecao = calcularProjecao({
      base: { custo: 4, lucroAtual: 0 },
      preco: 1,
      variacaoCusto: -50,
      volume: 2,
    });

    expect(projecao.custoProjetado).toBe(2);
    expect(projecao.lucroProjetado).toBe(-2);
    expect(projecao.margemProjetada).toBe(-100);
    expect(projecao.diferenca).toBe(-2);
  });

  it('com receita projetada zero, a margem é 0', () => {
    expect(
      calcularProjecao({
        base: { custo: 0, lucroAtual: 0 },
        preco: 0,
        variacaoCusto: 0,
        volume: 5,
      }).margemProjetada,
    ).toBe(0);
  });
});

describe('cenariosDeVolume', () => {
  it('Conservador (× 0,5), Base e Otimista (× 1,5), com receita e lucro', () => {
    expect(cenariosDeVolume(5, 3, 10)).toEqual([
      { nome: 'Conservador', volume: 5, receita: 25, lucro: 10 },
      { nome: 'Base', volume: 10, receita: 50, lucro: 20 },
      { nome: 'Otimista', volume: 15, receita: 75, lucro: 30 },
    ]);
  });

  it('arredonda os volumes e usa no mínimo 1', () => {
    expect(cenariosDeVolume(2, 1, 1).map((c) => c.volume)).toEqual([1, 1, 2]);
    expect(cenariosDeVolume(2, 1, 3).map((c) => c.volume)).toEqual([2, 3, 5]);
  });
});
