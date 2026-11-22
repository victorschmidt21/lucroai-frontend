import { z } from 'zod';
import type { CanalVenda } from '@/shared/api/contracts/pricing';
import type { Receita } from '@/shared/api/contracts/recipe';
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

/**
 * "Onde vendeu?" (FE-46): o valor do `<select>` é o id do canal em texto;
 * vazio (canais ainda carregando ou com erro) vira `null`, e a venda vai sem
 * `canal_id`, que o backend lê como Balcão.
 */
export const canalDaVendaSchema = z
  .string()
  .trim()
  .transform((valor) => (valor === '' ? null : Number(valor)))
  .pipe(z.number().int().positive().nullable())
  .catch(null);

/** Canais que aparecem em "Onde vendeu?": só os ativos, na ordem da API (Balcão primeiro). */
export function canaisParaVenda(canais: readonly CanalVenda[]) {
  return canais.filter((canal) => canal.ativo);
}

/** O canal padrão do formulário: o Balcão ativo; sem ele, o primeiro ativo. */
export function canalPadrao(canais: readonly CanalVenda[]) {
  const ativos = canaisParaVenda(canais);
  return (ativos.find((canal) => canal.balcao) ?? ativos[0])?.id ?? null;
}

/**
 * Preço sugerido da receita no canal da venda, de `receita.precos` (BE-28);
 * sem canal, o do Balcão. `null` quando o canal não tem preço possível
 * (o campo fica vazio, e a pessoa digita o preço).
 */
export function precoSugeridoNoCanal(
  receita: Pick<Receita, 'precos'>,
  canalId: number | null,
) {
  const preco = receita.precos.find((p) =>
    canalId === null ? p.balcao : p.canalId === canalId,
  )?.preco;
  return preco !== undefined && preco !== null && preco > 0 ? preco : null;
}

export function toCreateVendaBody(
  itens: readonly ItemVendaFormValues[],
  canalId: number | null = null,
): CreateVendaBody {
  return {
    ...(canalId === null ? {} : { canal_id: canalId }),
    itens: itens.map((item) => ({
      receita_id: item.receitaId,
      quantidade: item.quantidade,
      preco_unitario_real: arredondarCentavos(item.precoUnitario),
    })),
  };
}
