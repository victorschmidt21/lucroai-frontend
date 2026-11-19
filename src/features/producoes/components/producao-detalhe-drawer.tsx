'use client';

import { useQuery } from '@tanstack/react-query';
import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import type { Producao } from '@/shared/api/contracts/operations';
import type { Receita } from '@/shared/api/contracts/recipe';
import { getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero } from '@/shared/format/numero';
import { SEM_VALOR } from '@/shared/format/texto';
import { Drawer } from '@/shared/ui/drawer';
import { ErrorState } from '@/shared/ui/error-state';
import { producaoDetailOptions } from '../api/producoes.queries';
import { calcularTotalUnidades } from '../producoes.calculos';
import { descricaoDosLotes, formatCustoPorUnidade } from './producoes-texto';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producao: Producao;
  receita?: Receita;
  gastos: readonly GastoIndireto[];
};

/** Detalhe da produção, com os rateios gravados (`GET /producoes/:id`). Só na web. */
export function ProducaoDetalheDrawer({
  open,
  onOpenChange,
  producao,
  receita,
  gastos,
}: Props) {
  return (
    <Drawer
      title={receita?.nome ?? `Receita #${producao.receitaId}`}
      description={descricaoDosLotes(producao)}
      open={open}
      onOpenChange={onOpenChange}
    >
      {open ? (
        <Detalhe producao={producao} receita={receita} gastos={gastos} />
      ) : null}
    </Drawer>
  );
}

function Detalhe({
  producao: daLista,
  receita,
  gastos,
}: Omit<Props, 'open' | 'onOpenChange'>) {
  // A linha da lista aparece na hora, enquanto o detalhe é buscado.
  const detalhe = useQuery({
    ...producaoDetailOptions(daLista.id),
    placeholderData: daLista,
  });

  if (detalhe.isError) {
    return (
      <ErrorState
        title="Erro ao carregar a produção"
        message={getErrorMessage(detalhe.error)}
        onRetry={() => void detalhe.refetch()}
        retrying={detalhe.isFetching}
      />
    );
  }

  const producao = detalhe.data ?? daLista;
  const descricoes = new Map(gastos.map((g) => [g.id, g.descricao]));
  // O rendimento é o atual da receita: o backend não grava o total de unidades.
  const unidades = receita
    ? `${formatNumero(calcularTotalUnidades(producao.quantidade, receita.rendimento))} ${UNIDADE_MEDIDA_ROTULOS[receita.unidadeRendimento]}`
    : SEM_VALOR;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface-alt p-3">
        <Item rotulo="Total de unidades" valor={unidades} />
        <Item rotulo="Custo total" valor={formatMoeda(producao.custoTotal)} />
        <Item
          rotulo="Custo unitário"
          valor={formatCustoPorUnidade(producao.custoUnitario)}
        />
      </dl>
      <section aria-labelledby="rateios-titulo" className="flex flex-col gap-2">
        <h3 id="rateios-titulo" className="text-small text-ink-muted">
          Rateio dos gastos indiretos
        </h3>
        {producao.rateios.length === 0 ? (
          <p className="text-small text-ink-muted">Nenhum gasto rateado.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {producao.rateios.map((rateio) => (
              <li
                key={rateio.gastoIndiretoId}
                className="flex justify-between gap-3 rounded-md border border-border bg-surface p-3"
              >
                <span className="min-w-0 wrap-anywhere">
                  {descricoes.get(rateio.gastoIndiretoId) ??
                    `Gasto #${rateio.gastoIndiretoId}`}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatMoeda(rateio.valorRateado)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small text-ink-muted">{rotulo}</dt>
      <dd className="font-semibold tabular-nums">{valor}</dd>
    </div>
  );
}
