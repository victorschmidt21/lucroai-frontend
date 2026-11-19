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
  valor: '450,00',
  metodo_rateio: 'PROPORCIONAL',
};

function mensagens(entrada: Record<string, unknown>) {
  const result = gastoIndiretoFormSchema.safeParse({ ...valido, ...entrada });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

describe('gastoIndiretoFormSchema', () => {
  it('aceita a entrada válida e converte o valor brasileiro', () => {
    expect(
      gastoIndiretoFormSchema.parse({
        ...valido,
        descricao: '  Aluguel  ',
        valor: '1.800,50',
      }),
    ).toEqual({
      descricao: 'Aluguel',
      valor: 1800.5,
      metodo_rateio: 'PROPORCIONAL',
    });
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

  it.each(['', '0', '0,00', '-5', 'abc'])(
    'pede um valor válido com "%s"',
    (valor) => {
      expect(mensagens({ valor })).toEqual([
        ['valor', 'Informe um valor válido'],
      ]);
    },
  );

  it.each(['PROPORCIONAL', 'POR_UNIDADE', 'FIXO'])(
    'aceita o método %s',
    (metodo_rateio) => {
      expect(mensagens({ metodo_rateio })).toEqual([]);
    },
  );

  it('recusa um método fora do contrato', () => {
    expect(mensagens({ metodo_rateio: 'OUTRO' })).toHaveLength(1);
  });
});

describe('formulário vazio e edição', () => {
  it('começa vazio, com o método fixo, como o mobile', () => {
    expect(gastoIndiretoFormVazio).toEqual({
      descricao: '',
      valor: '',
      metodo_rateio: 'FIXO',
    });
  });

  it('preenche a edição no formato brasileiro', () => {
    expect(
      toGastoIndiretoFormInput(makeGastoIndireto({ valor: 1234.5 })),
    ).toEqual({
      descricao: 'Energia Elétrica',
      valor: '1.234,50',
      metodo_rateio: 'PROPORCIONAL',
    });
  });
});

describe('corpos da API', () => {
  it('envia os três campos em snake_case na criação e na edição', () => {
    const values = gastoIndiretoFormSchema.parse(valido);
    const corpo = {
      descricao: 'Energia Elétrica',
      valor: 450,
      metodo_rateio: 'PROPORCIONAL',
    };

    expect(toCreateGastoIndiretoBody(values)).toEqual(corpo);
    expect(toUpdateGastoIndiretoBody(values)).toEqual(corpo);
  });
});
