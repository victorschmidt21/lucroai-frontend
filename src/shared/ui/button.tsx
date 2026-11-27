import type { ComponentProps } from 'react';
import { cn } from './cn';

// `not-disabled:` em vez de `enabled:`: `:enabled` nunca casa com `<a>`, e o link
// com aparência de botão ficaria sem hover.
// Visual Doce Fatia (FE-55, docs/ui.md#componentes-srcsharedui). Borda de 2px em
// todas as variantes, para terem a mesma altura que o `secundario`.
const VARIANT_CLASSES = {
  // Ação primária em Amora; `accent-strong` no hover. Uma por tela.
  primario:
    'border-accent bg-accent text-on-accent not-disabled:hover:border-accent-strong not-disabled:hover:bg-accent-strong',
  // Contorno Amora sobre fundo transparente; `accent-soft` no hover (5,09:1).
  secundario:
    'border-accent bg-transparent text-accent not-disabled:hover:bg-accent-soft',
  perigo:
    'border-danger-strong bg-danger-strong text-on-danger not-disabled:hover:border-danger not-disabled:hover:bg-danger',
  // "Suave": fundo `accent-soft` e texto `ink`; o hover acende a borda.
  fantasma:
    'border-transparent bg-accent-soft text-ink not-disabled:hover:border-accent',
  // Base do `IconButton`: círculo Merengue com ícone `ink`.
  icone:
    'border-transparent bg-surface-alt text-ink not-disabled:hover:bg-accent-soft',
  // `IconButton` dentro do campo (`trailing` do `Input`, FE-74): só o ícone, sem
  // círculo. `ink-muted` como o ícone à esquerda; Damasco (`highlight-ink`) no
  // hover, que passa de 3:1. O anel de foco entra 4px para não cobrir a borda.
  'icone-campo':
    'border-transparent bg-transparent text-ink-muted not-disabled:hover:text-highlight-ink focus-visible:-outline-offset-4',
};

// Pílula com 48px de altura em qualquer tela (área de toque da marca, FE-53).
const SIZE_CLASSES = {
  padrao: 'min-h-12 rounded-full px-5 py-2',
  compacto: 'min-h-12 rounded-full px-4 py-1',
  icone: 'size-12 rounded-full',
};

export type ButtonVariant = keyof typeof VARIANT_CLASSES;
export type ButtonSize = keyof typeof SIZE_CLASSES;

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Inativa o botão e mostra o progresso, mantendo o texto e a largura. */
  loading?: boolean;
};

/** Aparência de botão para um link: navegação continua sendo `a`, e não `button`. */
export function buttonClasses(
  variant: ButtonVariant = 'primario',
  className?: string,
  size: ButtonSize = 'padrao',
) {
  return cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border-2 text-body font-extrabold transition-colors duration-150',
    'disabled:cursor-default disabled:opacity-50',
    SIZE_CLASSES[size],
    VARIANT_CLASSES[variant],
    className,
  );
}

export function Button({
  variant = 'primario',
  size,
  type = 'button',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, className, size)}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current/25 border-t-current motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </button>
  );
}

type IconButtonProps = Omit<ButtonProps, 'size' | 'aria-label'> & {
  /** Obrigatório: o botão só tem ícone. Diga a ação e o item ("Editar Farinha de Trigo"). */
  'aria-label': string;
};

/** Aparência de `IconButton` para um link, como as ações por linha das receitas. */
export function iconButtonClasses(className?: string) {
  return buttonClasses('icone', className, 'icone');
}

/** Botão só com ícone: círculo de 48px, como as ações por linha das listagens. */
export function IconButton({ variant = 'icone', ...props }: IconButtonProps) {
  return <Button variant={variant} size="icone" {...props} />;
}
