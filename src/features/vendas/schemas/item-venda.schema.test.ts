import { describe, expect, it } from 'vitest';
import {
  itemVendaFormSchema,
  itemVendaFormVazio,
  toCreateVendaBody,
  type ItemVendaFormInput,
} from './item-venda.schema';

function validar(mudancas: Partial<ItemVendaFormInput>) {
  return itemVendaFormSchema.safeParse({
    receitaId: '1',
    quantidade: '10',
    precoUnitario: '0,50',
    ...mudancas,
  });
}

function mensagens(mudancas: Partial<ItemVendaFormInput>) {
  const resultado = validar(mudancas);
  return resultado.success ? [] : resultado.error.issues.map((i) => i.message);
}

describe('itemVendaFormSchema', () => {
  it('converte receita, quantidade e preço em número', () => {
    const resultado = validar({ precoUnitario: '1.234,5' });
    expect(resultado.success && resultado.data).toEqual({
      receitaId: 1,
      quantidade: 10,
      precoUnitario: 1234.5,
    });
  });

  it('exige o produto', () => {
    expect(mensagens({ receitaId: '' })).toEqual(['Selecione um produto']);
  });

  it.each(['', '0', '1,5', 'abc'])('recusa a quantidade "%s"', (quantidade) => {
    expect(mensagens({ quantidade })).toEqual(['Informe a quantidade']);
  });

  it.each(['', '0', '0,004', 'abc'])('recusa o preço "%s"', (precoUnitario) => {
    expect(mensagens({ precoUnitario })).toEqual(['Informe o preço']);
  });

  it('arredonda o preço a 2 casas, o máximo que o backend aceita', () => {
    const resultado = validar({ precoUnitario: '0,125' });
    expect(resultado.success && resultado.data.precoUnitario).toBe(0.13);
  });

  it('começa vazio', () => {
    expect(itemVendaFormVazio()).toEqual({
      receitaId: '',
      quantidade: '',
      precoUnitario: '',
    });
  });
});

describe('toCreateVendaBody', () => {
  it('monta os itens em snake_case, na ordem do carrinho', () => {
    expect(
      toCreateVendaBody([
        { receitaId: 1, quantidade: 50, precoUnitario: 0.5 },
        { receitaId: 3, quantidade: 20, precoUnitario: 1 },
      ]),
    ).toEqual({
      itens: [
        { receita_id: 1, quantidade: 50, preco_unitario_real: 0.5 },
        { receita_id: 3, quantidade: 20, preco_unitario_real: 1 },
      ],
    });
  });
});
