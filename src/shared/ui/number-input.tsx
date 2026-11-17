import type { ComponentProps } from 'react';
import { cn } from './cn';
import {
  CONTROL_CLASSES,
  CONTROL_HEIGHT_CLASSES,
  FieldLayout,
  useFieldControl,
  type FieldProps,
} from './label';

type NumberInputProps = Omit<ComponentProps<'input'>, 'type' | 'prefix'> &
  FieldProps & {
    /** Texto fixo à esquerda, como `R$`. */
    prefixo?: string;
    /** Texto fixo à direita, como a unidade (`kg`) ou `%`. */
    sufixo?: string;
  };

/**
 * Base dos campos numéricos brasileiros (FE-06). Guarda o texto digitado: `type="text"`
 * aceita vírgula, e `inputMode` abre o teclado numérico no celular. A conversão fica
 * no schema do formulário (`numeroBR()`), não aqui.
 */
export function NumberInput({
  label,
  error,
  hint,
  id,
  required,
  prefixo,
  sufixo,
  inputMode = 'decimal',
  className,
  ...props
}: NumberInputProps) {
  const { controlProps, hintId, errorId } = useFieldControl({
    label,
    error,
    hint,
    id,
    required,
  });

  return (
    <FieldLayout
      label={label}
      error={error}
      hint={hint}
      required={required}
      controlId={controlProps.id}
      hintId={hintId}
      errorId={errorId}
    >
      <div className="relative">
        {prefixo ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-field text-ink-muted"
          >
            {prefixo}
          </span>
        ) : null}
        <input
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          className={cn(
            CONTROL_CLASSES,
            CONTROL_HEIGHT_CLASSES,
            'tabular-nums',
            Boolean(prefixo) && 'pl-12',
            Boolean(sufixo) && 'pr-12',
            className,
          )}
          {...controlProps}
          {...props}
        />
        {sufixo ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-field text-ink-muted"
          >
            {sufixo}
          </span>
        ) : null}
      </div>
    </FieldLayout>
  );
}
