'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/ui/cn';
import { getItemAtivo, ITENS_MENU, ITENS_MENU_LATERAL } from '../menu';

const VARIANTES = {
  // Menu lateral do desktop: ícone e rótulo na mesma linha.
  lateral: {
    lista: 'flex flex-col gap-1',
    item: 'flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-body hover:bg-surface-alt',
    ativo: 'bg-surface-alt font-semibold',
    icone: 'size-5',
    itens: ITENS_MENU_LATERAL,
  },
  // Barra inferior do celular (main_screen.dart): ícone de 22px sobre o rótulo, oito
  // colunas iguais. O contorno do foco fica para dentro, para não ser cortado.
  inferior: {
    lista: 'grid grid-cols-8',
    item: 'flex min-h-16 flex-col items-center justify-center gap-1 rounded-md px-0.5 text-nav whitespace-nowrap -outline-offset-2',
    ativo: 'font-semibold',
    icone: 'size-5.5',
    itens: ITENS_MENU,
  },
};

type MenuNavegacaoProps = {
  variante: keyof typeof VARIANTES;
};

/**
 * Os oito destinos de `menu.ts` (no lateral, também as configurações de custo). O item da tela atual fica em `accent-strong`,
 * os outros em `ink-muted`, e só ele tem `aria-current="page"`.
 */
export function MenuNavegacao({ variante }: MenuNavegacaoProps) {
  const itemAtivo = getItemAtivo(usePathname());
  const classes = VARIANTES[variante];

  return (
    <nav aria-label="Menu principal">
      <ul className={classes.lista}>
        {classes.itens.map((item) => {
          const ativo = item === itemAtivo;
          const Icone = item.icone;

          return (
            <li key={item.href} className="min-w-0">
              {/* Sem pré-carregar: o menu aparece em toda página, e cada tela busca os próprios dados ao abrir. */}
              <Link
                href={item.href}
                prefetch={false}
                {...(ativo ? { 'aria-current': 'page' } : {})}
                className={cn(
                  'transition-colors duration-150',
                  classes.item,
                  ativo
                    ? cn('text-accent-strong', classes.ativo)
                    : 'text-ink-muted hover:text-ink',
                )}
              >
                <Icone className={classes.icone} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
