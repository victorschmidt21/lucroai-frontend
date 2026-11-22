import { z } from 'zod';
import type { CreateCompraInsumoBody } from '@/shared/api/contracts/catalog';
import { numeroBR } from '@/shared/format/numero-br';

// `CreateCompraInsumoDto` (BE-29): `quantidade ≥ 0.000001`, `valorTotal ≥ 0` e
// `observacao` opcional com até 200 caracteres, aparada. Como no cadastro do
// insumo, a web pede valor maior que zero.
const QUANTIDADE = 'Informe uma quantidade maior que zero';
const VALOR = 'Informe um valor maior que zero';
export const OBSERVACAO_COMPRA_MAX = 200;

export const compraInsumoSchema = z.object({
  quantidade: numeroBR(z.number({ error: QUANTIDADE }).positive(QUANTIDADE)),
  valorTotal: numeroBR(z.number({ error: VALOR }).positive(VALOR)),
  observacao: z
    .string()
    .trim()
    .max(OBSERVACAO_COMPRA_MAX, `Use até ${OBSERVACAO_COMPRA_MAX} caracteres`),
});

export type CompraInsumoInput = z.input<typeof compraInsumoSchema>;
export type CompraInsumoValues = z.output<typeof compraInsumoSchema>;

export const compraInsumoVazia: CompraInsumoInput = {
  quantidade: '',
  valorTotal: '',
  observacao: '',
};

/** Observação vazia não é enviada. */
export function toCreateCompraInsumoBody(
  values: CompraInsumoValues,
): CreateCompraInsumoBody {
  return {
    quantidade: values.quantidade,
    valorTotal: values.valorTotal,
    ...(values.observacao ? { observacao: values.observacao } : {}),
  };
}
