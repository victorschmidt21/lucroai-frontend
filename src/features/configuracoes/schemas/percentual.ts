import { z } from 'zod';
import { numeroBR } from '@/shared/format/numero-br';

export const PERCENTUAL_INVALIDO = 'Informe um percentual de 0 a 100';

/**
 * Percentual digitado na tela (`15,2`), de 0 a 100. A fração da API (0 a 1) é
 * calculada no `to...Body`, com `percentualDaTela`.
 */
export function campoPercentual() {
  return numeroBR(
    z
      .number({ error: PERCENTUAL_INVALIDO })
      .min(0, PERCENTUAL_INVALIDO)
      .max(100, PERCENTUAL_INVALIDO),
  );
}
