import type { BaseRateio } from '@/shared/api/contracts/enums';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import type { ConfiguracaoCustos } from '@/shared/api/contracts/pricing';
import type { Receita } from '@/shared/api/contracts/recipe';
import { porCadaCemReais } from '@/shared/domain/margem';
import { descreverLucroReal } from '@/shared/domain/vendas';
import { formatMoeda } from '@/shared/format/moeda';
import {
  formatMargem,
  formatNumero,
  formatPercentual,
  fracaoParaPercentual,
} from '@/shared/format/numero';

/*
 * Exemplos "No seu caso" da Pitada (FE-65, docs/aprender.md#no-seu-caso): cada
 * função recebe o que a tela já carregou e devolve a frase com os números da
 * pessoa, ou `null` quando faltam dados. Valores calculados pelo backend vêm da
 * API como estão; as fórmulas do cliente vêm de `shared/domain/`. O nome da
 * receita vai depois de "receita" (feminino), para não errar o gênero do produto.
 */

/** Junta uma lista em português: "a", "a e b", "a, b e c". */
function juntar(partes: readonly string[]) {
  if (partes.length <= 1) return partes.join('');
  return `${partes.slice(0, -1).join(', ')} e ${partes.at(-1)}`;
}

export type DadosCustoPorUnidade = Pick<Receita, 'nome' | 'custo'>;

/** "Cada unidade da receita X custa R$ 0,81: R$ 0,50 de ingredientes, ..." */
export function exemploCustoPorUnidade({
  nome,
  custo,
}: DadosCustoPorUnidade): string | null {
  if (custo.unitario <= 0) return null;
  const partes = [
    [custo.ingredientes, 'de ingredientes'],
    [custo.embalagem, 'de embalagem'],
    [custo.perdas, 'de perdas'],
    [custo.gastosPorUnidade, 'de gastos por unidade'],
    [custo.gastosMensais, 'das contas do mês'],
    [custo.trabalho, 'do seu trabalho'],
  ] as const;
  const lista = partes
    .filter(([valor]) => valor > 0)
    .map(([valor, rotulo]) => `${formatMoeda(valor)} ${rotulo}`);
  return `Cada unidade da receita ${nome} custa ${formatMoeda(custo.unitario)}: ${juntar(lista)}.`;
}

export type DadosRendimento = Pick<
  Receita,
  'nome' | 'rendimento' | 'unidadeRendimento'
>;

/** "A receita X rende 12 unidades, então cada uma leva 1/12 dos ingredientes." */
export function exemploRendimento({
  nome,
  rendimento,
  unidadeRendimento,
}: DadosRendimento): string | null {
  if (rendimento <= 0) return null;
  const n = formatNumero(rendimento);
  if (unidadeRendimento === 'UN') {
    return rendimento === 1
      ? `A receita ${nome} rende 1 unidade, que leva todos os ingredientes.`
      : `A receita ${nome} rende ${n} unidades, então cada uma leva 1/${n} dos ingredientes.`;
  }
  const unidade = UNIDADE_MEDIDA_ROTULOS[unidadeRendimento];
  return `A receita ${nome} rende ${n} ${unidade}, então cada ${unidade} leva 1/${n} dos ingredientes.`;
}

export type DadosDivisaoDasContas = {
  /** Soma das contas do mês (`MENSAL`). */
  totalContas: number;
  capacidadeMensal: number;
  baseRateio: BaseRateio;
  /** Parte das contas em 1 fornada (ou 1 minuto), como o rateio da fornada calcula. */
  porFornada: number;
};

/** "Suas contas do mês somam R$ 240,00 e cabem 40 fornadas: cada fornada leva R$ 6,00." */
export function exemploDivisaoDasContas({
  totalContas,
  capacidadeMensal,
  baseRateio,
  porFornada,
}: DadosDivisaoDasContas): string | null {
  if (totalContas <= 0 || capacidadeMensal <= 0) return null;
  const total = formatMoeda(totalContas);
  const capacidade = formatNumero(capacidadeMensal);
  return baseRateio === 'MINUTOS'
    ? `Suas contas do mês somam ${total} e se dividem por ${capacidade} minutos de forno: cada minuto leva ${formatMoeda(porFornada)}.`
    : `Suas contas do mês somam ${total} e cabem ${capacidade} fornadas: cada fornada leva ${formatMoeda(porFornada)}.`;
}

export type DadosFornadasPorMes = Pick<
  ConfiguracaoCustos,
  'capacidadeMensal' | 'baseRateio'
>;

/** "Você disse que faz 40 fornadas por mês." */
export function exemploFornadasPorMes({
  capacidadeMensal,
  baseRateio,
}: DadosFornadasPorMes): string | null {
  if (capacidadeMensal <= 0) return null;
  const capacidade = formatNumero(capacidadeMensal);
  return baseRateio === 'MINUTOS'
    ? `Você disse que usa ${capacidade} minutos de forno por mês.`
    : `Você disse que faz ${capacidade} fornadas por mês.`;
}

export type DadosContasDoMes = { totalContas: number };

/** "Suas contas do mês somam R$ 240,00." */
export function exemploContasDoMes({
  totalContas,
}: DadosContasDoMes): string | null {
  if (totalContas <= 0) return null;
  return `Suas contas do mês somam ${formatMoeda(totalContas)}.`;
}

