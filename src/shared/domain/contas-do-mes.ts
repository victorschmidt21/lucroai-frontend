import type { GastoIndireto } from '@/shared/api/contracts/catalog';

type GastoParaTotal = Pick<GastoIndireto, 'valor' | 'tipo'>;

/**
 * Total das contas do mês: soma só os gastos `MENSAL`, sem arredondamento
 * (docs/business-rules.md#total). Os outros tipos têm outra unidade (reais por
 * unidade, percentual da venda) e não entram na soma (FE-42).
 */
export function calcularTotalContasDoMes(gastos: readonly GastoParaTotal[]) {
  return gastos
    .filter((gasto) => gasto.tipo === 'MENSAL')
    .reduce((total, gasto) => total + gasto.valor, 0);
}
