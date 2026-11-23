'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type {
  Receita,
  SimularCenarioBody,
} from '@/shared/api/contracts/recipe';
import type { Venda } from '@/shared/api/contracts/sales';
import { getErrorMessage } from '@/shared/api/errors';
import { hrefComFiltros } from '@/shared/api/filtros';
import { fimDoDia, inicioDoDia } from '@/shared/format/data';
import { formatMoeda } from '@/shared/format/moeda';
import {
  formatMargem,
  formatNumero,
  formatQuantidade,
  fracaoParaPercentual,
} from '@/shared/format/numero';
import { Button, buttonClasses } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/ui/cn';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { IconAdicionar, IconAtualizar } from '@/shared/ui/icons/acoes';
import { IlustracaoCaderno } from '@/shared/ui/ilustracoes';
import { PageHeader } from '@/shared/ui/page-header';
import { Select } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  receitasListOptions,
  simulacaoReceitaOptions,
} from '@/features/receitas/api/receitas.queries';
import { vendasListOptions } from '@/features/vendas/api/vendas.queries';
import {
  FAIXA_VARIACAO_CUSTO,
  calcularBase,
  cenariosDeVolume,
  custoComVariacao,
  faixaPreco,
  faixaVolume,
  limitarNaFaixa,
} from '../simulacao.calculos';
import { ControleSimulacao } from './controle-simulacao';
import { GraficoLucro } from './grafico-lucro';

function nada() {
  return () => {};
}

/**
 * Mês atual (`YYYY-MM`) no fuso do navegador; `null` no servidor, que pode
 * estar em outro fuso.
 */
function useMesAtual() {
  return useSyncExternalStore(
    nada,
    () => {
      const hoje = new Date();
      return `${hoje.getFullYear()}-${hoje.getMonth()}`;
    },
    () => null,
  );
}

/** Do dia 1 ao último dia do mês, em ISO (o backend lê com `new Date()`). */
function periodoDoMes(mes: string) {
  const [ano, indice] = mes.split('-').map(Number);
  return {
    dataInicio: inicioDoDia(new Date(ano, indice, 1)).toISOString(),
    dataFim: fimDoDia(new Date(ano, indice + 1, 0)).toISOString(),
  };
}

/**
 * Simulação interativa (FE-21). Origem: simulacao_page.dart. Receitas e vendas
 * `CONCLUIDA` do mês atual dão o ponto de partida; desde a FE-45 o lucro vem de
 * `POST /receitas/:id/simular` (no Balcão).
 */
export function SimulacaoTela({ receitaId }: { receitaId?: number }) {
  const mes = useMesAtual();
  const receitas = useQuery(receitasListOptions());
  const vendas = useQuery({
    ...vendasListOptions(mes ? periodoDoMes(mes) : {}),
    enabled: mes !== null,
  });

  let conteudo;
  if (receitas.isError || vendas.isError) {
    const falha = receitas.isError ? receitas : vendas;
    conteudo = (
      <ErrorState
        title="Não foi possível carregar a simulação."
        message={getErrorMessage(falha.error)}
        retrying={receitas.isFetching || vendas.isFetching}
        onRetry={() => {
          if (receitas.isError) void receitas.refetch();
          if (vendas.isError) void vendas.refetch();
        }}
      />
    );
  } else if (!receitas.data || !vendas.data) {
    conteudo = <Skeleton aria-label="Carregando simulação" className="h-96" />;
  } else if (receitas.data.length === 0) {
    conteudo = (
      <EmptyState
        title="Cadastre uma receita para simular cenários."
        ilustracao={<IlustracaoCaderno />}
        action={
          <Link href="/receitas/nova" className={buttonClasses('primario')}>
            <IconAdicionar className="size-5" />
            Criar receita
          </Link>
        }
      />
    );
  } else {
    const receita =
      receitas.data.find((r) => r.id === receitaId) ?? receitas.data[0];
    conteudo = (
      <Simulacao
        // Trocar de receita volta os ajustes ao inicial.
        key={receita.id}
        receitas={receitas.data}
        receita={receita}
        vendas={vendas.data}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <PageHeader
        title="Simulação"
        subtitle="Projete preço, custo e volume antes de agir"
      />
      {conteudo}
    </div>
  );
}

/** O valor só depois de `ms` sem mudar: o Slider não dispara uma chamada por passo. */
function useValorAtrasado(valor: string, ms = 300) {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const espera = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(espera);
  }, [valor, ms]);
  return atrasado;
}

