import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import type {
  ComposicaoPreco,
  PrecoCanal,
  Receita,
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

/** Preço sugerido no canal e o lucro por unidade dele, para o aviso de prejuízo. */
export type SugestaoDePreco = { preco: number; lucroPorUnidade: number };

/**
 * Sugestão para o aviso de prejuízo (FE-57): o preço sugerido pela API no canal
 * simulado, quando existe e deixa lucro.
 */
export function sugestaoDoCanal(
  precos: readonly PrecoCanal[],
  canalId: number,
): SugestaoDePreco | null {
  const preco = precos.find((p) => p.canalId === canalId);
  const lucro = preco?.composicao?.lucro.valor;
  if (!preco || preco.preco === null || lucro === undefined || lucro <= 0) {
    return null;
  }
  return { preco: preco.preco, lucroPorUnidade: lucro };
}

/** Aviso quando o preço não paga o custo (FE-57): o problema e o caminho. */
export function avisoDePrejuizo(
  perdaPorUnidade: number,
  sugestao: SugestaoDePreco | null,
) {
  const inicio = 'Com esse preço você paga para vender.';
  return sugestao
    ? `${inicio} Que tal ${formatMoeda(sugestao.preco)}? Assim sobram ${formatMoeda(sugestao.lucroPorUnidade)} por unidade.`
    : `${inicio} Você perde ${formatMoeda(perdaPorUnidade)} em cada unidade.`;
}

/**
 * Textos do resultado de `POST /receitas/:id/simular` (FE-45), sem recalcular
 * nada: tudo vem da API. Com prejuízo por unidade, mostra o aviso (com o preço
 * sugerido no canal, quando houver) e esconde a frase das contas do mês
 * (critério da FE-45), mesmo que a API devolva unidades.
 */
export function formatarResultadoDaSimulacao(
  resultado: Pick<
    SimulacaoCenario,
    'lucroPorUnidade' | 'lucroReal' | 'lucroMes' | 'pontoEquilibrio'
  >,
  sugestao: SugestaoDePreco | null = null,
): ResultadoDaSimulacao {
  const prejuizo = resultado.lucroPorUnidade < 0;
  const { unidades } = resultado.pontoEquilibrio;

  let pontoEquilibrio: string | null = null;
  if (!prejuizo && unidades !== null) {
    pontoEquilibrio =
      unidades === 0
        ? 'Você não tem contas do mês cadastradas: qualquer venda já ajuda no lucro.'
        : `Para pagar as contas do mês, você precisa vender ${formatNumero(unidades)} ${unidades === 1 ? 'unidade' : 'unidades'}.`;
  }

  return {
    lucroPorUnidade: formatMoeda(resultado.lucroPorUnidade),
    lucroReal: formatMargem(resultado.lucroReal),
    lucroMes: formatMoeda(resultado.lucroMes),
    prejuizo,
    aviso: prejuizo
      ? avisoDePrejuizo(-resultado.lucroPorUnidade, sugestao)
      : null,
    pontoEquilibrio,
  };
}

/**
 * Canal sem preço possível (`preco: null`): as taxas e o lucro já passam de
 * 100% do preço. Diz o que fazer, sem jargão (FE-57).
 */
export function avisoSemPrecoPossivel(percentuais: number) {
  return `Não existe preço que pague tudo: as taxas e o lucro já somam ${formatMargem(percentuais)} do preço. Diminua o lucro da receita ou as taxas em Ajustes de preço.`;
}

/**
 * Receitas que podem ir dentro desta (receita dentro de receita, BE-39): nem
 * ela mesma, nem as que já têm receitas dentro (um nível só), nem as que já
 * estão na lista. `receitaId` é `undefined` no cadastro.
 */
export function receitasQuePodemEntrar(
  receitas: readonly Receita[],
  {
    receitaId,
    jaAdicionadas,
  }: { receitaId?: number; jaAdicionadas: readonly number[] },
): Receita[] {
  const adicionadas = new Set(jaAdicionadas);
  return receitas.filter(
    (receita) =>
      receita.id !== receitaId &&
      receita.receitas.length === 0 &&
      !adicionadas.has(receita.id),
  );
}

/**
 * Por que esta receita não pode levar outras dentro: ela já vai dentro de
 * outra (um nível só). `null` quando pode.
 */
export function motivoSemReceitasDentro(
  receita: Pick<Receita, 'nome' | 'usadaEm'> | undefined,
): string | null {
  if (!receita || receita.usadaEm.length === 0) return null;
  // "A, B e C".
  const onde = new Intl.ListFormat('pt-BR').format(
    receita.usadaEm.map((uso) => uso.nome),
  );
  return `A receita ${receita.nome} já vai dentro de ${onde}, então não pode levar outras receitas.`;
}

/** Dica da quantidade no diálogo, na unidade em que a receita escolhida rende. */
export function dicaDaQuantidadeDaReceita(
  receita: Pick<Receita, 'nome' | 'rendimento' | 'unidadeRendimento'>,
) {
  return `A receita de ${receita.nome} rende ${formatNumero(receita.rendimento)} ${UNIDADE_MEDIDA_ROTULOS[receita.unidadeRendimento]}. Quanto vai em 1 lote desta?`;
}
