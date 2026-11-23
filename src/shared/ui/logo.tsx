// Um `<img>` não teria o logotipo em Fredoka nem as cores dos tokens: o `span`
// com `role="img"` junta símbolo e logotipo num só nome acessível.
// oxlint-disable jsx-a11y/prefer-tag-over-role
import { cn } from './cn';

type LogoProps = {
  /** `completo`: símbolo e logotipo (padrão). `simbolo`: só o bolo com a fatia. */
  variante?: 'completo' | 'simbolo';
  /** `compacto`: o tamanho do título das telas internas, para o menu. */
  size?: 'padrao' | 'compacto';
  /**
   * `sobre-cor`: sobre fundo Amora (`bg-accent`), com o bolo em `on-accent`, a
   * fatia em `highlight` e os confeitos em `accent`.
   */
  tom?: 'normal' | 'sobre-cor';
  className?: string;
};

/**
 * Logo Doce Fatia (FE-54, docs/marca.md#logo): o símbolo (bolo visto de cima com
 * a fatia servida) e o logotipo "Doce" + "Fatia" em Fredoka. As cores vêm dos
 * tokens, então o modo noite troca sozinho. A arte final só substitui os caminhos.
 */
export function Logo({
  variante = 'completo',
  size = 'padrao',
  tom = 'normal',
  className,
}: LogoProps) {
  const sobreCor = tom === 'sobre-cor';

  return (
    <span
      role="img"
      aria-label="Doce Fatia"
      className={cn(
        'inline-flex items-center gap-2 font-display',
        size === 'padrao' ? 'text-heading' : 'text-title',
        className,
      )}
    >
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
        className={cn('shrink-0', size === 'padrao' ? 'size-10' : 'size-8')}
      >
        <path
          data-parte="bolo"
          d="M24 24 L39.59 15 A18 18 0 1 1 24 6 Z"
          className={sobreCor ? 'fill-on-accent' : 'fill-accent'}
        />
        <path
          data-parte="fatia"
          d="M26.2 20.2 L26.2 2.2 A18 18 0 0 1 41.79 11.2 Z"
          className="fill-highlight"
        />
        <g
          data-parte="confeitos"
          className={sobreCor ? 'fill-accent' : 'fill-bg'}
        >
          <circle cx="16" cy="22" r="1.8" />
          <circle cx="21" cy="33" r="1.8" />
          <circle cx="31" cy="30" r="1.8" />
          <circle cx="13" cy="30" r="1.3" />
        </g>
      </svg>
      {variante === 'completo' ? (
        <span aria-hidden="true" className="whitespace-nowrap">
          <span
            className={cn(
              'font-medium',
              sobreCor ? 'text-on-accent' : 'text-accent',
            )}
          >
            Doce
          </span>{' '}
          <span
            className={cn(
              'font-semibold',
              sobreCor ? 'text-on-accent' : 'text-ink',
            )}
          >
            Fatia
          </span>
        </span>
      ) : null}
    </span>
  );
}
