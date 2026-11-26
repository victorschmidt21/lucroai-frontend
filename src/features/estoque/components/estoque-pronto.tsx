'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import { getErrorMessage } from '@/shared/api/errors';
import { formatQuantidade } from '@/shared/format/numero';
import { EstoqueNegativoBadge } from '@/shared/ui/badge';
import { buttonClasses } from '@/shared/ui/button';
import { cn } from '@/shared/ui/cn';
import { ErrorState } from '@/shared/ui/error-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { estoqueProdutosOptions } from '../api/estoque.queries';
import {
  montarEstoquePronto,
  type ItemEstoquePronto,
} from '../estoque.calculos';

/**
 * Estoque pronto (FE-72): o saldo de cada receita que já teve produção. A
 * receita usada dentro de outra sem a produção dela fica negativa, com o selo
 * "Estoque negativo" dos insumos (FE-47) e o atalho "Registrar produção".
 */
export function EstoquePronto() {
  const saldos = useQuery(estoqueProdutosOptions());
  const receitas = useQuery(receitasListOptions());

  return (
    <section
      aria-labelledby="estoque-pronto-titulo"
      className="flex flex-col gap-3"
    >
      <h2 id="estoque-pronto-titulo" className="font-display text-title">
        Receitas prontas
      </h2>
      {saldos.isPending || receitas.isPending ? (
        <Skeleton
          aria-label="Carregando as receitas prontas"
          className="h-24"
        />
      ) : saldos.isError || receitas.isError ? (
        <ErrorState
          compacto
          title="Não consegui buscar as receitas prontas agora."
          message={getErrorMessage(saldos.error ?? receitas.error)}
          onRetry={() => {
            void saldos.refetch();
            void receitas.refetch();
          }}
          retrying={saldos.isFetching || receitas.isFetching}
        />
      ) : saldos.data.length === 0 ? (
        <p className="text-small text-ink-muted">
          Nenhuma receita pronta ainda. Anote uma fornada para ela aparecer
          aqui.
        </p>
      ) : (
        <ul
          aria-label="Receitas prontas"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {montarEstoquePronto(saldos.data, receitas.data).map((item) => (
            <li key={item.receitaId}>
              <CartaoPronto item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CartaoPronto({ item }: { item: ItemEstoquePronto }) {
  return (
    <article className="flex h-full flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-ink">
      <h3 className="text-body font-semibold wrap-anywhere">{item.nome}</h3>
      {item.estoqueNegativo ? <EstoqueNegativoBadge /> : null}
      <dl className="flex flex-col gap-0.5">
        <dt className="text-small text-ink-muted">Disponível</dt>
        <dd
          className={cn(
            'font-semibold tabular-nums',
            item.estoqueNegativo && 'text-danger',
          )}
        >
          {formatQuantidade(item.quantidade, item.unidade)}
        </dd>
      </dl>
      {item.estoqueNegativo ? (
        <Link
          href={`/producoes?novo=1&receitaId=${item.receitaId}`}
          aria-label={`Registrar produção de ${item.nome}`}
          className={cn(
            buttonClasses('secundario', undefined, 'compacto'),
            'mt-auto self-start',
          )}
        >
          Registrar produção
        </Link>
      ) : null}
    </article>
  );
}
