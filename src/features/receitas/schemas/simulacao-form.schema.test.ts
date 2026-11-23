import { describe, expect, it } from 'vitest';
import { makePrecoCanal } from '@/test/factories/receita.factory';
import {
  custoLotesFormSchema,
  precoDoCanalNoCampo,
  simulacaoCenarioFormSchema,
  toSimulacaoCenarioFormInput,
  toSimularCenarioBody,
  toSimularReceitaCustoBody,
} from './simulacao-form.schema';

function mensagens(entrada: Record<string, string>) {
  const result = simulacaoCenarioFormSchema.safeParse({
    canalId: '1',
    novoPreco: '',
    volume: '',
    ...entrada,
  });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

const balcao = makePrecoCanal({ canalId: 1, canal: 'Balcão', balcao: true });
const ifood = makePrecoCanal({
  canalId: 2,
  canal: 'iFood',
  balcao: false,
  preco: 0.5513,
});

describe('simulacaoCenarioFormSchema', () => {
  it('converte o canal e os números brasileiros', () => {
    expect(
      simulacaoCenarioFormSchema.parse({
        canalId: '2',
        novoPreco: '1.234,56',
        volume: '3000',
      }),
    ).toEqual({ canalId: 2, novoPreco: 1234.56, volume: 3000 });
  });

  it('aceita preço e volume vazios', () => {
    expect(mensagens({})).toEqual([]);
  });

  it('exige o canal', () => {
    expect(mensagens({ canalId: '' })).toEqual([
      ['canalId', 'Escolha onde vende'],
    ]);
  });

  it('recusa preço não positivo ou inválido', () => {
    const erro = 'Informe um valor maior que zero';
    expect(mensagens({ novoPreco: '0' })).toEqual([['novoPreco', erro]]);
    expect(mensagens({ novoPreco: 'abc' })).toEqual([['novoPreco', erro]]);
  });

  it('exige volume inteiro maior que zero', () => {
    const erro = 'Informe uma quantidade inteira maior que zero';
    expect(mensagens({ volume: '1,5' })).toEqual([['volume', erro]]);
    expect(mensagens({ volume: '0' })).toEqual([['volume', erro]]);
  });
});

describe('toSimularCenarioBody', () => {
  const receita = { precos: [balcao, ifood] };

  it('envia o canal e só os campos preenchidos', () => {
    expect(
      toSimularCenarioBody(
        simulacaoCenarioFormSchema.parse({
          canalId: '1',
          novoPreco: '0,50',
          volume: '',
        }),
        receita,
      ),
    ).toStrictEqual({ canalId: 1, novoPreco: 0.5 });
  });

  it('com preço e volume vazios, envia só o canal', () => {
    expect(
      toSimularCenarioBody(
        { canalId: 2, novoPreco: undefined, volume: undefined },
        receita,
      ),
    ).toStrictEqual({ canalId: 2 });
  });

  it('envia os três quando preenchidos', () => {
    expect(
      toSimularCenarioBody({ canalId: 1, novoPreco: 5, volume: 300 }, receita),
    ).toEqual({ canalId: 1, novoPreco: 5, volume: 300 });
  });

  it('omite o preço igual ao sugerido do canal arredondado, para a API usar o exato', () => {
    // iFood: sugerido 0,5513, mostrado no campo como 0,55.
    expect(
      toSimularCenarioBody(
        { canalId: 2, novoPreco: 0.55, volume: 28 },
        receita,
      ),
    ).toStrictEqual({ canalId: 2, volume: 28 });
    // O mesmo preço em outro canal é um preço informado.
    expect(
      toSimularCenarioBody(
        { canalId: 1, novoPreco: 0.55, volume: 28 },
        receita,
      ),
    ).toStrictEqual({ canalId: 1, novoPreco: 0.55, volume: 28 });
  });
});

describe('toSimulacaoCenarioFormInput', () => {
  it('começa no Balcão, com o preço sugerido e o rendimento', () => {
    expect(
      toSimulacaoCenarioFormInput({
        rendimento: 28,
        precos: [ifood, { ...balcao, preco: 0.46 }],
      }),
    ).toEqual({ canalId: '1', novoPreco: '0,46', volume: '28' });
  });

  it('sem Balcão, usa o primeiro canal; sem preço possível, deixa vazio', () => {
    expect(
      toSimulacaoCenarioFormInput({
        rendimento: 0,
        precos: [{ ...ifood, preco: null }],
      }),
    ).toEqual({ canalId: '2', novoPreco: '', volume: '' });
  });

  it('sem canais, deixa tudo vazio', () => {
    expect(toSimulacaoCenarioFormInput({ rendimento: 12, precos: [] })).toEqual(
      { canalId: '', novoPreco: '', volume: '12' },
    );
  });
});

describe('precoDoCanalNoCampo', () => {
  it('usa o preço sugerido do canal escolhido', () => {
    expect(precoDoCanalNoCampo({ precos: [balcao, ifood] }, 2)).toBe('0,55');
  });

  it('fica vazio com canal desconhecido ou sem preço', () => {
    expect(precoDoCanalNoCampo({ precos: [balcao] }, 9)).toBe('');
    expect(
      precoDoCanalNoCampo({ precos: [{ ...ifood, preco: null }] }, 2),
    ).toBe('');
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
