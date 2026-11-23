'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { canaisOptions } from '@/features/configuracoes/api/configuracoes.queries';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import {
  STATUS_VENDA,
  STATUS_VENDA_ROTULOS,
  type StatusVenda,
} from '@/shared/api/contracts/enums';
import type { Venda } from '@/shared/api/contracts/sales';
import { getErrorMessage } from '@/shared/api/errors';
import { hrefComFiltros, type MudancasDeFiltro } from '@/shared/api/filtros';
import {
  fimDoDia,
  formatData,
  inicioDoDia,
  parseDataSemHora,
} from '@/shared/format/data';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero } from '@/shared/format/numero';
import { StatusVendaBadge } from '@/shared/ui/badge';
import { Button, IconButton } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { DataTable } from '@/shared/ui/data-table';
import {
  DateRangePicker,
  isPeriodoValido,
  type Periodo,
} from '@/shared/ui/date-picker';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { IconMostrar } from '@/shared/ui/icons/acoes';
import { Select } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { vendasListOptions } from '../api/vendas.queries';
import type { VendasSearch } from '../schemas/vendas-search.schema';
import {
  descreverLucroReal,
  nomeDoCanal,
  periodoPadrao,
  quantidadeDaVenda,
  resumirVendas,
  totalDaVenda,
} from '../vendas.calculos';
import { VendaDetalheDrawer } from './venda-detalhe-drawer';

type Props = {
  /** Filtros da URL, já validados pela página. */
  filtros: Pick<VendasSearch, 'dataInicio' | 'dataFim' | 'status'>;
  /** Abre a confirmação (FE-17) de uma venda `PENDENTE`. */
  onConfirmar: (venda: Venda) => void;
};

const nada = () => () => {};

/**
 * "Hoje" em `YYYY-MM-DD` no fuso do navegador; `null` no servidor, que pode
 * estar em outro fuso (o mês padrão mudaria na virada do mês).
 */
function useHoje() {
  return useSyncExternalStore(
    nada,
    () => periodoPadrao(new Date()).inicio,
    () => null,
  );
}

/** Aba "Histórico" de vendas_page.dart (`_buildHistorico`). */
export function HistoricoVendas({ filtros, onConfirmar }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inicioDoMes = useHoje();

  function alterarFiltros(mudancas: MudancasDeFiltro) {
    router.replace(hrefComFiltros(pathname, searchParams, mudancas), {
      scroll: false,
    });
  }

  if (inicioDoMes === null) {
    return <Skeleton aria-label="Carregando vendas" className="h-40" />;
  }

  const padrao = periodoPadrao(parseDataSemHora(inicioDoMes) as Date);
  const periodo: Periodo = {
    inicio: filtros.dataInicio ?? padrao.inicio,
    fim: filtros.dataFim ?? padrao.fim,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-end gap-3 md:grid-cols-[1fr_auto]">
        <FiltroPeriodo
          // Volta ao que está na URL quando ela muda (voltar do navegador).
          key={`${periodo.inicio}|${periodo.fim}`}
          periodo={periodo}
          onAplicar={({ inicio, fim }) =>
            alterarFiltros({ dataInicio: inicio, dataFim: fim })
          }
        />
        <Select
          label="Status"
          value={filtros.status ?? ''}
          onChange={(event) =>
            alterarFiltros({ status: event.target.value || null })
          }
          className="md:w-48"
        >
          <option value="">Todos</option>
          {STATUS_VENDA.map((status) => (
            <option key={status} value={status}>
              {STATUS_VENDA_ROTULOS[status]}
            </option>
          ))}
        </Select>
      </div>

      <ListaDeVendas
        periodo={periodo}
        status={filtros.status}
        onConfirmar={onConfirmar}
      />
    </div>
  );
}

/**
 * Edita o período num rascunho e só leva à URL um período completo e válido:
 * data inicial depois da final fica bloqueada, com a mensagem do `DateRangePicker`.
 */
function FiltroPeriodo({
  periodo,
  onAplicar,
}: {
  periodo: Periodo;
  onAplicar: (periodo: Periodo) => void;
}) {
  const [rascunho, setRascunho] = useState(periodo);

  return (
    <DateRangePicker
      legend="Período"
      value={rascunho}
      onChange={(novo) => {
        setRascunho(novo);
        if (novo.inicio && novo.fim && isPeriodoValido(novo)) onAplicar(novo);
      }}
    />
  );
}

