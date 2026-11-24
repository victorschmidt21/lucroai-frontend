'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero, formatPercentual } from '@/shared/format/numero';
import { buttonClasses } from '@/shared/ui/button';
import { cn } from '@/shared/ui/cn';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { IconAdicionar, IconSeta } from '@/shared/ui/icons/acoes';
import { IconEstoque, IconReceitas, IconVendas } from '@/shared/ui/icons/menu';
import { IlustracaoSacola } from '@/shared/ui/ilustracoes';
import { Logo } from '@/shared/ui/logo';
import { ProgressBar } from '@/shared/ui/progress-bar';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatCard } from '@/shared/ui/stat-card';
import { estoqueInsumosOptions } from '@/features/estoque/api/estoque.queries';
import { insumosListOptions } from '@/features/insumos/api/insumos.queries';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import {
  resumoVendasOptions,
  vendasListOptions,
} from '@/features/vendas/api/vendas.queries';
import {
  calcularIndicadores,
  chipsAcabando,
  evolucaoMensal,
  heroiDoMes,
  ingredientesAcabando,
  inicioDosSeisMeses,
  pontoEquilibrioDoPainel,
  porCadaCemReais,
  produtosMaisRentaveis,
  rotuloAcabando,
  saudacao,
  tendenciaMensal,
  textoFechamentoDoMes,
  vendasDoMes,
  type ProdutoRentavel,
} from '../painel.calculos';
import { Termo } from '@/features/aprender/components/termo';
import type { DadosDoExemplo } from '@/features/aprender/termos';
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

/** Estado de um bloco: erro compacto (com "Tentar de novo"), Skeleton ou o conteúdo. */
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
  /** Altura do Skeleton, no formato do bloco. */
  altura?: string;
}) {
  const falhas = queries.filter((q) => q.isError);
  if (falhas.length > 0) {
    return (
      <ErrorState
        compacto
        className={classe}
        title={titulo}
        message={getErrorMessage(falhas[0].error)}
        retrying={falhas.some((q) => q.isFetching)}
        onRetry={() => falhas.forEach((q) => void q.refetch())}
      />
    );
  }
  if (!pronto) {
    return (
      <Skeleton
        aria-label={rotulo}
        className={cn('rounded-lg', altura, classe)}
      />
    );
  }
  return conteudo();
}

const ERRO_NUMEROS =
  'Não consegui buscar seus números agora. Confira a internet e toque em Tentar de novo.';

const LINK_CLASSES =
  'inline-flex min-h-12 items-center gap-1 rounded-full font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * Painel (FE-22, redesenhado na FE-58). Sem rota de painel no backend: vendas
 * dos últimos 6 meses, receitas, insumos e o saldo de cada um, com os cálculos
 * de `painel.calculos.ts`. O lucro do mês é o herói; cada bloco tem o próprio
 * carregamento e erro. No celular, uma coluna na ordem do código; a partir de
 * `lg`, herói e cards à esquerda e as listas à direita.
 */
