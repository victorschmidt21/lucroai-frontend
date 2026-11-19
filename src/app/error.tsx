'use client';

import { Button } from '@/shared/ui/button';
import { StatusPage } from '@/shared/ui/status-page';

/** Erros fora de `(app)/error.tsx`, como uma falha no próprio layout de `(app)` ou no login. */
export default function RootError({ retry }: { retry: () => void }) {
  return (
    <StatusPage
      standalone
      alert
      title="Não foi possível carregar esta página"
      description="Tente novamente em instantes."
      action={<Button onClick={() => retry()}>Tentar novamente</Button>}
    />
  );
}
