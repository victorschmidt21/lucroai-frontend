'use client';

import Link from 'next/link';
import type {
  AlertaEstoqueNegativo,
  AlertaPrecoDefasado,
  Alertas,
} from '@/shared/api/contracts/catalog';
import { formatMoeda } from '@/shared/format/moeda';
import { formatMargem, formatQuantidade } from '@/shared/format/numero';
import { EstoqueNegativoBadge } from '@/shared/ui/badge';
import { Button, buttonClasses } from '@/shared/ui/button';
import { ResponsiveDialog } from '@/shared/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertas: Alertas;
};

/**
 * Lista de avisos (FE-47, docs/business-rules.md#avisos-ao-entrar): estoque
 * negativo, com o link para registrar a compra, e ingredientes que ficaram
 * mais caros, com o preço novo sugerido e o link para a receita. Seguir um
 * link fecha o aviso.
 */
export function AvisosDialog({ open, onOpenChange, alertas }: Props) {
  const fechar = () => onOpenChange(false);

  return (
    <ResponsiveDialog
      title="Avisos"
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <Button variant="secundario" onClick={fechar}>
          Fechar
        </Button>
      }
    >
      {alertas.estoqueNegativo.length > 0 ? (
        <section
          aria-labelledby="aviso-estoque-negativo"
          className="flex flex-col gap-2"
        >
          <h3 id="aviso-estoque-negativo" className="text-body font-semibold">
            Estes ingredientes estão com estoque negativo: registre a compra
            para acertar o saldo e o custo.
          </h3>
          <ul className="flex flex-col gap-2">
            {alertas.estoqueNegativo.map((item) => (
              <li key={item.id}>
                <ItemEstoqueNegativo item={item} onNavegar={fechar} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {alertas.precoDefasado.length > 0 ? (
        <section
          aria-labelledby="aviso-preco-defasado"
          className="flex flex-col gap-2"
        >
          <h3 id="aviso-preco-defasado" className="text-body font-semibold">
            Estes ingredientes ficaram mais caros: o preço destes produtos
            precisa subir.
          </h3>
          <ul className="flex flex-col gap-2">
            {alertas.precoDefasado.map((item) => (
              <li key={item.id}>
                <ItemPrecoDefasado item={item} onNavegar={fechar} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </ResponsiveDialog>
  );
}

function ItemEstoqueNegativo({
  item,
  onNavegar,
}: {
  item: AlertaEstoqueNegativo;
  onNavegar: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-alt p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-semibold wrap-anywhere">{item.nome}</span>
        <span className="flex flex-wrap items-center gap-2">
          <EstoqueNegativoBadge />
          <span className="text-small font-semibold text-danger tabular-nums">
            Saldo: {formatQuantidade(item.saldo, item.unidade)}
          </span>
        </span>
      </div>
      <Link
        href={`/insumos?compra=${item.id}`}
        aria-label={`Registrar compra de ${item.nome}`}
        onClick={onNavegar}
        className={buttonClasses('primario', undefined, 'compacto')}
      >
        Registrar compra
      </Link>
    </div>
  );
}

function ItemPrecoDefasado({
  item,
  onNavegar,
}: {
  item: AlertaPrecoDefasado;
  onNavegar: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-alt p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-semibold wrap-anywhere">{item.nome}</span>
        <span className="text-small text-ink-muted">
          {formatMargem(item.aumentoPercentual)} mais caro
        </span>
      </div>
      {item.receitas.length === 0 ? (
        <p className="text-small text-ink-muted">
          Nenhum produto usa este ingrediente.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {item.receitas.map((receita) => (
            <li
              key={receita.id}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="wrap-anywhere">{receita.nome}</span>
                <span className="text-small text-ink-muted tabular-nums">
                  {receita.precoSugerido === null
                    ? 'Sem preço que pague tudo: as taxas e o lucro passam de 100%.'
                    : `Preço novo sugerido: ${formatMoeda(receita.precoSugerido)} (antes ${formatMoeda(receita.precoComCustoMedio)})`}
                </span>
              </div>
              <Link
                href={`/receitas/${receita.id}`}
                aria-label={`Ver a receita ${receita.nome}`}
                onClick={onNavegar}
                className={buttonClasses('secundario', undefined, 'compacto')}
              >
                Ver receita
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
