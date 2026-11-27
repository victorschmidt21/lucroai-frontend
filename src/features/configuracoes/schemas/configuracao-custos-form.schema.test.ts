import { describe, expect, it } from 'vitest';
import { makeConfiguracaoCustos } from '@/test/factories/pricing.factory';
import {
  configuracaoCustosFormSchema,
  toConfiguracaoCustosFormInput,
  toUpdateConfiguracaoCustosBody,
  type ConfiguracaoCustosFormInput,
} from './configuracao-custos-form.schema';

const valido: ConfiguracaoCustosFormInput = {
  baseRateio: 'FORNADAS',
  capacidadeMensal: '100',
  lucroPadrao: '15',
  impostoPercentual: '0',
  taxaMaquininha: '1,36',
  valorHora: '18,75',
};

function mensagens(entrada: Record<string, unknown>) {
  const result = configuracaoCustosFormSchema.safeParse({
    ...valido,
    ...entrada,
  });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

describe('configuracaoCustosFormSchema', () => {
  it('aceita a entrada válida e lê os números brasileiros', () => {
    expect(
      configuracaoCustosFormSchema.parse({
        ...valido,
        baseRateio: 'MINUTOS',
        capacidadeMensal: '1.200,5',
      }),
    ).toEqual({
      baseRateio: 'MINUTOS',
      capacidadeMensal: 1200.5,
      lucroPadrao: 15,
      impostoPercentual: 0,
      taxaMaquininha: 1.36,
      valorHora: 18.75,
    });
  });

  it.each(['0', '0,00', '18,75', '1.500,5'])(
    'aceita o valor da hora "%s"',
    (valorHora) => {
      expect(mensagens({ valorHora })).toEqual([]);
    },
  );

  it.each(['', '-1', '-0,01', 'abc'])(
    'recusa o valor da hora "%s"',
    (valorHora) => {
      expect(mensagens({ valorHora })).toEqual([
        ['valorHora', 'Informe um valor de R$ 0,00 ou mais'],
      ]);
    },
  );

  it.each(['', '0', '-3', 'abc'])(
    'recusa a capacidade "%s" no campo',
    (capacidadeMensal) => {
      expect(mensagens({ capacidadeMensal })).toEqual([
        ['capacidadeMensal', 'Informe um número maior que zero'],
      ]);
    },
  );

  it.each(['lucroPadrao', 'impostoPercentual', 'taxaMaquininha'])(
    'recusa %s fora de 0 a 100',
    (campo) => {
      for (const texto of ['', '-1', '100,01', '150', 'x']) {
        expect(mensagens({ [campo]: texto })).toEqual([
          [campo, 'Informe um percentual de 0 a 100'],
        ]);
      }
    },
  );

  it('aceita os limites 0 e 100', () => {
    expect(mensagens({ lucroPadrao: '0', taxaMaquininha: '100' })).toEqual([]);
  });

  it('recusa uma base fora do contrato', () => {
    expect(mensagens({ baseRateio: 'HORAS' })).toHaveLength(1);
  });
});

describe('conversão entre a tela e a API', () => {
  it('preenche o formulário com os percentuais da fração salva', () => {
    expect(toConfiguracaoCustosFormInput(makeConfiguracaoCustos())).toEqual(
      valido,
    );
  });

  it('capacidade de milhares volta para o campo sem virar outro número', () => {
    const entrada = toConfiguracaoCustosFormInput(
      makeConfiguracaoCustos({ baseRateio: 'MINUTOS', capacidadeMensal: 3000 }),
    );

    expect(entrada.capacidadeMensal).toBe('3000');
    expect(configuracaoCustosFormSchema.parse(entrada).capacidadeMensal).toBe(
      3000,
    );
  });

  it('a hora começa em 0,00 quando não foi definida', () => {
    expect(
      toConfiguracaoCustosFormInput(makeConfiguracaoCustos({ valorHora: 0 }))
        .valorHora,
    ).toBe('0,00');
  });

  it('envia os seis campos, com os percentuais em fração do preço', () => {
    expect(
      toUpdateConfiguracaoCustosBody(
        configuracaoCustosFormSchema.parse({
          ...valido,
          impostoPercentual: '6',
        }),
      ),
    ).toEqual({
      baseRateio: 'FORNADAS',
      capacidadeMensal: 100,
      lucroPadrao: 0.15,
      impostoPercentual: 0.06,
      taxaMaquininha: 0.0136,
      valorHora: 18.75,
    });
  });
});
