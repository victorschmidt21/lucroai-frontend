import { isFaturavel } from '@/shared/domain/vendas';
import type { StatusVenda } from '@/shared/api/contracts/enums';

/*
 * Simulação interativa (docs/business-rules.md#simulação-interativa). Origem:
 * simulacao_page.dart (`_ScenarioBase.fromReceita`, `_priceRangeFor`,
 * `_volumeRangeFor` e `_VolumePreviewCard`). Desde a FE-45 o lucro vem de
 * `POST /receitas/:id/simular`: aqui só ficam o preço e o volume de partida,
 * as faixas dos controles e o custo que vai no corpo.
 */

type ReceitaParaSimulacao = {
  id: number;
  rendimento: number;
  custoUnitario?: number;
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
  volumeAtual: number;
};

/**
 * O preço sugerido no Balcão; sem ele (percentuais ≥ 100%), o custo. O mobile
 * usava `custo × (1 + margemLucro)`, o markup que saiu na FE-45.
 */
export function precoBaseDaReceita(receita: ReceitaParaSimulacao) {
  const sugerido = receita.precoSugerido ?? 0;

  return sugerido > 0 ? sugerido : (receita.custoUnitario ?? 0);
}

/**
 * Preço médio e volume da receita nas vendas `CONCLUIDA`. Sem vendas, usa o
 * preço sugerido e `max(1, rendimento)` como volume.
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

  return {
    custo: receita.custoUnitario ?? 0,
    precoAtual:
      quantidade > 0 ? receitaVendas / quantidade : precoBaseDaReceita(receita),
    volumeAtual: quantidade > 0 ? quantidade : Math.max(1, receita.rendimento),
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

/**
 * Custo com a variação em pontos percentuais (`20` = +20%), que vai como
 * `novoCusto` na simulação.
 */
export function custoComVariacao(custo: number, variacaoCusto: number) {
  return custo * (1 + variacaoCusto / 100);
}

export type CenarioVolume = {
  nome: 'Conservador' | 'Base' | 'Otimista';
  volume: number;
  receita: number;
  lucro: number;
};

/**
 * `_VolumePreviewCard`: volume × 0,5, × 1 e × 1,5, arredondados e no mínimo 1.
 * O lucro é o `lucroPorUnidade` da API × volume, como o `lucroMes` dela.
 */
export function cenariosDeVolume(
  preco: number,
  lucroPorUnidade: number,
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
      lucro: lucroPorUnidade * v,
    };
  });
}
