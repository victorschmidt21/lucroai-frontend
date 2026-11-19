import { describe, expect, it } from 'vitest';
import {
  calcularEstoqueDisponivel,
  periodoPadrao,
  quantidadeDaVenda,
  resumirVendas,
  subtotalItem,
  totalCarrinho,
  totalDaVenda,
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

const item = (quantidade: number, precoUnitarioReal: number) => ({
  quantidade,
  precoUnitarioReal,
});

describe('resumirVendas', () => {
  it('soma só as vendas concluídas', () => {
    const resumo = resumirVendas([
      { status: 'CONCLUIDA', total: 45, itens: [] },
      { status: 'CONCLUIDA', total: 15, itens: [] },
      { status: 'PENDENTE', total: 100, itens: [] },
      { status: 'CANCELADA', total: 200, itens: [] },
    ]);

    expect(resumo).toEqual({
      totalVendido: 60,
      quantidadeVendas: 2,
      ticketMedio: 30,
    });
  });

  it('ticket médio é 0 sem vendas concluídas', () => {
    expect(resumirVendas([])).toEqual({
      totalVendido: 0,
      quantidadeVendas: 0,
      ticketMedio: 0,
    });
    expect(
      resumirVendas([{ status: 'PENDENTE', total: 10, itens: [] }]).ticketMedio,
    ).toBe(0);
  });

  it('venda sem total usa a soma dos itens', () => {
    expect(
      resumirVendas([
        { status: 'CONCLUIDA', total: null, itens: [item(50, 0.5)] },
      ]).totalVendido,
    ).toBe(25);
  });
});

describe('totalDaVenda e quantidadeDaVenda', () => {
  const venda = {
    status: 'PENDENTE' as const,
    total: null,
    itens: [item(50, 0.5), item(3, 12.5)],
  };

  it('total: o gravado ou a soma dos itens', () => {
    expect(totalDaVenda(venda)).toBe(62.5);
    expect(totalDaVenda({ ...venda, total: 60 })).toBe(60);
  });

  it('quantidade: soma dos itens', () => {
    expect(quantidadeDaVenda(venda)).toBe(53);
  });
});

describe('periodoPadrao', () => {
  it('vai do dia 1 ao último dia do mês, no fuso local', () => {
    expect(periodoPadrao(new Date(2026, 10, 19, 23, 30))).toEqual({
      inicio: '2026-11-01',
      fim: '2026-11-30',
    });
  });

  it('fevereiro de ano bissexto e dezembro', () => {
    expect(periodoPadrao(new Date(2028, 1, 10))).toEqual({
      inicio: '2028-02-01',
      fim: '2028-02-29',
    });
    expect(periodoPadrao(new Date(2026, 11, 31, 23, 59))).toEqual({
      inicio: '2026-12-01',
      fim: '2026-12-31',
    });
  });
});
