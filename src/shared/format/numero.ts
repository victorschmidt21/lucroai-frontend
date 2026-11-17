import {
  UNIDADE_MEDIDA_ROTULOS,
  type UnidadeMedida,
} from '@/shared/api/contracts/enums';
import { normalizarEspacos, SEM_VALOR } from './texto';

const formatadores = new Map<string, Intl.NumberFormat>();

function formatador(minimo: number, maximo: number) {
  const chave = `${minimo}-${maximo}`;
  let atual = formatadores.get(chave);

  if (!atual) {
    atual = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: minimo,
      maximumFractionDigits: maximo,
    });
    formatadores.set(chave, atual);
  }

  return atual;
}

function isSemValor(
  valor: number | null | undefined,
): valor is null | undefined {
  return valor === null || valor === undefined || Number.isNaN(valor);
}

function formatar(valor: number, minimo: number, maximo: number) {
  // Sem "-0": o que arredonda para zero é zero.
  const seguro = Number(valor.toFixed(maximo)) === 0 ? 0 : valor;

  return normalizarEspacos(formatador(minimo, maximo).format(seguro));
}

/** Número com separador de milhar e `casas` decimais fixas: `1.200`, `2,50`. */
export function formatNumero(valor: number | null | undefined, casas = 0) {
  return isSemValor(valor) ? SEM_VALOR : formatar(valor, casas, casas);
}

/**
 * Quantidade de insumo e de estoque: até 3 casas, sem zeros à direita, com a
 * unidade quando informada (`1,5 kg`, `0,25 kg`, `12 un`).
 */
export function formatQuantidade(
  valor: number | null | undefined,
  unidade?: UnidadeMedida,
) {
  if (isSemValor(valor)) return SEM_VALOR;

  const numero = formatar(valor, 0, 3);

  return unidade ? `${numero} ${UNIDADE_MEDIDA_ROTULOS[unidade]}` : numero;
}

/**
 * Percentual com 1 casa: `86,0%`. Recebe pontos percentuais (`86`), não a
 * fração do contrato (`0.86`): para margens, use `fracaoParaPercentual` antes.
 */
export function formatPercentual(pontos: number | null | undefined) {
  return isSemValor(pontos) ? SEM_VALOR : `${formatar(pontos, 1, 1)}%`;
}

/** Margem do contrato (`0.6`) em pontos percentuais (`60`). */
export function fracaoParaPercentual(fracao: number) {
  // Arredonda o ruído de ponto flutuante (0.07 * 100 = 7.000000000000001).
  return Number((fracao * 100).toFixed(10));
}
