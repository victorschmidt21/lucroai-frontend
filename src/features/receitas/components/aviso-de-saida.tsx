'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFormState } from 'react-hook-form';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

/** Destino interno do link clicado, ou `null` se o clique não sai da tela. */
function destinoDoClique(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !(event.target instanceof Element)
  ) {
    return null;
  }

  const link = event.target.closest('a[href]');
  if (
    !(link instanceof HTMLAnchorElement) ||
    (link.target && link.target !== '_self') ||
    link.hasAttribute('download')
  ) {
    return null;
  }

  const url = new URL(link.href);
  const atual = window.location;
  if (
    url.origin !== atual.origin ||
    (url.pathname === atual.pathname && url.search === atual.search)
  ) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Formulário com alterações não salvas pede confirmação antes de sair
 * (docs/ui.md): links internos (menu, "Cancelar") abrem o ConfirmDialog, e
 * recarregar ou fechar a aba usa o aviso do navegador (`beforeunload`). Fica
 * dentro do `Form`, para ler o `isDirty`. O botão "voltar" do navegador não é
 * interceptado: o App Router não tem como bloquear essa navegação.
 */
export function AvisoDeSaida() {
  const { isDirty } = useFormState();
  const router = useRouter();
  const [destino, setDestino] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return undefined;

    function antesDeDescarregar(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    // Na captura, antes do `onClick` do `Link`: o Next nem chega a navegar.
    function aoClicar(event: MouseEvent) {
      const href = destinoDoClique(event);
      if (href === null) return;
      event.preventDefault();
      event.stopPropagation();
      setDestino(href);
    }

    window.addEventListener('beforeunload', antesDeDescarregar);
    document.addEventListener('click', aoClicar, true);

    return () => {
      window.removeEventListener('beforeunload', antesDeDescarregar);
      document.removeEventListener('click', aoClicar, true);
    };
  }, [isDirty]);

  return (
    <ConfirmDialog
      open={destino !== null}
      onOpenChange={(aberto) => {
        if (!aberto) setDestino(null);
      }}
      title="Descartar alterações?"
      description="As alterações não salvas serão perdidas."
      confirmLabel="Descartar"
      onConfirm={() => {
        if (destino) router.push(destino);
      }}
    />
  );
}
