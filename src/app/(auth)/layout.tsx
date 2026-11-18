import type { ReactNode } from 'react';
import { QueryProvider } from '@/shared/api/query-provider';

/** Layout do login: só a marca e o formulário, centralizados, sem menu. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <main className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
        <div className="flex w-full max-w-105 flex-col gap-8">{children}</div>
      </main>
    </QueryProvider>
  );
}
