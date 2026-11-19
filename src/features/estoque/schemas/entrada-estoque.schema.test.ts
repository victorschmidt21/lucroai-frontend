import { describe, expect, it } from 'vitest';
import {
  entradaEstoqueSchema,
  entradaEstoqueVazia,
  saldoAposEntrada,
  toRegistrarEntradaBody,
} from './entrada-estoque.schema';

function mensagens(quantidade: string) {
  const result = entradaEstoqueSchema.safeParse({ quantidade });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

describe('entradaEstoqueSchema', () => {
  it('começa vazio', () => {
    expect(entradaEstoqueVazia).toEqual({ quantidade: '' });
  });

  it.each([
    ['10', 10],
    ['10,5', 10.5],
    ['10.5', 10.5],
    ['0,001', 0.001],
    ['1.234,5', 1234.5],
  ])('aceita "%s" como %d', (quantidade, esperado) => {
    expect(entradaEstoqueSchema.parse({ quantidade }).quantidade).toBe(
      esperado,
    );
  });

  it.each(['', '   ', '0', '0,0', '-1', 'abc', '1,2,3'])(
    'recusa "%s" com a mensagem do mobile',
    (quantidade) => {
      expect(mensagens(quantidade)).toEqual([
        ['quantidade', 'Digite uma quantidade válida'],
      ]);
    },
  );
});

describe('corpo da API', () => {
  it('envia só a quantidade, sem observação', () => {
    expect(
      toRegistrarEntradaBody(entradaEstoqueSchema.parse({ quantidade: '2,5' })),
    ).toEqual({ quantidade: 2.5 });
  });
});

describe('saldoAposEntrada', () => {
  it('soma a quantidade ao saldo atual', () => {
    expect(saldoAposEntrada(10, 2.5)).toBe(12.5);
  });

  it('parte de um saldo negativo', () => {
    expect(saldoAposEntrada(-3, 5)).toBe(2);
  });

  it('não deixa ruído de ponto flutuante', () => {
    expect(saldoAposEntrada(0.1, 0.2)).toBe(0.3);
  });
});
