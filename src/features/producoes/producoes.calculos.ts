import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import { arredondarCentavos } from '@/shared/format/moeda';

// Fórmulas de `producao.service.ts` (operations-service), repetidas na prévia do
// formulário: docs/business-rules.md#produções-e-rateio. O valor gravado é o do backend.

/** `totalUnidades = lotes × receita.rendimento`. */
export function calcularTotalUnidades(lotes: number, rendimento: number) {
  return lotes * rendimento;
}

/** `calcularValorRateado` do backend, com o mesmo arredondamento a centavos. */
export function calcularValorRateado(
  gasto: Pick<GastoIndireto, 'valor' | 'metodoRateio'>,
  lotes: number,
  totalUnidades: number,
) {
  switch (gasto.metodoRateio) {
    case 'POR_UNIDADE':
      return arredondarCentavos(gasto.valor * totalUnidades);
    case 'PROPORCIONAL':
      return arredondarCentavos(gasto.valor * lotes);
    case 'FIXO':
    default:
      return arredondarCentavos(gasto.valor);
  }
}

export type RateioEstimado = { gasto: GastoIndireto; valorRateado: number };

/** Prévia: total de unidades, rateio estimado de cada gasto e a soma dos rateios. */
export function calcularPreviaProducao(
  gastos: readonly GastoIndireto[],
  lotes: number,
  rendimento: number,
) {
  const totalUnidades = calcularTotalUnidades(lotes, rendimento);
  const rateios: RateioEstimado[] = gastos.map((gasto) => ({
    gasto,
    valorRateado: calcularValorRateado(gasto, lotes, totalUnidades),
  }));
  const totalRateio = arredondarCentavos(
    rateios.reduce((total, rateio) => total + rateio.valorRateado, 0),
  );

  return { totalUnidades, rateios, totalRateio };
}
