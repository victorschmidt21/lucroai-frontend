import type { ReactNode } from 'react';

type PageHeaderProps = {
  /** O `h1` da tela, como "Insumos". */
  title: string;
  /** Texto cinza sob o título, como "Gerencie quantidade, valor pago e custo unitário". */
  subtitle?: string;
  /** Ação primária da tela e atalhos do cabeçalho. */
  actions?: ReactNode;
};

/** Cabeçalho das telas internas: título em Fredoka de 24px e subtítulo cinza. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-heading wrap-anywhere text-ink">{title}</h1>
        {subtitle ? (
          <p className="text-subtitle text-ink-subtle">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
