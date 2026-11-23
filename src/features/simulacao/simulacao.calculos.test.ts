import { describe, expect, it } from 'vitest';
import {
  calcularBase,
  cenariosDeVolume,
  custoComVariacao,
  faixaPreco,
  faixaVolume,
  limitarNaFaixa,
  precoBaseDaReceita,
} from './simulacao.calculos';

const receita = {
  id: 1,
  rendimento: 10,
  custoUnitario: 2,
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

  it('sem preço sugerido, usa o custo; sem custo, 0', () => {
    expect(precoBaseDaReceita({ ...receita, precoSugerido: 0 })).toBe(2);
    expect(precoBaseDaReceita({ id: 1, rendimento: 1, custoUnitario: 4 })).toBe(
      4,
    );
    expect(precoBaseDaReceita({ id: 1, rendimento: 1 })).toBe(0);
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
    expect(base).toEqual({ custo: 2, precoAtual: 4.4, volumeAtual: 10 });
  });

  it('sem vendas, usa o preço sugerido e o rendimento', () => {
    expect(calcularBase(receita, [])).toEqual({
      custo: 2,
      precoAtual: 3,
      volumeAtual: 10,
    });
  });

  it('sem vendas e sem rendimento, o volume é 1; sem custo nem preço, 0', () => {
    expect(calcularBase({ id: 1, rendimento: 0 }, [])).toEqual({
      custo: 0,
      precoAtual: 0,
      volumeAtual: 1,
    });
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

describe('custoComVariacao', () => {
  it('aplica a variação em pontos percentuais', () => {
    expect(custoComVariacao(2, 50)).toBe(3);
    expect(custoComVariacao(4, -50)).toBe(2);
    expect(custoComVariacao(2, 0)).toBe(2);
  });
});

describe('cenariosDeVolume', () => {
  it('Conservador (× 0,5), Base e Otimista (× 1,5), com o lucro por unidade da API', () => {
    expect(cenariosDeVolume(5, 2, 10)).toEqual([
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
