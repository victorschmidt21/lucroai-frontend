'use client';

import { useId, useState } from 'react';
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
import {
  IconAdicionar,
  IconEditar,
  IconHistorico,
} from '@/shared/ui/icons/acoes';
import { ProgressBar } from '@/shared/ui/progress-bar';
import type { ItemEstoque } from '../hooks/use-estoques';
import { EntradaEstoqueDialog } from './entrada-estoque-dialog';
import { EstoqueMinimoDialog } from './estoque-minimo-dialog';
import { MovimentacoesDrawer } from './movimentacoes-drawer';

/** Cartão de um insumo. Origem: estoque_card.dart. */
export function EstoqueCard({ insumo, estoque }: ItemEstoque) {
  const tituloId = useId();
  const unidade = UNIDADE_MEDIDA_ROTULOS[insumo.unidade];
  const [entradaAberta, setEntradaAberta] = useState(false);
  const [minimoAberto, setMinimoAberto] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);

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

      {estoque ? (
        <Saldo estoque={estoque} nome={insumo.nome} unidade={insumo.unidade} />
      ) : (
        <p role="alert" className="text-small text-ink-muted">
          Não foi possível carregar o estoque deste insumo.
        </p>
      )}

      {/* "Registrar entrada" e "Definir mínimo" precisam do saldo atual; o histórico, não. */}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {estoque ? (
          <>
            <Button size="compacto" onClick={() => setEntradaAberta(true)}>
              <IconAdicionar className="size-4" />
              Registrar entrada
            </Button>
            <Button
              variant="secundario"
              size="compacto"
              onClick={() => setMinimoAberto(true)}
            >
              <IconEditar className="size-4" />
              Definir mínimo
            </Button>
          </>
        ) : null}
        <Button
          variant="secundario"
          size="compacto"
          onClick={() => setHistoricoAberto(true)}
        >
          <IconHistorico className="size-4" />
          Histórico
        </Button>
      </div>

      {estoque ? (
        <EntradaEstoqueDialog
          open={entradaAberta}
          onOpenChange={setEntradaAberta}
          insumo={insumo}
          estoque={estoque}
        />
      ) : null}
      {/* Montado só aberto, para o campo começar com o mínimo atual. */}
      {estoque && minimoAberto ? (
        <EstoqueMinimoDialog
          open
          onOpenChange={setMinimoAberto}
          insumo={insumo}
          estoque={estoque}
        />
      ) : null}
      <MovimentacoesDrawer
        open={historicoAberto}
        onOpenChange={setHistoricoAberto}
        insumo={insumo}
      />
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
