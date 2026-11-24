import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import { calcularTotalContasDoMes } from '@/shared/domain/contas-do-mes';
import { formatMoeda } from '@/shared/format/moeda';
import { fracaoParaPercentual, formatQuantidade } from '@/shared/format/numero';

type GastoParaTotal = Pick<GastoIndireto, 'valor' | 'tipo'>;

// `calcularTotalContasDoMes` fica em `shared/domain/contas-do-mes.ts`, porque
// a fornada e a Pitada (FE-65) também usam.
export { calcularTotalContasDoMes };

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
