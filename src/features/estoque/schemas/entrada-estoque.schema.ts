import { z } from 'zod';
import type { RegistrarEntradaEstoqueBody } from '@/shared/api/contracts/operations';
import { numeroBR } from '@/shared/format/numero-br';

// Origem: `_registrarEntrada` de registrar_entrada_modal.dart (`quantidade > 0`) e
// `@Min(0.000001)` de registrar-entrada-estoque.dto.ts. Sem "Observação": o DTO
// não tem o campo e o backend rejeita campos extras.
const QUANTIDADE_INVALIDA = 'Digite uma quantidade válida';

export const entradaEstoqueSchema = z.object({
  quantidade: numeroBR(
    z.number({ error: QUANTIDADE_INVALIDA }).positive(QUANTIDADE_INVALIDA),
  ),
});

export type EntradaEstoqueInput = z.input<typeof entradaEstoqueSchema>;
export type EntradaEstoqueValues = z.output<typeof entradaEstoqueSchema>;

export const entradaEstoqueVazia: EntradaEstoqueInput = { quantidade: '' };

export function toRegistrarEntradaBody(
  values: EntradaEstoqueValues,
): RegistrarEntradaEstoqueBody {
  return { quantidade: values.quantidade };
}

/** Prévia "Saldo após a entrada", sem o ruído de ponto flutuante (0,1 + 0,2). */
export function saldoAposEntrada(
  quantidadeDisponivel: number,
  quantidade: number,
) {
  return Number((quantidadeDisponivel + quantidade).toFixed(6));
}
