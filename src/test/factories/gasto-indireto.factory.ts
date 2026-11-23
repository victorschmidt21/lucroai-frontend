import type { GastoIndireto } from '@/shared/api/contracts/catalog';

/** Energia Elétrica do seed (R$ 450,00 por mês). */
export function makeGastoIndireto(
  overrides: Partial<GastoIndireto> = {},
): GastoIndireto {
  return {
    id: 1,
    empresaId: 1,
    descricao: 'Energia Elétrica',
    valor: 450,
    tipo: 'MENSAL',
    ...overrides,
  };
}

/** Os 5 gastos do seed, na ordem do backend (`id` decrescente). */
export function makeGastosDoSeed(): GastoIndireto[] {
  return [
    makeGastoIndireto({
      id: 5,
      descricao: 'Saquinho de Papel',
      valor: 0.05,
      tipo: 'POR_UNIDADE',
    }),
    makeGastoIndireto({ id: 4, descricao: 'DAS do MEI', valor: 80 }),
    makeGastoIndireto({ id: 3, descricao: 'Gás de Cozinha (P45)', valor: 185 }),
    makeGastoIndireto({ id: 2, descricao: 'Aluguel do Espaço', valor: 1800 }),
    makeGastoIndireto(),
  ];
}
