'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/ui/cn';
import { DialogClose } from '@/shared/ui/dialog';
import { Drawer } from '@/shared/ui/drawer';
import { IconMais } from '@/shared/ui/icons/menu';
import {
  getItemAtivo,
  ITENS_BARRA_INFERIOR,
  ITENS_MAIS,
  ITENS_MENU_LATERAL,
  type ItemMenu,
} from '../menu';

const COR_ATIVO = 'text-ink';
const COR_INATIVO = 'text-ink-muted hover:text-ink';

// Menu lateral do desktop e gaveta "Mais": ícone e rótulo na mesma linha.
const ITEM_LINHA =
  'flex min-h-12 items-center gap-3 rounded-full px-4 py-2 text-body transition-colors duration-150';

// Barra inferior do celular (FE-57): cinco colunas, ícone de 24px sobre o rótulo
// de 12px. O contorno do foco fica para dentro, para não ser cortado.
const ITEM_BARRA =
  'flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-md px-0.5 text-nav whitespace-nowrap -outline-offset-2 transition-colors duration-150';

type MenuNavegacaoProps = {
  variante: 'lateral' | 'inferior';
};

/**
 * Menu principal. No lateral, os oito destinos de `menu.ts` e os ajustes de preço.
 * Na barra inferior, Início, Receitas, Vendas, Estoque e "Mais", que abre uma
 * gaveta com o resto (FE-57). O item da tela atual fica em `ink` com o ícone em
 * `accent` (FE-55), e só ele tem `aria-current="page"`.
 */
export function MenuNavegacao({ variante }: MenuNavegacaoProps) {
  const itemAtivo = getItemAtivo(usePathname());

  if (variante === 'lateral') {
    return (
      <nav aria-label="Menu principal">
        <ListaEmLinha itens={ITENS_MENU_LATERAL} itemAtivo={itemAtivo} />
      </nav>
    );
  }

  const maisAtivo = itemAtivo !== undefined && ITENS_MAIS.includes(itemAtivo);

  return (
    <nav aria-label="Menu principal">
      <ul className="grid grid-cols-5">
        {ITENS_BARRA_INFERIOR.map((item) => {
          const ativo = item === itemAtivo;
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                prefetch={false}
                {...(ativo ? { 'aria-current': 'page' } : {})}
                className={cn(ITEM_BARRA, ativo ? COR_ATIVO : COR_INATIVO)}
              >
                <IconeDaBarra item={item} ativo={ativo} />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="min-w-0">
          <Drawer
            title="Mais"
            trigger={
              <button
                type="button"
                className={cn(ITEM_BARRA, maisAtivo ? COR_ATIVO : COR_INATIVO)}
              >
                <IconeDaBarra
                  item={{ label: 'Mais', href: '', icone: IconMais }}
                  ativo={maisAtivo}
                />
                Mais
              </button>
            }
          >
            <ListaEmLinha itens={ITENS_MAIS} itemAtivo={itemAtivo} fechar />
          </Drawer>
        </li>
      </ul>
    </nav>
  );
}

/** Pílula `accent-soft` atrás do ícone, que marca o item ativo (FE-55). */
function IconeDaBarra({ item, ativo }: { item: ItemMenu; ativo: boolean }) {
  const Icone = item.icone;
  return (
    <span
      className={cn(
        'flex h-7 w-11 max-w-full items-center justify-center rounded-full',
        ativo && 'bg-accent-soft',
      )}
    >
      <Icone className={cn('size-6', ativo && 'text-accent')} />
    </span>
  );
}

function ListaEmLinha({
  itens,
  itemAtivo,
  fechar = false,
}: {
  itens: readonly ItemMenu[];
  itemAtivo: ItemMenu | undefined;
  /** Na gaveta "Mais": fecha ao navegar, porque o layout continua montado. */
  fechar?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {itens.map((item) => {
        const ativo = item === itemAtivo;
        const Icone = item.icone;
        // Sem pré-carregar: o menu aparece em toda página, e cada tela busca os próprios dados ao abrir.
        const link = (
          <Link
            href={item.href}
            prefetch={false}
            {...(ativo ? { 'aria-current': 'page' } : {})}
            className={cn(
              ITEM_LINHA,
              ativo
                ? cn(COR_ATIVO, 'bg-accent-soft font-extrabold')
                : cn(COR_INATIVO, 'hover:bg-surface-alt'),
            )}
          >
            <Icone className={cn('size-6', ativo && 'text-accent')} />
            {item.label}
          </Link>
        );

        return (
          <li key={item.href} className="min-w-0">
            {fechar ? <DialogClose asChild>{link}</DialogClose> : link}
          </li>
        );
      })}
    </ul>
  );
}
