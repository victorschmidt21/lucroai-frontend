import type {
  ComposicaoPreco,
  CustoReceitaDetalhe,
  PrecoCanal,
  Receita,
  ReceitaCusto,
  SimulacaoCenario,
} from '@/shared/api/contracts/recipe';

/**
 * Custo de 1 unidade do Pão Francês do seed (`GET /receitas/:id`, BE-28):
 * 0,3848 = ingredientes + contas do mês + gastos por unidade + perdas.
 */
export function makeCustoReceitaDetalhe(
  overrides: Partial<CustoReceitaDetalhe> = {},
): CustoReceitaDetalhe {
  return {
    ingredientesLote: 3.81,
    gastosMensaisLote: 5.03,
    trabalhoLote: 0,
    ingredientes: 0.1359,
    gastosMensais: 0.1796,
    trabalho: 0,
    gastosPorUnidade: 0.05,
    embalagem: 0,
    perdas: 0.0192,
    unitario: 0.3848,
    ...overrides,
  };
}

/** Composição do preço do Pão Francês no Balcão (lucro de 15%, maquininha de 1,36%). */
export function makeComposicaoPreco(
  overrides: Partial<ComposicaoPreco> = {},
): ComposicaoPreco {
  return {
    ingredientes: { valor: 0.1359, fracao: 0.2954 },
    gastosMensais: { valor: 0.1796, fracao: 0.3905 },
    trabalho: { valor: 0, fracao: 0 },
    gastosPorUnidade: { valor: 0.05, fracao: 0.1087 },
    embalagem: { valor: 0, fracao: 0 },
    perdas: { valor: 0.0192, fracao: 0.0418 },
    imposto: { valor: 0, fracao: 0 },
    taxaCanal: { valor: 0.0063, fracao: 0.0136 },
    gastosPercentuais: { valor: 0, fracao: 0 },
    lucro: { valor: 0.069, fracao: 0.15 },
    ...overrides,
  };
}

/** Preço do Pão Francês do seed no Balcão. */
export function makePrecoCanal(
  overrides: Partial<PrecoCanal> = {},
): PrecoCanal {
  return {
    canalId: 1,
    canal: 'Balcão',
    balcao: true,
    percentuais: 0.1636,
    preco: 0.46,
    motivo: null,
    composicao: makeComposicaoPreco(),
    ...overrides,
  };
}

/** Pão Francês do seed (50 un, custo 3,31, unitário 0,07, preço 0,11). */
export function makeReceita(overrides: Partial<Receita> = {}): Receita {
  return {
    id: 1,
    empresaId: 1,
    nome: 'Pão Francês',
    rendimento: 50,
    unidadeRendimento: 'UN',
    usoPorLote: 1,
    embalagemPorUnidade: 0,
    perdaPercentual: 0,
    minutosTrabalhoPorLote: 0,
    custoProducao: 3.31,
    custoUnitario: 0.07,
    precoSugerido: 0.11,
    vendavel: true,
    dataCriacao: '2026-06-01T10:00:00.000Z',
    itens: [
      { insumoId: 1, quantidade: 1, custoCalculado: 3 },
      { insumoId: 8, quantidade: 0.02, custoCalculado: 0.05 },
      { insumoId: 6, quantidade: 15, custoCalculado: 0.26 },
    ],
    receitas: [],
    usadaEm: [],
    custo: makeCustoReceitaDetalhe(),
    precos: [makePrecoCanal()],
    ...overrides,
  };
}

/** As 4 receitas do seed, na ordem do backend (`dataCriacao` decrescente). */
export function makeReceitasDoSeed(): Receita[] {
  return [
    makeReceita({
      id: 4,
      nome: 'Quindim',
      rendimento: 12,
      custoProducao: 10.8,
      custoUnitario: 0.9,
      precoSugerido: 1.4,
      dataCriacao: '2026-06-01T10:03:00.000Z',
      itens: [
        { insumoId: 2, quantidade: 0.3, custoCalculado: 1.32 },
        { insumoId: 4, quantidade: 6, custoCalculado: 4.5 },
        { insumoId: 11, quantidade: 100, custoCalculado: 4.5 },
      ],
    }),
    makeReceita({
      id: 3,
      nome: 'Brigadeiro Gourmet',
      rendimento: 40,
      custoProducao: 15.48,
      custoUnitario: 0.39,
      precoSugerido: 0.62,
      dataCriacao: '2026-06-01T10:02:00.000Z',
      itens: [
        { insumoId: 10, quantidade: 0.3, custoCalculado: 10.5 },
        { insumoId: 9, quantidade: 100, custoCalculado: 2.75 },
        { insumoId: 3, quantidade: 20, custoCalculado: 0.48 },
        { insumoId: 12, quantidade: 50, custoCalculado: 1.75 },
      ],
    }),
    makeReceita({
      id: 2,
      nome: 'Bolo de Chocolate',
      rendimento: 12,
      custoProducao: 9.7,
      custoUnitario: 0.81,
      precoSugerido: 1.22,
      dataCriacao: '2026-06-01T10:01:00.000Z',
      itens: [
        { insumoId: 1, quantidade: 0.25, custoCalculado: 0.75 },
        { insumoId: 2, quantidade: 0.2, custoCalculado: 0.88 },
        { insumoId: 3, quantidade: 100, custoCalculado: 2.4 },
        { insumoId: 4, quantidade: 3, custoCalculado: 2.25 },
        { insumoId: 5, quantidade: 0.2, custoCalculado: 1 },
        { insumoId: 7, quantidade: 50, custoCalculado: 2.25 },
        { insumoId: 6, quantidade: 10, custoCalculado: 0.17 },
      ],
    }),
    makeReceita(),
  ];
}

export function makeReceitaCusto(
  overrides: Partial<ReceitaCusto> = {},
): ReceitaCusto {
  return {
    quantidade_lotes: 1,
    total_unidades: 50,
    custo_invisivel: 0,
    custo_total_producao: 3.31,
    custo_por_unidade: 0.07,
    ...overrides,
  };
}

/** Pão Francês do seed simulado no Balcão pelo preço sugerido (BE-31). */
export function makeSimulacaoCenario(
  overrides: Partial<SimulacaoCenario> = {},
): SimulacaoCenario {
  return {
    canalId: 1,
    canal: 'Balcão',
    custoUnitario: 0.3848,
    custoSemGastosMensais: 0.1957,
    percentuaisSemLucro: 0.0136,
    precoVenda: 0.46,
    volume: 28,
    margemContribuicao: 0.2581,
    lucroPorUnidade: 0.069,
    lucroReal: 0.15,
    lucroMes: 1.93,
    gastosMensais: 2515,
    pontoEquilibrio: { unidades: 9745, motivo: null },
    ...overrides,
  };
}
