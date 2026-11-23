import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import { formatMoeda } from '@/shared/format/moeda';
import { fracaoParaPercentual, formatQuantidade } from '@/shared/format/numero';

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

/**
 * Valor com a unidade do tipo: `R$ 1.800,00 por mês`, `R$ 0,05 por unidade`
 * ou `12% da venda` (a API guarda o percentual como fração, `0.12`).
 */
export function formatValorDoGasto({ valor, tipo }: GastoParaTotal) {
  switch (tipo) {
    case 'MENSAL':
      return `${formatMoeda(valor)} por mês`;
    case 'POR_UNIDADE':
      return `${formatMoeda(valor)} por unidade`;
    case 'PERCENTUAL_VENDA':
      return `${formatQuantidade(fracaoParaPercentual(valor))}% da venda`;
  }
}
