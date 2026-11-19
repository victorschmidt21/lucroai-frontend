import { useMemo, useSyncExternalStore } from 'react';

/*
 * Substituto de `next/navigation` nos testes de componente, sobre a URL do jsdom:
 *
 *   vi.mock('next/navigation', () => import('@/test/next-navigation'));
 *
 * `router.replace` e `router.push` trocam a URL e avisam os componentes, como no
 * Next; `setTestUrl()` define a URL inicial do teste.
 */

const ouvintes = new Set<() => void>();

function avisar() {
  for (const ouvinte of ouvintes) ouvinte();
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function lerUrl() {
  return `${window.location.pathname}${window.location.search}`;
}

/** Define a URL atual (`/insumos?q=acucar`) antes de renderizar. */
export function setTestUrl(url: string) {
  window.history.replaceState(null, '', url);
  avisar();
}

const router = {
  replace: (href: string) => setTestUrl(href),
  push: (href: string) => {
    window.history.pushState(null, '', href);
    avisar();
  },
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => undefined,
  prefetch: () => undefined,
};

export function useRouter() {
  return router;
}

export function usePathname() {
  const url = useSyncExternalStore(assinar, lerUrl);

  return new URL(url, window.location.origin).pathname;
}

export function useSearchParams() {
  const url = useSyncExternalStore(assinar, lerUrl);

  return useMemo(
    () => new URL(url, window.location.origin).searchParams,
    [url],
  );
}

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND');
}
