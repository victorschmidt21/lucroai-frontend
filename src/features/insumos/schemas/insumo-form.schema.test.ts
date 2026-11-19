import { describe, expect, it } from 'vitest';
import { makeInsumo } from '@/test/factories/insumo.factory';
import {
  insumoFormSchema,
  insumoFormVazio,
  toCreateInsumoBody,
  toInsumoFormInput,
  toUpdateInsumoBody,
  type InsumoFormInput,
} from './insumo-form.schema';

const valido: InsumoFormInput = {
  nome: 'Manteiga sem Sal',
  quantidadeBaseCusto: '500',
  unidade: 'G',
  valorPago: '12,00',
  quantidadeDisponivelInicial: '',
};

function mensagens(entrada: Partial<InsumoFormInput>) {
  const result = insumoFormSchema.safeParse({ ...valido, ...entrada });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

describe('insumoFormSchema', () => {
  it('aceita a entrada válida e converte os números brasileiros', () => {
    const values = insumoFormSchema.parse({
      ...valido,
      nome: '  Manteiga sem Sal  ',
      valorPago: '1.234,56',
    });

    expect(values).toEqual({
      nome: 'Manteiga sem Sal',
      quantidadeBaseCusto: 500,
      unidade: 'G',
      valorPago: 1234.56,
      quantidadeDisponivelInicial: undefined,
    });
  });

  it('pede o nome', () => {
    expect(mensagens({ nome: '   ' })).toEqual([['nome', 'Informe o nome']]);
  });

  it('aceita 80 caracteres no nome e recusa 81', () => {
    expect(mensagens({ nome: 'a'.repeat(80) })).toEqual([]);
    expect(mensagens({ nome: 'a'.repeat(81) })).toEqual([
      ['nome', 'Use até 80 caracteres'],
    ]);
  });

  it.each(['', '0', '0,0', 'abc'])(
    'pede uma quantidade maior que zero com "%s"',
    (quantidadeBaseCusto) => {
      expect(mensagens({ quantidadeBaseCusto })).toEqual([
        ['quantidadeBaseCusto', 'Informe uma quantidade maior que zero'],
      ]);
    },
  );

  it('aceita uma quantidade fracionada', () => {
    expect(
      insumoFormSchema.parse({ ...valido, quantidadeBaseCusto: '0,5' })
        .quantidadeBaseCusto,
    ).toBe(0.5);
  });

  it.each(['', '0', '0,00', '1,2,3'])(
    'pede um valor maior que zero com "%s"',
    (valorPago) => {
      expect(mensagens({ valorPago })).toEqual([
        ['valorPago', 'Informe um valor maior que zero'],
      ]);
    },
  );

  it('recusa uma unidade fora do contrato', () => {
    expect(
      insumoFormSchema.safeParse({ ...valido, unidade: 'XG' }).success,
    ).toBe(false);
  });

  it('aceita zero na quantidade disponível inicial', () => {
    expect(
      insumoFormSchema.parse({ ...valido, quantidadeDisponivelInicial: '0' })
        .quantidadeDisponivelInicial,
    ).toBe(0);
  });

  it('recusa uma quantidade disponível inicial inválida ou negativa', () => {
    const mensagem = [
      'quantidadeDisponivelInicial',
      'Informe uma quantidade maior ou igual a zero',
    ];

    expect(mensagens({ quantidadeDisponivelInicial: 'abc' })).toEqual([
      mensagem,
    ]);
    expect(mensagens({ quantidadeDisponivelInicial: '-1' })).toEqual([
      mensagem,
    ]);
  });
});

describe('formulário vazio e edição', () => {
  it('começa vazio, em gramas, como o mobile', () => {
    expect(insumoFormVazio).toEqual({
      nome: '',
      quantidadeBaseCusto: '',
      unidade: 'G',
      valorPago: '',
      quantidadeDisponivelInicial: '',
    });
  });

  it('preenche a edição no formato brasileiro, sem a quantidade inicial', () => {
    expect(
      toInsumoFormInput(
        makeInsumo({ quantidadeBaseCusto: 1.5, valorPago: 1234.5 }),
      ),
    ).toEqual({
      nome: 'Farinha de Trigo',
      quantidadeBaseCusto: '1,5',
      unidade: 'KG',
      valorPago: '1.234,50',
      quantidadeDisponivelInicial: '',
    });
  });
});

describe('corpos da API', () => {
  const values = insumoFormSchema.parse(valido);

  it('não envia a quantidade inicial vazia na criação', () => {
    expect(toCreateInsumoBody(values)).toEqual({
      nome: 'Manteiga sem Sal',
      quantidadeBaseCusto: 500,
      unidade: 'G',
      valorPago: 12,
    });
  });

  it('envia a quantidade inicial preenchida, inclusive zero', () => {
    expect(
      toCreateInsumoBody({ ...values, quantidadeDisponivelInicial: 0 }),
    ).toEqual({
      nome: 'Manteiga sem Sal',
      quantidadeBaseCusto: 500,
      unidade: 'G',
      valorPago: 12,
      quantidadeDisponivelInicial: 0,
    });
  });

  it('nunca envia a quantidade inicial na edição', () => {
    expect(
      toUpdateInsumoBody({ ...values, quantidadeDisponivelInicial: 3 }),
    ).toEqual({
      nome: 'Manteiga sem Sal',
      quantidadeBaseCusto: 500,
      unidade: 'G',
      valorPago: 12,
    });
  });
});
