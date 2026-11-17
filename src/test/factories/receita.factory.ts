import type {
  PrecoVenda,
  Receita,
  ReceitaCusto,
  SimulacaoCenario,
} from '@/shared/api/contracts/recipe';

/** Pão Francês do seed (50 un, margem 60%, custo 3,31, unitário 0,07, preço 0,11). */
export function makeReceita(overrides: Partial<Receita> = {}): Receita {
  return {
    id: 1,
    empresaId: 1,
    nome: 'Pão Francês',
    rendimento: 50,
    unidadeRendimento: 'UN',
    custoProducao: 3.31,
    custoUnitario: 0.07,
    margemLucro: 0.6,
    precoSugerido: 0.11,
    dataCriacao: '2026-06-01T10:00:00.000Z',
    itens: [
      { insumoId: 1, quantidade: 1, custoCalculado: 3 },
      { insumoId: 8, quantidade: 0.02, custoCalculado: 0.05 },
      { insumoId: 6, quantidade: 15, custoCalculado: 0.26 },
    ],
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
      margemLucro: 0.55,
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
      margemLucro: 0.6,
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
      margemLucro: 0.5,
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

export function makeSimulacaoCenario(
  overrides: Partial<SimulacaoCenario> = {},
): SimulacaoCenario {
  return {
    custoUnitario: 0.07,
    precoVenda: 0.11,
    volume: 50,
    lucroEstimado: 2,
    margemProjetada: 0.36,
    breakEven: 0,
    ...overrides,
  };
}

export function makePrecoVenda(
  overrides: Partial<PrecoVenda> = {},
): PrecoVenda {
  return {
    custo_total_unitario: 0.07,
    preco_sugerido: 0.112,
    lucro_por_unidade: 0.042,
    ...overrides,
  };
}