export function PainelTela({ nome }: { nome: string | null }) {
  const agora = useAgora();
  // Só no navegador; o início dos seis meses só muda na virada do mês.
  const hoje = agora ? paraData(agora) : null;
  const inicio = hoje ? inicioDosSeisMeses(hoje).toISOString() : null;

  const vendas = useQuery({
    ...vendasListOptions(inicio ? { dataInicio: inicio } : {}),
    enabled: inicio !== null,
  });
  const receitas = useQuery(receitasListOptions());
  const insumos = useQuery(insumosListOptions());
  const estoques = useQuery(estoqueInsumosOptions());
  const resumo = useQuery(resumoVendasOptions());

  const dados =
    hoje && vendas.data && receitas.data
      ? { hoje, vendas: vendas.data, receitas: receitas.data }
      : null;
  const indicadores = dados
    ? calcularIndicadores(dados.vendas, dados.receitas, dados.hoje)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-display text-ink">{saudacao(nome)}</h1>
        <p className="min-h-6 text-body text-ink-muted">
          {hoje ? textoFechamentoDoMes(hoje) : null}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          {bloco({
            rotulo: 'Carregando quanto sobrou este mês',
            titulo: ERRO_NUMEROS,
            queries: [vendas, receitas],
            pronto: indicadores !== null,
            altura: 'h-44',
            conteudo: () =>
              indicadores ? <Heroi indicadores={indicadores} /> : null,
          })}

          <section
            aria-label="Indicadores"
            className="grid grid-cols-2 gap-2.5"
          >
            {bloco({
              rotulo: 'Carregando vendas',
              titulo: ERRO_NUMEROS,
              queries: [vendas, receitas],
              pronto: indicadores !== null,
              classe: 'col-span-2',
              conteudo: () =>
                indicadores ? (
                  <>
                    <StatCard
                      title={
                        <Termo id="faturamento" dados={indicadores}>
                          Você vendeu
                        </Termo>
                      }
                      value={formatMoeda(indicadores.faturamento)}
                      detail="Este mês"
                    />
                    <StatCard
                      title="Pedidos na semana"
                      value={formatNumero(indicadores.vendasUltimos7Dias)}
                      detail="Últimos 7 dias"
                    />
                  </>
                ) : null,
            })}
            {bloco({
              rotulo: 'Carregando estoque',
              titulo: 'Não foi possível carregar o estoque.',
              queries: [estoques, insumos],
              pronto: Boolean(estoques.data && insumos.data),
              classe: 'col-span-2',
              altura: 'h-24',
              conteudo: () => (
                <CardEstoque
                  nomes={ingredientesAcabando(
                    estoques.data ?? [],
                    insumos.data ?? [],
                  )}
                />
              ),
            })}
          </section>

          {bloco({
            rotulo: 'Carregando quanto vender para pagar as contas',
            titulo:
              'Não foi possível carregar quanto vender para pagar as contas.',
            queries: [resumo, vendas, receitas],
            pronto: Boolean(resumo.data) && indicadores !== null,
            altura: 'h-28',
            conteudo: () =>
              resumo.data && indicadores ? (
                <ContasDoMes
                  ponto={pontoEquilibrioDoPainel(
                    resumo.data.pontoEquilibrio,
                    indicadores.faturamento,
                  )}
                  dados={{
                    valor: resumo.data.pontoEquilibrio.valor,
                    faturamento: indicadores.faturamento,
                  }}
                />
              ) : null,
          })}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Secao
            titulo="O que mais deu lucro"
            acao={
              <Link
                href="/vendas?aba=historico"
                className={cn(LINK_CLASSES, 'text-small text-accent')}
              >
                Ver tudo
                <IconSeta className="size-4" />
              </Link>
            }
          >
            {bloco({
              rotulo: 'Carregando o que mais deu lucro',
              titulo: 'Não foi possível carregar o que mais deu lucro.',
              queries: [vendas, receitas],
              pronto: dados !== null,
              altura: 'h-48',
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

          <Secao titulo="Evolução mensal">
            {bloco({
              rotulo: 'Carregando evolução mensal',
              titulo: 'Não foi possível carregar a evolução mensal.',
              queries: [vendas],
              pronto: dados !== null,
              altura: 'h-56',
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
            <div className="grid gap-2.5 min-[400px]:grid-cols-2">
              <Link href="/receitas/nova" className={buttonClasses('primario')}>
                <IconReceitas className="size-4" />
                Nova receita
              </Link>
              <Link href="/vendas" className={buttonClasses('secundario')}>
                <IconVendas className="size-4" />
                Anotar venda
              </Link>
            </div>
          </Secao>
        </div>
      </div>
    </div>
  );
}

/** Herói (FE-58): o lucro do mês, com os três estados de `heroiDoMes`. */
function Heroi({
  indicadores,
}: {
  indicadores: ReturnType<typeof calcularIndicadores>;
}) {
  const heroi = heroiDoMes(indicadores);
  const negativo = heroi.estado === 'negativo';

  return (
    <StatCard
      variant="heroi"
      heroiTone={negativo ? 'danger' : 'accent'}
      title={
        heroi.estado === 'positivo' ? (
          <>
            <Termo id="sobrou-pra-voce" tom="sobre-cor" dados={indicadores}>
              Sobrou pra você
            </Termo>{' '}
            este mês
          </>
        ) : (
          heroi.titulo
        )
      }
      value={formatMoeda(indicadores.lucro)}
      detail={heroi.detalhe ?? undefined}
      decoration={
        <Logo
          variante="simbolo"
          tom={negativo ? 'normal' : 'sobre-cor'}
          className="[&_svg]:size-32"
        />
      }
    >
      {negativo ? (
        <Link
          href="/simulacao"
          className={cn(LINK_CLASSES, 'text-ink underline')}
        >
          Ver como ajustar os preços
          <IconSeta className="size-4" />
        </Link>
      ) : null}
      {heroi.estado === 'sem-vendas' ? (
        <Link
          href="/vendas"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-on-accent bg-surface px-5 py-2 font-bold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
        >
          <IconVendas className="size-4" />
          Anotar uma venda
        </Link>
      ) : null}
    </StatCard>
  );
}

/** Card "Estoque" (FE-58): os ingredientes acabando em chips, ou "Estoque em dia". */
function CardEstoque({ nomes }: { nomes: string[] }) {
  const { visiveis, resto } = chipsAcabando(nomes);

  return (
    <Link
      href="/estoque?baixo=1"
      className="col-span-2 flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-surface p-4 hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-caption text-ink-muted">Estoque</span>
        <IconEstoque className="size-[18px] text-accent" />
      </span>
      {nomes.length === 0 ? (
        <span className="flex items-center gap-2 text-body font-bold text-ink">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-success"
          />
          Estoque em dia
        </span>
      ) : (
        <>
          <span className="text-body font-bold text-ink">
            {rotuloAcabando(nomes.length)}
          </span>
          <span className="flex flex-wrap gap-1.5">
            {visiveis.map((nome) => (
              <span
                key={nome}
                className="max-w-full truncate rounded-full bg-warning-soft px-2.5 py-0.5 text-caption text-warning"
              >
                {nome}
              </span>
            ))}
            {resto > 0 ? (
              <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-caption text-warning">
                +{formatNumero(resto)}
              </span>
            ) : null}
          </span>
        </>
      )}
    </Link>
  );
}

const PARA_PAGAR_AS_CONTAS = 'Para pagar as contas do mês';

/** "Para pagar as contas do mês, venda R$ X" com o quanto já foi vendido (FE-45, FE-58). */
function ContasDoMes({
  ponto,
  dados,
}: {
  ponto: ReturnType<typeof pontoEquilibrioDoPainel>;
  /** Para o exemplo "No seu caso" da Pitada (FE-65). */
  dados: DadosDoExemplo<'para-pagar-as-contas'>;
}) {
  return (
    <section
      aria-label="Contas do mês"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <h2 className="text-body font-bold text-ink">
        <Termo id="para-pagar-as-contas" dados={dados}>
          {PARA_PAGAR_AS_CONTAS}
        </Termo>
        {ponto.titulo.slice(PARA_PAGAR_AS_CONTAS.length)}
      </h2>
      {ponto.progresso !== null ? (
        <ProgressBar
          aria-label="Quanto já vendeu para pagar as contas do mês"
          value={ponto.progresso}
          tone={ponto.progresso >= 1 ? 'adequado' : 'accent'}
          valueText={formatPercentual(ponto.progresso * 100)}
        />
      ) : null}
      <p
        className={cn(
          'text-small',
          ponto.tom === 'danger' && 'text-danger',
          ponto.tom === 'success' && 'text-success',
          ponto.tom === 'muted' && 'text-ink-muted',
        )}
      >
        {ponto.detalhe}
      </p>
    </section>
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
      <div className="flex min-h-12 items-center justify-between gap-2">
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
      <EmptyState
        title="Crie uma receita e anote as vendas para ver o que mais deu lucro."
        ilustracao={<IlustracaoSacola />}
        action={
          // Secundária: "Nova receita" das ações rápidas já é a primária da tela.
          <Link href="/receitas/nova" className={buttonClasses('secundario')}>
            <IconAdicionar className="size-5" />
            Criar receita
          </Link>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {produtos.map((produto) => (
        <li
          key={produto.receitaId}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5"
        >
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-alt text-accent"
          >
            <IconReceitas className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-body font-bold text-ink">
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
              'text-body font-bold tabular-nums',
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
