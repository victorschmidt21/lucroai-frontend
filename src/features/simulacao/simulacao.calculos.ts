import { isFaturavel } from '@/shared/domain/vendas';
import type { StatusVenda } from '@/shared/api/contracts/enums';

/*
 * Simulação interativa (docs/business-rules.md#simulação-interativa). Origem:
 * simulacao_page.dart (`_ScenarioBase.fromReceita`, `_priceRangeFor`,
 * `_volumeRangeFor`, `_buildSimulationContent` e `_VolumePreviewCard`).
 */

type ReceitaParaSimulacao = {
  id: number;
  rendimento: number;
  custoUnitario?: number;
  margemLucro?: number;
  precoSugerido?: number;
};

type VendaParaSimulacao = {
  status: StatusVenda;
  itens: readonly {
    receitaId: number;
    quantidade: number;
    precoUnitarioReal: number;
  }[];
};

export type Faixa = { min: number; max: number; passo: number };

export type BaseSimulacao = {
  custo: number;
  precoAtual: number;
  receitaAtual: number;
  volumeAtual: number;
  lucroAtual: number;
  /** Pontos percentuais (`25` = 25%). */
  margemAtual: number;
};

/** `precoSugerido > 0 ? precoSugerido : custo × (1 + margemLucro)`. */
export function precoBaseDaReceita(receita: ReceitaParaSimulacao) {
  const custo = receita.custoUnitario ?? 0;
  const sugerido = receita.precoSugerido ?? 0;

  return sugerido > 0 ? sugerido : custo * (1 + (receita.margemLucro ?? 0));
}

/**
 * Base da receita a partir dos itens dela nas vendas `CONCLUIDA`. Sem vendas,
 * usa o preço sugerido e `max(1, rendimento)` como volume: não divide por zero.
 */
export function calcularBase(
  receita: ReceitaParaSimulacao,
  vendas: readonly VendaParaSimulacao[],
): BaseSimulacao {
  let quantidade = 0;
  let receitaVendas = 0;

  for (const venda of vendas.filter(isFaturavel)) {
    for (const item of venda.itens) {
      if (item.receitaId !== receita.id) continue;
      quantidade += item.quantidade;
      receitaVendas += item.quantidade * item.precoUnitarioReal;
    }
  }

  const custo = receita.custoUnitario ?? 0;
  const precoAtual =
    quantidade > 0 ? receitaVendas / quantidade : precoBaseDaReceita(receita);
  const volumePadrao = Math.max(1, receita.rendimento);
  const receitaAtual =
    quantidade > 0 ? receitaVendas : precoAtual * volumePadrao;
  const volumeAtual = quantidade > 0 ? quantidade : volumePadrao;
  const lucroAtual = receitaAtual - custo * volumeAtual;

  return {
    custo,
    precoAtual,
    receitaAtual,
    volumeAtual,
    lucroAtual,
    margemAtual: receitaAtual === 0 ? 0 : (lucroAtual / receitaAtual) * 100,
  };
}

/** `_priceRangeFor`, com as 80 divisões do Slider do mobile. */
export function faixaPreco(receita: ReceitaParaSimulacao): Faixa {
  const custo = receita.custoUnitario ?? 0;
  const base = Math.max(precoBaseDaReceita(receita), custo * 1.25);
  const min = Math.max(0.01, Math.min(custo * 0.75, base));
  // Sem custo nem preço, o mobile teria `max < min` (o Slider quebra): a web
  // usa `max = min`.
  const max = Math.max(base * 2.2, custo * 3, min);

  return { min, max, passo: max > min ? (max - min) / 80 : 0.01 };
}

/** Variação de custo em %: de −50 a +100, de 1 em 1. */
export const FAIXA_VARIACAO_CUSTO: Faixa = { min: -50, max: 100, passo: 1 };

/** `_volumeRangeFor`: de 1 a `ceil(max(20, base × 3))`, em unidades inteiras. */
export function faixaVolume(volumeAtual: number, rendimento: number): Faixa {
  const base = Math.max(1, volumeAtual > 0 ? volumeAtual : rendimento);

  return { min: 1, max: Math.ceil(Math.max(20, base * 3)), passo: 1 };
}

/** Prende o valor à faixa (`clamp` do mobile). */
export function limitarNaFaixa(valor: number, { min, max }: Faixa) {
  return Math.min(max, Math.max(min, valor));
}

export type Projecao = {
  custoProjetado: number;
  lucroPorUnidade: number;
  lucroProjetado: number;
  receitaProjetada: number;
  /** Pontos percentuais. */
  margemProjetada: number;
  /** `lucroProjetado − lucroAtual`. */
  diferenca: number;
};

export function calcularProjecao({
  base,
  preco,
  variacaoCusto,
  volume,
}: {
  base: Pick<BaseSimulacao, 'custo' | 'lucroAtual'>;
  preco: number;
  /** Em pontos percentuais (`20` = +20%). */
  variacaoCusto: number;
  volume: number;
}): Projecao {
  const custoProjetado = base.custo * (1 + variacaoCusto / 100);
  const lucroPorUnidade = preco - custoProjetado;
  const lucroProjetado = lucroPorUnidade * volume;
  const receitaProjetada = preco * volume;

  return {
    custoProjetado,
    lucroPorUnidade,
    lucroProjetado,
    receitaProjetada,
    margemProjetada:
      receitaProjetada === 0 ? 0 : (lucroProjetado / receitaProjetada) * 100,
    diferenca: lucroProjetado - base.lucroAtual,
  };
}

export type CenarioVolume = {
  nome: 'Conservador' | 'Base' | 'Otimista';
  volume: number;
  receita: number;
  lucro: number;
};

/** `_VolumePreviewCard`: volume × 0,5, × 1 e × 1,5, arredondados e no mínimo 1. */
export function cenariosDeVolume(
  preco: number,
  custoProjetado: number,
  volume: number,
): CenarioVolume[] {
  const cenarios = [
    ['Conservador', 0.5],
    ['Base', 1],
    ['Otimista', 1.5],
  ] as const;

  return cenarios.map(([nome, fator]) => {
    const v = Math.max(1, Math.round(volume * fator));

    return {
      nome,
      volume: v,
      receita: preco * v,
      lucro: (preco - custoProjetado) * v,
    };
  });
}
