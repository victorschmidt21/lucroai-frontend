'use client';

import { useSyncExternalStore } from 'react';

/** `md` do Tailwind (48rem): a partir daqui a interface é de computador. */
export const MEDIA_COMPUTADOR = '(min-width: 48rem)';

/**
 * Diz se a media query vale, acompanhando a troca de largura. No servidor, e onde
 * não há `matchMedia` (jsdom), devolve `false`: a versão de celular.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      if (typeof window.matchMedia !== 'function') return () => {};
      const lista = window.matchMedia(query);
      lista.addEventListener('change', avisar);
      return () => lista.removeEventListener('change', avisar);
    },
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches,
    () => false,
  );
}
