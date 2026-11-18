import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  formatNumeroEditavel,
  inteiroBR,
  numeroBR,
  numeroBROpcional,
  parseInteiroBR,
  parseNumeroBR,
} from './numero-br';
import { percentualParaFracao } from './numero';

describe('parseNumeroBR', () => {
  it.each([
    ['1.234,56', 1234.56],
    ['1234,56', 1234.56],
    ['1234.56', 1234.56],
    ['1.234.567,8', 1234567.8],
    ['0,5', 0.5],
    [',5', 0.5],
    ['.5', 0.5],
    ['12,', 12],
    ['15', 15],
    ['  7,25  ', 7.25],
    ['1.234', 1.234],
  ])('lê "%s" como %d', (texto, esperado) => {
    expect(parseNumeroBR(texto)).toBe(esperado);
  });

  it.each([
    ['-12,30', -12.3],
    ['-1.234,5', -1234.5],
    ['-0,5', -0.5],
  ])('aceita negativo: "%s"', (texto, esperado) => {
    expect(parseNumeroBR(texto)).toBe(esperado);
  });

  it('não devolve -0', () => {
    expect(Object.is(parseNumeroBR('-0'), 0)).toBe(true);
  });

  it.each(['', '   ', null, undefined])('vazio vira null (%j)', (texto) => {
    expect(parseNumeroBR(texto)).toBeNull();
  });

  it.each([
    'abc',
    '12a',
    'R$ 10',
    '1,2,3',
    '1.23,4',
    '1.234.567',
    '1e3',
    '-',
    ',',
    '.',
    '--1',
    '1-',
  ])('inválido vira null: "%s"', (texto) => {
    expect(parseNumeroBR(texto)).toBeNull();
  });
});

describe('parseInteiroBR', () => {
  it('lê só dígitos', () => {
    expect(parseInteiroBR('50')).toBe(50);
    expect(parseInteiroBR(' 12 ')).toBe(12);
  });

  it.each(['', null, undefined, '1,5', '1.200', '-3', 'doze'])(
    'recusa "%s"',
    (texto) => {
      expect(parseInteiroBR(texto)).toBeNull();
    },
  );
});

describe('formatNumeroEditavel', () => {
  it('mostra o número no padrão brasileiro, sem arredondar', () => {
    expect(formatNumeroEditavel(1234.56)).toBe('1.234,56');
    expect(formatNumeroEditavel(0.024)).toBe('0,024');
    expect(formatNumeroEditavel(5)).toBe('5');
  });

  it('fixa as casas quando pedido (dinheiro)', () => {
    expect(formatNumeroEditavel(15, 2)).toBe('15,00');
    expect(formatNumeroEditavel(1234.567, 2)).toBe('1.234,57');
  });

  it('mostra negativo com sinal e sem -0', () => {
    expect(formatNumeroEditavel(-12.3, 2)).toBe('-12,30');
    expect(formatNumeroEditavel(-0)).toBe('0');
  });

  it.each([null, undefined, Number.NaN, Number.POSITIVE_INFINITY])(
    'sem valor devolve campo vazio (%s)',
    (valor) => {
      expect(formatNumeroEditavel(valor)).toBe('');
    },
  );

  it('volta a ser lido pelo parseNumeroBR', () => {
    expect(parseNumeroBR(formatNumeroEditavel(1234567.891))).toBe(1234567.891);
  });
});

describe('percentualParaFracao', () => {
  it('margem de 30% vira 0.3', () => {
    expect(percentualParaFracao(30)).toBe(0.3);
    expect(percentualParaFracao(7)).toBe(0.07);
    expect(percentualParaFracao(0)).toBe(0);
  });
});

const VALOR = 'Informe um valor maior que zero';

describe('numeroBR', () => {
  const schema = numeroBR(z.number({ error: VALOR }).positive(VALOR));

  it.each(['1.234,56', '1234,56', '1234.56'])(
    'converte "%s" em 1234.56',
    (texto) => {
      expect(schema.parse(texto)).toBe(1234.56);
    },
  );

  it.each(['', 'abc', '0', '-1'])(
    'recusa "%s" com a mensagem do campo',
    (texto) => {
      const result = schema.safeParse(texto);

      expect(result.error?.issues[0]?.message).toBe(VALOR);
    },
  );
});

describe('numeroBROpcional', () => {
  const MENSAGEM = 'Informe uma quantidade maior ou igual a zero';
  const schema = numeroBROpcional(
    z.number({ error: MENSAGEM }).min(0, MENSAGEM),
  );

  it('vazio vira undefined', () => {
    expect(schema.parse('')).toBeUndefined();
    expect(schema.parse('  ')).toBeUndefined();
  });

  it('converte o número digitado', () => {
    expect(schema.parse('2,5')).toBe(2.5);
  });

  it.each(['abc', '-1'])('recusa "%s"', (texto) => {
    expect(schema.safeParse(texto).error?.issues[0]?.message).toBe(MENSAGEM);
  });
});

describe('inteiroBR', () => {
  const MENSAGEM = 'Informe um rendimento válido';
  const schema = inteiroBR(
    z.number({ error: MENSAGEM }).int().positive(MENSAGEM),
  );

  it('converte dígitos', () => {
    expect(schema.parse('50')).toBe(50);
  });

  it.each(['', '1,5', 'dez', '0'])('recusa "%s"', (texto) => {
    expect(schema.safeParse(texto).error?.issues[0]?.message).toBe(MENSAGEM);
  });
});
