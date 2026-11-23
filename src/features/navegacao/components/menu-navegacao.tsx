'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/ui/cn';
import { getItemAtivo, ITENS_MENU, ITENS_MENU_LATERAL } from '../menu';

const VARIANTES = {
  // Menu lateral do desktop: ícone e rótulo na mesma linha.
  lateral: {
    lista: 'flex flex-col gap-1',
    item: 'flex min-h-12 items-center gap-3 rounded-full px-4 py-2 text-body',
    ativo: 'bg-accent-soft font-extrabold',
    inativo: 'hover:bg-surface-alt',
    icone: 'size-5',
    fundoDoIcone: '',
    fundoDoIconeAtivo: '',
    itens: ITENS_MENU_LATERAL,
  },
  // Barra inferior do celular (main_screen.dart): ícone de 22px sobre o rótulo, oito
  // colunas iguais. O contorno do foco fica para dentro, para não ser cortado.
  inferior: {
    lista: 'grid grid-cols-8',
    item: 'flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 text-nav whitespace-nowrap -outline-offset-2',
    ativo: '',
    inativo: '',
    icone: 'size-5.5',
    // Pílula atrás do ícone, que marca o item ativo (FE-55).
    fundoDoIcone:
      'flex h-7 w-11 max-w-full items-center justify-center rounded-full',
    fundoDoIconeAtivo: 'bg-accent-soft',
    itens: ITENS_MENU,
  },
};

type MenuNavegacaoProps = {
  variante: keyof typeof VARIANTES;
};

/**
 * Os oito destinos de `menu.ts` (no lateral, também as configurações de custo). O
 * item da tela atual fica em `ink` com o ícone em `accent` (FE-55): no lateral, sobre
 * a pílula `accent-soft`; na barra inferior, a pílula fica atrás do ícone. Os outros
 * ficam em `ink-muted`, e só o atual tem `aria-current="page"`.
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
                    ? cn('text-ink', classes.ativo)
                    : cn('text-ink-muted hover:text-ink', classes.inativo),
                )}
              >
                {classes.fundoDoIcone ? (
                  <span
                    className={cn(
                      classes.fundoDoIcone,
                      ativo && classes.fundoDoIconeAtivo,
                    )}
                  >
                    <Icone
                      className={cn(classes.icone, ativo && 'text-accent')}
                    />
                  </span>
                ) : (
                  <Icone
                    className={cn(classes.icone, ativo && 'text-accent')}
                  />
                )}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
