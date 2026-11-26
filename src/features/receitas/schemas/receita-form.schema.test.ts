import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api/errors';
import { makeReceita } from '@/test/factories/receita.factory';
import {
  novaReceitaSchema,
  novoInsumoSchema,
  PERCENTUAL_INVALIDO,
  receitaFormSchema,
  receitaFormVazio,
  toCreateReceitaBody,
  toReceitaFormInput,
  toUpdateReceitaBody,
  traduzirErroDaReceita,
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
  vendavel: true,
  receitas: [],
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
      vendavel: true,
      receitas: [],
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
    ).toEqual([['insumos.1.insumo_id', 'Ingrediente repetido']]);
  });

  it('aceita receitas dentro, com quantidade maior que zero e sem repetir', () => {
    expect(
      receitaFormSchema.parse({
        ...valido,
        vendavel: false,
        receitas: [
          { receita_id: 7, quantidade: '150' },
          { receita_id: 8, quantidade: '0,5' },
        ],
      }),
    ).toMatchObject({
      vendavel: false,
      receitas: [
        { receita_id: 7, quantidade: 150 },
        { receita_id: 8, quantidade: 0.5 },
      ],
    });
    expect(
      mensagens({
        receitas: [
          { receita_id: 7, quantidade: '0' },
          { receita_id: 8, quantidade: '' },
        ],
      }),
    ).toEqual([
      ['receitas.0.quantidade', 'Inválido'],
      ['receitas.1.quantidade', 'Inválido'],
    ]);
    expect(
      mensagens({
        receitas: [
          { receita_id: 7, quantidade: '1' },
          { receita_id: 7, quantidade: '2' },
        ],
      }),
    ).toEqual([['receitas.1.receita_id', 'Receita repetida']]);
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
      vendavel: true,
      insumos: [
        { insumo_id: 1, quantidade: 0.25 },
        { insumo_id: 3, quantidade: 100 },
      ],
      receitas: [],
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
      vendavel: true,
      receitas: [],
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

describe('receita dentro de receita (FE-70)', () => {
  // Brownie Dois Amores: 1 brownie, 150 g de cada brigadeiro e 30 g de leite Ninho.
  const brownieDoisAmores: ReceitaFormInput = {
    ...valido,
    nome: 'Brownie Dois Amores',
    insumos: [{ insumo_id: 13, quantidade: '30' }],
    receitas: [
      { receita_id: 7, quantidade: '1' },
      { receita_id: 5, quantidade: '150' },
      { receita_id: 6, quantidade: '150' },
    ],
  };

  it('envia as receitas e o vendavel no corpo do POST e do PUT', () => {
    const valores = receitaFormSchema.parse({
      ...brownieDoisAmores,
      vendavel: false,
    });
    const esperado = {
      vendavel: false,
      insumos: [{ insumo_id: 13, quantidade: 30 }],
      receitas: [
        { receita_id: 7, quantidade: 1 },
        { receita_id: 5, quantidade: 150 },
        { receita_id: 6, quantidade: 150 },
      ],
    };
    expect(toCreateReceitaBody(valores)).toMatchObject(esperado);
    expect(toUpdateReceitaBody(valores)).toMatchObject(esperado);
  });

  it('preenche as receitas salvas e o vendavel na edição', () => {
    expect(
      toReceitaFormInput(
        makeReceita({
          vendavel: false,
          receitas: [
            {
              receitaId: 5,
              nome: 'Brigadeiro preto',
              quantidade: 150,
              unidade: 'G',
              custoUnitario: 0.035,
              custoCalculado: 5.25,
            },
            { receitaId: 7, nome: 'Brownie', quantidade: 0.5, unidade: 'UN' },
          ],
        }),
      ),
    ).toMatchObject({
      vendavel: false,
      receitas: [
        { receita_id: 5, quantidade: '150' },
        { receita_id: 7, quantidade: '0,5' },
      ],
    });
  });

  it('o formulário vazio começa vendendo sozinha e sem receitas', () => {
    expect(receitaFormVazio).toMatchObject({ vendavel: true, receitas: [] });
  });

  it('o diálogo exige a receita e a quantidade maior que zero', () => {
    expect(
      novaReceitaSchema.parse({ receita_id: '5', quantidade: '150' }),
    ).toEqual({ receita_id: 5, quantidade: 150 });
    const result = novaReceitaSchema.safeParse({
      receita_id: null,
      quantidade: '0',
    });
    expect(
      result.error?.issues.map((issue) => [issue.path[0], issue.message]),
    ).toEqual([
      ['receita_id', 'Obrigatório'],
      ['quantidade', 'Obrigatório'],
    ]);
  });

  it('troca a mensagem dos erros novos pelo code e deixa os outros como estão', () => {
    const casos = [
      [422, 'RECEITA_USA_ELA_MESMA', /dentro dela mesma/],
      [422, 'RECEITA_DENTRO_DE_RECEITA_COM_RECEITA', /só de ingredientes/],
      [409, 'RECEITA_EM_USO', /unidade do rendimento não pode mudar/],
    ] as const;
    for (const [statusCode, code, mensagem] of casos) {
      const traduzido = traduzirErroDaReceita(
        new ApiError({ statusCode, code, mensagens: ['texto do backend'] }),
      );
      expect(traduzido).toBeInstanceOf(ApiError);
      expect((traduzido as ApiError).code).toBe(code);
      expect((traduzido as ApiError).message).toMatch(mensagem);
    }
    const outro = new ApiError({
      statusCode: 404,
      code: 'INSUMO_NAO_ENCONTRADO',
    });
    expect(traduzirErroDaReceita(outro)).toBe(outro);
    const rede = new Error('falhou');
    expect(traduzirErroDaReceita(rede)).toBe(rede);
  });
});
