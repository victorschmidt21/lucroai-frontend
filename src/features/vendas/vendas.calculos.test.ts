import { describe, expect, it } from 'vitest';
import {
  calcularEstoqueDisponivel,
  subtotalItem,
  totalCarrinho,
} from './vendas.calculos';

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

describe('calcularEstoqueDisponivel', () => {
  const receitas = [
    { id: 1, nome: 'Pão Francês', rendimento: 50 },
    { id: 3, nome: 'Brigadeiro Gourmet', rendimento: 40 },
  ];
  const concluida = (receitaId: number, quantidade: number) => ({
    status: 'CONCLUIDA',
    itens: [{ receitaId, quantidade }],
  });

  it('sem produção, não há estoque', () => {
    expect(calcularEstoqueDisponivel(1, [], receitas, [])).toBe(0);
  });

  it('vendas pendentes e canceladas não descontam', () => {
    const producoes = [{ receitaId: 1, quantidade: 2 }];
    const vendas = [
      { status: 'PENDENTE', itens: [{ receitaId: 1, quantidade: 30 }] },
      { status: 'CANCELADA', itens: [{ receitaId: 1, quantidade: 10 }] },
    ];

    expect(calcularEstoqueDisponivel(1, producoes, receitas, vendas)).toBe(100);
  });

  it('desconta as vendas concluídas do produzido (lotes × rendimento)', () => {
    const producoes = [
      { receitaId: 1, quantidade: 3 },
      { receitaId: 1, quantidade: 1 },
    ];
    const vendas = [concluida(1, 50), concluida(1, 120)];

    expect(calcularEstoqueDisponivel(1, producoes, receitas, vendas)).toBe(30);
  });

  it('com várias receitas, conta só as produções e os itens da receita', () => {
    const producoes = [
      { receitaId: 1, quantidade: 3 },
      { receitaId: 3, quantidade: 1 },
    ];
    const vendas = [
      {
        status: 'CONCLUIDA',
        itens: [
          { receitaId: 1, quantidade: 50 },
          { receitaId: 3, quantidade: 20 },
        ],
      },
    ];

    expect(calcularEstoqueDisponivel(1, producoes, receitas, vendas)).toBe(100);
    expect(calcularEstoqueDisponivel(3, producoes, receitas, vendas)).toBe(20);
  });

  it('receita fora da lista usa rendimento 1', () => {
    expect(
      calcularEstoqueDisponivel(9, [{ receitaId: 9, quantidade: 4 }], [], []),
    ).toBe(4);
  });
});
