import { describe, expect, it } from 'vitest';
import { makeInsumo } from '@/test/factories/insumo.factory';
import {
  precoMercadoSchema,
  toPrecoMercadoBody,
  toPrecoMercadoInput,
  VOLTAR_AO_ULTIMO_CUSTO,
  type PrecoMercadoInput,
} from './preco-mercado.schema';

function mensagens(entrada: PrecoMercadoInput) {
  const result = precoMercadoSchema.safeParse(entrada);
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

describe('precoMercadoSchema', () => {
  it('aceita a entrada válida e converte os números brasileiros', () => {
    expect(
      precoMercadoSchema.parse({ valor: '1.200,00', quantidade: '0,5' }),
    ).toEqual({ valor: 1200, quantidade: 0.5 });
  });

  it('pede valor e quantidade maiores que zero', () => {
    expect(mensagens({ valor: '', quantidade: '0' })).toEqual([
      ['valor', 'Informe um valor maior que zero'],
      ['quantidade', 'Informe uma quantidade maior que zero'],
    ]);
    expect(mensagens({ valor: '-2', quantidade: 'x' })).toEqual([
      ['valor', 'Informe um valor maior que zero'],
      ['quantidade', 'Informe uma quantidade maior que zero'],
    ]);
  });
});

describe('toPrecoMercadoInput', () => {
  it('começa com a quantidade do último preço e o valor vazio', () => {
    expect(
      toPrecoMercadoInput(
        makeInsumo({ quantidadeBaseCusto: 1000, unidade: 'G' }),
      ),
    ).toEqual({ valor: '', quantidade: '1000' });
    expect(
      toPrecoMercadoInput(makeInsumo({ quantidadeBaseCusto: 2.5 })),
    ).toEqual({ valor: '', quantidade: '2,5' });
  });
});

describe('corpos da API', () => {
  it('envia só o preço por unidade do insumo', () => {
    // 5 kg por R$ 60,00 → R$ 12,00/kg.
    expect(
      toPrecoMercadoBody(
        precoMercadoSchema.parse({ valor: '60,00', quantidade: '5' }),
      ),
    ).toEqual({ precoMercado: 12 });
  });

  it('volta ao preço da última compra com null', () => {
    expect(VOLTAR_AO_ULTIMO_CUSTO).toEqual({ precoMercado: null });
  });
});
