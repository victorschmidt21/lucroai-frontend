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
   * `heroi`: o número principal da tela, com valor de 36px (painel, FE-58). No
   * `heroi`, o detalhe fica em chip `bg-surface text-success` e o título quebra
   * linha em vez de cortar.
   */
  variant?: 'padrao' | 'heroi';
  /** Só no `heroi`: `accent` (sobre Amora, padrão) ou `danger` (`danger-soft` com texto `ink`). */
  heroiTone?: 'accent' | 'danger';
  /** Só no `heroi`: enfeite decorativo no canto (marca d'água), já `aria-hidden`. */
  decoration?: ReactNode;
  /** Conteúdo abaixo do detalhe, como um link de ação. */
  children?: ReactNode;
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
  heroiTone = 'accent',
  decoration,
  children,
  className,
}: StatCardProps) {
  const heroi = variant === 'heroi';
  const sobreAmora = heroi && heroiTone === 'accent';

  return (
    <div
      data-variant={variant}
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-lg border p-4',
        heroi && 'relative overflow-hidden p-5',
        sobreAmora
          ? 'border-accent bg-accent text-on-accent'
          : heroi
            ? 'border-danger-soft bg-danger-soft text-ink'
            : 'border-border bg-surface text-ink',
        className,
      )}
    >
      {heroi && decoration ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -bottom-6 opacity-20"
        >
          {decoration}
        </span>
      ) : null}
      <div className="relative flex items-center justify-between gap-2">
        <p
          className={cn(
            heroi
              ? 'text-body font-bold'
              : 'truncate text-caption text-ink-muted',
            sobreAmora && 'text-on-accent',
          )}
        >
          {title}
        </p>
        {icon ? (
          <span
            className={cn(
              '[&>svg]:size-[18px]',
              sobreAmora ? 'text-on-accent' : 'text-accent',
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'relative mt-2 truncate tabular-nums',
          heroi ? 'text-display-lg' : 'text-display',
        )}
      >
        {value}
      </p>
      {detail ? (
        <p
          className={cn(
            'relative mt-1 max-w-full self-start truncate rounded-full px-2.5 py-0.5 text-caption',
            sobreAmora ? 'bg-surface text-success' : DETAIL_CLASSES[detailTone],
          )}
        >
          {detail}
        </p>
      ) : null}
      {children ? <div className="relative mt-2">{children}</div> : null}
    </div>
  );
}
