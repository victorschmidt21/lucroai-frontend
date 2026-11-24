import { normalizarTexto } from '@/shared/api/filtros';
import type { Termo } from './aprender.schema';
import { TERMOS } from './termos';

/**
 * Busca da página Aprender (FE-67): ignora acento e caixa e procura no título,
 * nos sinônimos e no `curto`. Ordem: título que começa com o texto, depois
 * sinônimo igual ao texto, depois o resto; dentro de cada grupo, a ordem da base.
 * Texto vazio devolve todos os termos.
 */
export function buscarTermos(
  q: string,
  termos: readonly Termo[] = TERMOS,
): Termo[] {
  const busca = normalizarTexto(q.trim());

  if (!busca) return [...termos];

  const comPrioridade = termos.flatMap((termo) => {
    const prioridade = prioridadeDoTermo(termo, busca);
    return prioridade === null ? [] : [{ termo, prioridade }];
  });

  // `toSorted` é estável: a ordem da base vale dentro de cada grupo.
  return comPrioridade
    .toSorted((a, b) => a.prioridade - b.prioridade)
    .map(({ termo }) => termo);
}

function prioridadeDoTermo(termo: Termo, busca: string): number | null {
  const titulo = normalizarTexto(termo.titulo);
  const sinonimos = termo.sinonimos.map(normalizarTexto);

  if (titulo.startsWith(busca)) return 0;
  if (sinonimos.includes(busca)) return 1;
  if (
    titulo.includes(busca) ||
    sinonimos.some((sinonimo) => sinonimo.includes(busca)) ||
    normalizarTexto(termo.curto).includes(busca)
  ) {
    return 2;
  }
  return null;
}
