import type { ComponentProps } from 'react';
import { cn } from './cn';
import { IconChevronBaixo } from './icons/acoes';
import {
  CONTROL_CLASSES,
  CONTROL_HEIGHT_CLASSES,
  FieldLayout,
  useFieldControl,
  type FieldProps,
} from './label';

type SelectProps = ComponentProps<'select'> & FieldProps;

/**
 * `<select>` nativo, como na Urbizzi: teclado, leitor de tela e o seletor do celular
 * já funcionam, e ele aceita `{...register('campo')}`. A seta laranja repete o
 * `iconEnabledColor` do `DropdownButtonFormField` do mobile.
 */
export function Select({
  label,
  error,
  hint,
  id,
  required,
  className,
  children,
  ...props
}: SelectProps) {
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
        <select
          className={cn(
            CONTROL_CLASSES,
            CONTROL_HEIGHT_CLASSES,
            'cursor-pointer appearance-none pr-11',
            className,
          )}
          {...controlProps}
          {...props}
        >
          {children}
        </select>
        <IconChevronBaixo className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-accent" />
      </div>
    </FieldLayout>
  );
}
