import { describe, expect, it } from 'vitest';
import { makeEstoqueProduto } from '@/test/factories/estoque.factory';
import { montarEstoquePronto } from './estoque.calculos';

const receitas = [
  {
    id: 1,
    nome: 'Pão Francês',
    vendavel: true,
    unidadeRendimento: 'UN' as const,
  },
  {
    id: 2,
    nome: 'Brigadeiro branco',
    vendavel: false,
    unidadeRendimento: 'G' as const,
  },
];

describe('montarEstoquePronto', () => {
  it('põe o nome e a unidade: un na vendida, a do rendimento na que só vai dentro', () => {
    const itens = montarEstoquePronto(
      [
        makeEstoqueProduto({ receitaId: 1, quantidadeDisponivel: 28 }),
        makeEstoqueProduto({
          receitaId: 2,
          quantidadeDisponivel: 500,
          vendavel: false,
        }),
      ],
      receitas,
    );

    expect(itens).toEqual([
      {
        receitaId: 2,
        nome: 'Brigadeiro branco',
        quantidade: 500,
        unidade: 'G',
        estoqueNegativo: false,
      },
      {
        receitaId: 1,
        nome: 'Pão Francês',
        quantidade: 28,
        unidade: 'UN',
        estoqueNegativo: false,
      },
    ]);
  });

  it('o saldo negativo vem primeiro e destacado', () => {
    const itens = montarEstoquePronto(
      [
        makeEstoqueProduto({ receitaId: 1, quantidadeDisponivel: 28 }),
        makeEstoqueProduto({
          receitaId: 2,
          quantidadeDisponivel: -300,
          estoqueNegativo: true,
          vendavel: false,
        }),
      ],
      receitas,
    );

    expect(itens.map((item) => [item.nome, item.estoqueNegativo])).toEqual([
      ['Brigadeiro branco', true],
      ['Pão Francês', false],
    ]);
  });

  it('receita fora da lista aparece como "Receita #id", em un', () => {
    const [item] = montarEstoquePronto(
      [makeEstoqueProduto({ receitaId: 9, quantidadeDisponivel: 3 })],
      receitas,
    );

    expect(item).toMatchObject({ nome: 'Receita #9', unidade: 'UN' });
  });
});