export type DadosPrecoSugerido = Pick<
  Receita,
  'nome' | 'lucroPercentual' | 'precos'
>;

/** "Para sobrar o lucro de 30,0%, a receita X sai a R$ 7,29 (Balcão) e R$ 9,60 (iFood)." */
export function exemploPrecoSugerido({
  nome,
  lucroPercentual,
  precos,
}: DadosPrecoSugerido): string | null {
  const comPreco = precos.filter((p) => p.preco !== null);
  if (comPreco.length === 0) return null;
  // O lucro efetivo é o mesmo em todos os canais: o da receita ou o padrão.
  const lucro =
    lucroPercentual ??
    precos.find((p) => p.composicao)?.composicao?.lucro.fracao;
  const valores = juntar(
    comPreco.map((p) => `${formatMoeda(p.preco)} (${p.canal})`),
  );
  const inicio =
    lucro === undefined
      ? `Cada unidade da receita ${nome} sai a`
      : `Para sobrar o lucro de ${formatMargem(lucro)}, cada unidade da receita ${nome} sai a`;
  return `${inicio} ${valores}.`;
}

export type DadosMargem = {
  nome: string;
  /** `lucroReal` da simulação: fração do preço (pode ser negativa). */
  lucroReal: number;
  lucroPorUnidade: number;
};

/** "Na receita X, ficam com você R$ 29 de cada R$ 100 vendidos." */
export function exemploMargem({
  nome,
  lucroReal,
  lucroPorUnidade,
}: DadosMargem): string | null {
  if (lucroPorUnidade < 0) {
    return `Na receita ${nome}, cada venda tira ${formatMoeda(-lucroPorUnidade)} do seu bolso.`;
  }
  const porCem = porCadaCemReais(fracaoParaPercentual(lucroReal));
  return porCem === null
    ? null
    : `Na receita ${nome}, ficam com você ${porCem} vendidos.`;
}

export type DadosTaxaDoCanal = {
  /** Com o artigo, como sujeito da frase: "A maquininha", "O iFood". */
  canal: string;
  /** Fração do preço (`0.03`). */
  taxa: number;
};

/** "A maquininha cobra 3,0%: de cada R$ 100 vendidos, R$ 3,00 ficam com eles." */
export function exemploTaxaDoCanal({
  canal,
  taxa,
}: DadosTaxaDoCanal): string | null {
  if (taxa <= 0) return null;
  const pontos = fracaoParaPercentual(taxa);
  return `${canal} cobra ${formatPercentual(pontos)}: de cada R$ 100 vendidos, ${formatMoeda(pontos)} ficam com eles.`;
}

export type DadosLucroReal = {
  /** Nome da receita do item. */
  nome: string;
  /** `lucroReal` do item da venda, fração do preço; `null` em vendas antigas. */
  lucroReal: number | null;
};

/** "Na venda mais recente da lista, a receita X teve lucro real de 29,0%." */
export function exemploLucroReal({
  nome,
  lucroReal,
}: DadosLucroReal): string | null {
  if (lucroReal === null) return null;
  return `Na venda mais recente da lista, a receita ${nome} teve lucro real de ${descreverLucroReal(lucroReal).texto}.`;
}

export type DadosDoMes = {
  faturamento: number;
  lucro: number;
  /** Pontos percentuais (`29`), como `calcularIndicadores`. */
  margem: number;
};

/** "Você vendeu R$ 4.524,36 este mês e sobraram R$ 1.312,06." */
export function exemploFaturamento({
  faturamento,
  lucro,
}: Pick<DadosDoMes, 'faturamento' | 'lucro'>): string | null {
  if (faturamento <= 0) return null;
  const vendeu = `Você vendeu ${formatMoeda(faturamento)} este mês`;
  return lucro < 0
    ? `${vendeu}, mas ficou ${formatMoeda(-lucro)} no vermelho.`
    : `${vendeu} e sobraram ${formatMoeda(lucro)}.`;
}

/** "Este mês sobraram R$ 1.312,06: R$ 29 de cada R$ 100 vendidos." */
export function exemploSobrouPraVoce({
  faturamento,
  lucro,
  margem,
}: DadosDoMes): string | null {
  if (faturamento <= 0 || lucro < 0) return null;
  const porCem = porCadaCemReais(margem);
  return porCem === null
    ? null
    : `Este mês sobraram ${formatMoeda(lucro)}: ${porCem} vendidos.`;
}

export type DadosParaPagarAsContas = {
  /** `pontoEquilibrio.valor` de `GET /vendas/resumo`; `null` sem o valor. */
  valor: number | null;
  faturamento: number;
};

/** "Você precisa vender R$ 830,00 no mês; já vendeu R$ 4.524,36." ou "Faltam R$ 310,00 ..." */
export function exemploParaPagarAsContas({
  valor,
  faturamento,
}: DadosParaPagarAsContas): string | null {
  if (valor === null || valor <= 0) return null;
  if (faturamento < valor) {
    return `Faltam ${formatMoeda(valor - faturamento)} para pagar as contas do mês.`;
  }
  return `Você precisa vender ${formatMoeda(valor)} no mês; já vendeu ${formatMoeda(faturamento)}.`;
}