function ListaDeVendas({
  periodo,
  status,
  onConfirmar,
}: {
  periodo: Periodo;
  status?: StatusVenda;
  onConfirmar: (venda: Venda) => void;
}) {
  // O backend lê as datas com `new Date()`: vão o início e o fim do dia local
  // em ISO, senão o último dia fica de fora (lacuna 7).
  const query = useQuery(
    vendasListOptions({
      dataInicio: inicioDoDia(
        parseDataSemHora(periodo.inicio) as Date,
      ).toISOString(),
      dataFim: fimDoDia(parseDataSemHora(periodo.fim) as Date).toISOString(),
      status,
    }),
  );
  const receitas = useQuery(receitasListOptions());
  const canais = useQuery(canaisOptions());
  const [detalhe, setDetalhe] = useState<Venda | null>(null);

  const nomes = new Map((receitas.data ?? []).map((r) => [r.id, r.nome]));

  /** `_resolveProdutoNome`: nomes das receitas dos itens, separados por vírgula. */
  function produtos(venda: Venda) {
    const lista = venda.itens
      .map((item) => nomes.get(item.receitaId))
      .filter((nome): nome is string => Boolean(nome?.trim()));
    return lista.length > 0 ? lista.join(', ') : 'Produto vendido';
  }

  if (query.isPending) {
    return <Skeleton aria-label="Carregando vendas" className="h-40" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar as vendas."
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }

  const vendas = query.data;
  const resumo = resumirVendas(vendas);

  return (
    <>
      <Card>
        <dl className="grid grid-cols-3 gap-3">
          <Metrica
            rotulo="Total vendido"
            valor={formatMoeda(resumo.totalVendido)}
          />
          <Metrica
            rotulo="Vendas"
            valor={formatNumero(resumo.quantidadeVendas)}
          />
          <Metrica
            rotulo="Ticket médio"
            valor={formatMoeda(resumo.ticketMedio)}
          />
        </dl>
      </Card>

      {vendas.length === 0 ? (
        <EmptyState title="Nenhuma venda encontrada no período." />
      ) : (
        <DataTable
          label="Vendas"
          rows={vendas}
          getRowKey={(venda) => venda.id}
          columns={[
            {
              id: 'produtos',
              header: 'Produto(s)',
              cell: (venda) => (
                <span className="wrap-anywhere">{produtos(venda)}</span>
              ),
            },
            {
              id: 'canal',
              header: 'Canal',
              cell: (venda) => nomeDoCanal(venda.canalId, canais.data ?? []),
            },
            {
              id: 'lucroReal',
              header: 'Lucro real',
              align: 'right',
              cell: (venda) => (
                <LucroRealDosItens
                  venda={venda}
                  nomeDoItem={(receitaId) =>
                    nomes.get(receitaId) ?? `Produto #${receitaId}`
                  }
                />
              ),
            },
            {
              id: 'data',
              header: 'Data',
              cell: (venda) => formatData(venda.dataVenda),
            },
            {
              id: 'quantidade',
              header: 'Quantidade',
              align: 'right',
              cell: (venda) => `${formatNumero(quantidadeDaVenda(venda))} un`,
            },
            {
              id: 'total',
              header: 'Total',
              align: 'right',
              cell: (venda) => (
                <span className="font-semibold text-accent">
                  {formatMoeda(totalDaVenda(venda))}
                </span>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (venda) => <StatusVendaBadge status={venda.status} />,
            },
            {
              id: 'acoes',
              header: 'Ações',
              acoes: true,
              cell: (venda) => (
                <div className="flex items-center justify-end gap-2">
                  {venda.status === 'PENDENTE' ? (
                    <Button
                      size="compacto"
                      aria-label={`Confirmar venda #${venda.id}`}
                      onClick={() => onConfirmar(venda)}
                    >
                      Confirmar
                    </Button>
                  ) : null}
                  <IconButton
                    aria-label={`Ver detalhes da venda #${venda.id}`}
                    onClick={() => setDetalhe(venda)}
                  >
                    <IconMostrar />
                  </IconButton>
                </div>
              ),
            },
          ]}
        />
      )}

      {detalhe ? (
        <VendaDetalheDrawer
          venda={detalhe}
          nomeDoItem={(receitaId) =>
            nomes.get(receitaId) ?? `Produto #${receitaId}`
          }
          canal={nomeDoCanal(detalhe.canalId, canais.data ?? [])}
          onFechar={() => setDetalhe(null)}
        />
      ) : null}
    </>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="truncate text-small text-ink-muted">{rotulo}</dt>
      <dd className="truncate font-semibold text-accent tabular-nums">
        {valor}
      </dd>
    </div>
  );
}

/**
 * Lucro real de cada item (FE-46), em % do preço: com mais de um item, cada
 * linha traz o nome. Negativo em cor de alerta e com "(prejuízo)".
 */
function LucroRealDosItens({
  venda,
  nomeDoItem,
}: {
  venda: Venda;
  nomeDoItem: (receitaId: number) => string;
}) {
  const varios = venda.itens.length > 1;
  return (
    <ul className="flex flex-col items-end gap-0.5">
      {venda.itens.map((item) => {
        const { texto, prejuizo } = descreverLucroReal(item.lucroReal);
        return (
          <li
            key={item.id}
            className={
              prejuizo ? 'font-semibold text-danger' : 'text-ink-muted'
            }
          >
            {varios ? `${nomeDoItem(item.receitaId)}: ${texto}` : texto}
          </li>
        );
      })}
    </ul>
  );
}
