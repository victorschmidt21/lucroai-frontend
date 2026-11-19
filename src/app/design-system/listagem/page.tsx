import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ListFormShowcase } from '@/features/design-system/components/list-form-showcase';
import { QueryProvider } from '@/shared/api/query-provider';
import { ToastProvider } from '@/shared/ui/toast';

export const metadata: Metadata = {
  title: 'Listagem e formulário',
  robots: { index: false, follow: false },
};

/**
 * Exemplo funcionando da `ListPage`, do `FormDialog` e dos campos numéricos, com
 * uma API em memória. Só em desenvolvimento, como `/design-system` (no build, 404).
 */
export default function ListagemExemploPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <QueryProvider>
      <ToastProvider>
        {/* A busca lê a URL com `useSearchParams`. */}
        <Suspense>
          <ListFormShowcase />
        </Suspense>
      </ToastProvider>
    </QueryProvider>
  );
}
