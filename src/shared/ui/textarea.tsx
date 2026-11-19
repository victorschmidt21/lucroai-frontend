import type { ComponentProps } from 'react';
import { cn } from './cn';
import {
  CONTROL_CLASSES,
  FieldLayout,
  useFieldControl,
  type FieldProps,
} from './label';

type TextareaProps = ComponentProps<'textarea'> & FieldProps;

export function Textarea({
  label,
  error,
  hint,
  id,
  required,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
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
      <textarea
        rows={rows}
        className={cn(CONTROL_CLASSES, 'py-3', className)}
        {...controlProps}
        {...props}
      />
    </FieldLayout>
  );
}
