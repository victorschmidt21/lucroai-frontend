import { z } from 'zod';
import type { CreateProducaoBody } from '@/shared/api/contracts/operations';
import { inteiroBR } from '@/shared/format/numero-br';

// Origem: `_RegistrarProducaoSheet` de producoes_page.dart e `create-producao.dto.ts`
// (`receita_id` e `quantidade` inteiros positivos, `gasto_indireto_ids` opcional).
const RECEITA = 'Selecione uma receita';
const LOTES = 'Informe a quantidade de lotes';

export const producaoFormSchema = z.object({
  /** Valor do `<select>`: o id em texto. */
  receitaId: z
    .string()
    .trim()
    .min(1, RECEITA)
    .transform(Number)
    .pipe(z.number({ error: RECEITA }).int(RECEITA).positive(RECEITA)),
  quantidade: inteiroBR(z.number({ error: LOTES }).int(LOTES).positive(LOTES)),
  /** Chip "Todos": o backend rateia todos os gastos da empresa. */
  todosGastos: z.boolean(),
  gastoIndiretoIds: z.array(z.number().int().positive()),
});

export type ProducaoFormInput = z.input<typeof producaoFormSchema>;
export type ProducaoFormValues = z.output<typeof producaoFormSchema>;

/** "Todos" marcado por padrão; a receita do filtro da lista já vem escolhida. */
export function producaoFormVazio(receitaId?: number): ProducaoFormInput {
  return {
    receitaId: receitaId ? String(receitaId) : '',
    quantidade: '',
    todosGastos: true,
    gastoIndiretoIds: [],
  };
}

/**
 * Com "Todos", `gasto_indireto_ids` não é enviado. Com uma seleção, vão os ids
 * escolhidos; seleção vazia envia `[]` (nenhum rateio), como o mobile.
 */
export function toCreateProducaoBody(
  values: ProducaoFormValues,
): CreateProducaoBody {
  const body: CreateProducaoBody = {
    receita_id: values.receitaId,
    quantidade: values.quantidade,
  };

  if (!values.todosGastos) body.gasto_indireto_ids = values.gastoIndiretoIds;

  return body;
}
