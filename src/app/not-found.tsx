import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonClasses } from '@/shared/ui/button';
import { StatusPage } from '@/shared/ui/status-page';

export const metadata: Metadata = { title: 'Página não encontrada' };

/**
 * 404 fora do layout de `(app)`, como `/design-system` no build de produção.
 * Rotas inexistentes com sessão caem em `(app)/not-found.tsx`, com o menu.
 */
export default function NotFound() {
  return (
    <StatusPage
      standalone
      code="404"
      title="Página não encontrada"
      description="O endereço pode estar errado, ou a página não existe mais."
      action={
        <Link href="/" className={buttonClasses('primario')}>
          Voltar ao início
        </Link>
      }
    />
  );
}
