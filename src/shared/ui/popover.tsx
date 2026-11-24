'use client';

import { Popover as RadixPopover } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from './cn';

/**
 * Balão ancorado num elemento (FE-64), pelo Radix Popover: abre por clique, Enter
 * ou Espaço no `PopoverTrigger`, fecha com Esc ou clique fora e devolve o foco ao
 * gatilho. Não é modal: a tela continua rolando.
 */
export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverClose = RadixPopover.Close;

/** Conteúdo do balão: `surface-raised`, cantos de 20px, `shadow-elevacao`, até 360px. */
export function PopoverContent({
  className,
  sideOffset = 8,
  collisionPadding = 16,
  ...props
}: ComponentProps<typeof RadixPopover.Content>) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'z-50 flex w-[min(22.5rem,calc(100vw-2rem))] animate-surgir flex-col gap-3 rounded-lg bg-surface-raised p-5 text-ink shadow-elevacao',
          className,
        )}
        {...props}
      />
    </RadixPopover.Portal>
  );
}
