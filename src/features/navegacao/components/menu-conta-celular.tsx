'use client';

import type { ReactNode } from 'react';
import { IconButton } from '@/shared/ui/button';
import { Drawer } from '@/shared/ui/drawer';
import { IconConta } from '@/shared/ui/icons/acoes';

/**
 * No celular, a barra inferior só tem espaço para os oito destinos: o menu do
 * usuário (nome, empresa e "Sair") abre numa gaveta, pelo botão do cabeçalho.
 */
export function MenuContaCelular({ children }: { children: ReactNode }) {
  return (
    <Drawer
      title="Conta"
      trigger={
        <IconButton aria-label="Conta">
          <IconConta />
        </IconButton>
      }
    >
      {children}
    </Drawer>
  );
}
