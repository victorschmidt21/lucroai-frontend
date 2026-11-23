import type { ReactNode } from 'react';
import { cn } from './cn';

// Detalhe em chip: fundo suave e texto na cor cheia (pares medidos em tokens.test.ts).
const DETAIL_CLASSES = {
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  accent: 'bg-accent-soft text-ink',
  muted: 'bg-surface-alt text-ink-muted',
};

export type StatCardDetailTone = keyof typeof DETAIL_CLASSES;

type StatCardProps = {
  title: string;
  value: string;
  detail?: string;
  /** Cor do chip do detalhe, como `detailColor` do `_KpiCard` do painel. */
  detailTone?: StatCardDetailTone;
  /** Ícone decorativo à direita do título, em Amora. */
  icon?: ReactNode;
  /**
   * `heroi`: o número principal da tela, sobre Amora e com valor de 36px (painel,
   * FE-58). No `heroi`, o detalhe fica em chip `accent-strong`, sem a cor do tom.
   */
  variant?: 'padrao' | 'heroi';
  className?: string;
};

/**
 * Indicador do painel (`_KpiCard` de dashboard_page.dart), no visual da FE-55:
 * rótulo Nunito 700 de 13px, valor em Fredoka 600 com `tabular-nums` e detalhe
 * opcional em chip.
 */
export function StatCard({
  title,
  value,
  detail,
  detailTone = 'muted',
  icon,
  variant = 'padrao',
  className,
}: StatCardProps) {
  const heroi = variant === 'heroi';

  return (
    <div
      data-variant={variant}
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-lg border p-4',
        heroi
          ? 'border-accent bg-accent text-on-accent'
          : 'border-border bg-surface text-ink',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            'truncate text-caption',
            heroi ? 'text-on-accent' : 'text-ink-muted',
          )}
        >
          {title}
        </p>
        {icon ? (
          <span
            className={cn(
              '[&>svg]:size-[18px]',
              heroi ? 'text-on-accent' : 'text-accent',
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-2 truncate tabular-nums',
          heroi ? 'text-display-lg' : 'text-display',
        )}
      >
        {value}
      </p>
      {detail ? (
        <p
          className={cn(
            'mt-1 max-w-full self-start truncate rounded-full px-2.5 py-0.5 text-caption',
            heroi
              ? 'bg-accent-strong text-on-accent'
              : DETAIL_CLASSES[detailTone],
          )}
        >
          {detail}
        </p>
      ) : null}
    </div>
  );
}
