import { describe, expect, it } from 'vitest';
import {
  calcularIndicadores,
  contarEstoqueBaixo,
  evolucaoMensal,
  inicioDosSeisMeses,
  descreverSobraDoMes,
  pontoEquilibrioDoPainel,
  porCadaCemReais,
  rotuloAcabando,
  produtosMaisRentaveis,
  tendenciaMensal,
  vendasDoMes,
  type ReceitaParaPainel,
  type VendaParaPainel,
} from './painel.calculos';

// TZ fixo em America/Sao_Paulo (vitest.config.ts).

/** Preço do Balcão com o lucro por unidade e a fração do preço. */
function balcao(valor: number, fracao: number) {
  return [{ balcao: true, composicao: { lucro: { valor, fracao } } }];
}
const HOJE = new Date(2026, 10, 19, 15, 0); // 19/11/2026 15h

const receitas: ReceitaParaPainel[] = [
  {
    id: 1,
    nome: 'Pão Francês',
    rendimento: 50,
    custoUnitario: 0.4,
    precos: balcao(0.15, 0.15),
  },
  {
    id: 2,
    nome: 'Bolo de Chocolate',
    rendimento: 1,
    custoUnitario: 20,
    precos: balcao(7.5, 0.15),
  },
];

function venda(
  dataVenda: Date,
  itens: VendaParaPainel['itens'],
  status: VendaParaPainel['status'] = 'CONCLUIDA',
  total: number | null = null,
): VendaParaPainel {
  return { status, total, dataVenda: dataVenda.toISOString(), itens };
}

function item(
  receitaId: number,
  quantidade: number,
  precoUnitarioReal: number,
  custoUnitario: number | null = null,
) {
  return { receitaId, quantidade, precoUnitarioReal, custoUnitario };
}

describe('calcularIndicadores', () => {
  it('soma o faturamento só das vendas CONCLUIDA do mês atual', () => {
    const vendas = [
      venda(new Date(2026, 10, 2), [item(1, 10, 1)], 'CONCLUIDA', 10),
      venda(new Date(2026, 10, 3), [item(2, 1, 50)], 'CONCLUIDA', 50),
      venda(new Date(2026, 10, 4), [item(2, 1, 50)], 'PENDENTE', 50),
      venda(new Date(2026, 10, 5), [item(2, 1, 50)], 'CANCELADA', 50),
      venda(new Date(2026, 9, 31), [item(2, 1, 50)], 'CONCLUIDA', 50),
    ];

    expect(calcularIndicadores(vendas, receitas, HOJE).faturamento).toBe(60);
  });

  it('usa o total calculado pelos itens quando a venda não tem total', () => {
    const vendas = [venda(new Date(2026, 10, 2), [item(1, 3, 1.5)])];

    expect(calcularIndicadores(vendas, receitas, HOJE).faturamento).toBe(4.5);
  });

  it('calcula o lucro com o snapshot de custo do item', () => {
    const vendas = [venda(new Date(2026, 10, 2), [item(2, 2, 50, 25)])];

    // 2 × 50 − 25 × 2 (o custo atual da receita, 20, é ignorado)
    const { lucro, margem } = calcularIndicadores(vendas, receitas, HOJE);
    expect(lucro).toBe(50);
    expect(margem).toBe(50);
  });

  it('cai para o custo atual da receita sem snapshot, e para 0 sem receita', () => {
    const vendas = [
      venda(new Date(2026, 10, 2), [item(2, 2, 50, null), item(99, 1, 10)]),
    ];

    // (2 × 50 − 20 × 2) + (10 − 0)
    expect(calcularIndicadores(vendas, receitas, HOJE).lucro).toBe(70);
  });

  it('dá margem 0 sem faturamento', () => {
    expect(calcularIndicadores([], receitas, HOJE)).toEqual({
      faturamento: 0,
      lucro: 0,
      margem: 0,
      vendasUltimos7Dias: 0,
    });
  });

  it('conta as vendas CONCLUIDA dos últimos 7 dias, inclusive do mês anterior', () => {
    const agora = new Date(2026, 11, 3, 12, 0); // 03/12 12h
    const vendas = [
      venda(new Date(2026, 10, 26, 12, 0), [item(1, 1, 1)]), // exatamente 7 dias
      venda(new Date(2026, 10, 30), [item(1, 1, 1)]),
      venda(new Date(2026, 11, 2), [item(1, 1, 1)], 'PENDENTE'),
      venda(new Date(2026, 10, 26, 11, 59), [item(1, 1, 1)]), // 7 dias e 1 min
    ];

    expect(
      calcularIndicadores(vendas, receitas, agora).vendasUltimos7Dias,
    ).toBe(2);
  });
});

