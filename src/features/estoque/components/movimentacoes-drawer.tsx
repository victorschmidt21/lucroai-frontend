'use client';

import { useQuery } from '@tanstack/react-query';
import type { Insumo } from '@/shared/api/contracts/catalog';
import {
  ORIGEM_MOVIMENTACAO_ROTULOS,
  TIPO_MOVIMENTACAO_ROTULOS,
} from '@/shared/api/contracts/enums';
import type { MovimentacaoEstoque } from '@/shared/api/contracts/operations';
import { getErrorMessage } from '@/shared/api/errors';
import { formatData } from '@/shared/format/data';
import { formatQuantidade } from '@/shared/format/numero';
import { cn } from '@/shared/ui/cn';
import { Drawer } from '@/shared/ui/drawer';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { IconEntrada, IconHistorico, IconSaida } from '@/shared/ui/icons/acoes';
import { Skeleton } from '@/shared/ui/skeleton';
import { movimentacoesOptions } from '../api/estoque.queries';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insumo: Insumo;
};

/**
 * Histórico de entradas e saídas de um insumo, na ordem do backend (a mais
 * recente primeiro). Só na web: o mobile busca as movimentações, mas não as mostra.
 */
export function MovimentacoesDrawer({ open, onOpenChange, insumo }: Props) {
  return (
    <Drawer
      title="Histórico"
      description={insumo.nome}
      open={open}
      onOpenChange={onOpenChange}
    >
      {open ? <Historico insumo={insumo} /> : null}
    </Drawer>
  );
}

function Historico({ insumo }: { insumo: Insumo }) {
  const movimentacoes = useQuery(movimentacoesOptions(insumo.id));

  if (movimentacoes.isPending) {
    return <Skeleton aria-label="Carregando o histórico" className="h-40" />;
  }

  if (movimentacoes.isError) {
    return (
      <ErrorState
        title="Erro ao carregar o histórico"
        message={getErrorMessage(movimentacoes.error)}
        onRetry={() => void movimentacoes.refetch()}
        retrying={movimentacoes.isFetching}
      />
    );
  }

  if (movimentacoes.data.length === 0) {
    return (
      <EmptyState
        icon={<IconHistorico />}
        title="Nenhuma movimentação registrada."
      />
    );
  }

  return (
    <ul aria-label="Movimentações" className="flex flex-col gap-2">
      {movimentacoes.data.map((movimentacao) => (
        <li key={movimentacao.id}>
          <ItemMovimentacao movimentacao={movimentacao} insumo={insumo} />
        </li>
      ))}
    </ul>
  );
}

function ItemMovimentacao({
  movimentacao,
  insumo,
}: {
  movimentacao: MovimentacaoEstoque;
  insumo: Insumo;
}) {
  const entrada = movimentacao.tipo === 'ENTRADA';
  const Icone = entrada ? IconEntrada : IconSaida;
  // Sinal tipográfico de menos (U+2212) na saída, como em business-rules.md.
  const sinal = entrada ? '+' : '−';
  const referencia =
    movimentacao.origem === 'PRODUCAO' && movimentacao.referenciaId !== null
      ? `Produção #${movimentacao.referenciaId}`
      : null;

  return (
    <article className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          entrada
            ? 'bg-status-adequado/8 text-status-adequado'
            : 'bg-status-critico/8 text-status-critico',
        )}
      >
        <Icone className="size-5" />
      </span>
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <p className="font-semibold">
          {TIPO_MOVIMENTACAO_ROTULOS[movimentacao.tipo]}
          <span className="font-normal text-ink-muted">
            {' · '}
            {ORIGEM_MOVIMENTACAO_ROTULOS[movimentacao.origem]}
          </span>
        </p>
        <p className="text-small text-ink-muted">
          {formatData(movimentacao.dataMovimentacao)}
          {referencia ? ` · ${referencia}` : null}
        </p>
        {movimentacao.observacao ? (
          <p className="text-small wrap-anywhere text-ink-muted">
            {movimentacao.observacao}
          </p>
        ) : null}
      </div>
      <span
        className={cn(
          'shrink-0 font-semibold tabular-nums',
          entrada ? 'text-status-adequado' : 'text-status-critico',
        )}
      >
        {sinal}
        {formatQuantidade(Math.abs(movimentacao.quantidade), insumo.unidade)}
      </span>
    </article>
  );
}
