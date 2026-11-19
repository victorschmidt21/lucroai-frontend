/**
 * Custo por unidade de medida do insumo, sem arredondamento.
 * Origem: lib/features/insumos/domain/services/insumo_custo_calculator.dart
 * e Insumo.calcularCustoUnitario no catalog-service (docs/business-rules.md#insumos).
 */
export function calcularCustoUnitario(valorPago: number, quantidade: number) {
  return quantidade > 0 ? valorPago / quantidade : 0;
}
