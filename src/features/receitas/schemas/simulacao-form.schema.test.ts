import { describe, expect, it } from 'vitest';
import {
  custoLotesFormSchema,
  precoMargemFormSchema,
  simulacaoCenarioFormSchema,
  toPrecoMargemFormInput,
  toPrecoVendaBody,
  toSimulacaoCenarioFormInput,
  toSimularCenarioBody,
  toSimularReceitaCustoBody,
} from './simulacao-form.schema';

function mensagens(entrada: Record<string, string>) {
  const result = simulacaoCenarioFormSchema.safeParse({
    novoCusto: '',
    novoPreco: '',
    volume: '',
    ...entrada,
  });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

describe('simulacaoCenarioFormSchema', () => {
  it('converte os números brasileiros', () => {
    expect(
      simulacaoCenarioFormSchema.parse({
        novoCusto: '1.234,56',
        novoPreco: '5,00',
        volume: '12',
      }),
    ).toEqual({ novoCusto: 1234.56, novoPreco: 5, volume: 12 });
  });

  it('aceita tudo vazio', () => {
    expect(mensagens({})).toEqual([]);
  });

  it('recusa valores não positivos ou inválidos', () => {
    expect(mensagens({ novoCusto: '0', novoPreco: 'abc' })).toEqual([
      ['novoCusto', 'Informe um valor maior que zero'],
      ['novoPreco', 'Informe um valor maior que zero'],
    ]);
  });

  it('exige volume inteiro maior que zero', () => {
    const erro = 'Informe uma quantidade inteira maior que zero';
    expect(mensagens({ volume: '1,5' })).toEqual([['volume', erro]]);
    expect(mensagens({ volume: '0' })).toEqual([['volume', erro]]);
  });
});

describe('toSimularCenarioBody', () => {
  it('envia só os campos preenchidos', () => {
    expect(
      toSimularCenarioBody(
        simulacaoCenarioFormSchema.parse({
          novoCusto: '',
          novoPreco: '6,5',
          volume: '',
        }),
      ),
    ).toEqual({ novoPreco: 6.5 });
  });

  it('envia os três quando preenchidos', () => {
    expect(
      toSimularCenarioBody({ novoCusto: 2.5, novoPreco: 5, volume: 10 }),
    ).toEqual({ novoCusto: 2.5, novoPreco: 5, volume: 10 });
  });

  it('com tudo vazio, envia um corpo vazio', () => {
    expect(
      toSimularCenarioBody({
        novoCusto: undefined,
        novoPreco: undefined,
        volume: undefined,
      }),
    ).toStrictEqual({});
  });
});

describe('toSimulacaoCenarioFormInput', () => {
  it('preenche com custo, preço sugerido e rendimento da receita', () => {
    expect(
      toSimulacaoCenarioFormInput({
        custoUnitario: 1.2,
        precoSugerido: 2.16,
        rendimento: 50,
      }),
    ).toEqual({ novoCusto: '1,20', novoPreco: '2,16', volume: '50' });
  });

  it('deixa vazio o que não é positivo', () => {
    expect(
      toSimulacaoCenarioFormInput({
        custoUnitario: undefined,
        precoSugerido: 0,
        rendimento: 0,
      }),
    ).toEqual({ novoCusto: '', novoPreco: '', volume: '' });
  });
});

describe('preço para margem desejada', () => {
  it('converte a margem em pontos para a fração do contrato', () => {
    expect(
      toPrecoVendaBody(precoMargemFormSchema.parse({ margem: '7' })),
    ).toEqual({ margem_lucro: 0.07 });
  });

  it('aceita zero e recusa vazio ou negativo', () => {
    expect(precoMargemFormSchema.safeParse({ margem: '0' }).success).toBe(true);
    expect(precoMargemFormSchema.safeParse({ margem: '' }).success).toBe(false);
    expect(precoMargemFormSchema.safeParse({ margem: '-1' }).success).toBe(
      false,
    );
  });

  it('começa com a margem salva da receita', () => {
    expect(toPrecoMargemFormInput({ margemLucro: 0.6 })).toEqual({
      margem: '60',
    });
    expect(toPrecoMargemFormInput({ margemLucro: undefined })).toEqual({
      margem: '',
    });
  });
});

describe('custo para N lotes', () => {
  it('exige inteiro maior que zero', () => {
    expect(
      toSimularReceitaCustoBody(
        custoLotesFormSchema.parse({ quantidadeLotes: '3' }),
      ),
    ).toEqual({ quantidadeLotes: 3 });
    for (const quantidadeLotes of ['', '0', '1,5']) {
      expect(
        custoLotesFormSchema.safeParse({ quantidadeLotes }).error?.issues[0]
          ?.message,
      ).toBe('Informe a quantidade de lotes');
    }
  });
});
