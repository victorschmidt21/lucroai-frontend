import type { MetodoRateio } from '@/shared/api/contracts/enums';
import { arredondarCentavos } from '@/shared/format/moeda';

/*
 * Prévia dos custos da receita, com as fórmulas e os arredondamentos do backend
 * (docs/business-rules.md#receitas-formulário-e-custo). Origem:
 * `custos/application/services/custo.service.ts` (`calcularReceita`) e
 * `custos/infra/providers/default-custo-invisivel-result.provider.ts`. O valor
 * exibido depois de salvar é sempre o que o backend devolve.
 */

/** `custoCalculado` do item: `round2(quantidade × insumo.custoUnitario)`. */
export function calcularCustoItem(quantidade: number, custoUnitario: number) {
  return arredondarCentavos(quantidade * custoUnitario);
}

type GastoParaRateio = { valor: number; metodoRateio: MetodoRateio };

/**
 * Custo invisível de 1 lote: o rateio de **todos** os gastos indiretos da
 * empresa, cada um com `round2`, e o total com `round2` (lacuna 18).
 */
export function calcularCustoInvisivel(
  gastos: readonly GastoParaRateio[],
  rendimento: number,
) {
  const lotes = 1;
  const total = gastos.reduce((soma, gasto) => {
    switch (gasto.metodoRateio) {
      case 'POR_UNIDADE':
        return soma + arredondarCentavos(gasto.valor * rendimento * lotes);
      case 'PROPORCIONAL':
        return soma + arredondarCentavos(gasto.valor * lotes);
      case 'FIXO':
        return soma + arredondarCentavos(gasto.valor);
    }
  }, 0);

  return arredondarCentavos(total);
}

export type PreviaReceitaEntrada = {
  /** `custoUnitario` `null` quando o insumo não está mais no catálogo. */
  itens: readonly { quantidade: number | null; custoUnitario: number | null }[];
  /** `null` quando o rendimento digitado é inválido. */
  rendimento: number | null;
  /** Fração (`0.6`); `undefined` sem margem. */
  margem: number | undefined;
  gastos: readonly GastoParaRateio[];
};

export type PreviaReceita = {
  custoInsumos: number | null;
  custoInvisivel: number | null;
  custoProducao: number | null;
  custoUnitario: number | null;
  precoSugerido: number | null;
};

/**
 * `custoProducao = round2(round2(Σ custoItem) + custoInvisivel)`,
 * `custoUnitario = round2(custoProducao / rendimento)` e
 * `precoSugerido = round2(custoUnitario × (1 + margem))`, só com margem.
 * Valor que não dá para calcular (quantidade ou rendimento inválido, insumo
 * fora do catálogo) é `null` e aparece como "—".
 */
export function calcularPreviaReceita({
  itens,
  rendimento,
  margem,
  gastos,
}: PreviaReceitaEntrada): PreviaReceita {
  const custos = itens.map(({ quantidade, custoUnitario }) =>
    quantidade === null || custoUnitario === null
      ? null
      : calcularCustoItem(quantidade, custoUnitario),
  );
  const custoInsumos = custos.includes(null)
    ? null
    : arredondarCentavos(
        custos.reduce<number>((soma, custo) => soma + (custo ?? 0), 0),
      );
  const rendimentoValido = rendimento !== null && rendimento > 0;
  const custoInvisivel = rendimentoValido
    ? calcularCustoInvisivel(gastos, rendimento)
    : null;
  const custoProducao =
    custoInsumos === null || custoInvisivel === null
      ? null
      : arredondarCentavos(custoInsumos + custoInvisivel);
  const custoUnitario =
    custoProducao === null || !rendimentoValido
      ? null
      : arredondarCentavos(custoProducao / rendimento);
  const precoSugerido =
    custoUnitario === null || margem === undefined
      ? null
      : arredondarCentavos(custoUnitario * (1 + margem));

  return {
    custoInsumos,
    custoInvisivel,
    custoProducao,
    custoUnitario,
    precoSugerido,
  };
}
