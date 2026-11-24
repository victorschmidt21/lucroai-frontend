import Link from 'next/link';
import { IconSeta } from '@/shared/ui/icons/acoes';
import { IconAprender } from '@/shared/ui/icons/menu';

/**
 * Cartão discreto do Início (FE-67), abaixo dos Primeiros passos ou no lugar
 * deles quando somem: leva à página Aprender.
 */
export function CartaoAprender() {
  return (
    <Link
      href="/aprender"
      className="flex min-h-12 items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-body text-ink transition-colors duration-150 hover:border-accent"
    >
      <IconAprender className="size-6 shrink-0 text-accent" />
      <span className="flex-1">
        Dúvida em alguma palavra?{' '}
        <span className="font-extrabold text-accent">Veja o Aprender</span>
      </span>
      <IconSeta className="size-5 shrink-0 text-ink-muted" />
    </Link>
  );
}
