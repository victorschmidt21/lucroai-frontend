import { z } from 'zod';
import type {
  CreateGastoIndiretoBody,
  GastoIndireto,
  UpdateGastoIndiretoBody,
} from '@/shared/api/contracts/catalog';
import { tipoGastoSchema } from '@/shared/api/contracts/enums';
import {
  fracaoParaPercentual,
  percentualParaFracao,
} from '@/shared/format/numero';
import { formatNumeroEditavel, numeroBR } from '@/shared/format/numero-br';

const DESCRICAO_OBRIGATORIA = 'Informe a descrição';
const DESCRICAO_LONGA = 'Use até 100 caracteres';
const VALOR = 'Informe um valor válido';
export const PERCENTUAL_INVALIDO =
  'Informe um percentual maior que 0 e menor que 100';

/** `@MaxLength(100)` de `create-gasto-indireto.dto.ts`. */
export const DESCRICAO_MAX = 100;

/**
 * O `valor` é digitado na unidade do tipo: reais por mês (`MENSAL`), reais por
 * unidade (`POR_UNIDADE`) ou percentual da venda (`PERCENTUAL_VENDA`, de 0 a
 * 100 exclusive, porque a API exige fração menor que 1, `validarGasto`). O
 * backend aceita valor 0; a FE-10 pede > 0, e a web mantém.
 */
export const gastoIndiretoFormSchema = z
  .object({
    descricao: z
      .string()
      .trim()
      .min(1, DESCRICAO_OBRIGATORIA)
      .max(DESCRICAO_MAX, DESCRICAO_LONGA),
    tipo: tipoGastoSchema,
    valor: numeroBR(z.number({ error: VALOR }).positive(VALOR)),
  })
  .superRefine((values, ctx) => {
    if (values.tipo === 'PERCENTUAL_VENDA' && values.valor >= 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['valor'],
        message: PERCENTUAL_INVALIDO,
      });
    }
  });

export type GastoIndiretoFormInput = z.input<typeof gastoIndiretoFormSchema>;
export type GastoIndiretoFormValues = z.output<typeof gastoIndiretoFormSchema>;

/** O tipo padrão é a conta do mês, o caso mais comum (aluguel, luz, gás). */
export const gastoIndiretoFormVazio: GastoIndiretoFormInput = {
  descricao: '',
  tipo: 'MENSAL',
  valor: '',
};

/** Na edição, o percentual da venda volta da fração da API (`0.12` → `12`). */
export function toGastoIndiretoFormInput(
  gasto: GastoIndireto,
): GastoIndiretoFormInput {
  return {
    descricao: gasto.descricao,
    tipo: gasto.tipo,
    valor:
      gasto.tipo === 'PERCENTUAL_VENDA'
        ? formatNumeroEditavel(fracaoParaPercentual(gasto.valor))
        : formatNumeroEditavel(gasto.valor, 2),
  };
}

/** Valor na unidade da API: o percentual digitado vira fração do preço. */
function valorDaApi({ tipo, valor }: GastoIndiretoFormValues) {
  return tipo === 'PERCENTUAL_VENDA' ? percentualParaFracao(valor) : valor;
}

/** Envia o `tipo`, sem o `metodo_rateio` legado (BE-26). */
export function toCreateGastoIndiretoBody(
  values: GastoIndiretoFormValues,
): CreateGastoIndiretoBody {
  return {
    descricao: values.descricao,
    valor: valorDaApi(values),
    tipo: values.tipo,
  };
}

/** O PUT aceita campos opcionais; a web envia os três, como o mobile. */
export function toUpdateGastoIndiretoBody(
  values: GastoIndiretoFormValues,
): UpdateGastoIndiretoBody {
  return toCreateGastoIndiretoBody(values);
}
