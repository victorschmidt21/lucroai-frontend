import { Fredoka, Nunito } from 'next/font/google';

// Fontes da marca Doce Fatia (FE-53, docs/marca.md#tipografia). O `next/font`
// hospeda os arquivos no próprio servidor: o navegador não chama o Google.

/**
 * Fredoka: títulos, números de destaque e logotipo; nunca em texto corrido. A
 * variável se chama `--font-fredoka`, e não `--font-display`, porque o tema do
 * Tailwind já define `--font-display` (o utilitário `font-display`) a partir dela.
 */
export const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-fredoka',
  display: 'swap',
});

/** Nunito: interface e texto. */
export const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});
