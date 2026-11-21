import { describe, expect, it } from 'vitest';
import {
  entradaEstoqueSchema,
  entradaEstoqueVazia,
  saldoAposEntrada,
  toRegistrarEntradaBody,
} from './entrada-estoque.schema';

function mensagens(quantidade: string) {
  const result = entradaEstoqueSchema.safeParse({ quantidade, observacao: '' });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

describe('entradaEstoqueSchema', () => {
  it('começa vazio', () => {
    expect(entradaEstoqueVazia).toEqual({ quantidade: '', observacao: '' });
  });

  it.each([
    ['10', 10],
    ['10,5', 10.5],
    ['10.5', 10.5],
    ['0,001', 0.001],
    ['1.234,5', 1234.5],
  ])('aceita "%s" como %d', (quantidade, esperado) => {
    expect(
      entradaEstoqueSchema.parse({ quantidade, observacao: '' }).quantidade,
    ).toBe(esperado);
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

describe('observação', () => {
  it('aceita até 200 caracteres', () => {
    expect(
      entradaEstoqueSchema.safeParse({
        quantidade: '1',
        observacao: 'x'.repeat(200),
      }).success,
    ).toBe(true);
  });

  it('recusa mais de 200 caracteres', () => {
    const result = entradaEstoqueSchema.safeParse({
      quantidade: '1',
      observacao: 'x'.repeat(201),
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Use até 200 caracteres',
    ]);
  });
});

describe('corpo da API', () => {
  it('envia a observação aparada', () => {
    expect(
      toRegistrarEntradaBody(
        entradaEstoqueSchema.parse({
          quantidade: '2,5',
          observacao: '  Compra de reposição, NF 4521 ',
        }),
      ),
    ).toEqual({ quantidade: 2.5, observacao: 'Compra de reposição, NF 4521' });
  });

  it('não envia a observação vazia', () => {
    expect(
      toRegistrarEntradaBody(
        entradaEstoqueSchema.parse({ quantidade: '2,5', observacao: '   ' }),
      ),
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
