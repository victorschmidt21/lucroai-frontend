import { cn } from './cn';

type LogoProps = {
  /** `compacto`: o tamanho do título das telas internas, para o menu lateral. */
  size?: 'padrao' | 'compacto';
  className?: string;
};

/**
 * Wordmark "LucroAI" do cabeçalho do painel (dashboard_page.dart, `_buildHeader`):
 * texto branco de 27px, em negrito. O mobile não tem logo em imagem.
 */
export function Logo({ size = 'padrao', className }: LogoProps) {
  return (
    <span
      className={cn(
        'inline-block font-bold text-ink',
        size === 'padrao' ? 'text-heading' : 'text-title',
        className,
      )}
    >
      LucroAI
    </span>
  );
}
