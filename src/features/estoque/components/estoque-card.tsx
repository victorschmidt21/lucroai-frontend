'use client';

import { useId } from 'react';
import {
  UNIDADE_MEDIDA_ROTULOS,
  type UnidadeMedida,
} from '@/shared/api/contracts/enums';
import type { Estoque } from '@/shared/api/contracts/operations';
import {
  fracaoDaBarra,
  percentualEstoque,
  statusEstoque,
} from '@/shared/domain/estoque';
import { formatData } from '@/shared/format/data';
import { formatNumero, formatQuantidade } from '@/shared/format/numero';
import { StatusEstoqueBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Chip } from '@/shared/ui/chip';
import { IconAtualizar } from '@/shared/ui/icons/acoes';
import { ProgressBar } from '@/shared/ui/progress-bar';
import { Skeleton } from '@/shared/ui/skeleton';
import type { ItemEstoque } from '../hooks/use-estoques';

/** Cartão de um insumo. Origem: estoque_card.dart. */
export function EstoqueCard({ insumo, estoque }: ItemEstoque) {
  const tituloId = useId();
  const unidade = UNIDADE_MEDIDA_ROTULOS[insumo.unidade];

  return (
    <article
      aria-labelledby={tituloId}
      className="flex h-full flex-col gap-3 rounded-md border border-border bg-surface p-4 text-ink"
    >
      <div className="flex flex-col items-start gap-1.5">
        <h2 id={tituloId} className="text-body font-semibold wrap-anywhere">
          {insumo.nome}
        </h2>
        <Chip>{unidade}</Chip>
      </div>

      {estoque.isSuccess ? (
        <Saldo
          estoque={estoque.data}
          nome={insumo.nome}
          unidade={insumo.unidade}
        />
      ) : estoque.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-small text-ink-muted">
            Não foi possível carregar o estoque deste insumo.
          </p>
          <Button
            variant="secundario"
            size="compacto"
            loading={estoque.isFetching}
            onClick={() => void estoque.refetch()}
          >
            {estoque.isFetching ? null : <IconAtualizar className="size-4" />}
            Tentar novamente
          </Button>
        </div>
      ) : (
        <Skeleton
          aria-label={`Carregando o estoque de ${insumo.nome}`}
          className="h-20"
        />
      )}
    </article>
  );
}

function Saldo({
  estoque,
  nome,
  unidade,
}: {
  estoque: Estoque;
  nome: string;
  unidade: UnidadeMedida;
}) {
  const status = statusEstoque(estoque);
  const percentual = `${formatNumero(percentualEstoque(estoque), 0)}%`;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <StatusEstoqueBadge status={status} />
        <span className="text-small text-ink-muted tabular-nums">
          {percentual}
        </span>
      </div>
      <ProgressBar
        aria-label={`Estoque de ${nome} em relação ao mínimo`}
        value={fracaoDaBarra(percentualEstoque(estoque))}
        valueText={percentual}
        tone={status}
      />
      <dl className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-small text-ink-muted">Disponível</dt>
          <dd className="font-semibold tabular-nums">
            {formatQuantidade(estoque.quantidadeDisponivel, unidade)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-small text-ink-muted">Mínimo</dt>
          <dd className="font-semibold tabular-nums">
            {formatQuantidade(estoque.quantidadeMinima, unidade)}
          </dd>
        </div>
      </dl>
      {estoque.dataAlteracao ? (
        <p className="text-small text-ink-muted">
          Atualizado em {formatData(estoque.dataAlteracao)}
        </p>
      ) : null}
    </>
  );
}
