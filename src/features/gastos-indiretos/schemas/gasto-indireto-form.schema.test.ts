import { describe, expect, it } from 'vitest';
import { makeGastoIndireto } from '@/test/factories/gasto-indireto.factory';
import {
  gastoIndiretoFormSchema,
  gastoIndiretoFormVazio,
  toCreateGastoIndiretoBody,
  toGastoIndiretoFormInput,
  toUpdateGastoIndiretoBody,
  type GastoIndiretoFormInput,
} from './gasto-indireto-form.schema';

const valido: GastoIndiretoFormInput = {
  descricao: 'Energia Elétrica',
  tipo: 'MENSAL',
  valor: '450,00',
};

function mensagens(entrada: Record<string, unknown>) {
  const result = gastoIndiretoFormSchema.safeParse({ ...valido, ...entrada });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

function corpo(entrada: Partial<GastoIndiretoFormInput>) {
  return toCreateGastoIndiretoBody(
    gastoIndiretoFormSchema.parse({ ...valido, ...entrada }),
  );
}

describe('gastoIndiretoFormSchema', () => {
  it('aceita a entrada válida e converte o valor brasileiro', () => {
    expect(
      gastoIndiretoFormSchema.parse({
        ...valido,
        descricao: '  Aluguel  ',
        valor: '1.800,50',
      }),
    ).toEqual({ descricao: 'Aluguel', tipo: 'MENSAL', valor: 1800.5 });
  });

  it('pede a descrição', () => {
    expect(mensagens({ descricao: '   ' })).toEqual([
      ['descricao', 'Informe a descrição'],
    ]);
  });

  it('aceita 100 caracteres na descrição e recusa 101', () => {
    expect(mensagens({ descricao: 'a'.repeat(100) })).toEqual([]);
    expect(mensagens({ descricao: 'a'.repeat(101) })).toEqual([
      ['descricao', 'Use até 100 caracteres'],
    ]);
  });

  it.each(['MENSAL', 'POR_UNIDADE', 'PERCENTUAL_VENDA'])(
    'pede um valor válido no tipo %s',
    (tipo) => {
      for (const valor of ['', '0', '0,00', '-5', 'abc']) {
        expect(mensagens({ tipo, valor })).toEqual([
          ['valor', 'Informe um valor válido'],
        ]);
      }
    },
  );

  it('aceita valores altos em reais na conta do mês e por unidade', () => {
    expect(mensagens({ tipo: 'MENSAL', valor: '1.800' })).toEqual([]);
    expect(mensagens({ tipo: 'POR_UNIDADE', valor: '150' })).toEqual([]);
  });

  it('no percentual da venda, aceita até menos de 100%', () => {
    expect(mensagens({ tipo: 'PERCENTUAL_VENDA', valor: '99,99' })).toEqual([]);
    expect(mensagens({ tipo: 'PERCENTUAL_VENDA', valor: '100' })).toEqual([
      ['valor', 'Informe um percentual maior que 0 e menor que 100'],
    ]);
  });

  it.each(['FIXO', 'PROPORCIONAL', 'OUTRO'])(
    'recusa o tipo %s, fora do contrato',
    (tipo) => {
      expect(mensagens({ tipo })).toHaveLength(1);
    },
  );
});

describe('formulário vazio e edição', () => {
  it('começa vazio, com a conta do mês', () => {
    expect(gastoIndiretoFormVazio).toEqual({
      descricao: '',
      tipo: 'MENSAL',
      valor: '',
    });
  });

  it('preenche a conta do mês e o valor por unidade em reais', () => {
    expect(
      toGastoIndiretoFormInput(makeGastoIndireto({ valor: 1234.5 })),
    ).toEqual({
      descricao: 'Energia Elétrica',
      tipo: 'MENSAL',
      valor: '1.234,50',
    });
    expect(
      toGastoIndiretoFormInput(
        makeGastoIndireto({ tipo: 'POR_UNIDADE', valor: 0.05 }),
      ).valor,
    ).toBe('0,05');
  });

  it('preenche o percentual da venda a partir da fração da API', () => {
    expect(
      toGastoIndiretoFormInput(
        makeGastoIndireto({ tipo: 'PERCENTUAL_VENDA', valor: 0.125 }),
      ).valor,
    ).toBe('12,5');
  });
});

describe('corpos da API', () => {
  it('envia o tipo, sem o metodo_rateio, na criação e na edição', () => {
    const values = gastoIndiretoFormSchema.parse(valido);
    const esperado = {
      descricao: 'Energia Elétrica',
      valor: 450,
      tipo: 'MENSAL',
    };

    expect(toCreateGastoIndiretoBody(values)).toEqual(esperado);
    expect(toUpdateGastoIndiretoBody(values)).toEqual(esperado);
  });

  it('conta do mês: o valor vai em reais por mês', () => {
    expect(corpo({ tipo: 'MENSAL', valor: '1.800,00' }).valor).toBe(1800);
  });

  it('por unidade vendida: o valor vai em reais por unidade', () => {
    expect(corpo({ tipo: 'POR_UNIDADE', valor: '0,05' })).toEqual({
      descricao: 'Energia Elétrica',
      valor: 0.05,
      tipo: 'POR_UNIDADE',
    });
  });

  it('% da venda: o percentual digitado vai como fração do preço', () => {
    expect(corpo({ tipo: 'PERCENTUAL_VENDA', valor: '12' }).valor).toBe(0.12);
    expect(corpo({ tipo: 'PERCENTUAL_VENDA', valor: '7' }).valor).toBe(0.07);
    expect(corpo({ tipo: 'PERCENTUAL_VENDA', valor: '1,36' }).valor).toBe(
      0.0136,
    );
  });
});
