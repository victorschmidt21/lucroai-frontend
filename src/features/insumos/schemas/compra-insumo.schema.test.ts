import { describe, expect, it } from 'vitest';
import {
  compraInsumoSchema,
  compraInsumoVazia,
  toCreateCompraInsumoBody,
  type CompraInsumoInput,
} from './compra-insumo.schema';

const valida: CompraInsumoInput = {
  quantidade: '5',
  valorTotal: '50,00',
  observacao: '',
};

function mensagens(entrada: Partial<CompraInsumoInput>) {
  const result = compraInsumoSchema.safeParse({ ...valida, ...entrada });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

describe('compraInsumoSchema', () => {
  it('aceita a entrada válida e converte os números brasileiros', () => {
    expect(
      compraInsumoSchema.parse({
        quantidade: '1.250,5',
        valorTotal: '1.234,56',
        observacao: '  Nota 123  ',
      }),
    ).toEqual({
      quantidade: 1250.5,
      valorTotal: 1234.56,
      observacao: 'Nota 123',
    });
  });

  it('começa vazio e pede quantidade e valor', () => {
    const result = compraInsumoSchema.safeParse(compraInsumoVazia);
    expect(
      (result.error?.issues ?? []).map((issue) => [
        issue.path.join('.'),
        issue.message,
      ]),
    ).toEqual([
      ['quantidade', 'Informe uma quantidade maior que zero'],
      ['valorTotal', 'Informe um valor maior que zero'],
    ]);
  });

  it('recusa zero, negativo e texto inválido', () => {
    expect(mensagens({ quantidade: '0' })).toEqual([
      ['quantidade', 'Informe uma quantidade maior que zero'],
    ]);
    expect(mensagens({ quantidade: '-1' })).toEqual([
      ['quantidade', 'Informe uma quantidade maior que zero'],
    ]);
    expect(mensagens({ valorTotal: '0,00' })).toEqual([
      ['valorTotal', 'Informe um valor maior que zero'],
    ]);
    expect(mensagens({ valorTotal: 'abc' })).toEqual([
      ['valorTotal', 'Informe um valor maior que zero'],
    ]);
  });

  it('aceita 200 caracteres na observação e recusa 201', () => {
    expect(mensagens({ observacao: 'a'.repeat(200) })).toEqual([]);
    expect(mensagens({ observacao: 'a'.repeat(201) })).toEqual([
      ['observacao', 'Use até 200 caracteres'],
    ]);
  });
});

describe('toCreateCompraInsumoBody', () => {
  it('não envia a observação vazia', () => {
    expect(
      toCreateCompraInsumoBody(
        compraInsumoSchema.parse({ ...valida, observacao: '   ' }),
      ),
    ).toEqual({ quantidade: 5, valorTotal: 50 });
  });

  it('envia a observação preenchida', () => {
    expect(
      toCreateCompraInsumoBody(
        compraInsumoSchema.parse({ ...valida, observacao: 'Atacadão' }),
      ),
    ).toEqual({ quantidade: 5, valorTotal: 50, observacao: 'Atacadão' });
  });
});
