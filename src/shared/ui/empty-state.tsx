import type { ReactNode } from 'react';
import { cn } from './cn';
import { IconVazio } from './icons/acoes';

export const BLOCO_ESTADO_CLASSES =
  'flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center';
export const ICONE_ESTADO_CLASSES =
  'flex size-12 items-center justify-center rounded-full bg-surface-alt';

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Ação para sair do vazio, como "Novo insumo" ou "Limpar busca". */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

/** Lista sem itens: distingue "nenhum cadastro ainda" de "nenhum resultado para a busca". */
export function EmptyState({
  title,
  description,
  action,
  icon = <IconVazio />,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(BLOCO_ESTADO_CLASSES, className)}>
      <span className={cn(ICONE_ESTADO_CLASSES, 'text-ink-muted')}>{icon}</span>
      <div className="flex max-w-prose flex-col gap-1">
        <p className="text-body font-semibold text-ink">{title}</p>
        {description ? (
          <p className="text-body text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
