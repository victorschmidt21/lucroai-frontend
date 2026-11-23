import { describe, expect, it } from 'vitest';
import {
  makeCanaisDoSeed,
  makeCanalVenda,
} from '@/test/factories/pricing.factory';
import { makePrecoCanal } from '@/test/factories/receita.factory';
import {
  canaisParaVenda,
  canalDaVendaSchema,
  canalPadrao,
  itemVendaFormSchema,
  itemVendaFormVazio,
  precoSugeridoNoCanal,
  toCreateVendaBody,
  type ItemVendaFormInput,
} from './item-venda.schema';

function validar(mudancas: Partial<ItemVendaFormInput>) {
  return itemVendaFormSchema.safeParse({
    receitaId: '1',
    quantidade: '10',
    precoUnitario: '0,50',
    ...mudancas,
  });
}

function mensagens(mudancas: Partial<ItemVendaFormInput>) {
  const resultado = validar(mudancas);
  return resultado.success ? [] : resultado.error.issues.map((i) => i.message);
}

describe('itemVendaFormSchema', () => {
  it('converte receita, quantidade e preço em número', () => {
    const resultado = validar({ precoUnitario: '1.234,5' });
    expect(resultado.success && resultado.data).toEqual({
      receitaId: 1,
      quantidade: 10,
      precoUnitario: 1234.5,
    });
  });

  it('exige o produto', () => {
    expect(mensagens({ receitaId: '' })).toEqual(['Selecione um produto']);
  });

  it.each(['', '0', '1,5', 'abc'])('recusa a quantidade "%s"', (quantidade) => {
    expect(mensagens({ quantidade })).toEqual(['Informe a quantidade']);
  });

  it.each(['', '0', '0,004', 'abc'])('recusa o preço "%s"', (precoUnitario) => {
    expect(mensagens({ precoUnitario })).toEqual(['Informe o preço']);
  });

  it('arredonda o preço a 2 casas, o máximo que o backend aceita', () => {
    const resultado = validar({ precoUnitario: '0,125' });
    expect(resultado.success && resultado.data.precoUnitario).toBe(0.13);
  });

  it('começa vazio', () => {
    expect(itemVendaFormVazio()).toEqual({
      receitaId: '',
      quantidade: '',
      precoUnitario: '',
    });
  });
});

describe('toCreateVendaBody', () => {
  it('monta os itens em snake_case, na ordem do carrinho', () => {
    expect(
      toCreateVendaBody([
        { receitaId: 1, quantidade: 50, precoUnitario: 0.5 },
        { receitaId: 3, quantidade: 20, precoUnitario: 1 },
      ]),
    ).toEqual({
      itens: [
        { receita_id: 1, quantidade: 50, preco_unitario_real: 0.5 },
        { receita_id: 3, quantidade: 20, preco_unitario_real: 1 },
      ],
    });
  });
});

describe('toCreateVendaBody com o canal (FE-46)', () => {
  const itens = [{ receitaId: 1, quantidade: 2, precoUnitario: 3.69 }];

  it('envia o canal_id do canal escolhido', () => {
    expect(toCreateVendaBody(itens, 2)).toEqual({
      canal_id: 2,
      itens: [{ receita_id: 1, quantidade: 2, preco_unitario_real: 3.69 }],
    });
  });

  it('sem canal, omite canal_id (o backend usa o Balcão)', () => {
    expect(toCreateVendaBody(itens, null)).not.toHaveProperty('canal_id');
  });
});

describe('canalDaVendaSchema ("Onde vendeu?")', () => {
  it('lê o id do canal', () => {
    expect(canalDaVendaSchema.parse('2')).toBe(2);
  });

  it('vazio ou inválido vira null', () => {
    expect(canalDaVendaSchema.parse('')).toBeNull();
    expect(canalDaVendaSchema.parse('  ')).toBeNull();
    expect(canalDaVendaSchema.parse('abc')).toBeNull();
    expect(canalDaVendaSchema.parse('-1')).toBeNull();
  });
});

describe('canaisParaVenda e canalPadrao', () => {
  it('mostra só os canais ativos, na ordem da API', () => {
    expect(canaisParaVenda(makeCanaisDoSeed()).map((c) => c.nome)).toEqual([
      'Balcão',
      'iFood',
    ]);
  });

  it('o padrão é o Balcão', () => {
    const [balcao, ifood] = makeCanaisDoSeed();
    expect(canalPadrao([ifood!, balcao!])).toBe(1);
  });

  it('com o Balcão inativo, o padrão é o primeiro ativo; sem ativos, null', () => {
    const canais = makeCanaisDoSeed().map((c) =>
      c.balcao ? { ...c, ativo: false } : c,
    );
    expect(canalPadrao(canais)).toBe(2);
    expect(canalPadrao([makeCanalVenda({ ativo: false })])).toBeNull();
    expect(canalPadrao([])).toBeNull();
  });
});

describe('precoSugeridoNoCanal', () => {
  const receita = {
    precos: [
      makePrecoCanal(),
      makePrecoCanal({
        canalId: 2,
        canal: 'iFood',
        balcao: false,
        preco: 0.56,
      }),
    ],
  };

  it('usa o preço do canal escolhido', () => {
    expect(precoSugeridoNoCanal(receita, 2)).toBe(0.56);
    expect(precoSugeridoNoCanal(receita, 1)).toBe(0.46);
  });

  it('sem canal, usa o preço do Balcão', () => {
    expect(precoSugeridoNoCanal(receita, null)).toBe(0.46);
  });

  it('canal sem preço possível ou fora da receita dá null', () => {
    const semPreco = {
      precos: [
        makePrecoCanal({
          preco: null,
          motivo: 'PERCENTUAIS_ACIMA_DE_100',
          composicao: null,
        }),
      ],
    };
    expect(precoSugeridoNoCanal(semPreco, 1)).toBeNull();
    expect(precoSugeridoNoCanal(receita, 99)).toBeNull();
  });
});
