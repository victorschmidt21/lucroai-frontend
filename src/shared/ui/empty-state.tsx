import type { ReactNode } from 'react';
import { cn } from './cn';
import { IconVazio } from './icons/acoes';

/**
 * Caixa dos estados (FE-55): borda tracejada de 2px `border`, cantos de 20px e
 * conteúdo centralizado. Usada pelo `EmptyState`, pelo `ErrorState` e pela
 * `StatusPage`.
 */
export const BLOCO_ESTADO_CLASSES =
  'flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center';
export const ICONE_ESTADO_CLASSES =
  'flex size-12 items-center justify-center rounded-full bg-surface-alt';
/** Título dos estados: Fredoka 600 de 18px. */
export const TITULO_ESTADO_CLASSES =
  'font-display text-title font-semibold text-ink';

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Ação para sair do vazio, como "Novo insumo" ou "Limpar busca". */
  action?: ReactNode;
  /** Ícone no círculo, quando não há `ilustracao`. */
  icon?: ReactNode;
  /**
   * Ilustração "spot" acima do título, no lugar do ícone (desenhos na FE-59).
   * Decorativa: o título já diz o que aconteceu.
   */
  ilustracao?: ReactNode;
  className?: string;
};

/** Lista sem itens: distingue "nenhum cadastro ainda" de "nenhum resultado para a busca". */
export function EmptyState({
  title,
  description,
  action,
  icon = <IconVazio />,
  ilustracao,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(BLOCO_ESTADO_CLASSES, className)}>
      {ilustracao ? (
        <div
          aria-hidden="true"
          data-ilustracao=""
          className="flex justify-center"
        >
          {ilustracao}
        </div>
      ) : (
        <span className={cn(ICONE_ESTADO_CLASSES, 'text-ink-muted')}>
          {icon}
        </span>
      )}
      <div className="flex max-w-prose flex-col gap-1">
        <p className={TITULO_ESTADO_CLASSES}>{title}</p>
        {description ? (
          <p className="text-body text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
