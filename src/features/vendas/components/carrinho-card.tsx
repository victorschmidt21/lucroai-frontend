'use client';

import Link from 'next/link';
import { useId } from 'react';
import { getErrorMessage, isEstoqueInsuficiente } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero } from '@/shared/format/numero';
import { Alert } from '@/shared/ui/alert';
import { Button, IconButton } from '@/shared/ui/button';
import { IconFechar } from '@/shared/ui/icons/acoes';
import type { ItemCarrinho } from '../schemas/item-venda.schema';
import { subtotalItem, totalCarrinho } from '../vendas.calculos';

const MENSAGEM_ESTOQUE_INSUFICIENTE =
  'Estoque insuficiente para registrar a venda. Cadastre a produção do item em Produções.';

type Props = {
  itens: readonly ItemCarrinho[];
  onRemover: (chave: number) => void;
  onRegistrar: () => void;
  registrando: boolean;
  /** Erro do último `POST /vendas`. */
  erro: unknown;
};

/** Carrinho e "Registrar Venda". Origem: `_buildCarrinho` de vendas_page.dart. */
export function CarrinhoCard({
  itens,
  onRemover,
  onRegistrar,
  registrando,
  erro,
}: Props) {
  const tituloId = useId();
  const quantidadeDeItens = `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`;

  return (
    <section
      aria-labelledby={tituloId}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-ink"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={tituloId} className="text-body font-semibold">
          Carrinho
        </h2>
        <span className="text-small text-ink-muted">{quantidadeDeItens}</span>
      </div>

      {itens.length === 0 ? (
        <p className="text-body text-ink-muted">
          Adicione produtos para registrar a venda.
        </p>
      ) : (
        <ul aria-label="Itens do carrinho" className="flex flex-col gap-2">
          {itens.map((item) => (
            <li key={item.chave} className="flex items-center gap-2">
              <div className="flex min-w-0 grow flex-col">
                <span className="truncate text-body">{item.nome}</span>
                <span className="text-small text-ink-muted tabular-nums">
                  {`${formatNumero(item.quantidade)} × ${formatMoeda(item.precoUnitario)}`}
                </span>
              </div>
              <span className="shrink-0 text-body font-semibold text-accent tabular-nums">
                {formatMoeda(subtotalItem(item))}
              </span>
              <IconButton
                aria-label={`Remover ${item.nome}`}
                disabled={registrando}
                onClick={() => onRemover(item.chave)}
              >
                <IconFechar className="size-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-body font-semibold">Total</span>
        <span className="text-title text-accent tabular-nums">
          {formatMoeda(totalCarrinho(itens))}
        </span>
      </p>

      {erro ? <ErroAoRegistrar erro={erro} /> : null}

      <Button
        onClick={onRegistrar}
        disabled={itens.length === 0}
        loading={registrando}
      >
        Registrar Venda
      </Button>
    </section>
  );
}

function ErroAoRegistrar({ erro }: { erro: unknown }) {
  if (!isEstoqueInsuficiente(erro)) {
    return <Alert>{getErrorMessage(erro)}</Alert>;
  }

  return (
    <Alert>
      <span>
        {MENSAGEM_ESTOQUE_INSUFICIENTE}{' '}
        <Link href="/producoes" className="font-semibold text-accent underline">
          Ir para Produções
        </Link>
      </span>
    </Alert>
  );
}
