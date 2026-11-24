import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import { cn } from './cn';
import { textoDoNo } from './label';

type CardProps = Omit<ComponentProps<'div'>, 'title'> & {
  /** Rótulo da seção em caixa alta, como os cartões do cálculo real ("RENDIMENTO"). */
  title?: ReactNode;
  /** `destaque` ganha a sombra quente, para o cartão que importa mais na tela. */
  variant?: 'padrao' | 'destaque';
};

/**
 * Cartão sobre o fundo da tela: `surface` com borda, cantos de 20px (`rounded-lg`),
 * 16px de respiro (as telas podem passar `p-5`) e sem sombra (FE-55).
 */
export function Card({
  title,
  variant = 'padrao',
  className,
  children,
  ...props
}: CardProps) {
  const titleId = useId();
  const classes = cn(
    'flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-ink tabular-nums',
    variant === 'destaque' && 'shadow-elevacao',
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
    <section
      // Título com `<Termo>` (FE-64): o nome da seção é o texto, sem o "O que é...?".
      {...(typeof title === 'string'
        ? { 'aria-labelledby': titleId }
        : { 'aria-label': textoDoNo(title) })}
      className={classes}
      {...props}
    >
      <h2 id={titleId} className="text-section-label text-ink-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}
