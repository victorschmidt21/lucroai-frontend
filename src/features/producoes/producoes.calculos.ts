import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import { arredondarCentavos } from '@/shared/format/moeda';

// Fórmulas de `producoes/domain/producoes.calculos.ts` e
// `gastos-indiretos/domain/gastos-indiretos.calculos.ts` do monolito (BE-26,
// BE-30), repetidas na prévia do formulário: docs/business-rules.md#produções-e-rateio.
// O valor gravado é o do backend.

/** `totalUnidades = lotes × receita.rendimento`. */
export function calcularTotalUnidades(lotes: number, rendimento: number) {
  return lotes * rendimento;
}

/** Uso de forno da produção: o `usoPorLote` da receita e a capacidade do mês. */
export type UsoDoForno = {
  /** Fornadas (ou minutos de forno) de 1 lote; 1 se a receita não informar. */
  usoPorLote: number;
  /** `capacidadeMensal` da configuração de custos, sempre > 0. */
  capacidadeMensal: number;
};

/**
 * Parte de um gasto na produção, com 2 casas, como a resposta do backend:
 * só a conta do mês (`MENSAL`) entra, com
 * `valor × usoPorLote × lotes ÷ capacidadeMensal`. Os gastos por unidade e
 * os percentuais da venda ficam no custo da receita e da venda: 0 aqui.
 */
export function calcularValorRateado(
  gasto: Pick<GastoIndireto, 'valor' | 'tipo'>,
  lotes: number,
  { usoPorLote, capacidadeMensal }: UsoDoForno,
) {
  if (gasto.tipo !== 'MENSAL') return 0;

  return arredondarCentavos(
    (gasto.valor * usoPorLote * lotes) / capacidadeMensal,
  );
}

export type RateioEstimado = { gasto: GastoIndireto; valorRateado: number };

/**
 * Prévia: total de unidades, a parte de cada conta do mês e a soma delas.
 * Sem a configuração de custos (`uso` ausente), não estima as contas.
 */
export function calcularPreviaProducao(
  gastos: readonly GastoIndireto[],
  lotes: number,
  rendimento: number,
  uso: UsoDoForno | undefined,
) {
  const totalUnidades = calcularTotalUnidades(lotes, rendimento);
  const rateios: RateioEstimado[] = uso
    ? gastos
        .filter((gasto) => gasto.tipo === 'MENSAL')
        .map((gasto) => ({
          gasto,
          valorRateado: calcularValorRateado(gasto, lotes, uso),
        }))
    : [];
  const totalRateio = arredondarCentavos(
    rateios.reduce((total, rateio) => total + rateio.valorRateado, 0),
  );

  return { totalUnidades, rateios, totalRateio };
}
