import { z } from 'zod';
import type {
  CreateGastoIndiretoBody,
  GastoIndireto,
  UpdateGastoIndiretoBody,
} from '@/shared/api/contracts/catalog';
import { metodoRateioSchema } from '@/shared/api/contracts/enums';
import { formatNumeroEditavel, numeroBR } from '@/shared/format/numero-br';

const DESCRICAO_OBRIGATORIA = 'Informe a descrição';
const DESCRICAO_LONGA = 'Use até 100 caracteres';
const VALOR = 'Informe um valor válido';

/** `@MaxLength(100)` de `create-gasto-indireto.dto.ts`. */
export const DESCRICAO_MAX = 100;

// O backend e o mobile aceitam valor 0; a FE-10 pede > 0.
export const gastoIndiretoFormSchema = z.object({
  descricao: z
    .string()
    .trim()
    .min(1, DESCRICAO_OBRIGATORIA)
    .max(DESCRICAO_MAX, DESCRICAO_LONGA),
  valor: numeroBR(z.number({ error: VALOR }).positive(VALOR)),
  metodo_rateio: metodoRateioSchema,
});

export type GastoIndiretoFormInput = z.input<typeof gastoIndiretoFormSchema>;
export type GastoIndiretoFormValues = z.output<typeof gastoIndiretoFormSchema>;

/** O método padrão é `FIXO`, como no mobile (`MetodoRateio.fixo`). */
export const gastoIndiretoFormVazio: GastoIndiretoFormInput = {
  descricao: '',
  valor: '',
  metodo_rateio: 'FIXO',
};

export function toGastoIndiretoFormInput(
  gasto: GastoIndireto,
): GastoIndiretoFormInput {
  return {
    descricao: gasto.descricao,
    valor: formatNumeroEditavel(gasto.valor, 2),
    metodo_rateio: gasto.metodoRateio,
  };
}

export function toCreateGastoIndiretoBody(
  values: GastoIndiretoFormValues,
): CreateGastoIndiretoBody {
  return values;
}

/** O PUT aceita campos opcionais; a web envia os três, como o mobile. */
export function toUpdateGastoIndiretoBody(
  values: GastoIndiretoFormValues,
): UpdateGastoIndiretoBody {
  return values;
}
