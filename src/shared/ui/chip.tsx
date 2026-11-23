'use client';

import { Toggle } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from './cn';
import { IconCheck } from './icons/acoes';

const CHIP_CLASSES =
  'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-small font-semibold whitespace-nowrap';

/** Rótulo estático, sem ação (ex.: categoria do insumo). */
export function Chip({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        CHIP_CLASSES,
        'border-border bg-surface-alt text-ink-muted',
        className,
      )}
      {...props}
    />
  );
}

type ToggleChipProps = Omit<
  ComponentProps<typeof Toggle.Root>,
  'pressed' | 'onPressedChange' | 'defaultPressed'
> & {
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
};

/**
 * Chip que liga e desliga, como o `FilterChip` dos gastos na produção
 * (producoes_page.dart). Botão com `aria-pressed`, pelo Radix Toggle. Selecionado:
 * fundo `accent-soft`, texto `ink` e borda `accent` (FE-51).
 */
export function ToggleChip({
  selected,
  defaultSelected,
  onSelectedChange,
  className,
  children,
  ...props
}: ToggleChipProps) {
  return (
    <Toggle.Root
      pressed={selected}
      defaultPressed={defaultSelected}
      onPressedChange={onSelectedChange}
      className={cn(
        CHIP_CLASSES,
        // 48px de alvo de toque sem aumentar o chip (32px + 8px em cima e embaixo).
        'group relative cursor-pointer transition-colors duration-150 before:absolute before:-inset-y-2 before:inset-x-0',
        'border-border-field bg-surface text-ink-muted not-disabled:hover:text-ink',
        'data-[state=on]:border-accent data-[state=on]:bg-accent-soft data-[state=on]:text-ink',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <IconCheck className="hidden size-4 group-data-[state=on]:block" />
      {children}
    </Toggle.Root>
  );
}
