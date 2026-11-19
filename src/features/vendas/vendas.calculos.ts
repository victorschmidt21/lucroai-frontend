import { arredondarCentavos } from '@/shared/format/moeda';

/*
 * Carrinho de venda (docs/business-rules.md#vendas-carrinho). Origem:
 * `ItemCarrinho.subtotal` de vendas_state.dart e `_totalCarrinho` de
 * vendas_page.dart; o total repete o `round2` do `venda.service.ts` (`create`).
 */

type ItemParaTotal = { quantidade: number; precoUnitario: number };

/** `quantidade × precoUnitario`, sem arredondar (é arredondado só na exibição). */
export function subtotalItem({ quantidade, precoUnitario }: ItemParaTotal) {
  return quantidade * precoUnitario;
}

/** `round2(Σ quantidade × precoUnitario)`: o mesmo `total` que o backend grava. */
export function totalCarrinho(itens: readonly ItemParaTotal[]) {
  return arredondarCentavos(
    itens.reduce((soma, item) => soma + subtotalItem(item), 0),
  );
}