describe('vendasDoMes', () => {
  it('usa o mês do fuso local', () => {
    // 01/12 01h UTC ainda é 30/11 em São Paulo.
    const v = {
      ...venda(HOJE, [item(1, 1, 1)]),
      dataVenda: '2026-12-01T01:00:00.000Z',
    };

    expect(vendasDoMes([v], HOJE)).toHaveLength(1);
  });
});

describe('contarEstoqueBaixo', () => {
  it('conta só os insumos com disponível abaixo do mínimo', () => {
    expect(
      contarEstoqueBaixo([
        { quantidadeDisponivel: 1, quantidadeMinima: 2 },
        { quantidadeDisponivel: 2, quantidadeMinima: 2 },
        { quantidadeDisponivel: 5, quantidadeMinima: 0 },
      ]),
    ).toBe(1);
  });
});

describe('evolucaoMensal e inicioDosSeisMeses', () => {
  it('monta os seis meses na virada do ano, com os rótulos', () => {
    const fevereiro = new Date(2027, 1, 10);
    const vendas = [
      venda(new Date(2026, 8, 30), [item(1, 1, 1)], 'CONCLUIDA', 999), // set: fora
      venda(new Date(2026, 9, 1), [item(1, 1, 1)], 'CONCLUIDA', 10),
      venda(new Date(2026, 11, 31, 23), [item(1, 1, 1)], 'CONCLUIDA', 20),
      venda(new Date(2027, 0, 5), [item(1, 1, 1)], 'CANCELADA', 30),
      venda(new Date(2027, 1, 1), [item(1, 1, 1)], 'CONCLUIDA', 40),
    ];

    expect(evolucaoMensal(vendas, fevereiro)).toEqual([
      { rotulo: 'Set', ano: 2026, valor: 999 },
      { rotulo: 'Out', ano: 2026, valor: 10 },
      { rotulo: 'Nov', ano: 2026, valor: 0 },
      { rotulo: 'Dez', ano: 2026, valor: 20 },
      { rotulo: 'Jan', ano: 2027, valor: 0 },
      { rotulo: 'Fev', ano: 2027, valor: 40 },
    ]);
    expect(inicioDosSeisMeses(fevereiro)).toEqual(new Date(2026, 8, 1));
  });
});

describe('tendenciaMensal', () => {
  it.each([
    [[0, 0], '0,0%'],
    [[0, 50], '+100,0%'],
    [[100, 150], '+50,0%'],
    [[100, 100], '+0,0%'],
    [[200, 150], '-25,0%'],
    [[5], '0,0%'],
  ])('%j → %s', (valores, esperado) => {
    expect(tendenciaMensal(valores)).toBe(esperado);
  });
});

