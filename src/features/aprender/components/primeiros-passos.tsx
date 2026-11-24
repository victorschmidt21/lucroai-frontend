'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { buttonClasses } from '@/shared/ui/button';
import { cn } from '@/shared/ui/cn';
import { IconCheck } from '@/shared/ui/icons/acoes';
import { Logo } from '@/shared/ui/logo';
import { ProgressBar } from '@/shared/ui/progress-bar';
import { configuracaoCustosOptions } from '@/features/configuracoes/api/configuracoes.queries';
import { gastosIndiretosListOptions } from '@/features/gastos-indiretos/api/gastos-indiretos.queries';
import { insumosListOptions } from '@/features/insumos/api/insumos.queries';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import { vendasListOptions } from '@/features/vendas/api/vendas.queries';
import { passosIniciais, type PassoInicial } from '../primeiros-passos';
import { Termo } from './termo';

const CHAVE_ESCONDIDOS = 'aprender:passos-escondidos';
// "nao": o cartão já apareceu com passo faltando; "sim": a comemoração já apareceu.
const CHAVE_CONCLUIDOS = 'aprender:passos-concluidos';

function lerChave(chave: string) {
  try {
    return window.localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravarChave(chave: string, valor: string) {
  try {
    window.localStorage.setItem(chave, valor);
  } catch {
    // Sem localStorage, o cartão só não lembra entre as visitas.
  }
}

/** O que estava guardado ao abrir o Início; `null` no servidor. */
function lerInicio() {
  if (typeof window === 'undefined') return null;
  return {
    escondido: lerChave(CHAVE_ESCONDIDOS) === '1',
    concluidos: lerChave(CHAVE_CONCLUIDOS),
  };
}

const VENDAS_CONCLUIDAS = { status: 'CONCLUIDA' } as const;

/**
 * Primeiros passos no Início (FE-66, docs/aprender.md#primeiros-passos): os 5
 * passos até o primeiro preço justo, marcados pelos dados. Não aparece enquanto
 * carrega, com erro, escondido, depois da comemoração, nem numa conta que já
 * estava com tudo feito na primeira visita (o seed).
 */
export function PrimeirosPassos() {
  // Lido uma vez por visita: a comemoração fica até sair do Início.
  const [inicio] = useState(lerInicio);
  const [escondido, setEscondido] = useState(false);
  const ativo =
    inicio !== null && !inicio.escondido && inicio.concluidos !== 'sim';

  const insumos = useQuery({ ...insumosListOptions(), enabled: ativo });
  const gastos = useQuery({ ...gastosIndiretosListOptions(), enabled: ativo });
  const configuracao = useQuery({
    ...configuracaoCustosOptions(),
    enabled: ativo,
  });
  const receitas = useQuery({ ...receitasListOptions(), enabled: ativo });
  const vendas = useQuery({
    ...vendasListOptions(VENDAS_CONCLUIDAS),
    enabled: ativo,
  });

  const passos =
    insumos.data &&
    gastos.data &&
    configuracao.data &&
    receitas.data &&
    vendas.data
      ? passosIniciais({
          insumos: insumos.data,
          gastos: gastos.data,
          configuracao: configuracao.data,
          receitas: receitas.data,
          vendas: vendas.data,
        })
      : null;
  const feitos = passos ? passos.filter((p) => p.feito).length : 0;
  const completo = passos !== null && feitos === passos.length;
  const visivel =
    ativo &&
    !escondido &&
    passos !== null &&
    (!completo || inicio?.concluidos === 'nao');

  useEffect(() => {
    if (visivel) gravarChave(CHAVE_CONCLUIDOS, completo ? 'sim' : 'nao');
  }, [visivel, completo]);

  if (!visivel || !passos) return null;

  function esconder() {
    gravarChave(CHAVE_ESCONDIDOS, '1');
    setEscondido(true);
  }

  if (completo) {
    return (
      <section
        aria-labelledby="primeiros-passos-titulo"
        className="flex flex-col items-start gap-3 rounded-lg border-2 border-accent bg-surface p-4"
      >
        <Logo variante="simbolo" />
        <h2
          id="primeiros-passos-titulo"
          className="font-display text-title text-ink"
        >
          Seu primeiro preço justo está pronto!
        </h2>
        <Link href="/receitas" className={buttonClasses('secundario')}>
          Ver minhas receitas
        </Link>
      </section>
    );
  }

  const atual = passos.findIndex((p) => !p.feito);

  return (
    <section
      aria-labelledby="primeiros-passos-titulo"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="primeiros-passos-titulo"
          className="font-display text-title text-ink"
        >
          Seus primeiros passos
        </h2>
        <button
          type="button"
          onClick={esconder}
          className="min-h-12 shrink-0 cursor-pointer rounded-full px-3 text-small font-bold text-ink-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Esconder
        </button>
      </div>
      <ProgressBar
        aria-label="Primeiros passos feitos"
        value={feitos / passos.length}
        valueText={`${feitos} de ${passos.length} feitos`}
      />
      <p className="text-small text-ink-muted">
        {feitos} de {passos.length} feitos
      </p>
      <ol className="flex flex-col gap-2">
        {passos.map((passo, i) => (
          <Passo
            key={passo.id}
            passo={passo}
            numero={i + 1}
            destaque={i === atual}
          />
        ))}
      </ol>
    </section>
  );
}

/** Títulos e apoios com a Pitada (só no passo destacado). */
function textoDoPasso(passo: PassoInicial): {
  titulo: ReactNode;
  apoio: ReactNode;
} {
  if (passo.id === 'fornadas') {
    return {
      titulo: (
        <>
          Dizer quantas <Termo id="fornadas-por-mes">fornadas</Termo> cabem no
          mês
        </>
      ),
      apoio: passo.apoio,
    };
  }
  if (passo.id === 'receita') {
    return {
      titulo: passo.titulo,
      apoio: (
        <>
          Você vai ver quanto custa e{' '}
          <Termo id="preco-sugerido">quanto cobrar</Termo>.
        </>
      ),
    };
  }
  return { titulo: passo.titulo, apoio: passo.apoio };
}

function Passo({
  passo,
  numero,
  destaque,
}: {
  passo: PassoInicial;
  numero: number;
  destaque: boolean;
}) {
  const marcador = (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full text-small font-bold',
        passo.feito
          ? 'bg-success-soft text-success'
          : 'bg-surface-alt text-ink-muted',
      )}
    >
      {passo.feito ? <IconCheck className="size-4" /> : numero}
    </span>
  );

  if (passo.feito) {
    return (
      <li className="flex items-center gap-3 px-3 py-1">
        {marcador}
        <span className="text-body text-ink-muted line-through">
          {passo.titulo}
        </span>
        <span className="sr-only">(feito)</span>
      </li>
    );
  }

  if (!destaque) {
    return (
      <li className="flex items-center gap-3 px-3 py-1">
        {marcador}
        <span className="text-body text-ink">{passo.titulo}</span>
      </li>
    );
  }

  const texto = textoDoPasso(passo);
  return (
    <li className="flex flex-col gap-2 rounded-md border-2 border-accent p-3">
      <div className="flex items-center gap-3">
        {marcador}
        <span className="text-body font-bold text-ink">{texto.titulo}</span>
      </div>
      <p className="text-small text-ink-muted">{texto.apoio}</p>
      <Link
        href={passo.href}
        className={buttonClasses('secundario', 'self-start', 'compacto')}
      >
        {passo.botao}
      </Link>
    </li>
  );
}
