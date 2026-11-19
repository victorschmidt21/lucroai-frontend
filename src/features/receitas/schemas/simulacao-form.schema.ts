import { z } from 'zod';
import type {
  PrecoVendaBody,
  Receita,
  SimularCenarioBody,
  SimularReceitaCustoBody,
} from '@/shared/api/contracts/recipe';
import {
  fracaoParaPercentual,
  percentualParaFracao,
} from '@/shared/format/numero';
import {
  formatNumeroEditavel,
  inteiroBR,
  numeroBR,
  numeroBROpcional,
  parseInteiroBR,
} from '@/shared/format/numero-br';

// Simulação de cenário (FE-20). O mobile não valida os campos; a web segue o
// `simular-cenario.dto.ts` (todos opcionais e > 0; volume inteiro).
const VALOR = 'Informe um valor maior que zero';
const QUANTIDADE = 'Informe uma quantidade inteira maior que zero';
const MARGEM = 'Informe uma margem válida';
const LOTES = 'Informe a quantidade de lotes';

/** Inteiro opcional: vazio vira `undefined`; `1,5` ou `-3` falham. */
const inteiroOpcional = () =>
  z
    .string()
    .transform((texto) =>
      texto.trim() === '' ? undefined : (parseInteiroBR(texto) ?? Number.NaN),
    )
    .pipe(
      z
        .number({ error: QUANTIDADE })
        .int(QUANTIDADE)
        .positive(QUANTIDADE)
        .optional(),
    );

export const simulacaoCenarioFormSchema = z.object({
  novoCusto: numeroBROpcional(z.number({ error: VALOR }).positive(VALOR)),
  novoPreco: numeroBROpcional(z.number({ error: VALOR }).positive(VALOR)),
  volume: inteiroOpcional(),
});

export type SimulacaoCenarioFormInput = z.input<
  typeof simulacaoCenarioFormSchema
>;
export type SimulacaoCenarioFormValues = z.output<
  typeof simulacaoCenarioFormSchema
>;

/** Dinheiro positivo vai para o campo; o resto fica vazio. */
function dinheiroPositivo(valor: number | undefined) {
  return valor !== undefined && valor > 0 ? formatNumeroEditavel(valor, 2) : '';
}

/** Valores iniciais da receita (`initState` de simulacao_page.dart). */
export function toSimulacaoCenarioFormInput(
  receita: Pick<Receita, 'custoUnitario' | 'precoSugerido' | 'rendimento'>,
): SimulacaoCenarioFormInput {
  return {
    novoCusto: dinheiroPositivo(receita.custoUnitario),
    novoPreco: dinheiroPositivo(receita.precoSugerido),
    volume: receita.rendimento > 0 ? String(receita.rendimento) : '',
  };
}

/** Só os campos preenchidos: o vazio fica com o valor da receita no backend. */
export function toSimularCenarioBody(
  valores: SimulacaoCenarioFormValues,
): SimularCenarioBody {
  const body: SimularCenarioBody = {};

  if (valores.novoCusto !== undefined) body.novoCusto = valores.novoCusto;
  if (valores.novoPreco !== undefined) body.novoPreco = valores.novoPreco;
  if (valores.volume !== undefined) body.volume = valores.volume;

  return body;
}

/** "Preço para margem desejada": margem em pontos percentuais, ≥ 0. */
export const precoMargemFormSchema = z.object({
  margem: numeroBR(z.number({ error: MARGEM }).min(0, MARGEM)),
});

export type PrecoMargemFormInput = z.input<typeof precoMargemFormSchema>;
export type PrecoMargemFormValues = z.output<typeof precoMargemFormSchema>;

/** Começa com a margem salva na receita, se houver. */
export function toPrecoMargemFormInput(
  receita: Pick<Receita, 'margemLucro'>,
): PrecoMargemFormInput {
  return {
    margem:
      receita.margemLucro === undefined
        ? ''
        : formatNumeroEditavel(fracaoParaPercentual(receita.margemLucro)),
  };
}

export function toPrecoVendaBody(
  valores: PrecoMargemFormValues,
): PrecoVendaBody {
  return { margem_lucro: percentualParaFracao(valores.margem) };
}

/** "Custo para N lotes": inteiro > 0, começa em 1. */
export const custoLotesFormSchema = z.object({
  quantidadeLotes: inteiroBR(
    z.number({ error: LOTES }).int(LOTES).positive(LOTES),
  ),
});

export type CustoLotesFormInput = z.input<typeof custoLotesFormSchema>;
export type CustoLotesFormValues = z.output<typeof custoLotesFormSchema>;

export function toSimularReceitaCustoBody(
  valores: CustoLotesFormValues,
): SimularReceitaCustoBody {
  return { quantidadeLotes: valores.quantidadeLotes };
}
