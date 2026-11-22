import type { StatusVenda } from '@/shared/api/contracts/enums';
import { isFaturavel, totalDaVenda } from '@/shared/domain/vendas';
import { toDataSemHora } from '@/shared/format/data';
import { arredondarCentavos } from '@/shared/format/moeda';
import { formatMargem } from '@/shared/format/numero';

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
 * Estoque disponível de produto acabado (docs/business-rules.md#validação-de-estoque-antes-de-concluir):
 * vem de `GET /estoque/produtos` (lacuna 6, resolvida). Receita que nunca teve
 * produção não aparece na lista e vale 0, como na API.
 */
export function estoqueDisponivelDaReceita(
  receitaId: number,
  estoques: readonly { receitaId: number; quantidadeDisponivel: number }[],
) {
  return (
    estoques.find((e) => e.receitaId === receitaId)?.quantidadeDisponivel ?? 0
  );
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

/*
 * Canal e lucro real da venda (FE-46, docs/business-rules.md#vendas-canal-e-lucro-real).
 * O `lucroReal` é gravado pelo backend (BE-30) e só é exibido, nunca recalculado.
 */

/** Nome do canal da venda; "Não informado" nas vendas antigas e com o canal excluído. */
export function nomeDoCanal(
  canalId: number | null,
  canais: readonly { id: number; nome: string }[],
) {
  if (canalId === null) return 'Não informado';
  return (
    canais.find((canal) => canal.id === canalId)?.nome ?? `Canal #${canalId}`
  );
}

/**
 * Lucro real do item em % do preço, com o aviso quando é negativo (a venda não
 * pagou o custo e as taxas): a cor nunca vem sozinha.
 */
export function descreverLucroReal(lucroReal: number | null) {
  if (lucroReal === null) return { texto: formatMargem(null), prejuizo: false };
  const prejuizo = lucroReal < 0;
  return {
    texto: prejuizo
      ? `${formatMargem(lucroReal)} (prejuízo)`
      : formatMargem(lucroReal),
    prejuizo,
  };
}
