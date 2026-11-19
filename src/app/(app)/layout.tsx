import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { UserMenu } from '@/features/auth/components/user-menu';
import { AppShell } from '@/features/navegacao/components/app-shell';
import { QueryProvider } from '@/shared/api/query-provider';
import { sessaoKeys } from '@/shared/auth/usuario-atual.queries';
import { getUsuarioAtual } from '@/shared/auth/usuario-atual.server';
import { ToastProvider } from '@/shared/ui/toast';

/**
 * Layout das telas internas: sessão obrigatória (sem ela, `getUsuarioAtual()`
 * leva ao login com a rota atual), TanStack Query, Toast e o menu.
 *
 * Sem `loading.tsx` neste grupo: com ele, a resposta começaria antes da
 * conferência da sessão, e o 404 sairia com status 200.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const usuario = await getUsuarioAtual();

  // O menu do usuário já abre preenchido, sem repetir no navegador a leitura
  // da sessão feita aqui. Ela é conferida de novo quando os dados ficam velhos.
  const queryClient = new QueryClient();
  queryClient.setQueryData(sessaoKeys.usuario(), usuario);

  return (
    <QueryProvider>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ToastProvider>
          <AppShell userMenu={<UserMenu />}>{children}</AppShell>
        </ToastProvider>
      </HydrationBoundary>
    </QueryProvider>
  );
}
