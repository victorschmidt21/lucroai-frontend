import { describe, expect, it } from 'vitest';
import { makeReceita } from '@/test/factories/receita.factory';
import {
  novoInsumoSchema,
  PERCENTUAL_INVALIDO,
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
  uso_por_lote: '0,5',
  embalagem_por_unidade: '0,15',
  perda_percentual: '5',
  lucro_percentual: '20',
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
      }),
    ).toEqual({
      nome: 'Bolo',
      rendimento: 12,
      unidadeRendimento: 'UN',
      uso_por_lote: 0.5,
      embalagem_por_unidade: 0.15,
      perda_percentual: 5,
      lucro_percentual: 20,
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

  it('fornadas (ou minutos) por lote são obrigatórias e maiores que zero', () => {
    expect(mensagens({ uso_por_lote: '1' })).toEqual([]);
    expect(mensagens({ uso_por_lote: '0,25' })).toEqual([]);
    for (const uso_por_lote of ['', '0', '-1', 'abc']) {
      expect(mensagens({ uso_por_lote })).toEqual([
        ['uso_por_lote', 'Informe um valor maior que zero'],
      ]);
    }
  });

  it('embalagem é opcional, em reais, maior ou igual a zero', () => {
    expect(mensagens({ embalagem_por_unidade: '' })).toEqual([]);
    expect(mensagens({ embalagem_por_unidade: '0' })).toEqual([]);
    expect(mensagens({ embalagem_por_unidade: '-1' })).toEqual([
      ['embalagem_por_unidade', 'Valor inválido'],
    ]);
    expect(mensagens({ embalagem_por_unidade: 'abc' })).toEqual([
      ['embalagem_por_unidade', 'Valor inválido'],
    ]);
  });

  it('perda e lucro são opcionais, de 0 até menos de 100%', () => {
    for (const campo of ['perda_percentual', 'lucro_percentual'] as const) {
      for (const valor of ['', '0', '12,5', '99,9']) {
        expect(mensagens({ [campo]: valor })).toEqual([]);
      }
      for (const valor of ['100', '150', '-1', 'abc']) {
        expect(mensagens({ [campo]: valor })).toEqual([
          [campo, PERCENTUAL_INVALIDO],
        ]);
      }
    }
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

describe('toCreateReceitaBody', () => {
  it('envia a ficha técnica com os percentuais em fração', () => {
    expect(toCreateReceitaBody(receitaFormSchema.parse(valido))).toEqual({
      nome: 'Bolo de Chocolate',
      rendimento: 12,
      unidadeRendimento: 'UN',
      uso_por_lote: 0.5,
      embalagem_por_unidade: 0.15,
      perda_percentual: 0.05,
      lucro_percentual: 0.2,
      insumos: [
        { insumo_id: 1, quantidade: 0.25 },
        { insumo_id: 3, quantidade: 100 },
      ],
    });
    expect(
      toCreateReceitaBody(
        receitaFormSchema.parse({ ...valido, lucro_percentual: '7' }),
      ).lucro_percentual,
    ).toBe(0.07);
  });

  it('vazio: embalagem e perda vão 0, e o lucro vai null (usa o padrão)', () => {
    const vazio = {
      ...valido,
      embalagem_por_unidade: '',
      perda_percentual: '',
      lucro_percentual: '',
    };
    expect(toCreateReceitaBody(receitaFormSchema.parse(vazio))).toMatchObject({
      embalagem_por_unidade: 0,
      perda_percentual: 0,
      lucro_percentual: null,
    });
    // No PUT, o null também volta ao lucro padrão da empresa.
    expect(
      toUpdateReceitaBody(receitaFormSchema.parse(vazio)).lucro_percentual,
    ).toBeNull();
  });

  it('não envia a margem antiga (markup)', () => {
    expect(
      toCreateReceitaBody(receitaFormSchema.parse(valido)),
    ).not.toHaveProperty('margem_lucro');
  });
});

describe('toReceitaFormInput', () => {
  it('preenche o formulário com os valores salvos', () => {
    expect(
      toReceitaFormInput(
        makeReceita({
          usoPorLote: 0.2,
          embalagemPorUnidade: 0.15,
          perdaPercentual: 0.05,
          lucroPercentual: 0.25,
        }),
      ),
    ).toEqual({
      nome: 'Pão Francês',
      rendimento: '50',
      unidadeRendimento: 'UN',
      uso_por_lote: '0,2',
      embalagem_por_unidade: '0,15',
      perda_percentual: '5',
      lucro_percentual: '25',
      insumos: [
        { insumo_id: 1, quantidade: '1' },
        { insumo_id: 8, quantidade: '0,02' },
        { insumo_id: 6, quantidade: '15' },
      ],
    });
  });

  it('lucro omitido (padrão da empresa) e zeros ficam vazios', () => {
    expect(toReceitaFormInput(makeReceita())).toMatchObject({
      uso_por_lote: '1',
      embalagem_por_unidade: '',
      perda_percentual: '',
      lucro_percentual: '',
    });
  });

  it('o formulário vazio começa em unidades e sem insumos', () => {
    expect(receitaFormVazio).toMatchObject({
      unidadeRendimento: 'UN',
      uso_por_lote: '1',
      lucro_percentual: '',
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
