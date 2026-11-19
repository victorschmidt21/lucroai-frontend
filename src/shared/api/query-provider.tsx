'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getQueryClient } from './query-client';

/**
 * Provider do TanStack Query, renderizado pelo layout de `(app)` (FE-08) em
 * volta de `children`, com os padrões de `makeQueryClient`.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
