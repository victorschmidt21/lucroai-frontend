import type { StatusVenda } from '@/shared/api/contracts/enums';
import { isFaturavel, totalDaVenda } from '@/shared/domain/vendas';
import { toDataSemHora } from '@/shared/format/data';
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

/*
 * Histórico e resumo (docs/business-rules.md#vendas-histórico-e-resumo). Origem:
 * `VendaResumo.fromVendas` de venda.dart, `VendasState.initial` de
 * vendas_state.dart e `VendaModel.fromJson` (quantidade e total pelos itens).
 */

type ItemParaHistorico = {
  quantidade: number;
  precoUnitarioReal: number;
};
type VendaParaHistorico = {
  status: StatusVenda;
  total: number | null;
  itens: readonly ItemParaHistorico[];
};

// `totalDaVenda` fica em `shared/domain/vendas.ts`, porque o painel também usa.
export { totalDaVenda };

/** Soma das quantidades dos itens (a coluna "un" do `venda_card.dart`). */
export function quantidadeDaVenda({ itens }: VendaParaHistorico) {
  return itens.reduce((soma, item) => soma + item.quantidade, 0);
}

export type ResumoVendas = {
  totalVendido: number;
  quantidadeVendas: number;
  ticketMedio: number;
};

/** Só vendas faturáveis (`CONCLUIDA`); ticket médio 0 sem vendas. */
export function resumirVendas(
  vendas: readonly VendaParaHistorico[],
): ResumoVendas {
  const faturaveis = vendas.filter(isFaturavel);
  const totalVendido = faturaveis.reduce(
    (soma, venda) => soma + totalDaVenda(venda),
    0,
  );

  return {
    totalVendido,
    quantidadeVendas: faturaveis.length,
    ticketMedio: faturaveis.length > 0 ? totalVendido / faturaveis.length : 0,
  };
}

/**
 * Mês de `hoje`, do dia 1 ao último dia (`DateTime(ano, mes + 1, 0)`), em
 * `YYYY-MM-DD` no fuso local.
 */
export function periodoPadrao(hoje: Date) {
  return {
    inicio: toDataSemHora(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
    fim: toDataSemHora(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)),
  };
}
