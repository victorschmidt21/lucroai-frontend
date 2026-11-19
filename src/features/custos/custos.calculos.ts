import { parseInteiroBR, parseNumeroBR } from '@/shared/format/numero-br';

// Cálculo real (docs/business-rules.md#custos-cálculo-real).
// Origem: getters de calculo_real_screen.dart.

export type EntradaCustoReal = {
  ingredientes: number;
  energia: number;
  agua: number;
  gas: number;
  horas: number;
  valorHora: number;
  rendimento: number;
};

export type ResultadoCustoReal = {
  maoDeObra: number;
  custosInvisiveis: number;
  custoTotal: number;
  custoPorUnidade: number;
  /** Em pontos percentuais (`25`), não em fração. */
  percentualInvisivel: number;
};

export function calcularCustoReal(
  entrada: EntradaCustoReal,
): ResultadoCustoReal {
  const maoDeObra = entrada.horas * entrada.valorHora;
  const custosInvisiveis =
    entrada.energia + entrada.agua + entrada.gas + maoDeObra;
  const custoTotal = entrada.ingredientes + custosInvisiveis;

  return {
    maoDeObra,
    custosInvisiveis,
    custoTotal,
    custoPorUnidade:
      entrada.rendimento > 0 ? custoTotal / entrada.rendimento : 0,
    percentualInvisivel:
      custoTotal > 0 ? (custosInvisiveis / custoTotal) * 100 : 0,
  };
}

/** Os campos como foram digitados (texto), para o resultado ao vivo. */
export type CamposCustoReal = Record<
  Exclude<keyof EntradaCustoReal, 'rendimento'>,
  string
> & { rendimento: string };

/**
 * Lê os campos digitados para o resultado ao vivo: vazio conta como 0 (`_parseBR`).
 * Texto inválido também conta como 0 (o mobile usa -1); o erro aparece ao salvar.
 */
const numero = (texto: string) => parseNumeroBR(texto) ?? 0;

export function lerCamposCustoReal(campos: CamposCustoReal): EntradaCustoReal {
  return {
    ingredientes: numero(campos.ingredientes),
    energia: numero(campos.energia),
    agua: numero(campos.agua),
    gas: numero(campos.gas),
    horas: numero(campos.horas),
    valorHora: numero(campos.valorHora),
    rendimento: parseInteiroBR(campos.rendimento) ?? 0,
  };
}
