import type { ReactNode } from 'react';
import { cn } from '../cn';

export type IlustracaoProps = { className?: string };

/**
 * Base das ilustrações "spot" da marca (FE-59): `viewBox` de 64, contorno `accent`
 * de 2,5px com pontas arredondadas e preenchimentos por token (`surface-alt`,
 * `accent-soft` e um detalhe em `highlight`), então funcionam no claro e no noite.
 * Decorativas: o texto ao lado diz o que aconteceu. 80px por padrão.
 */
export function Ilustracao({
  nome,
  className,
  children,
}: IlustracaoProps & { nome: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-ilustracao-nome={nome}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-20 shrink-0 fill-none stroke-accent', className)}
    >
      {children}
    </svg>
  );
}
