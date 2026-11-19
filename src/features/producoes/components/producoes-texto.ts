import type { Producao } from '@/shared/api/contracts/operations';
import { formatData } from '@/shared/format/data';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero } from '@/shared/format/numero';
import { SEM_VALOR } from '@/shared/format/texto';

/** "1 lote · 02/06/2026" / "3 lotes · 02/06/2026" (`_ProducaoCard` do mobile). */
export function descricaoDosLotes(producao: Producao) {
  const lotes = producao.quantidade === 1 ? 'lote' : 'lotes';
  return `${formatNumero(producao.quantidade)} ${lotes} · ${formatData(producao.dataProducao)}`;
}

/** "R$ 0,19/un"; sem valor, `—`. */
export function formatCustoPorUnidade(valor: number | null) {
  return valor === null ? SEM_VALOR : `${formatMoeda(valor)}/un`;
}
