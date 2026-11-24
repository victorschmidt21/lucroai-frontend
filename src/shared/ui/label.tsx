import type { ComponentProps, ReactNode } from 'react';
import { isValidElement, useId } from 'react';
import { cn } from './cn';
import { IconErro } from './icons/acoes';

type LabelProps = ComponentProps<'label'> & {
  required?: boolean;
};

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-small font-extrabold text-ink', className)}
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
  'aria-labelledby'?: string;
};

export type FieldProps = {
  /**
   * Texto ou nó do rótulo. Um nó (com um `<Termo>`, FE-64) ganha um texto só para
   * leitor de tela, ligado ao campo por `aria-labelledby`: assim o campo é anunciado
   * pelo rótulo, e não pelo "O que é...?" do botão da Pitada.
   */
  label: ReactNode;
  error?: string;
  hint?: string;
  id?: string;
  required?: boolean;
};

/** Texto puro de um rótulo em nó (`<>Rende <Termo>quanto</Termo></>` vira "Rende quanto"). */
export function textoDoNo(no: ReactNode): string {
  if (typeof no === 'string' || typeof no === 'number') return String(no);
  if (Array.isArray(no)) return no.map(textoDoNo).join('');
  if (isValidElement<{ children?: ReactNode }>(no)) {
    return textoDoNo(no.props.children);
  }
  return '';
}

function rotuloEmNo(label: ReactNode) {
  return typeof label !== 'string' && typeof label !== 'number';
}

/** Liga rótulo, dica e erro ao controle, para o leitor de tela anunciar os três. */
export function useFieldControl({
  id,
  error,
  hint,
  required,
  label,
}: FieldProps) {
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
    ...(rotuloEmNo(label) ? { 'aria-labelledby': `${controlId}-rotulo` } : {}),
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
      {rotuloEmNo(label) ? (
        <span id={`${controlId}-rotulo`} hidden>
          {textoDoNo(label)}
        </span>
      ) : null}
      {children}
      {hint ? (
        <p id={hintId} className="text-caption font-normal text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

/**
 * Campo (FE-55): fundo `surface`, borda de 2px `border-field` (3:1 não textual),
 * cantos de 14px. No foco, borda `accent` e anel de 4px `accent-soft`, no lugar do
 * contorno global; com erro, borda `danger`. Texto de 16px, para o iOS não ampliar
 * a tela ao focar. `focus:` e não `focus-visible:`, para o campo de data também
 * mostrar o foco quando o Tab passa pelo botão do calendário (FE-23).
 */
export const CONTROL_CLASSES =
  'w-full rounded-md border-2 border-border-field bg-surface px-4 py-2 text-field text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-subtle not-disabled:hover:border-ink focus:border-accent focus:ring-4 focus:ring-accent-soft focus:outline-none disabled:cursor-default disabled:opacity-50 aria-invalid:border-danger';

/** 48px de altura em qualquer tela (área de toque da marca, FE-53). */
export const CONTROL_HEIGHT_CLASSES = 'min-h-12';
