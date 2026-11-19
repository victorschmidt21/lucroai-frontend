/**
 * Soma dos valores dos gastos, sem arredondamento (docs/business-rules.md#total).
 * Origem: `GastosIndiretosState.totalGastos` (gastos_indiretos_state.dart).
 */
export function calcularTotalGastos(gastos: readonly { valor: number }[]) {
  return gastos.reduce((total, gasto) => total + gasto.valor, 0);
}
