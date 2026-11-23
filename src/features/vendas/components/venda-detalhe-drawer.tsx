'use client';

import type { Venda } from '@/shared/api/contracts/sales';
import { formatData } from '@/shared/format/data';
import { formatMoeda } from '@/shared/format/moeda';
import { formatQuantidade } from '@/shared/format/numero';
import { StatusVendaBadge } from '@/shared/ui/badge';
import { Drawer } from '@/shared/ui/drawer';
import {
  descreverLucroReal,
  subtotalItem,
  totalDaVenda,
} from '../vendas.calculos';

type Props = {
  venda: Venda;
  /** Nome da receita do item, ou "Produto #<id>". */
  nomeDoItem: (receitaId: number) => string;
  /** Nome do canal da venda (FE-46). */
  canal: string;
  onFechar: () => void;
};

/**
 * Detalhe da venda (FE-18, só na web): por item, preço real, custo unitário
 * (snapshot gravado na criação) e lucro real (FE-46), gravado pelo backend.
 */
export function VendaDetalheDrawer({
  venda,
  nomeDoItem,
  canal,
  onFechar,
}: Props) {
  return (
    <Drawer
      title={`Venda #${venda.id}`}
      description={formatData(venda.dataVenda)}
      open
      onOpenChange={(aberto) => {
        if (!aberto) onFechar();
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="flex items-center justify-between gap-3 text-body text-ink-muted">
          <span>Status</span>
          <StatusVendaBadge status={venda.status} />
        </p>
        <p className="flex items-center justify-between gap-3 text-body text-ink-muted">
          <span>Onde vendeu</span>
          <span className="font-semibold text-ink">{canal}</span>
        </p>

        <ul aria-label="Itens da venda" className="flex flex-col gap-2">
          {venda.itens.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3"
            >
              <p className="flex justify-between gap-3">
                <span className="min-w-0 font-semibold wrap-anywhere">
                  {nomeDoItem(item.receitaId)}
                </span>
                <span className="shrink-0 font-semibold text-accent tabular-nums">
                  {formatMoeda(
                    subtotalItem({
                      quantidade: item.quantidade,
                      precoUnitario: item.precoUnitarioReal,
                    }),
                  )}
                </span>
              </p>
              <dl className="grid grid-cols-3 gap-2 text-small">
                <Dado
                  rotulo="Preço real"
                  valor={`${formatQuantidade(item.quantidade)} × ${formatMoeda(item.precoUnitarioReal)}`}
                />
                <Dado
                  rotulo="Custo unitário"
                  valor={formatMoeda(item.custoUnitario)}
                />
                <LucroReal lucroReal={item.lucroReal} />
              </dl>
            </li>
          ))}
        </ul>

        <p className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-body font-semibold">Total</span>
          <span className="text-title text-accent tabular-nums">
            {formatMoeda(totalDaVenda(venda))}
          </span>
        </p>
      </div>
    </Drawer>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-ink-muted">{rotulo}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}

/** Lucro real do item em % do preço; negativo em cor de alerta e com "(prejuízo)". */
function LucroReal({ lucroReal }: { lucroReal: number | null }) {
  const { texto, prejuizo } = descreverLucroReal(lucroReal);
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-ink-muted">Lucro real</dt>
      <dd
        className={
          prejuizo
            ? 'font-semibold text-danger tabular-nums'
            : 'text-success tabular-nums'
        }
      >
        {texto}
      </dd>
    </div>
  );
}