/** Preço e volume da simulação; o custo só vai quando há variação. */
function corpoDaSimulacao(
  preco: number,
  volume: number,
  custo: number,
): SimularCenarioBody {
  return {
    novoPreco: preco,
    volume: Math.max(1, Math.round(volume)),
    ...(custo > 0 ? { novoCusto: custo } : {}),
  };
}

function formatVariacao(valor: number) {
  return `${valor > 0 ? '+' : ''}${formatNumero(valor)}%`;
}

function Simulacao({
  receitas,
  receita,
  vendas,
}: {
  receitas: Receita[];
  receita: Receita;
  vendas: Venda[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [precoAjustado, setPrecoAjustado] = useState<number | null>(null);
  const [variacaoCusto, setVariacaoCusto] = useState(0);
  const [volumeAjustado, setVolumeAjustado] = useState<number | null>(null);

  const base = calcularBase(receita, vendas);
  const faixaDoPreco = faixaPreco(receita);
  const faixaDoVolume = faixaVolume(base.volumeAtual, receita.rendimento);
  const preco = limitarNaFaixa(precoAjustado ?? base.precoAtual, faixaDoPreco);
  const volume = limitarNaFaixa(
    volumeAjustado ?? base.volumeAtual,
    faixaDoVolume,
  );
  const custoProjetado = custoComVariacao(base.custo, variacaoCusto);
  const corpo = useValorAtrasado(
    JSON.stringify(
      corpoDaSimulacao(preco, volume, variacaoCusto === 0 ? 0 : custoProjetado),
    ),
  );
  const projetado = useQuery({
    ...simulacaoReceitaOptions(
      receita.id,
      JSON.parse(corpo) as SimularCenarioBody,
    ),
    placeholderData: keepPreviousData,
  });
  const atual = useQuery({
    ...simulacaoReceitaOptions(
      receita.id,
      corpoDaSimulacao(base.precoAtual, base.volumeAtual, 0),
    ),
    enabled: base.precoAtual > 0,
  });
  const resultado = projetado.data;
  const lucroAtual = atual.data?.lucroMes ?? 0;
  const lucroPositivo = (resultado?.lucroMes ?? 0) >= 0;

  function restaurar() {
    setPrecoAjustado(null);
    setVariacaoCusto(0);
    setVolumeAjustado(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="items-center text-center">
        <h2 className="text-section-label text-ink-muted">PREÇO SIMULADO</h2>
        <p
          aria-live="polite"
          className="text-display-lg wrap-anywhere text-accent tabular-nums"
        >
          {formatMoeda(preco)}
        </p>
        {projetado.isError ? (
          <ErrorState
            className="w-full"
            title="Não foi possível simular."
            message={getErrorMessage(projetado.error)}
            retrying={projetado.isFetching}
            onRetry={() => void projetado.refetch()}
          />
        ) : resultado ? (
          <>
            <p
              className={cn(
                'text-small font-semibold',
                resultado.lucroPorUnidade >= 0 ? 'text-success' : 'text-danger',
              )}
            >
              Lucro: {formatMoeda(resultado.lucroPorUnidade)} por unidade
            </p>
            <dl className="grid w-full grid-cols-2 divide-x divide-border">
              <div className="flex flex-col-reverse gap-0.5 px-2">
                <dt className="text-caption text-ink-muted">Lucro projetado</dt>
                <dd
                  className={cn(
                    'text-body font-extrabold wrap-anywhere tabular-nums',
                    lucroPositivo ? 'text-success' : 'text-danger',
                  )}
                >
                  {formatMoeda(resultado.lucroMes)}
                </dd>
              </div>
              <div className="flex flex-col-reverse gap-0.5 px-2">
                <dt className="text-caption text-ink-muted">Lucro real</dt>
                <dd className="text-body font-extrabold text-warning tabular-nums">
                  {formatMargem(resultado.lucroReal)}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <Skeleton aria-label="Calculando o lucro" className="h-16 w-full" />
        )}
      </Card>

      <Card title="Produto">
        <Select
          label="Receita"
          value={receita.id}
          onChange={(event) =>
            router.replace(
              hrefComFiltros(pathname, searchParams, {
                receitaId: event.target.value,
              }),
              { scroll: false },
            )
          }
        >
          {receitas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </Select>
        <dl className="grid gap-2.5 sm:grid-cols-3">
          <Info rotulo="Custo unitário" valor={formatMoeda(base.custo)} />
          <Info rotulo="Preço atual" valor={formatMoeda(base.precoAtual)} />
          <Info
            rotulo="Volume atual no período"
            valor={`${formatQuantidade(base.volumeAtual)} unidades`}
          />
        </dl>
      </Card>

      <ControleSimulacao
        label="Preço de venda"
        labelCampo="Preço de venda (R$)"
        value={preco}
        onValueChange={setPrecoAjustado}
        faixa={faixaDoPreco}
        formatValue={formatMoeda}
        hint={`Atual: ${formatMoeda(base.precoAtual)}`}
        casas={2}
        prefixo="R$"
      />
      <ControleSimulacao
        label="Variação de custo"
        labelCampo="Variação de custo (%)"
        value={variacaoCusto}
        onValueChange={setVariacaoCusto}
        faixa={FAIXA_VARIACAO_CUSTO}
        formatValue={formatVariacao}
        hint={`Custo projetado: ${formatMoeda(custoProjetado)}`}
        casas={0}
        sufixo="%"
        aceitaNegativo
      />
      <ControleSimulacao
        label="Volume projetado"
        labelCampo="Volume projetado (unidades)"
        value={volume}
        onValueChange={setVolumeAjustado}
        faixa={faixaDoVolume}
        formatValue={(v) => `${formatNumero(v)} un.`}
        hint={`Volume atual: ${formatQuantidade(base.volumeAtual)} un.`}
        casas={0}
        sufixo="un."
      />

      <Button variant="secundario" onClick={restaurar} className="self-end">
        <IconAtualizar className="size-4" />
        Restaurar
      </Button>

      {resultado ? (
        <>
          <GraficoLucro
            lucroAtual={lucroAtual}
            lucroProjetado={resultado.lucroMes}
            margemAtual={fracaoParaPercentual(atual.data?.lucroReal ?? 0)}
            margemProjetada={fracaoParaPercentual(resultado.lucroReal)}
            diferenca={resultado.lucroMes - lucroAtual}
          />
          <CenariosDeVolume
            preco={preco}
            lucroPorUnidade={resultado.lucroPorUnidade}
            volume={volume}
          />
        </>
      ) : null}
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex min-w-0 flex-col-reverse gap-1 rounded-md border border-border bg-surface-alt px-3 py-2.5">
      <dt className="text-caption text-ink-muted">{rotulo}</dt>
      <dd className="text-body font-bold wrap-anywhere text-ink tabular-nums">
        {valor}
      </dd>
    </div>
  );
}

function CenariosDeVolume({
  preco,
  lucroPorUnidade,
  volume,
}: {
  preco: number;
  lucroPorUnidade: number;
  volume: number;
}) {
  return (
    <Card title="Simulação de volume">
      <ul className="flex flex-col divide-y divide-border">
        {cenariosDeVolume(preco, lucroPorUnidade, volume).map((cenario) => (
          <li
            key={cenario.nome}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div className="flex min-w-0 flex-col">
              <span className="text-body text-ink">
                {formatNumero(cenario.volume)} unidades
              </span>
              <span className="text-caption text-ink-muted">
                {cenario.nome}
              </span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-body font-extrabold text-ink tabular-nums">
                {formatMoeda(cenario.receita)}
              </span>
              <span
                className={cn(
                  'text-caption font-bold tabular-nums',
                  cenario.lucro >= 0 ? 'text-success' : 'text-danger',
                )}
              >
                Lucro: {formatMoeda(cenario.lucro)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
