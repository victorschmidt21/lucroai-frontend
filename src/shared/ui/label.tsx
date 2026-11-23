import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import { cn } from './cn';
import { IconErro } from './icons/acoes';

type LabelProps = ComponentProps<'label'> & {
  required?: boolean;
};

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-body font-medium text-ink-muted', className)}
      {...props}
    >
      {children}
      {required ? <span aria-hidden="true"> *</span> : null}
    </label>
  );
}

export function FieldError({
  className,
  children,
  ...props
}: ComponentProps<'p'>) {
  return (
    <p
      role="alert"
      className={cn('flex items-start gap-1 text-small text-danger', className)}
      {...props}
    >
      <IconErro className="size-4" />
      {children}
    </p>
  );
}

export type FieldControlProps = {
  id: string;
  required?: boolean;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
};

export type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  id?: string;
  required?: boolean;
};

/** Liga rótulo, dica e erro ao controle, para o leitor de tela anunciar os três. */
export function useFieldControl({ id, error, hint, required }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-dica` : undefined;
  const errorId = error ? `${controlId}-erro` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ');

  const controlProps: FieldControlProps = {
    id: controlId,
    required,
    ...(error ? { 'aria-invalid': true } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
  };

  return { controlProps, hintId, errorId };
}

type FieldLayoutProps = FieldProps & {
  /** Rótulo só para leitor de tela, quando o contexto já diz o que é (a busca). */
  hideLabel?: boolean;
  controlId: string;
  hintId?: string;
  errorId?: string;
  children: ReactNode;
};

export function FieldLayout({
  label,
  error,
  hint,
  required,
  controlId,
  hintId,
  errorId,
  hideLabel = false,
  children,
}: FieldLayoutProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label
        htmlFor={controlId}
        required={required}
        className={cn(hideLabel && 'sr-only')}
      >
        {label}
      </Label>
      {children}
      {hint ? (
        <p id={hintId} className="text-small text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

/**
 * Campo: fundo `surface-alt` (Merengue), borda `border-field` (3:1 não textual,
 * FE-51), cantos de 14px e borda `accent` no foco. Texto de 16px, para o
 * iOS não ampliar a tela ao focar.
 */
export const CONTROL_CLASSES =
  'w-full rounded-md border border-border-field bg-surface-alt px-4 py-2 text-field text-ink transition-colors duration-150 placeholder:text-ink-subtle not-disabled:hover:border-ink focus-visible:border-accent focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger';

/** 48px de altura em qualquer tela (área de toque da marca, FE-53). */
export const CONTROL_HEIGHT_CLASSES = 'min-h-12';
