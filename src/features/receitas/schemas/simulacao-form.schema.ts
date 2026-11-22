import { z } from 'zod';
import type {
  Receita,
  SimularCenarioBody,
  SimularReceitaCustoBody,
} from '@/shared/api/contracts/recipe';
import { arredondarCentavos } from '@/shared/format/moeda';
import {
  formatNumeroEditavel,
  inteiroBR,
  numeroBROpcional,
  parseInteiroBR,
} from '@/shared/format/numero-br';

// Simulação da receita (FE-45): o preço que cobra, o canal e quantas unidades
// vende por mês. Segue o `simular-cenario.dto.ts` (preço > 0, volume inteiro > 0,
// os dois opcionais; `canalId` inteiro > 0).
const VALOR = 'Informe um valor maior que zero';
const QUANTIDADE = 'Informe uma quantidade inteira maior que zero';
const CANAL = 'Escolha onde vende';
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
  /** O `value` do `<select>` (id do canal). */
  canalId: z
    .string()
    .transform((texto) => parseInteiroBR(texto) ?? Number.NaN)
    .pipe(z.number({ error: CANAL }).int(CANAL).positive(CANAL)),
  /** Vazio usa o preço sugerido no canal. */
  novoPreco: numeroBROpcional(z.number({ error: VALOR }).positive(VALOR)),
  /** Vazio usa o rendimento da receita. */
  volume: inteiroOpcional(),
});

export type SimulacaoCenarioFormInput = z.input<
  typeof simulacaoCenarioFormSchema
>;
export type SimulacaoCenarioFormValues = z.output<
  typeof simulacaoCenarioFormSchema
>;

type ReceitaParaSimular = Pick<Receita, 'rendimento' | 'precos'>;

function precoSugeridoNoCanal(
  receita: Pick<Receita, 'precos'>,
  canalId: number,
) {
  const preco = receita.precos.find((p) => p.canalId === canalId)?.preco;
  return preco != null && preco > 0 ? preco : null;
}

/** Preço sugerido no canal, pronto para o campo; vazio sem preço possível. */
export function precoDoCanalNoCampo(
  receita: Pick<Receita, 'precos'>,
  canalId: number,
) {
  const preco = precoSugeridoNoCanal(receita, canalId);
  return preco === null ? '' : formatNumeroEditavel(preco, 2);
}

/** Começa no Balcão (ou no primeiro canal), com o preço sugerido e o rendimento. */
export function toSimulacaoCenarioFormInput(
  receita: ReceitaParaSimular,
): SimulacaoCenarioFormInput {
  const canal = receita.precos.find((p) => p.balcao) ?? receita.precos[0];

  return {
    canalId: canal ? String(canal.canalId) : '',
    novoPreco: canal ? precoDoCanalNoCampo(receita, canal.canalId) : '',
    volume: receita.rendimento > 0 ? String(receita.rendimento) : '',
  };
}

/**
 * O canal e só os campos preenchidos: o vazio fica com o valor do backend. O
 * preço igual ao sugerido no canal (o campo tem 2 casas; a API, 4) também é
 * omitido, para a API usar o sugerido exato e o lucro real sair igual ao
 * configurado.
 */
export function toSimularCenarioBody(
  valores: SimulacaoCenarioFormValues,
  receita: Pick<Receita, 'precos'>,
): SimularCenarioBody {
  const body: SimularCenarioBody = { canalId: valores.canalId };
  const sugerido = precoSugeridoNoCanal(receita, valores.canalId);
  const ehOSugerido =
    sugerido !== null && arredondarCentavos(sugerido) === valores.novoPreco;

  if (valores.novoPreco !== undefined && !ehOSugerido) {
    body.novoPreco = valores.novoPreco;
  }
  if (valores.volume !== undefined) body.volume = valores.volume;

  return body;
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
