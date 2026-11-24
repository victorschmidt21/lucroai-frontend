'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import type { CompraInsumo, Insumo } from '@/shared/api/contracts/catalog';
import { getErrorMessage } from '@/shared/api/errors';
import { formatData } from '@/shared/format/data';
import { formatCustoUnitario, formatMoeda } from '@/shared/format/moeda';
import { formatQuantidade } from '@/shared/format/numero';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/ui/cn';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Drawer } from '@/shared/ui/drawer';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { IconAdicionar, IconHistorico } from '@/shared/ui/icons/acoes';
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/shared/ui/toast';
import { Termo } from '@/features/aprender/components/termo';
import { comprasInsumoOptions } from '../api/insumos.queries';
import { useUpdateInsumo } from '../hooks/use-update-insumo';
import { VOLTAR_AO_ULTIMO_CUSTO } from '../schemas/preco-mercado.schema';
import { CompraInsumoDialog } from './compra-insumo-dialog';
import { PrecoMercadoDialog } from './preco-mercado-dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** O insumo da lista: depois de uma compra, chega atualizado pela invalidação. */
  insumo: Insumo;
  /** Já abre "Registrar compra" (link do aviso de estoque negativo, FE-47). */
  abrirCompra?: boolean;
};

type Acao = 'compra' | 'preco' | 'voltar' | null;

/**
 * Detalhe do insumo (FE-43): estoque, custo médio, última compra e preço de
 * hoje, com "Registrar compra", "Já sei que o preço mudou" e as compras.
 */
export function InsumoDetalheDrawer({
  open,
  onOpenChange,
  insumo,
  abrirCompra = false,
}: Props) {
  const [acao, setAcao] = useState<Acao>(abrirCompra ? 'compra' : null);
  const update = useUpdateInsumo();
  const toast = useToast();
  const fecharAcao = (aberto: boolean) => {
    if (!aberto) setAcao(null);
  };

  return (
    <Drawer
      title={insumo.nome}
      description="Compras e preços"
      open={open}
      onOpenChange={onOpenChange}
    >
      <dl className="grid grid-cols-1 gap-2">
        <Numero
          rotulo="Em estoque"
          valor={formatQuantidade(insumo.quantidadeDisponivel, insumo.unidade)}
          explicacao={
            insumo.estoqueNegativo ? (
              <>
                <Termo id="estoque-negativo">Estoque negativo</Termo>: registre
                a compra para acertar o saldo e o custo.
              </>
            ) : undefined
          }
          negativo={insumo.estoqueNegativo}
        />
        <Numero
          rotulo={<Termo id="custo-medio">Custo médio</Termo>}
          valor={formatCustoUnitario(insumo.custoMedio, insumo.unidade)}
          explicacao="Quanto você pagou, em média, pelo que tem guardado."
        />
        <Numero
          rotulo="Última compra"
          valor={formatCustoUnitario(insumo.ultimoCusto, insumo.unidade)}
          explicacao="Quanto custou na compra mais recente."
        />
        <Numero
          rotulo="Preço de hoje"
          valor={formatCustoUnitario(insumo.custoReposicao, insumo.unidade)}
          explicacao={
            insumo.precoMercado === null
              ? 'Usado para calcular o preço de venda. É o da última compra.'
              : `Usado para calcular o preço de venda. Você informou este preço em ${formatData(insumo.precoMercadoData)}.`
          }
          destaque
        />
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAcao('compra')}>
          <IconAdicionar className="size-5" />
          Registrar compra
        </Button>
        <Button variant="secundario" onClick={() => setAcao('preco')}>
          Já sei que o preço mudou
        </Button>
        {insumo.precoMercado === null ? null : (
          <Button variant="fantasma" onClick={() => setAcao('voltar')}>
            Voltar ao preço da última compra
          </Button>
        )}
      </div>

      <section aria-labelledby="compras-titulo" className="flex flex-col gap-2">
        <h3 id="compras-titulo" className="font-semibold">
          Compras
        </h3>
        {open ? <Compras insumo={insumo} /> : null}
      </section>

      <CompraInsumoDialog
        open={acao === 'compra'}
        onOpenChange={fecharAcao}
        insumo={insumo}
      />
      <PrecoMercadoDialog
        // A key recria o formulário com a quantidade do último preço.
        key={`preco-${insumo.quantidadeBaseCusto}`}
        open={acao === 'preco'}
        onOpenChange={fecharAcao}
        insumo={insumo}
      />
      <ConfirmDialog
        open={acao === 'voltar'}
        onOpenChange={fecharAcao}
        title="Voltar ao preço da última compra"
        description={`O preço de hoje volta a ser ${formatCustoUnitario(insumo.ultimoCusto, insumo.unidade)}.`}
        confirmLabel="Voltar ao preço"
        onConfirm={async () => {
          await update.mutateAsync({
            id: insumo.id,
            body: VOLTAR_AO_ULTIMO_CUSTO,
          });
          toast.success('Preço de hoje atualizado.');
          setAcao(null);
        }}
      />
    </Drawer>
  );
}

function Numero({
  rotulo,
  valor,
  explicacao,
  destaque = false,
  negativo = false,
}: {
  rotulo: ReactNode;
  valor: string;
  explicacao?: ReactNode;
  destaque?: boolean;
  /** Saldo abaixo de zero: vermelho, com a explicação em texto (FE-47). */
  negativo?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 rounded-md border border-border bg-surface-alt p-3">
      <dt className="text-small text-ink-muted">{rotulo}</dt>
      <dd
        className={cn(
          'font-semibold tabular-nums',
          destaque && 'text-accent',
          negativo && 'text-danger',
        )}
      >
        {valor}
      </dd>
      {explicacao ? (
        <dd className="col-span-2 text-small text-ink-muted">{explicacao}</dd>
      ) : null}
    </div>
  );
}

function Compras({ insumo }: { insumo: Insumo }) {
  const compras = useQuery(comprasInsumoOptions(insumo.id));

  if (compras.isPending) {
    return <Skeleton aria-label="Carregando as compras" className="h-32" />;
  }

  if (compras.isError) {
    return (
      <ErrorState
        title="Erro ao carregar as compras"
        message={getErrorMessage(compras.error)}
        onRetry={() => void compras.refetch()}
        retrying={compras.isFetching}
      />
    );
  }

  if (compras.data.length === 0) {
    return (
      <EmptyState icon={<IconHistorico />} title="Nenhuma compra registrada." />
    );
  }

  return (
    <ul aria-label="Compras" className="flex flex-col gap-2">
      {compras.data.map((compra) => (
        <li key={compra.id}>
          <ItemCompra compra={compra} insumo={insumo} />
        </li>
      ))}
    </ul>
  );
}

function ItemCompra({
  compra,
  insumo,
}: {
  compra: CompraInsumo;
  insumo: Insumo;
}) {
  return (
    <article className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-semibold tabular-nums">
          {formatQuantidade(compra.quantidade, insumo.unidade)} por{' '}
          {formatMoeda(compra.valorTotal)}
        </p>
        <p className="text-small text-ink-muted">
          {formatData(compra.dataCompra)}
          {compra.observacao ? ` · ${compra.observacao}` : null}
        </p>
      </div>
      <span className="shrink-0 text-small font-semibold tabular-nums">
        {formatCustoUnitario(compra.custoUnitario, insumo.unidade)}
      </span>
    </article>
  );
}
