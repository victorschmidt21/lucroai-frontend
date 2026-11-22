import type {
  ComposicaoPreco,
  PrecoCanal,
  SimulacaoCenario,
} from '@/shared/api/contracts/recipe';
import { arredondarCentavos, formatMoeda } from '@/shared/format/moeda';
import { formatMargem, formatNumero } from '@/shared/format/numero';

/*
 * Desde a FE-44 o custo e o preço da receita vêm sempre da API (`custo` e
 * `precos` de `GET /receitas/:id`, BE-28): aqui só fica a prévia do custo de
 * cada item no formulário e a montagem da barra a partir da resposta
 * (docs/business-rules.md#receitas-formulário-e-custo).
 */

/** `custoCalculado` do item: `round2(quantidade × insumo.custoUnitario)`. */
export function calcularCustoItem(quantidade: number, custoUnitario: number) {
  return arredondarCentavos(quantidade * custoUnitario);
}

export type ParteDaBarraId =
  | 'ingredientes'
  | 'contasDoMes'
  | 'embalagemEPerdas'
  | 'imposto'
  | 'taxaCanal'
  | 'percentuaisDaVenda'
  | 'lucro';

export type ParteDaBarra = {
  id: ParteDaBarraId;
  rotulo: string;
  /** Fração do preço: quanto de cada R$ 1,00 vendido vai para esta parte. */
  fracao: number;
  /** Reais por unidade. */
  valor: number;
};

const round4 = (valor: number) => Math.round(valor * 10_000) / 10_000;

/** Soma partes da API (4 casas) sem o ruído do ponto flutuante. */
function somar(...partes: { valor: number; fracao: number }[]) {
  return {
    valor: round4(partes.reduce((soma, parte) => soma + parte.valor, 0)),
    fracao: round4(partes.reduce((soma, parte) => soma + parte.fracao, 0)),
  };
}

/**
 * "Para onde vai cada R$ 1,00" do preço de um canal, a partir da `composicao`
 * da API, sem recalcular nada: os gastos por unidade (saquinho, etiqueta)
 * entram em "Embalagem e perdas". Partes com zero ficam de fora, menos o
 * lucro, que sempre aparece. A ordem é a da barra.
 */
export function montarBarraDoPreco(
  composicao: ComposicaoPreco,
  canal: Pick<PrecoCanal, 'canal' | 'balcao'>,
): ParteDaBarra[] {
  const partes: ParteDaBarra[] = [
    {
      id: 'ingredientes',
      rotulo: 'Ingredientes',
      ...somar(composicao.ingredientes),
    },
    {
      id: 'contasDoMes',
      rotulo: 'Contas do mês',
      ...somar(composicao.gastosMensais),
    },
    {
      id: 'embalagemEPerdas',
      rotulo: 'Embalagem e perdas',
      ...somar(
        composicao.embalagem,
        composicao.gastosPorUnidade,
        composicao.perdas,
      ),
    },
    { id: 'imposto', rotulo: 'Imposto', ...somar(composicao.imposto) },
    {
      id: 'taxaCanal',
      rotulo: canal.balcao ? 'Taxa da maquininha' : `Taxa do ${canal.canal}`,
      ...somar(composicao.taxaCanal),
    },
    {
      id: 'percentuaisDaVenda',
      rotulo: 'Gastos em % da venda',
      ...somar(composicao.gastosPercentuais),
    },
    { id: 'lucro', rotulo: 'Lucro', ...somar(composicao.lucro) },
  ];

  return partes.filter((parte) => parte.id === 'lucro' || parte.fracao > 0);
}

export type ResultadoDaSimulacao = {
  lucroPorUnidade: string;
  /** Lucro real em % do preço. */
  lucroReal: string;
  lucroMes: string;
  /** `true` quando o lucro por unidade é negativo. */
  prejuizo: boolean;
  /** Aviso em vermelho quando o preço não cobre o custo; `null` quando cobre. */
  aviso: string | null;
  /** Frase do ponto de equilíbrio do produto; `null` junto com o aviso. */
  pontoEquilibrio: string | null;
};

/**
 * Textos do resultado de `POST /receitas/:id/simular` (FE-45), sem recalcular
 * nada: tudo vem da API. Com prejuízo por unidade, mostra o aviso e esconde o
 * ponto de equilíbrio (critério da issue), mesmo que a API devolva unidades.
 */
export function formatarResultadoDaSimulacao(
  resultado: Pick<
    SimulacaoCenario,
    'lucroPorUnidade' | 'lucroReal' | 'lucroMes' | 'pontoEquilibrio'
  >,
): ResultadoDaSimulacao {
  const prejuizo = resultado.lucroPorUnidade < 0;
  const { unidades } = resultado.pontoEquilibrio;

  let pontoEquilibrio: string | null = null;
  if (!prejuizo && unidades !== null) {
    pontoEquilibrio =
      unidades === 0
        ? 'Você não tem contas do mês cadastradas em Gastos: qualquer venda já ajuda no lucro.'
        : `Para pagar as contas do mês, você precisa vender ${formatNumero(unidades)} ${unidades === 1 ? 'unidade' : 'unidades'}.`;
  }

  return {
    lucroPorUnidade: formatMoeda(resultado.lucroPorUnidade),
    lucroReal: formatMargem(resultado.lucroReal),
    lucroMes: formatMoeda(resultado.lucroMes),
    prejuizo,
    aviso: prejuizo
      ? `Este preço não cobre o custo: você perde ${formatMoeda(-resultado.lucroPorUnidade)} em cada unidade vendida.`
      : null,
    pontoEquilibrio,
  };
}
