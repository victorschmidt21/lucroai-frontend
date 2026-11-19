/** Valor ausente (`null` ou campo omitido): nunca `R$ 0,00` nem `0`. */
export const SEM_VALOR = '—';

/**
 * O `Intl` separa "R$" do número com espaço inquebrável (U+00A0). Trocamos por
 * espaço comum para o texto bater com o de docs/business-rules.md e com os
 * testes; onde a quebra de linha incomodar, use `whitespace-nowrap`.
 */
export function normalizarEspacos(texto: string) {
  return texto.replace(/[  ]/g, ' ');
}
