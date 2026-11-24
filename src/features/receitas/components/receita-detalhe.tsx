'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PrecoCanal, Receita } from '@/shared/api/contracts/recipe';
import { getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatMargem, formatQuantidade } from '@/shared/format/numero';
import { buttonClasses } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/ui/cn';
import { ErrorState } from '@/shared/ui/error-state';
import { IconAlerta, IconEditar, IconSimular } from '@/shared/ui/icons/acoes';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { DicaNaHora } from '@/features/aprender/components/dica-na-hora';
import { Termo } from '@/features/aprender/components/termo';
import { receitaDetailOptions } from '../api/receitas.queries';
import {
  avisoSemPrecoPossivel,
  montarBarraDoPreco,
  type ParteDaBarra,
  type ParteDaBarraId,
} from '../receitas.calculos';

/** Cor de cada parte da barra; a legenda repete o nome e o valor (cor e texto). */
const COR_DA_PARTE: Record<ParteDaBarraId, string> = {
  ingredientes: 'bg-accent',
  contasDoMes: 'bg-warning',
  embalagemEPerdas: 'bg-ink-muted',
  imposto: 'bg-danger',
  taxaCanal: 'bg-ink',
  percentuaisDaVenda: 'bg-accent-strong',
  lucro: 'bg-success',
};

/**
 * Detalhe da receita (FE-44): custo de 1 unidade e preço sugerido em cada
 * canal ativo, com "Para onde vai cada R$ 1,00". Tudo vem de `GET
 * /receitas/:id` (`custo` e `precos`, BE-28), sem recalcular.
 */
export function ReceitaDetalhePagina({ receitaId }: { receitaId: number }) {
  const receita = useQuery(receitaDetailOptions(receitaId));

  let conteudo;
  if (receita.isError) {
    conteudo = (
      <ErrorState
        title="Não foi possível carregar a receita."
        message={getErrorMessage(receita.error)}
        retrying={receita.isFetching}
        onRetry={() => void receita.refetch()}
      />
    );
  } else if (!receita.data) {
    conteudo = (
      <div className="flex flex-col gap-4">
        <Skeleton aria-label="Carregando receita" className="h-40" />
        <Skeleton aria-label="Carregando preços" className="h-64" />
      </div>
    );
  } else {
    conteudo = <Detalhe receita={receita.data} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title={receita.data?.nome ?? 'Receita'}
        subtitle="Custo de cada unidade e preço em cada lugar onde você vende"
        actions={
          <>
            <Link href="/receitas" className={buttonClasses('secundario')}>
              Voltar para receitas
            </Link>
            <Link
              href={`/receitas/${receitaId}/simular`}
              className={buttonClasses('secundario')}
            >
              <IconSimular className="size-5" />
              Simular
            </Link>
            <Link
              href={`/receitas/${receitaId}/editar`}
              className={buttonClasses('primario')}
            >
              <IconEditar className="size-5" />
              Editar
            </Link>
          </>
        }
      />
      <DicaNaHora
        tela="receita"
        prejuizo={receita.data ? prejuizoDaReceita(receita.data) : null}
      />
      {conteudo}
    </div>
  );
}

/**
 * Canal em que o lucro por unidade do preço é negativo (o pior), para a dica
 * de margem negativa (FE-68); `null` quando todos deixam lucro.
 */
function prejuizoDaReceita(receita: Receita) {
  let pior: { preco: number; lucro: number } | null = null;
  for (const { preco, composicao } of receita.precos) {
    const lucro = composicao?.lucro.valor;
    if (preco === null || lucro === undefined || lucro >= 0) continue;
    if (!pior || lucro < pior.lucro) pior = { preco, lucro };
  }
  if (!pior) return null;
  return {
    receitaId: receita.id,
    receita: receita.nome,
    custo: receita.custo.unitario,
    preco: pior.preco,
    lucroPorUnidade: pior.lucro,
    hrefAjuste: `/receitas/${receita.id}/editar`,
  };
}

function Linha({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: ReactNode;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-body text-ink-muted">{rotulo}</dt>
      <dd
        className={cn(
          'text-body text-ink tabular-nums',
          destaque && 'font-semibold',
        )}
      >
        {valor}
      </dd>
    </div>
  );
}

