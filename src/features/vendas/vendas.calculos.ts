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

/*
 * Estoque disponível de produto acabado (docs/business-rules.md#validação-de-estoque-antes-de-concluir).
 * Origem: `verificarEstoqueParaVenda` de vendas_cubit.dart. O backend não expõe
 * esse estoque (lacuna 6), então ele é calculado das produções e das vendas.
 */

type ProducaoParaEstoque = { receitaId: number; quantidade: number };
type ReceitaParaEstoque = { id: number; nome: string; rendimento: number };
type VendaParaEstoque = {
  status: string;
  itens: readonly { receitaId: number; quantidade: number }[];
};

/**
 * `Σ producao.quantidade × rendimento − Σ itens vendidos em vendas CONCLUIDA`,
 * só da receita. Sem a receita na lista, o rendimento é 1 (como o mobile).
 */
export function calcularEstoqueDisponivel(
  receitaId: number,
  producoes: readonly ProducaoParaEstoque[],
  receitas: readonly ReceitaParaEstoque[],
  vendas: readonly VendaParaEstoque[],
) {
  const rendimento = receitas.find((r) => r.id === receitaId)?.rendimento ?? 1;

  const produzido = producoes
    .filter((p) => p.receitaId === receitaId)
    .reduce((soma, p) => soma + p.quantidade * rendimento, 0);

  const vendido = vendas
    .filter((v) => v.status === 'CONCLUIDA')
    .flatMap((v) => v.itens)
    .filter((i) => i.receitaId === receitaId)
    .reduce((soma, i) => soma + i.quantidade, 0);

  return produzido - vendido;
}

/** Quantidade pedida por receita: a mesma receita em duas linhas é somada. */
export function quantidadesPorReceita(
  itens: readonly { receitaId: number; quantidade: number }[],
) {
  const total = new Map<number, number>();
  for (const item of itens) {
    total.set(
      item.receitaId,
      (total.get(item.receitaId) ?? 0) + item.quantidade,
    );
  }
  return total;
}
