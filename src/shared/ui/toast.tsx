'use client';

import { Toast as RadixToast } from 'radix-ui';
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from './cn';
import { IconErro, IconFechar, IconInfo, IconSucesso } from './icons/acoes';
import type { IconComponent } from './icons/icone';

type ToastVariant = 'sucesso' | 'erro' | 'info';

type ToastItem = { id: number; texto: string; variant: ToastVariant };

export type ToastApi = {
  success: (texto: string) => void;
  error: (texto: string) => void;
  info: (texto: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const VARIANTES: Record<ToastVariant, { icone: IconComponent; cor: string }> = {
  sucesso: { icone: IconSucesso, cor: 'text-success' },
  erro: { icone: IconErro, cor: 'text-danger' },
  info: { icone: IconInfo, cor: 'text-accent' },
};

/** Mesmo tempo do `SnackBar` do Flutter. */
const DURACAO_MS = 4000;

/**
 * Equivalente ao `SnackBar` do mobile. Fica em volta das telas (layout de `(app)` na
 * FE-08 e `/design-system`); as telas usam `useToast()`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const api = useMemo<ToastApi>(() => {
    function mostrar(variant: ToastVariant, texto: string) {
      const id = nextId.current;
      nextId.current += 1;
      setToasts((atuais) => [...atuais, { id, texto, variant }]);
    }

    return {
      success: (texto) => mostrar('sucesso', texto),
      error: (texto) => mostrar('erro', texto),
      info: (texto) => mostrar('info', texto),
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      <RadixToast.Provider
        label="Notificação"
        swipeDirection="down"
        duration={DURACAO_MS}
      >
        {children}
        {toasts.map(({ id, texto, variant }) => {
          const { icone: Icone, cor } = VARIANTES[variant];

          return (
            <RadixToast.Root
              key={id}
              // Erro interrompe o leitor de tela; os demais aguardam a fala atual terminar.
              type={variant === 'erro' ? 'foreground' : 'background'}
              onOpenChange={(open) => {
                if (!open) {
                  setToasts((atuais) =>
                    atuais.filter((item) => item.id !== id),
                  );
                }
              }}
              className="flex animate-subir items-center gap-3 rounded-md border border-border-strong bg-surface-raised py-3 pr-2 pl-4 text-ink shadow-elevacao"
            >
              <Icone className={cn('shrink-0', cor)} />
              <RadixToast.Description className="min-w-0 grow text-body">
                {texto}
              </RadixToast.Description>
              <RadixToast.Close
                aria-label="Fechar notificação"
                className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
              >
                <IconFechar className="size-4" />
              </RadixToast.Close>
            </RadixToast.Root>
          );
        })}
        <RadixToast.Viewport
          label="Notificações ({hotkey})"
          className="fixed inset-x-0 bottom-0 z-60 mx-auto flex w-full max-w-md flex-col gap-2 p-4 empty:p-0 lg:right-0 lg:left-auto lg:mx-0"
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);

  if (!toast) {
    throw new Error('useToast precisa estar dentro de um ToastProvider');
  }

  return toast;
}
