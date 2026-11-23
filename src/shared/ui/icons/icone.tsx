import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../cn';

export type IconProps = { className?: string };
export type IconComponent = ComponentType<IconProps>;

/**
 * Ícones decorativos da marca Doce Fatia (FE-56): contorno do `lucide-react`, traço de
 * 2px com pontas arredondadas e cor `currentColor`. O tamanho vem da classe: 20px
 * (`size-5`) por padrão, em botões e campos, e 24px (`size-6`) no menu. O nome
 * acessível vem do texto ao lado ou do `aria-label` do botão.
 */
export function criarIcone(nome: string, Lucide: LucideIcon): IconComponent {
  function Icone({ className }: IconProps) {
    return (
      <Lucide
        aria-hidden="true"
        focusable="false"
        strokeWidth={2}
        data-icone={nome}
        className={cn('size-5 shrink-0', className)}
      />
    );
  }

  Icone.displayName = `Icon${nome}`;

  return Icone;
}
