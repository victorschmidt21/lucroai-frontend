import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClasses } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';
import type { Termo } from '../aprender.schema';
import { telasDoTermo } from '../onde-aparece';
import { buscarTermo } from '../termos';

const LINK_TEXTO =
  'inline-flex min-h-12 items-center font-extrabold text-accent underline underline-offset-4';

const CHIP_LINK =
  'inline-flex min-h-12 items-center rounded-full border border-border-field bg-surface px-4 text-small font-bold text-ink transition-colors duration-150 hover:border-accent hover:bg-accent-soft';

/** Link "Aprender" no topo das páginas de termo e de guia. */
export function VoltarAoAprender() {
  return (
    <Link href="/aprender" className={`${LINK_TEXTO} self-start`}>
      Voltar ao Aprender
    </Link>
  );
}

/**
 * Página de um termo (FE-67): a explicação inteira, por que importa, a ação,
 * as telas onde ele aparece e os relacionados. Sem "No seu caso": a Pitada já
 * mostra o exemplo nas telas que têm os dados (docs/aprender.md#página-aprender).
 */
export function TermoPagina({ termo }: { termo: Termo }) {
  const telas = telasDoTermo(termo.id);
  const relacionados = termo.relacionados
    .map((id) => buscarTermo(id))
    .filter((relacionado) => relacionado !== undefined);

  return (
    <div className="flex flex-col gap-5">
      <VoltarAoAprender />
      <PageHeader title={termo.titulo} subtitle={termo.curto} />

      <Card className="gap-4 p-5 text-body">
        <p>{termo.explicacao}</p>
        <p className="text-ink-muted">{termo.porQueImporta}</p>
        {termo.acao ? (
          <Link
            href={termo.acao.href}
            className={buttonClasses('primario', 'self-start')}
          >
            {termo.acao.rotulo}
          </Link>
        ) : null}
      </Card>

      {telas.length > 0 ? (
        <Secao titulo="Onde aparece no app">
          <ul className="flex flex-col">
            {telas.map((tela) => (
              <li key={tela.href}>
                <Link href={tela.href} className={LINK_TEXTO}>
                  {tela.nome}
                </Link>
              </li>
            ))}
          </ul>
        </Secao>
      ) : null}

      {relacionados.length > 0 ? (
        <Secao titulo="Veja também">
          <ul className="flex flex-wrap gap-2">
            {relacionados.map((relacionado) => (
              <li key={relacionado.id}>
                <Link
                  href={`/aprender/${relacionado.id}`}
                  className={CHIP_LINK}
                >
                  {relacionado.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </Secao>
      ) : null}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2" aria-label={titulo}>
      <h2 className="text-section-label text-ink-muted">{titulo}</h2>
      {children}
    </section>
  );
}
