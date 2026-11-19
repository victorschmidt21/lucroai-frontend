import { describe, expect, it } from 'vitest';
import {
  producaoFormSchema,
  producaoFormVazio,
  toCreateProducaoBody,
  type ProducaoFormInput,
} from './producao-form.schema';

function validar(mudancas: Partial<ProducaoFormInput>) {
  return producaoFormSchema.safeParse({
    ...producaoFormVazio(),
    receitaId: '1',
    quantidade: '3',
    ...mudancas,
  });
}

function mensagens(mudancas: Partial<ProducaoFormInput>) {
  const resultado = validar(mudancas);
  return resultado.success ? [] : resultado.error.issues.map((i) => i.message);
}

describe('producaoFormSchema', () => {
  it('converte receita e lotes em número', () => {
    const resultado = validar({});
    expect(resultado.success && resultado.data).toEqual({
      receitaId: 1,
      quantidade: 3,
      todosGastos: true,
      gastoIndiretoIds: [],
    });
  });

  it('exige a receita', () => {
    expect(mensagens({ receitaId: '' })).toEqual(['Selecione uma receita']);
  });

  it.each(['', '0', '-1', '1,5', 'abc'])('recusa lotes "%s"', (quantidade) => {
    expect(mensagens({ quantidade })).toEqual([
      'Informe a quantidade de lotes',
    ]);
  });

  it('começa com "Todos" marcado e a receita do filtro', () => {
    expect(producaoFormVazio(7)).toEqual({
      receitaId: '7',
      quantidade: '',
      todosGastos: true,
      gastoIndiretoIds: [],
    });
  });
});

describe('toCreateProducaoBody', () => {
  it('com "Todos", não envia gasto_indireto_ids', () => {
    const body = toCreateProducaoBody({
      receitaId: 1,
      quantidade: 3,
      todosGastos: true,
      gastoIndiretoIds: [2],
    });

    expect(body).toEqual({ receita_id: 1, quantidade: 3 });
    expect(body).not.toHaveProperty('gasto_indireto_ids');
  });

  it('com uma seleção, envia os ids escolhidos', () => {
    expect(
      toCreateProducaoBody({
        receitaId: 1,
        quantidade: 2,
        todosGastos: false,
        gastoIndiretoIds: [4, 2],
      }),
    ).toEqual({ receita_id: 1, quantidade: 2, gasto_indireto_ids: [4, 2] });
  });

  it('com a seleção vazia, envia a lista vazia (nenhum rateio)', () => {
    expect(
      toCreateProducaoBody({
        receitaId: 1,
        quantidade: 1,
        todosGastos: false,
        gastoIndiretoIds: [],
      }),
    ).toEqual({ receita_id: 1, quantidade: 1, gasto_indireto_ids: [] });
  });
});
