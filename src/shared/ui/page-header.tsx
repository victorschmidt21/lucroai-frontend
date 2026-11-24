import type { ReactNode } from 'react';

type PageHeaderProps = {
  /** O `h1` da tela, como "Insumos". */
  title: string;
  /** Texto cinza sob o título, como "Gerencie quantidade, valor pago e custo unitário". */
  subtitle?: ReactNode;
  /** Ação primária da tela e atalhos do cabeçalho. */
  actions?: ReactNode;
};

/**
 * Cabeçalho das telas internas (FE-55): título em Fredoka 600 de 24px e subtítulo
 * `ink-muted`. As ações ficam abaixo no celular e à direita a partir de `sm`.
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-heading wrap-anywhere text-ink">{title}</h1>
        {subtitle ? (
          <p className="text-body text-ink-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
