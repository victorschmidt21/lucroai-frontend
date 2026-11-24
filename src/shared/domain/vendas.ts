import type { StatusVenda } from '@/shared/api/contracts/enums';
import { arredondarCentavos } from '@/shared/format/moeda';
import { formatMargem } from '@/shared/format/numero';

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
