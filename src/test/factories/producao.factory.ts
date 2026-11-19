import type { Producao } from '@/shared/api/contracts/operations';

/** Produção de 3 lotes de Pão Francês do seed (custo 28,28, unitário 0,19). */
export function makeProducao(overrides: Partial<Producao> = {}): Producao {
  return {
    id: 1,
    receitaId: 1,
    empresaId: 1,
    quantidade: 3,
    custoTotal: 28.28,
    custoUnitario: 0.19,
    dataProducao: '2026-06-02T10:00:00.000Z',
    rateios: [
      { gastoIndiretoId: 1, valorRateado: 4.5 },
      { gastoIndiretoId: 2, valorRateado: 9 },
      { gastoIndiretoId: 3, valorRateado: 1.85 },
      { gastoIndiretoId: 4, valorRateado: 3 },
    ],
    ...overrides,
  };
}
