'use client';

import type { ReactNode } from 'react';
import { IconButton } from '@/shared/ui/button';
import { Drawer } from '@/shared/ui/drawer';
import { IconConta } from '@/shared/ui/icons/acoes';

/**
 * No celular, o menu do usuário (nome, empresa, aparência e "Sair") abre numa
 * gaveta, pelo botão do cabeçalho. Os ajustes de preço ficam na gaveta "Mais"
 * da barra inferior desde a FE-57.
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
