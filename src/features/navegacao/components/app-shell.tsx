import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/shared/ui/logo';
import { MenuContaCelular } from './menu-conta-celular';
import { MenuNavegacao } from './menu-navegacao';

const LOGO_LABEL = 'Doce Fatia, página inicial';

type AppShellProps = {
  /** Nome, empresa e "Sair": vem de `features/auth`, composto pelo layout. */
  userMenu: ReactNode;
  /**
   * Indicador de avisos (FE-47), de `features/alertas`, composto pelo layout.
   * Aparece no topo do menu lateral e no cabeçalho do celular.
   */
  avisos?: ReactNode;
  children: ReactNode;
};

/**
 * Moldura das telas internas. A partir de `md` (768px), menu lateral com a logo,
 * os oito destinos e o menu do usuário no rodapé. Abaixo disso, como o app
 * Flutter: barra inferior fixa com os oito destinos e um cabeçalho com a logo e
 * o botão da conta.
 */
export function AppShell({ userMenu, avisos, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface-raised focus:p-3"
      >
        Pular para o conteúdo
      </a>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface p-4 md:flex">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            prefetch={false}
            aria-label={LOGO_LABEL}
            className="rounded-sm px-3 pt-1"
          >
            <Logo size="compacto" />
          </Link>
          {avisos}
        </div>
        <MenuNavegacao variante="lateral" />
        <div className="mt-auto border-t border-border px-1 pt-4">
          {userMenu}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col bg-bg-alt">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-border bg-bg px-4 md:hidden">
          <Link
            href="/"
            prefetch={false}
            aria-label={LOGO_LABEL}
            className="rounded-sm"
          >
            <Logo size="compacto" />
          </Link>
          <div className="flex items-center gap-1">
            {avisos}
            <MenuContaCelular>{userMenu}</MenuContaCelular>
          </div>
        </header>
        {/* No celular, o espaço de baixo é da barra fixa (64px) e da área segura do aparelho. */}
        <main
          id="conteudo"
          tabIndex={-1}
          className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] outline-none md:pb-0"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <MenuNavegacao variante="inferior" />
      </div>
    </div>
  );
}
