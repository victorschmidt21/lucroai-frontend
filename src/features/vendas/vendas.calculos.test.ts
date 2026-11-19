import { describe, expect, it } from 'vitest';
import { subtotalItem, totalCarrinho } from './vendas.calculos';

describe('subtotalItem', () => {
  it('multiplica a quantidade pelo preço', () => {
    expect(subtotalItem({ quantidade: 50, precoUnitario: 0.5 })).toBe(25);
  });
});

describe('totalCarrinho', () => {
  it('carrinho vazio vale zero', () => {
    expect(totalCarrinho([])).toBe(0);
  });

  it('soma os subtotais, como a primeira venda do seed (R$ 45,00)', () => {
    expect(
      totalCarrinho([
        { quantidade: 50, precoUnitario: 0.5 },
        { quantidade: 20, precoUnitario: 1 },
      ]),
    ).toBe(45);
  });

  it('arredonda a centavos como o backend, sem ruído de ponto flutuante', () => {
    // 3 × 0,1 + 3 × 0,2 = 0,9000000000000001 sem o round2.
    expect(
      totalCarrinho([
        { quantidade: 3, precoUnitario: 0.1 },
        { quantidade: 3, precoUnitario: 0.2 },
      ]),
    ).toBe(0.9);
  });
});
