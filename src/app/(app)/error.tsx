'use client';

import { Button } from '@/shared/ui/button';
import { IlustracaoSemConexao } from '@/shared/ui/ilustracoes';
import { StatusPage } from '@/shared/ui/status-page';

/**
 * Erro inesperado numa tela, dentro do layout: o menu continua disponível.
 * Erros de dados da API ficam no `ErrorState` de cada bloco (docs/ui.md#estados).
 */
export default function AppError({ retry }: { retry: () => void }) {
  return (
    <StatusPage
      alert
      ilustracao={<IlustracaoSemConexao />}
      title="Não foi possível carregar esta página"
      description="Tente de novo em instantes."
      action={<Button onClick={() => retry()}>Tentar de novo</Button>}
    />
  );
}
