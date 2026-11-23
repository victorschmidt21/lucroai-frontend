'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero } from '@/shared/format/numero';
import { buttonClasses } from '@/shared/ui/button';
import { cn } from '@/shared/ui/cn';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import {
  IconAlerta,
  IconDinheiro,
  IconSeta,
  IconSimular,
  IconTendencia,
} from '@/shared/ui/icons/acoes';
import {
  IconGastos,
  IconInsumos,
  IconProducao,
  IconReceitas,
  IconVendas,
} from '@/shared/ui/icons/menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatCard } from '@/shared/ui/stat-card';
import { estoqueInsumosOptions } from '@/features/estoque/api/estoque.queries';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import {
  resumoVendasOptions,
  vendasListOptions,
} from '@/features/vendas/api/vendas.queries';
import {
  calcularIndicadores,
  contarEstoqueBaixo,
  descreverSobraDoMes,
  evolucaoMensal,
  inicioDosSeisMeses,
  pontoEquilibrioDoPainel,
  porCadaCemReais,
  produtosMaisRentaveis,
  rotuloAcabando,
  tendenciaMensal,
  vendasDoMes,
  type ProdutoRentavel,
} from '../painel.calculos';
import { GraficoEvolucao } from './grafico-evolucao';

function nada() {
  return () => {};
}

/**
 * Agora, com precisão de minuto (`ano-mes-dia-hora-minuto`), no fuso do
 * navegador; `null` no servidor, que pode estar em outro fuso.
 */
function useAgora() {
  return useSyncExternalStore(
    nada,
    () => {
      const d = new Date();
      return [
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
      ].join('-');
    },
    () => null,
  );
}

function paraData(agora: string) {
  const [ano, mes, dia, hora, minuto] = agora.split('-').map(Number);
  return new Date(ano, mes, dia, hora, minuto);
}

type QueryDoBloco = {
  isError: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => unknown;
};

/** Estado de um bloco: erro (com "Tentar de novo"), Skeleton ou o conteúdo. */
function bloco({
  rotulo,
  titulo,
  queries,
  pronto,
  conteudo,
  classe,
  altura = 'h-28',
}: {
  rotulo: string;
  titulo: string;
  queries: readonly QueryDoBloco[];
  pronto: boolean;
  conteudo: () => ReactNode;
  /** Posição no grid, nos estados de erro e carregamento. */
  classe?: string;
  altura?: string;
}) {
  const falhas = queries.filter((q) => q.isError);
  if (falhas.length > 0) {
    return (
      <ErrorState
        className={classe}
        title={titulo}
        message={getErrorMessage(falhas[0].error)}
        retrying={falhas.some((q) => q.isFetching)}
        onRetry={() => falhas.forEach((q) => void q.refetch())}
      />
    );
  }
  if (!pronto) {
    return <Skeleton aria-label={rotulo} className={cn(altura, classe)} />;
  }
  return conteudo();
}

const ACOES_RAPIDAS = [
  { rotulo: 'Novo ingrediente', href: '/insumos?novo=1', Icone: IconInsumos },
  { rotulo: 'Nova receita', href: '/receitas/nova', Icone: IconReceitas },
  { rotulo: 'Nova fornada', href: '/producoes?novo=1', Icone: IconProducao },
  { rotulo: 'Novo gasto', href: '/gastos-indiretos?novo=1', Icone: IconGastos },
] as const;

/**
 * Painel (FE-22). Origem: dashboard_page.dart. Sem rota de painel no backend:
 * vendas dos últimos 6 meses, receitas e o saldo de cada insumo, com os cálculos
 * de `painel.calculos.ts`. Cada bloco tem o próprio carregamento e erro.
 */
