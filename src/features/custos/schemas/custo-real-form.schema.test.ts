import { describe, expect, it } from 'vitest';
import {
  custoRealFormSchema,
  custoRealFormVazio,
  toCustoRealFormInput,
  type CustoRealFormInput,
} from './custo-real-form.schema';

function validar(mudancas: Partial<CustoRealFormInput>) {
  return custoRealFormSchema.safeParse({
    ...custoRealFormVazio(),
    nome: 'Bolo de cenoura',
    ...mudancas,
  });
}

function mensagens(mudancas: Partial<CustoRealFormInput>) {
  const resultado = validar(mudancas);
  return resultado.success ? [] : resultado.error.issues.map((i) => i.message);
}

describe('custoRealFormSchema', () => {
  it('converte os campos em número, com vírgula e milhar', () => {
    const resultado = validar({
      nome: '  Bolo  ',
      ingredientes: '1.234,56',
      energia: '2,5',
      agua: '1',
      gas: '0,75',
      horas: '1,5',
      valorHora: '12',
      rendimento: '10',
    });
    expect(resultado.success && resultado.data).toEqual({
      nome: 'Bolo',
      ingredientes: 1234.56,
      energia: 2.5,
      agua: 1,
      gas: 0.75,
      horas: 1.5,
      valorHora: 12,
      rendimento: 10,
    });
  });

  it('campos de valor vazios contam como 0', () => {
    const resultado = validar({});
    expect(resultado.success && resultado.data.ingredientes).toBe(0);
    expect(resultado.success && resultado.data.horas).toBe(0);
  });

  it('exige o nome', () => {
    expect(mensagens({ nome: '   ' })).toEqual(['Informe um nome']);
  });

  it.each(['-1', 'abc', '1,2,3'])('recusa o valor "%s"', (texto) => {
    expect(mensagens({ energia: texto })).toEqual(['Informe um valor válido']);
    expect(mensagens({ ingredientes: texto })).toEqual([
      'Informe um valor válido',
    ]);
  });

  it.each(['', '0', '1,5', 'abc'])('recusa o rendimento "%s"', (rendimento) => {
    expect(mensagens({ rendimento })).toEqual([
      'Informe um rendimento maior que zero',
    ]);
  });
});

describe('custoRealFormVazio', () => {
  it('começa vazio, com rendimento 1', () => {
    expect(custoRealFormVazio()).toEqual({
      nome: '',
      ingredientes: '',
      energia: '',
      agua: '',
      gas: '',
      horas: '',
      valorHora: '',
      rendimento: '1',
    });
  });
});

describe('toCustoRealFormInput', () => {
  it('devolve todos os campos no formato brasileiro', () => {
    expect(
      toCustoRealFormInput({
        nome: 'Bolo',
        ingredientes: 1234.5,
        energia: 0,
        agua: 2,
        gas: 0.75,
        horas: 1.5,
        valorHora: 12,
        rendimento: 10,
      }),
    ).toEqual({
      nome: 'Bolo',
      ingredientes: '1.234,50',
      energia: '0,00',
      agua: '2,00',
      gas: '0,75',
      horas: '1,5',
      valorHora: '12,00',
      rendimento: '10',
    });
  });

  it('o que volta para os campos passa no schema com os mesmos valores', () => {
    const valores = {
      nome: 'Pão',
      ingredientes: 30,
      energia: 5,
      agua: 2,
      gas: 3,
      horas: 2,
      valorHora: 15,
      rendimento: 20,
    };
    const resultado = custoRealFormSchema.safeParse(
      toCustoRealFormInput(valores),
    );
    expect(resultado.success && resultado.data).toEqual(valores);
  });
});
