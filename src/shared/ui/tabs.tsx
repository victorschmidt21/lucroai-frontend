'use client';

import { Tabs as RadixTabs } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from './cn';

export const Tabs = RadixTabs.Root;

/** Dê um `aria-label` ao `TabsList`, como "Seções de vendas". */
export function TabsList({
  className,
  ...props
}: ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn('flex overflow-x-auto border-b border-border', className)}
      {...props}
    />
  );
}

/** Aba do `TabBar` do mobile: na ativa, texto Amora e sublinhado arredondado de 3px (FE-55). */
export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'relative min-h-12 flex-1 cursor-pointer px-4 py-2 text-body font-bold whitespace-nowrap text-ink-muted transition-colors duration-150',
        'after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-transparent',
        'hover:text-ink data-[state=active]:text-accent data-[state=active]:after:bg-accent',
        'disabled:cursor-default disabled:opacity-50',
        'focus-visible:-outline-offset-2',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn('pt-4', className)} {...props} />;
}