describe('produtosMaisRentaveis', () => {
  it('agrupa os itens vendidos por receita e ordena pelo lucro, até 3', () => {
    const vendas = [
      venda(HOJE, [item(1, 10, 1, 0.4), item(2, 1, 50, 20)]),
      venda(HOJE, [item(1, 20, 1), item(3, 1, 5, 1)]),
      venda(HOJE, [item(4, 1, 2, 1)]),
      venda(HOJE, [item(2, 10, 50, 20)], 'PENDENTE'),
    ];

    expect(produtosMaisRentaveis(vendas, receitas)).toEqual([
      {
        receitaId: 2,
        nome: 'Bolo de Chocolate',
        quantidade: 1,
        lucro: 30,
        margem: 60,
      },
      {
        receitaId: 1,
        nome: 'Pão Francês',
        quantidade: 30,
        lucro: expect.closeTo(18, 10),
        margem: expect.closeTo(60, 10),
      },
      {
        receitaId: 3,
        nome: 'Receita #3',
        quantidade: 1,
        lucro: 4,
        margem: 80,
      },
    ]);
  });

  it('sem vendas, usa o lucro do preço do Balcão calculado pela API, só os positivos', () => {
    const cadastro: ReceitaParaPainel[] = [
      ...receitas,
      { id: 3, nome: 'Lucro zero', rendimento: 1, precos: balcao(0, 0) },
      {
        id: 4,
        nome: 'Sem preço possível',
        rendimento: 1,
        precos: [{ balcao: true, composicao: null }],
      },
      {
        id: 5,
        nome: 'Só no iFood',
        rendimento: 1,
        precos: [
          { balcao: false, composicao: { lucro: { valor: 9, fracao: 0.2 } } },
        ],
      },
    ];

    expect(produtosMaisRentaveis([], cadastro)).toEqual([
      {
        receitaId: 2,
        nome: 'Bolo de Chocolate',
        quantidade: null,
        lucro: 7.5,
        margem: 15,
      },
      {
        receitaId: 1,
        nome: 'Pão Francês',
        quantidade: null,
        lucro: 0.15,
        margem: 15,
      },
    ]);
  });

  it('fica vazio sem vendas nem receitas rentáveis', () => {
    expect(produtosMaisRentaveis([], [])).toEqual([]);
  });
});

describe('pontoEquilibrioDoPainel', () => {
  it('mostra o valor por mês da API', () => {
    expect(pontoEquilibrioDoPainel({ valor: 4524.36, motivo: null })).toEqual({
      valor: 'R$ 4.524,36',
      detalhe: 'por mês',
      tom: 'muted',
    });
  });

  it('sem vendas, diz que ainda não vendeu', () => {
    expect(
      pontoEquilibrioDoPainel({ valor: null, motivo: 'SEM_VENDAS' }),
    ).toEqual({
      valor: '—',
      detalhe: 'Ainda sem vendas este mês',
      tom: 'muted',
    });
  });

  it('com margem negativa, avisa em vermelho', () => {
    expect(
      pontoEquilibrioDoPainel({ valor: null, motivo: 'MARGEM_NEGATIVA' }),
    ).toEqual({
      valor: '—',
      detalhe: 'Com os preços de hoje, você paga para vender.',
      tom: 'danger',
    });
  });
});

describe('porCadaCemReais', () => {
  it('arredonda a margem para inteiro', () => {
    expect(porCadaCemReais(12.4)).toBe('R$ 12 de cada R$ 100');
    expect(porCadaCemReais(12.5)).toBe('R$ 13 de cada R$ 100');
    expect(porCadaCemReais(0)).toBe('R$ 0 de cada R$ 100');
  });

  it('margem negativa não usa a frase', () => {
    expect(porCadaCemReais(-0.2)).toBeNull();
    expect(porCadaCemReais(-15)).toBeNull();
  });
});

describe('descreverSobraDoMes', () => {
  it('com lucro, diz quanto fica de cada R$ 100, em verde', () => {
    expect(descreverSobraDoMes({ faturamento: 200, margem: 23.6 })).toEqual({
      detalhe: 'R$ 24 de cada R$ 100',
      tom: 'success',
    });
  });

  it('com prejuízo, diz que ficou abaixo do custo, em vermelho', () => {
    expect(descreverSobraDoMes({ faturamento: 200, margem: -5 })).toEqual({
      detalhe: 'As vendas ficaram abaixo do custo',
      tom: 'danger',
    });
  });

  it('sem vendas no mês, diz que ainda não vendeu', () => {
    expect(descreverSobraDoMes({ faturamento: 0, margem: 0 })).toEqual({
      detalhe: 'Ainda sem vendas este mês',
      tom: 'muted',
    });
  });
});

describe('rotuloAcabando', () => {
  it('concorda com a quantidade', () => {
    expect(rotuloAcabando(1)).toBe('ingrediente acabando');
    expect(rotuloAcabando(0)).toBe('ingredientes acabando');
    expect(rotuloAcabando(3)).toBe('ingredientes acabando');
  });
});
