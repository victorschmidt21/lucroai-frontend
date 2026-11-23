'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { IconButton, buttonClasses } from '@/shared/ui/button';
import { DialogClose } from '@/shared/ui/dialog';
import { Drawer } from '@/shared/ui/drawer';
import { IconConta } from '@/shared/ui/icons/acoes';
import { ITEM_CONFIGURACOES } from '../menu';

/**
 * No celular, a barra inferior só tem espaço para os oito destinos: o menu do
 * usuário (nome, empresa e "Sair") e as configurações de custo (FE-41) abrem
 * numa gaveta, pelo botão do cabeçalho.
 */
export function MenuContaCelular({ children }: { children: ReactNode }) {
  const Icone = ITEM_CONFIGURACOES.icone;

  return (
    <Drawer
      title="Conta"
      trigger={
        <IconButton aria-label="Conta">
          <IconConta />
        </IconButton>
      }
    >
      {/* Fechar ao navegar: o layout continua montado e a gaveta ficaria aberta. */}
      <DialogClose asChild>
        <Link
          href={ITEM_CONFIGURACOES.href}
          prefetch={false}
          className={buttonClasses('secundario', 'self-start')}
        >
          <Icone className="size-5" />
          {ITEM_CONFIGURACOES.label}
        </Link>
      </DialogClose>
      {children}
    </Drawer>
  );
}
