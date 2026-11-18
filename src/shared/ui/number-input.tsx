import type { ComponentProps } from 'react';
import { formatNumeroEditavel, parseNumeroBR } from '@/shared/format/numero-br';
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

type CampoNumericoProps = Omit<
  NumberInputProps,
  'value' | 'defaultValue' | 'onChange' | 'prefixo' | 'sufixo' | 'inputMode'
> & {
  /** Texto digitado; o schema converte com `numeroBR()` ou `inteiroBR()`. */
  value: string;
  onValueChange: (texto: string) => void;
};

type ComportamentoNumerico = {
  /** Caracteres removidos ao digitar ou colar. */
  recusar: RegExp;
  /** Reescreve o texto ao sair do campo, para mostrar como o número foi lido. */
  formatarAoSair?: (texto: string) => string;
  prefixo?: string;
  sufixo?: string;
  inputMode: 'decimal' | 'numeric';
};

// O teclado decimal do mobile (`numberWithOptions(decimal: true)`) não tem sinal.
const NAO_DECIMAL = /[^\d.,]/g;
const NAO_DIGITO = /\D/g;

function formatarDecimal(casas?: number) {
  return (texto: string) => {
    const numero = parseNumeroBR(texto);

    return numero === null ? texto : formatNumeroEditavel(numero, casas);
  };
}

function CampoNumerico({
  value,
  onValueChange,
  onBlur,
  recusar,
  formatarAoSair,
  ...props
}: CampoNumericoProps & ComportamentoNumerico) {
  return (
    <NumberInput
      {...props}
      value={value}
      onChange={(event) =>
        onValueChange(event.target.value.replace(recusar, ''))
      }
      onBlur={(event) => {
        const formatado = formatarAoSair?.(value) ?? value;

        if (formatado !== value) onValueChange(formatado);
        onBlur?.(event);
      }}
    />
  );
}

/** Dinheiro: `R$` à esquerda; ao sair, mostra 2 casas (`1234.5` vira `1.234,50`). */
export function MoneyInput(props: CampoNumericoProps) {
  return (
    <CampoNumerico
      placeholder="0,00"
      {...props}
      prefixo="R$"
      inputMode="decimal"
      recusar={NAO_DECIMAL}
      formatarAoSair={formatarDecimal(2)}
    />
  );
}

/** Quantidade com a unidade à direita (`kg`); ao sair, mostra no padrão brasileiro. */
export function DecimalInput({
  unidade,
  ...props
}: CampoNumericoProps & { unidade?: string }) {
  return (
    <CampoNumerico
      {...props}
      sufixo={unidade}
      inputMode="decimal"
      recusar={NAO_DECIMAL}
      formatarAoSair={formatarDecimal()}
    />
  );
}

/** Rendimento, lotes, quantidade vendida e volume: só aceita dígitos. */
export function IntegerInput(props: CampoNumericoProps) {
  return <CampoNumerico {...props} inputMode="numeric" recusar={NAO_DIGITO} />;
}

/**
 * Margem em pontos percentuais (`30`), com `%` à direita. A fração do contrato
 * (`0.3`) é calculada na função `to...Body`, com `percentualParaFracao`.
 */
export function PercentInput(props: CampoNumericoProps) {
  return (
    <CampoNumerico
      {...props}
      sufixo="%"
      inputMode="decimal"
      recusar={NAO_DECIMAL}
      formatarAoSair={formatarDecimal()}
    />
  );
}
