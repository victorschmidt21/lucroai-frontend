'use client';

import { Dialog as RadixDialog } from 'radix-ui';
import {
  useRef,
  useState,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { IconButton } from './button';
import { cn } from './cn';
import { IconFechar } from './icons/acoes';

export type ModalProps = {
  title: string;
  description?: ReactNode;
  trigger?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  footer?: ReactNode;
  children?: ReactNode;
};

/** Quanto arrastar a alça para baixo (em px) para fechar a gaveta. */
const ARRASTO_PARA_FECHAR = 80;

/** Arrastar a alça para baixo move a gaveta junto e, passando do limite, fecha. */
function useArrastarParaFechar(fechar: () => void) {
  const inicio = useRef<number | null>(null);
  const [deslocamento, setDeslocamento] = useState(0);

  function terminar() {
    const fechou =
      inicio.current !== null && deslocamento > ARRASTO_PARA_FECHAR;
    inicio.current = null;
    setDeslocamento(0);
    if (fechou) fechar();
  }

  return {
    deslocamento,
    handlers: {
      onPointerDown(event: PointerEvent<HTMLDivElement>) {
        inicio.current = event.clientY;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      },
      onPointerMove(event: PointerEvent<HTMLDivElement>) {
        if (inicio.current === null) return;
        setDeslocamento(Math.max(0, event.clientY - inicio.current));
      },
      onPointerUp: terminar,
      onPointerCancel: () => {
        inicio.current = null;
        setDeslocamento(0);
      },
    },
  };
}

/** Base do Dialog e do Drawer: o Radix cuida do foco, do Esc e do `aria-modal`. */
export function Modal({
  title,
  description,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  footer,
  children,
  contentClassName,
  alca = false,
}: ModalProps & { contentClassName: string; alca?: boolean }) {
  const arrasto = useArrastarParaFechar(() => onOpenChange?.(false));

  return (
    <RadixDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {trigger ? (
        <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      ) : null}
      <RadixDialog.Portal>
        {/* Fundo `overlay` em tom Cacau (FE-55); título em Fredoka (`text-display`). */}
        <RadixDialog.Overlay className="fixed inset-0 z-40 animate-surgir bg-overlay" />
        <RadixDialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed z-50 flex flex-col gap-4 overflow-y-auto bg-surface-raised p-5 text-ink shadow-elevacao',
            contentClassName,
          )}
          style={
            arrasto.deslocamento > 0
              ? { transform: `translateY(${arrasto.deslocamento}px)` }
              : undefined
          }
        >
          {alca ? (
            // Alça da gaveta (FE-64): arrastar para baixo fecha. Decorativa para o
            // leitor de tela, que fecha pelo botão "Fechar" ou pelo Esc.
            <div
              aria-hidden="true"
              className="-mx-5 -mt-5 -mb-3 flex h-8 shrink-0 cursor-grab touch-none justify-center pt-3 lg:hidden"
              {...arrasto.handlers}
            >
              <span className="h-1.5 w-10 rounded-full bg-border-strong" />
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-4">
            <RadixDialog.Title className="pt-2 text-display">
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton aria-label="Fechar" className="-mt-1 -mr-2">
                <IconFechar />
              </IconButton>
            </RadixDialog.Close>
          </div>
          {description ? (
            <RadixDialog.Description className="text-body text-ink-muted">
              {description}
            </RadixDialog.Description>
          ) : null}
          {children}
          {footer ? (
            <div className="mt-2 flex flex-wrap justify-end gap-2 *:grow sm:*:grow-0">
              {footer}
            </div>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Diálogo centralizado, como o `Dialog` de cadastro do mobile (cantos de 24px). */
export function Dialog({
  size = 'padrao',
  ...props
}: ModalProps & { size?: 'padrao' | 'amplo' }) {
  return (
    <Modal
      {...props}
      contentClassName={cn(
        'top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 animate-subir rounded-xl',
        size === 'amplo' ? 'max-w-3xl' : 'max-w-lg',
      )}
    />
  );
}

/**
 * Drawer de baixo no celular (como o `showModalBottomSheet` do mobile) e Dialog
 * centralizado a partir de `md`. Só CSS: o mesmo conteúdo serve aos dois, sem
 * depender da largura no servidor. Usado pelo `FormDialog` e pelo `ResponsiveDialog`.
 */
export const RESPONSIVE_DIALOG_CLASSES =
  'inset-x-0 bottom-0 max-h-[90dvh] animate-gaveta-baixo rounded-t-xl pb-[max(1.25rem,env(safe-area-inset-bottom))] md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[calc(100dvh-2rem)] md:w-[calc(100%-2rem)] md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:animate-subir md:rounded-xl md:pb-5';

/** Drawer de baixo no celular e Dialog a partir de `md` (confirmação de venda, FE-17). */
export function ResponsiveDialog(props: ModalProps) {
  return <Modal {...props} contentClassName={RESPONSIVE_DIALOG_CLASSES} />;
}

export const DialogClose = RadixDialog.Close;
