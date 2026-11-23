import type { Estoque } from '@/shared/api/contracts/operations';
import type { StatusEstoque } from '@/shared/ui/badge';

// Origem: `lib/features/estoques/domain/entities/estoque_com_insumo.dart` e
// `presentation/widgets/estoque_card.dart` (docs/business-rules.md#estoque-de-insumos).
// Fica em `shared/domain/` porque o painel (FE-22) também conta os itens críticos.

type Saldo = Pick<Estoque, 'quantidadeDisponivel' | 'quantidadeMinima'>;

/** Abaixo do mínimo: o status Crítico e o filtro "Baixo". */
export function isBaixoEstoque({
  quantidadeDisponivel,
  quantidadeMinima,
}: Saldo) {
  return quantidadeDisponivel < quantidadeMinima;
}

/**
 * Disponível sobre o mínimo, em pontos percentuais; mínimo 0 dá 100, menos com
 * saldo negativo (FE-47), que dá 0: a barra não aparece cheia no Crítico.
 */
export function percentualEstoque({
  quantidadeDisponivel,
  quantidadeMinima,
}: Saldo) {
  if (quantidadeMinima > 0) {
    return (quantidadeDisponivel / quantidadeMinima) * 100;
  }
  return quantidadeDisponivel < 0 ? 0 : 100;
}

/**
 * A regra do mobile, ramo a ramo. "Baixo" nunca acontece com dados reais (abaixo de
 * 50% já é abaixo do mínimo), mas o ramo é mantido como no mobile.
 */
export function classificarStatusEstoque(
  baixoEstoque: boolean,
  percentual: number,
): StatusEstoque {
  if (baixoEstoque) return 'critico';
  if (percentual < 50) return 'baixo';
  return 'adequado';
}

export function statusEstoque(saldo: Saldo) {
  return classificarStatusEstoque(
    isBaixoEstoque(saldo),
    percentualEstoque(saldo),
  );
}

/** Preenchimento da barra, de 0 a 1. */
export function fracaoDaBarra(percentual: number) {
  return Math.min(Math.max(percentual / 100, 0), 1);
}
