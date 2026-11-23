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

/** Aba do `TabBar` do mobile: rótulo e indicador em Amora na ativa. */
export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        '-mb-px min-h-12 flex-1 cursor-pointer border-b-2 border-transparent px-4 py-2 text-body font-medium whitespace-nowrap text-ink-muted transition-colors duration-150',
        'hover:text-ink data-[state=active]:border-accent data-[state=active]:text-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
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
