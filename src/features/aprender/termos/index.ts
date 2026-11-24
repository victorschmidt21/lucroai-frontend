import type { Termo } from '../aprender.schema';
import { TERMOS_CUSTOS } from './custos';
import { TERMOS_ESTOQUE } from './estoque';
import { TERMOS_PRECO } from './preco';
import { TERMOS_VENDAS } from './vendas';

/** Todos os termos, na ordem dos assuntos: custos, preço, vendas e estoque. */
export const TERMOS = [
  ...TERMOS_CUSTOS,
  ...TERMOS_PRECO,
  ...TERMOS_VENDAS,
  ...TERMOS_ESTOQUE,
];

/** União dos ids dos termos: um id inexistente dá erro de tipo. */
export type TermoId = (typeof TERMOS)[number]['id'];

const TERMOS_POR_ID = new Map<string, Termo>(
  TERMOS.map((termo) => [termo.id, termo]),
);

/** Diz se o texto (de uma URL, por exemplo) é o id de um termo. */
export function isTermoId(id: string): id is TermoId {
  return TERMOS_POR_ID.has(id);
}

export function buscarTermo(id: TermoId): Termo;
export function buscarTermo(id: string): Termo | undefined;
export function buscarTermo(id: string): Termo | undefined {
  return TERMOS_POR_ID.get(id);
}
