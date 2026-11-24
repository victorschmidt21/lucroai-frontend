'use client';

import { Modal, type ModalProps } from './dialog';

const SIDE_CLASSES = {
  // Sobe de baixo no celular, como o `showModalBottomSheet`; à direita a partir de `lg`.
  bottom:
    'inset-x-0 bottom-0 max-h-[85dvh] animate-gaveta-baixo rounded-t-xl pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:max-h-none lg:w-[28rem] lg:animate-gaveta-direita lg:rounded-none lg:rounded-l-xl',
  right:
    'inset-y-0 right-0 w-[85%] max-w-md animate-gaveta-direita rounded-l-xl',
};

type DrawerProps = ModalProps & {
  side?: keyof typeof SIDE_CLASSES;
  /**
   * Alça no topo da gaveta de baixo (FE-64): arrastar para baixo fecha, chamando
   * `onOpenChange(false)`; use com `open` controlado. Some a partir de `lg`.
   */
  alca?: boolean;
};

export function Drawer({ side = 'bottom', ...props }: DrawerProps) {
  return <Modal {...props} contentClassName={SIDE_CLASSES[side]} />;
}
