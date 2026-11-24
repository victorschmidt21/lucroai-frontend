'use client';

import { useAvisos } from '@/shared/avisos/avisos-context';
import { IconButton } from '@/shared/ui/button';
import { IconAvisos } from '@/shared/ui/icons/acoes';

/**
 * Ícone com contador no topo (FE-47): reabre a lista de avisos depois de
 * fechada. Some quando não há alertas.
 */
export function IndicadorAvisos() {
  const { total, abrir } = useAvisos();

  if (total === 0) return null;

  return (
    <IconButton
      aria-label={total === 1 ? 'Ver 1 aviso' : `Ver ${total} avisos`}
      onClick={abrir}
      className="relative text-warning"
    >
      <IconAvisos />
      <span
        aria-hidden="true"
        className="absolute top-0.5 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger-strong px-1 text-caption leading-4 font-bold text-on-danger"
      >
        {total}
      </span>
    </IconButton>
  );
}
