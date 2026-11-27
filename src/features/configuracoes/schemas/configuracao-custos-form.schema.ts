import { z } from 'zod';
import type {
  ConfiguracaoCustos,
  UpdateConfiguracaoCustosBody,
} from '@/shared/api/contracts/pricing';
import { baseRateioSchema } from '@/shared/api/contracts/enums';
import { formatNumeroEditavel, numeroBR } from '@/shared/format/numero-br';
import { percentualDaApi, percentualDaTela } from '../configuracoes.calculos';
import { campoPercentual } from './percentual';

const CAPACIDADE_INVALIDA = 'Informe um número maior que zero';
export const VALOR_HORA_INVALIDO = 'Informe um valor de R$ 0,00 ou mais';

/**
 * Limites de `validarConfiguracaoCustos` (BE-24, BE-45): capacidade > 0,
 * percentuais de 0 a 100 e valor da hora ≥ 0.
 */
export const configuracaoCustosFormSchema = z.object({
  baseRateio: baseRateioSchema,
  capacidadeMensal: numeroBR(
    z.number({ error: CAPACIDADE_INVALIDA }).positive(CAPACIDADE_INVALIDA),
  ),
  lucroPadrao: campoPercentual(),
  impostoPercentual: campoPercentual(),
  taxaMaquininha: campoPercentual(),
  valorHora: numeroBR(
    z.number({ error: VALOR_HORA_INVALIDO }).min(0, VALOR_HORA_INVALIDO),
  ),
});

export type ConfiguracaoCustosFormInput = z.input<
  typeof configuracaoCustosFormSchema
>;
export type ConfiguracaoCustosFormValues = z.output<
  typeof configuracaoCustosFormSchema
>;

export function toConfiguracaoCustosFormInput(
  config: ConfiguracaoCustos,
): ConfiguracaoCustosFormInput {
  return {
    baseRateio: config.baseRateio,
    capacidadeMensal: formatNumeroEditavel(config.capacidadeMensal),
    lucroPadrao: percentualDaApi(config.lucroPadrao),
    impostoPercentual: percentualDaApi(config.impostoPercentual),
    taxaMaquininha: percentualDaApi(config.taxaMaquininha),
    valorHora: formatNumeroEditavel(config.valorHora, 2),
  };
}

/** Envia os seis campos, com os percentuais em fração do preço e a hora em reais. */
export function toUpdateConfiguracaoCustosBody(
  values: ConfiguracaoCustosFormValues,
): UpdateConfiguracaoCustosBody {
  return {
    baseRateio: values.baseRateio,
    capacidadeMensal: values.capacidadeMensal,
    lucroPadrao: percentualDaTela(values.lucroPadrao),
    impostoPercentual: percentualDaTela(values.impostoPercentual),
    taxaMaquininha: percentualDaTela(values.taxaMaquininha),
    valorHora: values.valorHora,
  };
}
