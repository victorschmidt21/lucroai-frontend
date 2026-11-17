'use client';

import { ToggleGroup } from 'radix-ui';
import { cn } from './cn';
import { IconCheck } from './icons/acoes';

export type SegmentedOption<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  /** Nome do grupo para o leitor de tela, como "Status". */
  'aria-label': string;
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
};

/**
 * Escolha única entre poucas opções, como o `SegmentedButton` "Todos / Baixo" do
 * estoque. Radix ToggleGroup: setas movem o foco, Enter e Espaço escolhem.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      // O Radix devolve '' ao clicar na opção já escolhida; um filtro sempre tem uma.
      onValueChange={(next) => {
        const opcao = options.find((option) => option.value === next);
        if (opcao) onValueChange(opcao.value);
      }}
      className={cn(
        'inline-flex max-w-full overflow-hidden rounded-full border border-ink-subtle',
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className={cn(
            'group inline-flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 px-4 text-body font-medium whitespace-nowrap text-ink transition-colors duration-150 lg:min-h-10',
            'not-first:border-l not-first:border-ink-subtle hover:bg-surface-alt',
            'data-[state=on]:bg-accent-strong data-[state=on]:text-on-accent',
            'focus-visible:-outline-offset-4',
          )}
        >
          <IconCheck className="hidden size-4 group-data-[state=on]:block" />
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
