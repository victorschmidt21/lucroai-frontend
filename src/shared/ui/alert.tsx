import type { ComponentProps } from 'react';
import { cn } from './cn';
import { IconAlerta, IconErro } from './icons/acoes';

/**
 * Aviso que não bloqueia (FE-78): borda e fundo `warning`, com o ícone de
 * alerta e o texto em `ink`. Sem papel ARIA: para anunciar ao mudar, ponha
 * dentro de um `<output>`.
 */
export function Aviso({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border border-warning/40 bg-warning/8 p-3 text-body wrap-anywhere text-ink',
        className,
      )}
      {...props}
    >
      <IconAlerta className="shrink-0 text-warning" />
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
    </div>
  );
}

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
