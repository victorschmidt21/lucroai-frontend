import Link from 'next/link';
import { buttonClasses } from '@/shared/ui/button';
import { StatusPage } from '@/shared/ui/status-page';

/** 404 dentro do layout, com o menu: rota inexistente ou `notFound()` de uma tela. */
export default function AppNotFound() {
  return (
    <StatusPage
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
