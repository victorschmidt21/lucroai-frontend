'use client';

import { Button } from '@/shared/ui/button';
import { StatusPage } from '@/shared/ui/status-page';

/**
 * Erro inesperado numa tela, dentro do layout: o menu continua disponível.
 * Erros de dados da API ficam no `ErrorState` de cada bloco (docs/ui.md#estados).
 */
export default function AppError({ retry }: { retry: () => void }) {
  return (
    <StatusPage
      alert
      title="Não foi possível carregar esta página"
      description="Tente novamente em instantes."
      action={<Button onClick={() => retry()}>Tentar novamente</Button>}
    />
  );
}
