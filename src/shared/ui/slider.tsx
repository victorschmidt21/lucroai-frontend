'use client';

import { Slider as RadixSlider } from 'radix-ui';
import { useId } from 'react';
import { cn } from './cn';

type SliderProps = {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Texto do valor, exibido e anunciado (`aria-valuetext`), como "R$ 1,50". */
  formatValue?: (value: number) => string;
  /** Texto de apoio sob o título, como a variação em relação ao atual. */
  hint?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Controle deslizante da simulação (`_SliderCard` de simulacao_page.dart): título,
 * valor em Amora, trilho `border-strong` de 8px, polegar de 24px com borda
 * `surface` (FE-55) e os limites embaixo. Radix Slider: setas,
 * Page Up/Down, Home e End.
 */
export function Slider({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  formatValue = String,
  hint,
  disabled,
  className,
}: SliderProps) {
  const labelId = useId();
  const hintId = useId();

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={labelId} className="text-body font-medium text-ink">
          {label}
        </span>
        <output
          aria-hidden="true"
          className="text-title text-accent tabular-nums"
        >
          {formatValue(value)}
        </output>
      </div>
      {hint ? (
        <p id={hintId} className="text-small text-ink-muted">
          {hint}
        </p>
      ) : null}
      <RadixSlider.Root
        value={[value]}
        onValueChange={([next]) => onValueChange(next)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="relative flex h-11 w-full touch-none items-center select-none data-disabled:opacity-50"
      >
        <RadixSlider.Track className="relative h-2 grow overflow-hidden rounded-full bg-border-strong">
          <RadixSlider.Range className="absolute h-full rounded-full bg-accent" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          aria-labelledby={labelId}
          aria-describedby={hint ? hintId : undefined}
          aria-valuetext={formatValue(value)}
          className="block size-6 cursor-grab rounded-full border-[3px] border-surface bg-accent shadow-elevacao transition-shadow duration-150 hover:ring-8 hover:ring-accent-soft"
        />
      </RadixSlider.Root>
      <div
        aria-hidden="true"
        className="flex justify-between text-caption text-ink-muted tabular-nums"
      >
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
