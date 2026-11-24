import Link from 'next/link';
import { buttonClasses } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import type { Guia } from '../guias';
import { buscarTermo } from '../termos';
import { VoltarAoAprender } from './termo-pagina';

/**
 * Página de um guia (FE-67): os passos numerados, cada um com o link para a
 * tela onde ele é feito e, quando houver, o termo que o passo explica.
 */
export function GuiaPagina({ guia }: { guia: Guia }) {
  return (
    <div className="flex flex-col gap-5">
      <VoltarAoAprender />
      <PageHeader
        title={guia.titulo}
        subtitle={`${guia.passos.length} passos`}
      />

      <ol className="flex flex-col gap-3">
        {guia.passos.map((passo, indice) => {
          const termo = passo.termo ? buscarTermo(passo.termo) : undefined;
          return (
            <li
              key={passo.texto}
              className="flex gap-3 rounded-lg border border-border bg-surface p-4 text-ink"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-extrabold text-ink tabular-nums"
              >
                {indice + 1}
              </span>
              <div className="flex min-w-0 flex-col items-start gap-2">
                <p className="text-body">
                  <span className="sr-only">Passo {indice + 1}: </span>
                  {passo.texto}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Link
                    href={passo.link.href}
                    className={buttonClasses(
                      'secundario',
                      undefined,
                      'compacto',
                    )}
                  >
                    {passo.link.rotulo}
                  </Link>
                  {termo ? (
                    <Link
                      href={`/aprender/${termo.id}`}
                      className="inline-flex min-h-12 items-center text-small font-bold text-accent underline underline-offset-4"
                    >
                      O que é {termo.titulo}?
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
