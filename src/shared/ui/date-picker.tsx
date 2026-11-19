import { useId } from 'react';
import { cn } from './cn';
import { FieldError } from './label';
import { Input } from './input';

export type Periodo = {
  /** `YYYY-MM-DD`; vazio quando não escolhido. */
  inicio: string;
  fim: string;
};

export const PERIODO_INVALIDO =
  'A data inicial não pode ser depois da data final.';

/** Datas `YYYY-MM-DD` se comparam como texto, sem `new Date()` e sem fuso. */
export function isPeriodoValido({ inicio, fim }: Periodo) {
  return !inicio || !fim || inicio <= fim;
}

type DateRangePickerProps = {
  /** Nome do grupo, como "Período". */
  legend: string;
  value: Periodo;
  onChange: (value: Periodo) => void;
  className?: string;
};

/**
 * Período do histórico de vendas ("Data inicial" e "Data final"). Usa
 * `<input type="date">`: calendário do sistema no celular, teclado no desktop e o
 * valor já em `YYYY-MM-DD`, o formato da URL. Data inicial depois da final mostra
 * o erro de docs/business-rules.md e quem usa não deve buscar.
 */
export function DateRangePicker({
  legend,
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const errorId = useId();
  const valido = isPeriodoValido(value);
  const erroProps = valido
    ? {}
    : { 'aria-invalid': true, 'aria-describedby': errorId };

  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-2', className)}>
      <legend className="mb-2 text-section-label text-ink-muted">
        {legend}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="date"
          label="Data inicial"
          value={value.inicio}
          max={value.fim || undefined}
          onChange={(event) =>
            onChange({ ...value, inicio: event.target.value })
          }
          {...erroProps}
        />
        <Input
          type="date"
          label="Data final"
          value={value.fim}
          min={value.inicio || undefined}
          onChange={(event) => onChange({ ...value, fim: event.target.value })}
          {...erroProps}
        />
      </div>
      {valido ? null : <FieldError id={errorId}>{PERIODO_INVALIDO}</FieldError>}
    </fieldset>
  );
}
