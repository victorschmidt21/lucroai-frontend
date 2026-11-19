import type { ComponentProps } from 'react';
import { useId } from 'react';
import { cn } from './cn';

type CardProps = ComponentProps<'div'> & {
  /** Rótulo da seção em caixa alta, como os cartões do cálculo real ("RENDIMENTO"). */
  title?: string;
  /** `resumo`: cantos de 14px, dos cartões de resumo e indicadores do mobile. */
  variant?: 'padrao' | 'resumo';
};

/** Cartão sobre o fundo da tela: `surface` com borda, cantos de 12px. */
export function Card({
  title,
  variant = 'padrao',
  className,
  children,
  ...props
}: CardProps) {
  const titleId = useId();
  const classes = cn(
    'flex flex-col gap-3 border border-border bg-surface p-4 text-ink',
    variant === 'resumo' ? 'rounded-lg' : 'rounded-md',
    className,
  );

  if (!title) {
    return (
      <div className={classes} {...props}>
        {children}
      </div>
    );
  }

  return (
    <section aria-labelledby={titleId} className={classes} {...props}>
      <h2 id={titleId} className="text-section-label text-ink-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}
