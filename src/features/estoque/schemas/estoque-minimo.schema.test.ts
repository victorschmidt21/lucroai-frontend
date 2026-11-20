import { describe, expect, it } from 'vitest';
import {
  estoqueMinimoInicial,
  estoqueMinimoSchema,
  toAtualizarMinimoBody,
} from './estoque-minimo.schema';

describe('estoqueMinimoSchema', () => {
  it('começa com o mínimo atual, no formato brasileiro', () => {
    expect(estoqueMinimoInicial(2.5)).toEqual({ quantidadeMinima: '2,5' });
    expect(estoqueMinimoInicial(0)).toEqual({ quantidadeMinima: '0' });
  });

  it.each([
    ['0', 0],
    ['2', 2],
    ['0,5', 0.5],
    ['1.250,75', 1250.75],
  ])('aceita "%s" como %d', (quantidadeMinima, esperado) => {
    expect(
      estoqueMinimoSchema.parse({ quantidadeMinima }).quantidadeMinima,
    ).toBe(esperado);
  });

  it.each(['', '-1', 'abc'])('recusa "%s"', (quantidadeMinima) => {
    const result = estoqueMinimoSchema.safeParse({ quantidadeMinima });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Digite uma quantidade válida',
    ]);
  });

  it('monta o corpo do PATCH', () => {
    expect(
      toAtualizarMinimoBody(
        estoqueMinimoSchema.parse({ quantidadeMinima: '3,5' }),
      ),
    ).toEqual({ quantidadeMinima: 3.5 });
  });
});
