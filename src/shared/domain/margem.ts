import { formatNumero } from '@/shared/format/numero';

/**
 * Margem em linguagem de cozinha (FE-57): "R$ X de cada R$ 100", com a margem
 * (em pontos percentuais) arredondada a inteiro. Margem negativa não usa a
 * frase: devolve `null`, e a tela diz que a venda ficou abaixo do custo.
 */
export function porCadaCemReais(margem: number): string | null {
  if (margem < 0) return null;
  return `R$ ${formatNumero(Math.round(margem))} de cada R$ 100`;
}
