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
  /**
   * Cada opção com a largura do próprio texto, em vez de larguras iguais: para
   * rótulos de tamanhos diferentes caberem em 360px, como "Igual ao celular".
   */
  larguraDoTexto?: boolean;
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
  larguraDoTexto = false,
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
        'inline-flex max-w-full overflow-hidden rounded-full border border-border-field',
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className={cn(
            // O rótulo quebra em duas linhas quando não cabe (texto de 16px em 360px, FE-53).
            'group inline-flex min-h-12 min-w-0 cursor-pointer items-center justify-center gap-1.5 py-1.5 text-center text-body font-semibold text-balance text-ink transition-colors duration-150',
            larguraDoTexto ? 'flex-auto px-3' : 'flex-1 px-4',
            'not-first:border-l not-first:border-border-field hover:bg-surface-alt',
            'data-[state=on]:bg-accent data-[state=on]:text-on-accent',
            'focus-visible:-outline-offset-4',
          )}
        >
          <IconCheck className="hidden size-4 shrink-0 group-data-[state=on]:block" />
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
