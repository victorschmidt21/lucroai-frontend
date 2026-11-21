import { z } from 'zod';
import type { AtualizarMinimoEstoqueBody } from '@/shared/api/contracts/operations';
import { formatNumeroEditavel, numeroBR } from '@/shared/format/numero-br';

// `AtualizarMinimoEstoqueDto` da API: `quantidadeMinima ≥ 0` (lacuna 14, resolvida).
const MINIMO_INVALIDO = 'Digite uma quantidade válida';

export const estoqueMinimoSchema = z.object({
  quantidadeMinima: numeroBR(
    z.number({ error: MINIMO_INVALIDO }).min(0, MINIMO_INVALIDO),
  ),
});

export type EstoqueMinimoInput = z.input<typeof estoqueMinimoSchema>;
export type EstoqueMinimoValues = z.output<typeof estoqueMinimoSchema>;

/** O campo começa com o mínimo atual. */
export function estoqueMinimoInicial(
  quantidadeMinima: number,
): EstoqueMinimoInput {
  return { quantidadeMinima: formatNumeroEditavel(quantidadeMinima) };
}

export function toAtualizarMinimoBody(
  values: EstoqueMinimoValues,
): AtualizarMinimoEstoqueBody {
  return { quantidadeMinima: values.quantidadeMinima };
}
