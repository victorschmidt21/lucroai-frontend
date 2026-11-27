'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef } from 'react';
import { hrefComFiltros, lerFiltros } from '@/shared/api/filtros';
import { Button } from '@/shared/ui/button';
import { ToggleChip } from '@/shared/ui/chip';
import { cn } from '@/shared/ui/cn';
import { EmptyState } from '@/shared/ui/empty-state';
import { IconBusca, IconSeta } from '@/shared/ui/icons/acoes';
import { IlustracaoCaderno } from '@/shared/ui/ilustracoes';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/ui/page-header';
import { useBuscaNaUrl } from '@/shared/ui/use-busca-na-url';
import type { Assunto } from '../aprender.schema';
import { buscarGuias, buscarTermos } from '../busca';
import { aprenderSearchSchema } from '../schemas/aprender-search.schema';

const OPCOES_ASSUNTO: { value: Assunto | undefined; label: string }[] = [
  { value: undefined, label: 'Todos' },
  { value: 'custos', label: 'Custos' },
  { value: 'preco', label: 'Preço' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'estoque', label: 'Estoque' },
];

const CARTAO_LINK =
  'flex h-full flex-col gap-1 rounded-lg border border-border bg-surface p-4 text-ink transition-colors duration-150 hover:border-accent';

/**
 * Página Aprender (FE-67): busca em `?q=`, assuntos em `?assunto=`, os termos
 * em cartões e os guias curtos. Tudo vem da base de termos, sem requisição.
 */
export function AprenderTela() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { assunto } = lerFiltros(aprenderSearchSchema, searchParams);
  const busca = useBuscaNaUrl();
  const campoDeBusca = useRef<HTMLInputElement>(null);

  function alterarAssunto(valor: Assunto | undefined) {
    router.replace(
      hrefComFiltros(pathname, searchParams, { assunto: valor ?? null }),
      { scroll: false },
    );
  }

  function limparBusca() {
    busca.limpar();
    campoDeBusca.current?.focus();
  }

  const termos = buscarTermos(busca.termo).filter(
    (termo) => assunto === undefined || termo.assunto === assunto,
  );
  // Os guias não têm assunto: a busca filtra, os chips não (FE-78).
  const guias = buscarGuias(busca.termo);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Aprender"
        subtitle="O que cada palavra do app quer dizer"
      />

      <search>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            busca.aplicarAgora();
          }}
        >
          <Input
            ref={campoDeBusca}
            type="search"
            label="Buscar uma palavra"
            hideLabel
            placeholder="Busque uma palavra, como “lucro”"
            icon={<IconBusca className="size-5" />}
            value={busca.texto}
            onChange={(event) => busca.alterar(event.target.value)}
            autoComplete="off"
            enterKeyHint="search"
          />
        </form>
      </search>

      {/* `min-w-0`: o `fieldset` não encolhe sozinho, e os chips precisam quebrar a linha em 360px. */}
      <fieldset className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-3">
        <legend className="sr-only">Assunto</legend>
        {OPCOES_ASSUNTO.map((opcao) => (
          <ToggleChip
            key={opcao.label}
            selected={assunto === opcao.value}
            // Um assunto está sempre escolhido: tocar no atual não desmarca.
            onSelectedChange={() => alterarAssunto(opcao.value)}
          >
            {opcao.label}
          </ToggleChip>
        ))}
      </fieldset>

      {termos.length === 0 && guias.length === 0 ? (
        <EmptyState
          ilustracao={<IlustracaoCaderno />}
          title="Ainda não temos essa palavra. Tente outra, como “custo” ou “preço”."
          action={
            busca.termo ? (
              <Button variant="secundario" onClick={limparBusca}>
                Limpar busca
              </Button>
            ) : undefined
          }
        />
      ) : termos.length === 0 ? null : (
        <ul aria-label="Palavras" className="grid gap-3 md:grid-cols-2">
          {termos.map((termo) => (
            <li key={termo.id}>
              <Link href={`/aprender/${termo.id}`} className={CARTAO_LINK}>
                <span className="font-display text-title">{termo.titulo}</span>
                <span className="text-body text-ink-muted">{termo.curto}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {guias.length === 0 ? null : (
        <section aria-labelledby="guias" className="flex flex-col gap-3">
          <h2 id="guias" className="text-section-label text-ink-muted">
            Guias
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {guias.map((guia) => (
              <li key={guia.id}>
                <Link
                  href={`/aprender/guias/${guia.id}`}
                  className={cn(
                    CARTAO_LINK,
                    'flex-row items-center justify-between gap-3',
                  )}
                >
                  <span className="flex flex-col gap-1">
                    <span className="font-display text-title">
                      {guia.titulo}
                    </span>
                    <span className="text-small text-ink-muted">
                      {guia.passos.length} passos
                    </span>
                  </span>
                  <IconSeta className="size-5 shrink-0 text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
