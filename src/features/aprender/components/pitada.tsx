'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { flushSync } from 'react-dom';
import { useId, useRef, type ReactElement, type ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { DialogClose } from '@/shared/ui/dialog';
import { Drawer } from '@/shared/ui/drawer';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import { MEDIA_COMPUTADOR, useMediaQuery } from '@/shared/ui/use-media-query';
import type { Termo } from '../aprender.schema';
import { buscarTermo } from '../termos';

type PitadaProps = {
  /** O termo mostrado agora (muda pelos chips de relacionados). */
  termo: Termo;
  aberta: boolean;
  onAbertaChange: (aberta: boolean) => void;
  onTrocarTermo: (id: string) => void;
  /** O botão do termo; o Radix liga `aria-expanded` e devolve o foco a ele. */
  gatilho: ReactElement;
  /** Bloco "No seu caso" (FE-65); sem ele, o bloco não aparece. */
  exemplo?: ReactNode;
};

/**
 * Folha da Pitada (FE-64): gaveta de baixo com alça no celular e balão ancorado
 * no termo a partir de `md`. Fecha com "Entendi", Esc, toque fora ou arrastando
 * a alça para baixo; o foco volta para o termo.
 */
export function Pitada({
  termo,
  aberta,
  onAbertaChange,
  onTrocarTermo,
  gatilho,
  exemplo,
}: PitadaProps) {
  const computador = useMediaQuery(MEDIA_COMPUTADOR);
  const tituloId = useId();

  if (computador) {
    return (
      <Popover open={aberta} onOpenChange={onAbertaChange}>
        <PopoverTrigger asChild>{gatilho}</PopoverTrigger>
        <PopoverContent aria-labelledby={tituloId}>
          <h2 id={tituloId} className="text-display">
            {termo.titulo}
          </h2>
          <PitadaConteudo
            termo={termo}
            exemplo={exemplo}
            onTrocarTermo={onTrocarTermo}
          />
          <PopoverClose asChild>
            <Button variant="fantasma" className="mt-1 self-end">
              Entendi
            </Button>
          </PopoverClose>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer
      alca
      title={termo.titulo}
      trigger={gatilho}
      open={aberta}
      onOpenChange={onAbertaChange}
      footer={
        <DialogClose asChild>
          <Button variant="fantasma">Entendi</Button>
        </DialogClose>
      }
    >
      <PitadaConteudo
        termo={termo}
        exemplo={exemplo}
        onTrocarTermo={onTrocarTermo}
      />
    </Drawer>
  );
}

/** Explicação, "No seu caso", por que importa, a ação e os relacionados. */
function PitadaConteudo({
  termo,
  exemplo,
  onTrocarTermo,
}: {
  termo: Termo;
  exemplo?: ReactNode;
  onTrocarTermo: (id: string) => void;
}) {
  const pathname = usePathname();
  const conteudo = useRef<HTMLDivElement>(null);

  // Trocar de termo pelo chip apaga o chip tocado: o foco vai para o conteúdo novo.
  function trocar(id: string) {
    flushSync(() => onTrocarTermo(id));
    conteudo.current?.focus();
  }

  const relacionados = termo.relacionados
    .map((id) => buscarTermo(id))
    .filter((relacionado) => relacionado !== undefined);

  return (
    <div
      ref={conteudo}
      tabIndex={-1}
      className="flex flex-col gap-3 text-body outline-none"
    >
      <p>{termo.explicacao}</p>
      {exemplo ? (
        <section
          aria-label="No seu caso"
          className="rounded-md bg-surface-alt px-4 py-3"
        >
          <h3 className="text-section-label text-ink-muted">No seu caso</h3>
          <div className="mt-1">{exemplo}</div>
        </section>
      ) : null}
      <p className="text-ink-muted">{termo.porQueImporta}</p>
      {termo.acao && termo.acao.href !== pathname ? (
        <Link
          href={termo.acao.href}
          className="inline-flex min-h-12 items-center self-start font-extrabold text-accent underline underline-offset-4"
        >
          {termo.acao.rotulo}
        </Link>
      ) : null}
      {relacionados.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-section-label text-ink-muted">Veja também</h3>
          <ul className="flex flex-wrap gap-2">
            {relacionados.map((relacionado) => (
              <li key={relacionado.id}>
                <button
                  type="button"
                  onClick={() => trocar(relacionado.id)}
                  className="relative inline-flex min-h-8 cursor-pointer items-center rounded-full border border-border-field bg-surface px-3 text-small font-bold text-ink transition-colors duration-150 before:absolute before:-inset-y-2 before:inset-x-0 hover:border-accent hover:bg-accent-soft"
                >
                  {relacionado.titulo}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
