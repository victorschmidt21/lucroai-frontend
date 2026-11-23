import type { ReactNode } from 'react';
import { cn } from './cn';
import { BLOCO_ESTADO_CLASSES } from './empty-state';
import { Logo } from './logo';

type StatusPageProps = {
  /** Código em destaque, como 404. */
  code?: string;
  title: string;
  description: string;
  /** Anuncia a descrição ao leitor de tela, para os erros que chegam sem navegação. */
  alert?: boolean;
  /** "Voltar ao início", "Tentar novamente". */
  action: ReactNode;
  /** Fora do layout de `(app)`, a própria página traz o `main` e a logo. */
  standalone?: boolean;
};

/**
 * Páginas 404 e de erro (`not-found.tsx` e `error.tsx`), no mesmo bloco tracejado
 * do `EmptyState` (FE-55), centralizado na tela.
 */
export function StatusPage({
  code,
  title,
  description,
  alert = false,
  action,
  standalone = false,
}: StatusPageProps) {
  const Container = standalone ? 'main' : 'div';

  return (
    <Container
      className={cn(
        'flex flex-col items-center justify-center gap-6 p-4',
        standalone ? 'min-h-dvh' : 'min-h-96 flex-1',
      )}
    >
      {standalone ? <Logo /> : null}
      <div className={cn(BLOCO_ESTADO_CLASSES, 'w-full max-w-lg gap-4')}>
        {code ? <p className="text-display-lg text-accent">{code}</p> : null}
        <h1 className="text-heading text-ink">{title}</h1>
        <p
          {...(alert ? { role: 'alert' } : {})}
          className="max-w-prose text-body text-ink-muted"
        >
          {description}
        </p>
        <div className="flex flex-wrap justify-center gap-2">{action}</div>
      </div>
    </Container>
  );
}
