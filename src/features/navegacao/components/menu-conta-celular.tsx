'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { IconButton } from '@/shared/ui/button';
import { cn } from '@/shared/ui/cn';
import { DialogClose } from '@/shared/ui/dialog';
import { Drawer } from '@/shared/ui/drawer';
import { IconConta } from '@/shared/ui/icons/acoes';
import { getItemAtivo, ITEM_APRENDER } from '../menu';

/**
 * No celular, o menu do usuário (nome, empresa, aparência e "Sair") abre numa
 * gaveta, pelo botão do cabeçalho, com o link do Aprender no topo (FE-67). Os
 * ajustes de preço ficam na gaveta "Mais" da barra inferior desde a FE-57.
 */
export function MenuContaCelular({ children }: { children: ReactNode }) {
  const ativo = getItemAtivo(usePathname()) === ITEM_APRENDER;
  const Icone = ITEM_APRENDER.icone;

  return (
    <Drawer
      title="Conta"
      trigger={
        <IconButton aria-label="Conta">
          <IconConta />
        </IconButton>
      }
    >
      <nav aria-label="Ajuda" className="border-b border-border pb-3">
        {/* Fecha ao navegar, porque o layout continua montado. */}
        <DialogClose asChild>
          <Link
            href={ITEM_APRENDER.href}
            prefetch={false}
            {...(ativo ? { 'aria-current': 'page' } : {})}
            className={cn(
              'flex min-h-12 items-center gap-3 rounded-full px-4 py-2 text-body transition-colors duration-150',
              ativo
                ? 'bg-accent-soft font-extrabold text-ink'
                : 'text-ink-muted hover:bg-surface-alt hover:text-ink',
            )}
          >
            <Icone className={cn('size-6', ativo && 'text-accent')} />
            {ITEM_APRENDER.label}
          </Link>
        </DialogClose>
      </nav>
      {children}
    </Drawer>
  );
}
