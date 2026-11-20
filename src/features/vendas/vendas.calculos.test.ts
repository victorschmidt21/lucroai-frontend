import { describe, expect, it } from 'vitest';
import {
  estoqueDisponivelDaReceita,
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

describe('estoqueDisponivelDaReceita', () => {
  const estoques = [
    { receitaId: 1, quantidadeDisponivel: 100 },
    { receitaId: 3, quantidadeDisponivel: 0 },
  ];

  it('usa o saldo de produto acabado da API', () => {
    expect(estoqueDisponivelDaReceita(1, estoques)).toBe(100);
    expect(estoqueDisponivelDaReceita(3, estoques)).toBe(0);
  });

  it('receita sem produção (fora da lista) vale zero', () => {
    expect(estoqueDisponivelDaReceita(9, estoques)).toBe(0);
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
