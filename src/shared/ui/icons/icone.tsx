import type { ComponentType } from 'react';
import { cn } from '../cn';

export type IconProps = { className?: string };
export type IconComponent = ComponentType<IconProps>;

/**
 * Ícones decorativos no formato dos Material Icons (24×24, preenchidos), que o app
 * Flutter usa. O nome acessível vem do texto ao lado ou do `aria-label` do botão.
 */
export function criarIcone(nome: string, d: string): IconComponent {
  function Icone({ className }: IconProps) {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="currentColor"
        data-icone={nome}
        className={cn('size-5 shrink-0', className)}
      >
        <path d={d} />
      </svg>
    );
  }

  Icone.displayName = `Icon${nome}`;

  return Icone;
}