export function PainelTela({ empresa }: { empresa: string }) {
  const agora = useAgora();
  // Só no navegador; o início dos seis meses só muda na virada do mês.
  const hoje = agora ? paraData(agora) : null;
  const inicio = hoje ? inicioDosSeisMeses(hoje).toISOString() : null;

  const vendas = useQuery({
    ...vendasListOptions(inicio ? { dataInicio: inicio } : {}),
    enabled: inicio !== null,
  });
  const receitas = useQuery(receitasListOptions());
  const estoques = useQuery(estoqueInsumosOptions());
  const resumo = useQuery(resumoVendasOptions());

  const dados =
    hoje && vendas.data && receitas.data
      ? { hoje, vendas: vendas.data, receitas: receitas.data }
      : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-heading text-ink">Doce Fatia</h1>
          <p className="text-subtitle text-ink-subtle">Seu painel financeiro</p>
          <p className="text-body font-semibold wrap-anywhere text-ink-muted">
            {empresa}
          </p>
        </div>
        <Link href="/simulacao" className={buttonClasses('secundario')}>
          <IconSimular className="size-4" />
          Simulação
        </Link>
      </header>

      <section
        aria-label="Indicadores"
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"
      >
        {bloco({
          rotulo: 'Carregando indicadores',
          titulo:
            'Não consegui buscar seus números agora. Confira a internet e toque em Tentar de novo.',
          queries: [vendas, receitas],
          pronto: dados !== null,
          classe: 'col-span-2 lg:col-span-3',
          conteudo: () => {
            if (!dados) return null;
            const ind = calcularIndicadores(
              dados.vendas,
              dados.receitas,
              dados.hoje,
            );
            const sobra = descreverSobraDoMes(ind);
            return (
              <>
                <StatCard
                  title="Faturamento"
                  value={formatMoeda(ind.faturamento)}
                  detail="Período atual"
                  detailTone="success"
                  icon={<IconDinheiro />}
                />
                <StatCard
                  title="Sobrou pra você"
                  value={formatMoeda(ind.lucro)}
                  detail={sobra.detalhe}
                  detailTone={sobra.tom}
                  icon={<IconTendencia />}
                />
                <StatCard
                  title="Vendas"
                  value={formatNumero(ind.vendasUltimos7Dias)}
                  detail="Últimos 7 dias"
                  icon={<IconVendas />}
                />
              </>
            );
          },
        })}
        {bloco({
          rotulo: 'Carregando estoque',
          titulo: 'Não foi possível carregar o estoque.',
          queries: [estoques],
          pronto: Boolean(estoques.data),
          classe: 'col-span-2 lg:col-span-1',
          conteudo: () => {
            const baixo = contarEstoqueBaixo(estoques.data ?? []);
            return (
              <Link
                href="/estoque?baixo=1"
                className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>div]:h-full [&>div]:hover:border-border-strong"
              >
                <StatCard
                  title="Despensa"
                  value={formatNumero(baixo)}
                  detail={rotuloAcabando(baixo)}
                  detailTone={baixo === 0 ? 'success' : 'danger'}
                  icon={<IconAlerta />}
                />
              </Link>
            );
          },
        })}
      </section>

      <Secao titulo="Contas do mês">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {bloco({
            rotulo: 'Carregando quanto vender para pagar as contas',
            titulo:
              'Não foi possível carregar quanto vender para pagar as contas.',
            queries: [resumo],
            pronto: Boolean(resumo.data),
            classe: 'col-span-2',
            conteudo: () => {
              if (!resumo.data) return null;
              const ponto = pontoEquilibrioDoPainel(
                resumo.data.pontoEquilibrio,
              );
              return (
                <StatCard
                  className="col-span-2"
                  title="Para pagar as contas do mês, venda"
                  value={ponto.valor}
                  detail={ponto.detalhe}
                  detailTone={ponto.tom}
                  icon={<IconGastos />}
                />
              );
            },
          })}
        </div>
      </Secao>

      <Secao titulo="Evolução mensal">
        {bloco({
          rotulo: 'Carregando evolução mensal',
          titulo: 'Não foi possível carregar a evolução mensal.',
          queries: [vendas],
          pronto: dados !== null,
          altura: 'h-52',
          conteudo: () => {
            if (!dados) return null;
            const pontos = evolucaoMensal(dados.vendas, dados.hoje);
            return (
              <GraficoEvolucao
                pontos={pontos}
                tendencia={tendenciaMensal(pontos.map((p) => p.valor))}
              />
            );
          },
        })}
      </Secao>

      <Secao titulo="Ações rápidas">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {ACOES_RAPIDAS.map(({ rotulo, href, Icone }) => (
            <Link key={href} href={href} className={buttonClasses('primario')}>
              <Icone className="size-4" />
              {rotulo}
            </Link>
          ))}
        </div>
      </Secao>

      <Secao
        titulo="Produtos mais rentáveis"
        acao={
          <Link
            href="/vendas?aba=historico"
            className="inline-flex min-h-12 items-center gap-1 text-small font-bold text-accent hover:underline"
          >
            Ver tudo
            <IconSeta className="size-4" />
          </Link>
        }
      >
        {bloco({
          rotulo: 'Carregando produtos mais rentáveis',
          titulo: 'Não foi possível carregar os produtos mais rentáveis.',
          queries: [vendas, receitas],
          pronto: dados !== null,
          conteudo: () =>
            dados ? (
              <ProdutosRentaveis
                produtos={produtosMaisRentaveis(
                  vendasDoMes(dados.vendas, dados.hoje),
                  dados.receitas,
                )}
              />
            ) : null,
        })}
      </Secao>
    </div>
  );
}

function Secao({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-section-label text-ink-muted">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** `unitsLabel` de `_ProductProfit`, com a quantidade abreviada como a web faz. */
function rotuloUnidades(quantidade: number | null) {
  return quantidade === null
    ? 'sem vendas no período'
    : `${formatNumero(quantidade)} un`;
}

function ProdutosRentaveis({ produtos }: { produtos: ProdutoRentavel[] }) {
  if (produtos.length === 0) {
    return (
      <EmptyState title="Cadastre receitas e registre vendas para ver rentabilidade." />
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {produtos.map((produto) => (
        <li
          key={produto.receitaId}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-body font-extrabold text-ink">
              {produto.nome}
            </p>
            <p className="truncate text-small text-ink-muted">
              {`${rotuloUnidades(produto.quantidade)} - ${
                porCadaCemReais(produto.margem) ?? 'abaixo do custo'
              }`}
            </p>
          </div>
          <p
            className={cn(
              'text-body font-extrabold tabular-nums',
              produto.lucro >= 0 ? 'text-success' : 'text-danger',
            )}
          >
            {formatMoeda(produto.lucro)}
          </p>
        </li>
      ))}
    </ul>
  );
}
