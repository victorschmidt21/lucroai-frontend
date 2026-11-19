import {
  UNIDADE_MEDIDA_ROTULOS,
  type UnidadeMedida,
} from '@/shared/api/contracts/enums';
import { normalizarEspacos, SEM_VALOR } from './texto';

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const moeda4Casas = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

/**
 * O mesmo arredondamento do backend (`Number(valor.toFixed(2))`, ex.:
 * `arredondarValorMonetario` do `custo.service.ts`). Use nas prévias que
 * precisam bater com o valor gravado; no resto, arredonde só ao exibir.
 */
export function arredondarCentavos(valor: number) {
  return Number(valor.toFixed(2));
}

function semZeroNegativo(valor: number, casas: number) {
  // "-R$ 0,00" para -0,001 confunde: o que arredonda para zero é zero.
  return Number(valor.toFixed(casas)) === 0 ? 0 : valor;
}

/** `R$ 1.234,56`; negativo com sinal (`-R$ 12,30`); sem valor, `—`. */
export function formatMoeda(valor: number | null | undefined) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) {
    return SEM_VALOR;
  }

  return normalizarEspacos(moeda.format(semZeroNegativo(valor, 2)));
}

/**
 * Custo unitário do insumo, com 4 casas fixas e a unidade: `R$ 0,0240/g`.
 * O mobile corta os zeros à direita; a web segue a FE-05.
 */
export function formatCustoUnitario(
  valor: number | null | undefined,
  unidade: UnidadeMedida,
) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) {
    return SEM_VALOR;
  }

  const texto = normalizarEspacos(
    moeda4Casas.format(semZeroNegativo(valor, 4)),
  );

  return `${texto}/${UNIDADE_MEDIDA_ROTULOS[unidade]}`;
}
