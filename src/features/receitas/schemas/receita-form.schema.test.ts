import { describe, expect, it } from 'vitest';
import { makeReceita } from '@/test/factories/receita.factory';
import {
  margemParaCampo,
  novoInsumoSchema,
  receitaFormSchema,
  receitaFormVazio,
  toCreateReceitaBody,
  toReceitaFormInput,
  toUpdateReceitaBody,
  type ReceitaFormInput,
} from './receita-form.schema';
import { receitaParamsSchema } from './receita-params.schema';

const valido: ReceitaFormInput = {
  nome: 'Bolo de Chocolate',
  rendimento: '12',
  unidadeRendimento: 'UN',
  margem_lucro: '50',
  insumos: [
    { insumo_id: 1, quantidade: '0,25' },
    { insumo_id: 3, quantidade: '100' },
  ],
};

function mensagens(entrada: Partial<ReceitaFormInput>) {
  const result = receitaFormSchema.safeParse({ ...valido, ...entrada });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

describe('receitaFormSchema', () => {
  it('aceita a entrada válida e converte os números brasileiros', () => {
    expect(
      receitaFormSchema.parse({
        ...valido,
        nome: '  Bolo  ',
        margem_lucro: '',
      }),
    ).toEqual({
      nome: 'Bolo',
      rendimento: 12,
      unidadeRendimento: 'UN',
      margem_lucro: undefined,
      insumos: [
        { insumo_id: 1, quantidade: 0.25 },
        { insumo_id: 3, quantidade: 100 },
      ],
    });
  });

  it('pede o nome e limita a 80 caracteres', () => {
    expect(mensagens({ nome: '  ' })).toEqual([['nome', 'Informe o nome']]);
    expect(mensagens({ nome: 'a'.repeat(80) })).toEqual([]);
    expect(mensagens({ nome: 'a'.repeat(81) })).toEqual([
      ['nome', 'Use até 80 caracteres'],
    ]);
  });

  it('exige rendimento inteiro maior que zero', () => {
    for (const rendimento of ['', '0', '1,5', 'abc']) {
      expect(mensagens({ rendimento })).toEqual([
        ['rendimento', 'Obrigatório'],
      ]);
    }
  });

  it('margem é opcional, maior ou igual a zero', () => {
    expect(mensagens({ margem_lucro: '0' })).toEqual([]);
    expect(mensagens({ margem_lucro: '12,5' })).toEqual([]);
    expect(mensagens({ margem_lucro: 'abc' })).toEqual([
      ['margem_lucro', 'Valor inválido'],
    ]);
  });

  it('a quantidade aceita vírgula e precisa ser maior que zero', () => {
    expect(
      mensagens({ insumos: [{ insumo_id: 1, quantidade: '0,001' }] }),
    ).toEqual([]);
    for (const quantidade of ['', '0', '0,0001', 'x']) {
      expect(mensagens({ insumos: [{ insumo_id: 1, quantidade }] })).toEqual([
        ['insumos.0.quantidade', 'Inválido'],
      ]);
    }
  });

  it('recusa o mesmo insumo duas vezes', () => {
    expect(
      mensagens({
        insumos: [
          { insumo_id: 1, quantidade: '1' },
          { insumo_id: 1, quantidade: '2' },
        ],
      }),
    ).toEqual([['insumos.1.insumo_id', 'Insumo repetido']]);
  });

  it('aceita receita sem insumos', () => {
    expect(mensagens({ insumos: [] })).toEqual([]);
  });
});

describe('conversão da margem', () => {
  it('envia a margem em fração e omite a vazia', () => {
    const body = toCreateReceitaBody(receitaFormSchema.parse(valido));
    expect(body).toEqual({
      nome: 'Bolo de Chocolate',
      rendimento: 12,
      unidadeRendimento: 'UN',
      margem_lucro: 0.5,
      insumos: [
        { insumo_id: 1, quantidade: 0.25 },
        { insumo_id: 3, quantidade: 100 },
      ],
    });
    expect(
      toCreateReceitaBody(
        receitaFormSchema.parse({ ...valido, margem_lucro: '7' }),
      ).margem_lucro,
    ).toBe(0.07);
    expect(
      toUpdateReceitaBody(
        receitaFormSchema.parse({ ...valido, margem_lucro: '' }),
      ),
    ).not.toHaveProperty('margem_lucro');
  });

  it('na edição, margem ausente ou ≤ 0 fica vazia', () => {
    expect(margemParaCampo(0.6)).toBe('60');
    expect(margemParaCampo(0.075)).toBe('7,5');
    expect(margemParaCampo(undefined)).toBe('');
    expect(margemParaCampo(0)).toBe('');
    expect(margemParaCampo(-0.1)).toBe('');
  });
});

describe('toReceitaFormInput', () => {
  it('preenche o formulário com os valores salvos', () => {
    expect(toReceitaFormInput(makeReceita())).toEqual({
      nome: 'Pão Francês',
      rendimento: '50',
      unidadeRendimento: 'UN',
      margem_lucro: '60',
      insumos: [
        { insumo_id: 1, quantidade: '1' },
        { insumo_id: 8, quantidade: '0,02' },
        { insumo_id: 6, quantidade: '15' },
      ],
    });
  });

  it('o formulário vazio começa em unidades e sem insumos', () => {
    expect(receitaFormVazio).toMatchObject({
      unidadeRendimento: 'UN',
      insumos: [],
    });
  });
});

describe('novoInsumoSchema', () => {
  it('exige o insumo e a quantidade maior que zero', () => {
    expect(
      novoInsumoSchema.parse({ insumo_id: '3', quantidade: '1,5' }),
    ).toEqual({ insumo_id: 3, quantidade: 1.5 });
    const result = novoInsumoSchema.safeParse({
      insumo_id: null,
      quantidade: '0',
    });
    expect(
      result.error?.issues.map((issue) => [issue.path[0], issue.message]),
    ).toEqual([
      ['insumo_id', 'Obrigatório'],
      ['quantidade', 'Obrigatório'],
    ]);
  });
});

describe('receitaParamsSchema', () => {
  it('aceita id inteiro positivo e recusa o resto', () => {
    expect(receitaParamsSchema.parse({ receitaId: '7' })).toEqual({
      receitaId: 7,
    });
    for (const receitaId of ['abc', '0', '-1', '1.5']) {
      expect(receitaParamsSchema.safeParse({ receitaId }).success).toBe(false);
    }
  });
});
