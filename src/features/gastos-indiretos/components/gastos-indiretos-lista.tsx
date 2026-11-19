'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import { hrefComFiltros } from '@/shared/api/filtros';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero } from '@/shared/format/numero';
import { MetodoRateioBadge } from '@/shared/ui/badge';
import { Button, IconButton } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  IconAdicionar,
  IconEditar,
  IconExcluir,
  IconInfo,
} from '@/shared/ui/icons/acoes';
import { ListPage } from '@/shared/ui/list-page';
import { useToast } from '@/shared/ui/toast';
import { gastosIndiretosListOptions } from '../api/gastos-indiretos.queries';
import { calcularTotalGastos } from '../gastos-indiretos.calculos';
import { useDeleteGastoIndireto } from '../hooks/use-delete-gasto-indireto';
import { GastoIndiretoFormDialog } from './gasto-indireto-form-dialog';

type Formulario = { aberto: boolean; gasto?: GastoIndireto };

/** Tela de gastos indiretos. Origem: gastos_indiretos_page.dart. */
export function GastosIndiretosLista({
  abrirNovo = false,
}: {
  abrirNovo?: boolean;
}) {
  const query = useQuery(gastosIndiretosListOptions());
  const toast = useToast();
  const excluir = useDeleteGastoIndireto();
  const [formulario, setFormulario] = useState<Formulario>({
    aberto: abrirNovo,
  });
  const [paraExcluir, setParaExcluir] = useState<GastoIndireto | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function alternarFormulario(aberto: boolean) {
    setFormulario((atual) => ({ ...atual, aberto }));
    // `?novo=1` (ação rápida do painel) abre a criação uma vez; ao fechar, sai da URL.
    if (!aberto && searchParams.has('novo')) {
      router.replace(hrefComFiltros(pathname, searchParams, { novo: null }), {
        scroll: false,
      });
    }
  }

  const novoGasto = (
    <Button onClick={() => setFormulario({ aberto: true })}>
      <IconAdicionar className="size-5" />
      Novo gasto
    </Button>
  );

  const gastos = query.data ?? [];

  return (
    <>
      <ListPage
        title="Gastos Indiretos"
        subtitle="Custos rateados automaticamente nas receitas"
        actions={novoGasto}
        label="Gastos indiretos"
        query={query}
        itemLabel={{ singular: 'gasto', plural: 'gastos' }}
        summary={
          <>
            <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/8 p-3 text-small text-ink">
              <IconInfo className="size-4 shrink-0 text-warning" />
              Alterações afetam o custo unitário de todas as receitas
              automaticamente.
            </p>
            {gastos.length > 0 ? <TotalGastos gastos={gastos} /> : null}
          </>
        }
        emptyTitle="Nenhum gasto cadastrado"
        emptyDescription="Adicione água, energia, gás, aluguel e outros custos para calcular o custo real das receitas."
        emptyAction={novoGasto}
        errorTitle="Não foi possível carregar os gastos."
        getRowKey={(gasto) => gasto.id}
        columns={[
          {
            id: 'descricao',
            header: 'Descrição',
            cell: (gasto) => gasto.descricao,
          },
          {
            id: 'metodoRateio',
            header: 'Método de rateio',
            cell: (gasto) => <MetodoRateioBadge metodo={gasto.metodoRateio} />,
          },
          {
            id: 'valor',
            header: 'Valor',
            align: 'right',
            cell: (gasto) => formatMoeda(gasto.valor),
          },
          {
            id: 'acoes',
            header: 'Ações',
            acoes: true,
            cell: (gasto) => (
              <>
                <IconButton
                  aria-label={`Editar ${gasto.descricao}`}
                  onClick={() => setFormulario({ aberto: true, gasto })}
                >
                  <IconEditar />
                </IconButton>
                <IconButton
                  aria-label={`Excluir ${gasto.descricao}`}
                  onClick={() => setParaExcluir(gasto)}
                >
                  <IconExcluir />
                </IconButton>
              </>
            ),
          },
        ]}
      />

      <GastoIndiretoFormDialog
        // A key recria o formulário com os valores do gasto escolhido.
        key={formulario.gasto?.id ?? 'novo'}
        open={formulario.aberto}
        onOpenChange={alternarFormulario}
        gasto={formulario.gasto}
      />

      <ConfirmDialog
        open={paraExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setParaExcluir(null);
        }}
        title="Excluir gasto"
        description={`Deseja excluir "${paraExcluir?.descricao ?? ''}"? Isso afetará o custo de todas as receitas.`}
        confirmLabel="Excluir"
        // Rejeitar mantém o diálogo aberto, com a mensagem do backend.
        onConfirm={async () => {
          if (!paraExcluir) return;
          await excluir.mutateAsync(paraExcluir.id);
          toast.success('Gasto excluído com sucesso.');
          setParaExcluir(null);
        }}
      />
    </>
  );
}

/** Cartão "Total de gastos" (`_buildTotalCard` do mobile). */
function TotalGastos({ gastos }: { gastos: readonly GastoIndireto[] }) {
  const quantidade = gastos.length;

  return (
    <section
      aria-label="Total de gastos"
      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3.5"
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-small text-ink-muted">Total de gastos</p>
        <p className="text-small text-ink">
          {`${formatNumero(quantidade)} ${quantidade === 1 ? 'item' : 'itens'}`}
        </p>
      </div>
      <p className="text-title text-accent tabular-nums">
        {formatMoeda(calcularTotalGastos(gastos))}
      </p>
    </section>
  );
}