function Detalhe({ receita }: { receita: Receita }) {
  const { custo } = receita;
  // O lucro efetivo é o mesmo em todos os canais: o da receita ou o padrão.
  const lucro =
    receita.lucroPercentual ??
    receita.precos.find((preco) => preco.composicao)?.composicao?.lucro.fracao;

  return (
    <div className="flex flex-col gap-6">
      <Card
        title={
          <Termo id="custo-por-unidade" dados={receita}>
            Custo de 1 unidade
          </Termo>
        }
      >
        <p className="text-display text-accent tabular-nums">
          {formatMoeda(custo.unitario)}
        </p>
        <dl className="flex flex-col gap-2">
          <Linha
            rotulo={<Termo id="ficha-tecnica">Ingredientes</Termo>}
            valor={formatMoeda(custo.ingredientes)}
          />
          <Linha
            rotulo={<Termo id="divisao-das-contas">Contas do mês</Termo>}
            valor={formatMoeda(custo.gastosMensais)}
          />
          {custo.gastosPorUnidade > 0 ? (
            <Linha
              rotulo="Gastos por unidade"
              valor={formatMoeda(custo.gastosPorUnidade)}
            />
          ) : null}
          <Linha
            rotulo={<Termo id="embalagem">Embalagem</Termo>}
            valor={formatMoeda(custo.embalagem)}
          />
          <Linha
            rotulo={<Termo id="perda">Perdas</Termo>}
            valor={formatMoeda(custo.perdas)}
          />
          <Linha
            rotulo={
              <>
                Custo do lote (
                <Termo id="rendimento" dados={receita}>
                  {formatQuantidade(
                    receita.rendimento,
                    receita.unidadeRendimento,
                  )}
                </Termo>
                )
              </>
            }
            valor={formatMoeda(receita.custoProducao)}
            destaque
          />
        </dl>
        <p className="text-small text-ink-muted">
          <Termo id="lucro-desejado">Lucro desta receita</Termo>
          {`: ${formatMargem(lucro)} de cada R$ 1,00 vendido${
            receita.lucroPercentual === undefined ? ' (padrão da empresa)' : ''
          }.`}
        </p>
      </Card>

      <section
        aria-labelledby="precos-por-canal"
        className="flex flex-col gap-3"
      >
        <h2 id="precos-por-canal" className="text-title text-ink">
          <Termo id="preco-sugerido" dados={receita}>
            Preço sugerido
          </Termo>{' '}
          por <Termo id="canal-de-venda">canal</Termo>
        </h2>
        {receita.precos.length === 0 ? (
          <Card>
            <p className="text-body text-ink-muted">
              Nenhuma forma de venda ativa.{' '}
              <Link href="/configuracoes" className="text-accent underline">
                Ative uma em Ajustes de preço
              </Link>
              .
            </p>
          </Card>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {receita.precos.map((preco) => (
              <li key={preco.canalId} className="flex">
                <PrecoDoCanal preco={preco} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PrecoDoCanal({ preco }: { preco: PrecoCanal }) {
  return (
    <Card className="w-full">
      <h3 className="text-body font-semibold wrap-anywhere text-ink">
        {preco.canal}
      </h3>
      {preco.preco === null || preco.composicao === null ? (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/8 p-3 text-body text-ink">
          <IconAlerta className="shrink-0 text-warning" />
          <p>{avisoSemPrecoPossivel(preco.percentuais)}</p>
        </div>
      ) : (
        <>
          <p className="text-display text-accent tabular-nums">
            {formatMoeda(preco.preco)}
          </p>
          <BarraDoPreco partes={montarBarraDoPreco(preco.composicao, preco)} />
        </>
      )}
    </Card>
  );
}

/** A barra é só visual (`aria-hidden`): a legenda traz cada parte em texto. */
function BarraDoPreco({ partes }: { partes: ParteDaBarra[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-small font-medium text-ink-muted">
        Para onde vai cada R$ 1,00
      </p>
      <div
        aria-hidden="true"
        className="flex h-3 w-full gap-px overflow-hidden rounded-sm bg-border-strong"
      >
        {partes.map((parte) => (
          <span
            key={parte.id}
            className={COR_DA_PARTE[parte.id]}
            style={{ width: `${Math.max(parte.fracao, 0) * 100}%` }}
          />
        ))}
      </div>
      <dl className="flex flex-col gap-1.5">
        {partes.map((parte) => (
          <div
            key={parte.id}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="flex items-center gap-2 text-body text-ink-muted">
              <span
                aria-hidden="true"
                className={cn(
                  'size-2.5 shrink-0 rounded-full',
                  COR_DA_PARTE[parte.id],
                )}
              />
              {parte.rotulo}
            </dt>
            <dd
              className={cn(
                'text-body text-ink tabular-nums',
                parte.id === 'lucro' && 'font-semibold text-success',
              )}
            >
              {`${formatMoeda(parte.fracao)} (${formatMargem(parte.fracao)})`}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
