import type { ComponentProps, ReactNode } from 'react';
import { cn } from './cn';
import {
  CONTROL_CLASSES,
  CONTROL_HEIGHT_CLASSES,
  FieldLayout,
  useFieldControl,
  type FieldProps,
} from './label';

type InputProps = ComponentProps<'input'> &
  FieldProps & {
    /** Ícone decorativo à esquerda, como a lupa da busca. */
    icon?: ReactNode;
  };

export function Input({
  label,
  error,
  hint,
  id,
  required,
  icon,
  className,
  ...props
}: InputProps) {
  const { controlProps, hintId, errorId } = useFieldControl({
    label,
    error,
    hint,
    id,
    required,
  });

  const input = (
    <input
      className={cn(
        CONTROL_CLASSES,
        CONTROL_HEIGHT_CLASSES,
        Boolean(icon) && 'pl-11',
        className,
      )}
      {...controlProps}
      {...props}
    />
  );

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
      {icon ? (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted">
            {icon}
          </span>
          {input}
        </div>
      ) : (
        input
      )}
    </FieldLayout>
  );
}
