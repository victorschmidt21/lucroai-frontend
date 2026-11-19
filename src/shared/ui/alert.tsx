import type { ComponentProps } from 'react';
import { cn } from './cn';
import { IconErro } from './icons/acoes';

/** Erro que não pertence a um campo: formulário, diálogo ou login. */
export function Alert({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-md border border-danger/40 bg-danger/8 p-3 text-body wrap-anywhere text-ink',
        className,
      )}
      {...props}
    >
      <IconErro className="text-danger" />
      {children}
    </div>
  );
}
