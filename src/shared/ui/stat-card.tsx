import type { ReactNode } from 'react';
import { cn } from './cn';

const DETAIL_CLASSES = {
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
  accent: 'text-accent',
  muted: 'text-ink-muted',
};

export type StatCardDetailTone = keyof typeof DETAIL_CLASSES;

type StatCardProps = {
  title: string;
  value: string;
  detail?: string;
  /** Cor do detalhe, como `detailColor` do `_KpiCard` do painel. */
  detailTone?: StatCardDetailTone;
  /** Ícone decorativo à direita do título, em laranja. */
  icon?: ReactNode;
  className?: string;
};

/** Indicador do painel (`_KpiCard` de dashboard_page.dart). */
export function StatCard({
  title,
  value,
  detail,
  detailTone = 'muted',
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-surface p-3.5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-section-label text-ink-muted">{title}</p>
        {icon ? (
          <span className="text-accent [&>svg]:size-[18px]">{icon}</span>
        ) : null}
      </div>
      <p className="mt-3 truncate text-display text-ink tabular-nums">
        {value}
      </p>
      {detail ? (
        <p
          className={cn(
            'truncate text-small font-semibold',
            DETAIL_CLASSES[detailTone],
          )}
        >
          {detail}
        </p>
      ) : null}
    </div>
  );
}
