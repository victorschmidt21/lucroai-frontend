import type { ComponentProps } from 'react';
import { cn } from './cn';

// `not-disabled:` em vez de `enabled:`: `:enabled` nunca casa com `<a>`, e o link
// com aparência de botão ficaria sem hover.
const VARIANT_CLASSES = {
  // ElevatedButton laranja do mobile; o texto é preto pelo contraste (docs/ui.md).
  primario:
    'border-accent-strong bg-accent-strong text-on-accent not-disabled:hover:border-accent not-disabled:hover:bg-accent',
  secundario:
    'border-border-strong bg-surface-alt text-ink not-disabled:hover:border-ink-subtle',
  perigo:
    'border-danger-strong bg-danger-strong text-on-danger not-disabled:hover:border-danger not-disabled:hover:bg-danger',
  fantasma:
    'border-transparent bg-transparent text-ink not-disabled:hover:bg-surface-alt',
};

// 44px no toque; a partir de `lg`, 40px. O mobile usa 46px nos botões de formulário.
const SIZE_CLASSES = {
  padrao: 'min-h-11 rounded-md px-4 py-2 lg:min-h-10',
  compacto: 'min-h-11 rounded-sm px-3 py-1 md:min-h-8',
  // IconButton do Material: redondo.
  icone: 'size-11 rounded-full lg:size-10',
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
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border text-body font-semibold transition-colors duration-150',
    'disabled:cursor-not-allowed disabled:opacity-50',
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

/** Botão só com ícone, como as ações por linha das listagens. */
export function IconButton({
  variant = 'fantasma',
  ...props
}: IconButtonProps) {
  return <Button variant={variant} size="icone" {...props} />;
}
