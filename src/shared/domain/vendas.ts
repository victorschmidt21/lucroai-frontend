import type { StatusVenda } from '@/shared/api/contracts/enums';
import { arredondarCentavos } from '@/shared/format/moeda';

/**
 * Só vendas `CONCLUIDA` entram no faturamento: `PENDENTE` ainda não é receita e
 * `CANCELADA` nunca conta. Origem: `isFaturavel` de venda.dart. Usado pelo
 * histórico (FE-18), pelo painel e pela simulação.
 */
export function isFaturavel(venda: { status: StatusVenda }) {
  return venda.status === 'CONCLUIDA';
}

/**
 * `total` gravado; sem ele, `round2(Σ quantidade × precoUnitarioReal)`, como o
 * mobile (`VendaModel.fromJson`). Usado pelo histórico (FE-18) e pelo painel.
 */
export function totalDaVenda({
  total,
  itens,
}: {
  total: number | null;
  itens: readonly { quantidade: number; precoUnitarioReal: number }[];
}) {
  return (
    total ??
    arredondarCentavos(
      itens.reduce((soma, i) => soma + i.quantidade * i.precoUnitarioReal, 0),
    )
  );
}
