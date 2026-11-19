'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { handleSessaoExpirada } from '@/shared/auth/sessao-expirada';
import { getQueryClient } from './query-client';

/**
 * Provider do TanStack Query, renderizado pelos layouts de `(auth)` (FE-07) e
 * de `(app)` (FE-08) em volta de `children`, com os padrões de
 * `makeQueryClient`. Um 401 em qualquer query ou mutação leva ao login, com a
 * rota atual em `redirect` e o aviso de sessão expirada.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={getQueryClient({ onSessaoExpirada: handleSessaoExpirada })}
    >
      {children}
    </QueryClientProvider>
  );
}
