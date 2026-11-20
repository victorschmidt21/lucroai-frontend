import { z } from 'zod';
import type { RegistrarEntradaEstoqueBody } from '@/shared/api/contracts/operations';
import { numeroBR } from '@/shared/format/numero-br';

// Origem: `_registrarEntrada` de registrar_entrada_modal.dart (`quantidade > 0`) e
// `RegistrarEntradaEstoqueDto` da API (`quantidade ≥ 0.000001`, `observacao`
// opcional com até 200 caracteres, aparada).
const QUANTIDADE_INVALIDA = 'Digite uma quantidade válida';
export const OBSERVACAO_MAX = 200;

export const entradaEstoqueSchema = z.object({
  quantidade: numeroBR(
    z.number({ error: QUANTIDADE_INVALIDA }).positive(QUANTIDADE_INVALIDA),
  ),
  observacao: z
    .string()
    .trim()
    .max(OBSERVACAO_MAX, `Use até ${OBSERVACAO_MAX} caracteres`),
});

export type EntradaEstoqueInput = z.input<typeof entradaEstoqueSchema>;
export type EntradaEstoqueValues = z.output<typeof entradaEstoqueSchema>;

export const entradaEstoqueVazia: EntradaEstoqueInput = {
  quantidade: '',
  observacao: '',
};

/** Observação vazia não é enviada. */
export function toRegistrarEntradaBody(
  values: EntradaEstoqueValues,
): RegistrarEntradaEstoqueBody {
  return {
    quantidade: values.quantidade,
    ...(values.observacao ? { observacao: values.observacao } : {}),
  };
}

/** Prévia "Saldo após a entrada", sem o ruído de ponto flutuante (0,1 + 0,2). */
export function saldoAposEntrada(
  quantidadeDisponivel: number,
  quantidade: number,
) {
  return Number((quantidadeDisponivel + quantidade).toFixed(6));
}
