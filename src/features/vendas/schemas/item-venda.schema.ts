import { z } from 'zod';
import type { CreateVendaBody } from '@/shared/api/contracts/sales';
import { arredondarCentavos } from '@/shared/format/moeda';
import { inteiroBR, numeroBR } from '@/shared/format/numero-br';

// Origem: `_buildAddItemForm` de vendas_page.dart e `create-venda.dto.ts`
// (`receita_id` e `quantidade` inteiros positivos, preço positivo com 2 casas).
const PRODUTO = 'Selecione um produto';
const QUANTIDADE = 'Informe a quantidade';
const PRECO = 'Informe o preço';

export const itemVendaFormSchema = z.object({
  /** Valor do `<select>`: o id da receita em texto. */
  receitaId: z
    .string()
    .trim()
    .min(1, PRODUTO)
    .transform(Number)
    .pipe(z.number({ error: PRODUTO }).int(PRODUTO).positive(PRODUTO)),
  quantidade: inteiroBR(
    z.number({ error: QUANTIDADE }).int(QUANTIDADE).positive(QUANTIDADE),
  ),
  /** Arredondado a centavos antes de validar: o backend aceita só 2 casas. */
  precoUnitario: numeroBR(
    z
      .number({ error: PRECO })
      .transform(arredondarCentavos)
      .pipe(z.number().positive(PRECO)),
  ),
});

export type ItemVendaFormInput = z.input<typeof itemVendaFormSchema>;
export type ItemVendaFormValues = z.output<typeof itemVendaFormSchema>;

export function itemVendaFormVazio(): ItemVendaFormInput {
  return { receitaId: '', quantidade: '', precoUnitario: '' };
}

/** Linha do carrinho: só no estado do componente, nunca no navegador. */
export type ItemCarrinho = ItemVendaFormValues & {
  /** Identifica a linha: a mesma receita pode aparecer mais de uma vez. */
  chave: number;
  nome: string;
};

export function toCreateVendaBody(
  itens: readonly ItemVendaFormValues[],
): CreateVendaBody {
  return {
    itens: itens.map((item) => ({
      receita_id: item.receitaId,
      quantidade: item.quantidade,
      preco_unitario_real: arredondarCentavos(item.precoUnitario),
    })),
  };
}
