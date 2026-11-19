'use client';

import { useState, type ReactElement } from 'react';
import { getErrorMessage } from '@/shared/api/errors';
import { Alert } from './alert';
import { Button } from './button';
import { Dialog } from './dialog';

type ConfirmDialogProps = {
  /** Diz a ação: "Excluir gasto". */
  title: string;
  /** Cita o item entre aspas e, se houver, a consequência. */
  description?: string;
  /**
   * O que muda além do item, numa linha própria e anunciada junto com a descrição:
   * "Isso afetará o custo de todas as receitas."
   */
  consequence?: string;
  /** Descreve a ação ("Excluir", "Cancelar venda"), nunca "OK". */
  confirmLabel: string;
  cancelLabel?: string;
  /** Ao rejeitar, o diálogo continua aberto, com a mensagem de erro. */
  onConfirm: () => Promise<unknown> | void;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ConfirmDialog({
  title,
  description,
  consequence,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [isPending, setIsPending] = useState(false);
  const open = controlledOpen ?? internalOpen;

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);

    // Uma nova confirmação não herda o erro da tentativa anterior.
    if (!next) setError(null);
  }

  async function handleConfirm() {
    if (isPending) return;
    setIsPending(true);
    setError(null);

    try {
      await onConfirm();
      handleOpenChange(false);
    } catch (cause) {
      setError(cause);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog
      title={title}
      description={
        consequence ? (
          <>
            {/* O espaço separa as frases no texto anunciado. */}
            {description}{' '}
            <span className="mt-2 block font-medium text-ink">
              {consequence}
            </span>
          </>
        ) : (
          description
        )
      }
      trigger={trigger}
      open={open}
      onOpenChange={(next) => {
        if (!isPending) handleOpenChange(next);
      }}
      footer={
        <>
          <Button
            variant="secundario"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="perigo"
            loading={isPending}
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error ? <Alert>{getErrorMessage(error)}</Alert> : null}
    </Dialog>
  );
}
