import type { GastoIndireto } from '@/shared/api/contracts/catalog';

/** Energia Elétrica do seed (R$ 450,00, proporcional aos lotes). */
export function makeGastoIndireto(
  overrides: Partial<GastoIndireto> = {},
): GastoIndireto {
  return {
    id: 1,
    empresaId: 1,
    descricao: 'Energia Elétrica',
    valor: 450,
    metodoRateio: 'PROPORCIONAL',
    ...overrides,
  };
}

/** Os 4 gastos do seed, na ordem do backend (`id` decrescente). */
export function makeGastosDoSeed(): GastoIndireto[] {
  return [
    makeGastoIndireto({
      id: 4,
      descricao: 'Material de Embalagem',
      valor: 120,
      metodoRateio: 'POR_UNIDADE',
    }),
    makeGastoIndireto({
      id: 3,
      descricao: 'Gás de Cozinha (P45)',
      valor: 185,
      metodoRateio: 'PROPORCIONAL',
    }),
    makeGastoIndireto({
      id: 2,
      descricao: 'Aluguel do Espaço',
      valor: 1800,
      metodoRateio: 'FIXO',
    }),
    makeGastoIndireto(),
  ];
}
