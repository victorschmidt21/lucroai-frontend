'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { hrefComFiltros } from '@/shared/api/filtros';
import { formatCustoUnitario, formatMoeda } from '@/shared/format/moeda';
import { formatQuantidade } from '@/shared/format/numero';
import { EstoqueNegativoBadge } from '@/shared/ui/badge';
import { Button, IconButton } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  IconAdicionar,
  IconDinheiro,
  IconEditar,
  IconExcluir,
} from '@/shared/ui/icons/acoes';
import { IlustracaoDespensa } from '@/shared/ui/ilustracoes';
import { ListPage } from '@/shared/ui/list-page';
import { useToast } from '@/shared/ui/toast';
import { DicaNaHora } from '@/features/aprender/components/dica-na-hora';
import { Termo } from '@/features/aprender/components/termo';
import { insumosListOptions } from '../api/insumos.queries';
import { useDeleteInsumo } from '../hooks/use-delete-insumo';
import { InsumoDetalheDrawer } from './insumo-detalhe-drawer';
import { InsumoFormDialog } from './insumo-form-dialog';

type Formulario = { aberto: boolean; insumo?: Insumo };

/**
 * Tela de insumos. Origem: insumos_page.dart, insumo_card.dart e
 * insumos_search_bar.dart.
 */
export function InsumosLista({
  abrirNovo = false,
  abrirCompraDe,
}: {
  abrirNovo?: boolean;
  /** Abre o detalhe do insumo com "Registrar compra" (`?compra=<id>`, FE-47). */
  abrirCompraDe?: number;
}) {
  const query = useQuery(insumosListOptions());
  const toast = useToast();
  const excluir = useDeleteInsumo();
  const [formulario, setFormulario] = useState<Formulario>({
    aberto: abrirNovo,
  });
  const [paraExcluir, setParaExcluir] = useState<Insumo | null>(null);
  // Guarda o id: o detalhe lê o insumo da lista, que volta atualizada depois
  // de uma compra ou de um preço novo.
  const [detalheId, setDetalheId] = useState<number | null>(
    abrirCompraDe ?? null,
  );
  const detalhe = query.data?.find(({ id }) => id === detalheId);
  // A Pitada vai só no primeiro selo "Estoque negativo" da tela (FE-64).
  const primeiroNegativo = query.data?.find(
    (insumo) => insumo.estoqueNegativo,
  )?.id;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function fecharDetalhe() {
    setDetalheId(null);
    // `?compra=<id>` (aviso de estoque negativo) abre uma vez; ao fechar, sai da URL.
    if (searchParams.has('compra')) {
      router.replace(hrefComFiltros(pathname, searchParams, { compra: null }), {
        scroll: false,
      });
    }
  }

  function alternarFormulario(aberto: boolean) {
    setFormulario((atual) => ({ ...atual, aberto }));
    // `?novo=1` (ação rápida do painel) abre a criação uma vez; ao fechar, sai da URL.
    if (!aberto && searchParams.has('novo')) {
      router.replace(hrefComFiltros(pathname, searchParams, { novo: null }), {
        scroll: false,
      });
    }
  }

  const novoInsumo = (
    <Button onClick={() => setFormulario({ aberto: true })}>
      <IconAdicionar className="size-5" />
      Novo ingrediente
    </Button>
  );

  return (
    <>
      <ListPage
        title="Ingredientes e embalagens"
        subtitle="O que você compra para produzir"
        actions={novoInsumo}
        topo={<DicaNaHora tela="insumos" />}
        label="Ingredientes e embalagens"
        query={query}
        searchField="nome"
        searchPlaceholder="Buscar ingrediente"
        itemLabel={{ singular: 'ingrediente', plural: 'ingredientes' }}
        emptyTitle="Sua despensa está vazia"
        emptyDescription="Comece pelo ingrediente que você mais usa, como leite condensado."
        emptyIlustracao={<IlustracaoDespensa />}
        emptyAction={
          <Button onClick={() => setFormulario({ aberto: true })}>
            <IconAdicionar className="size-5" />
            Adicionar ingrediente
          </Button>
        }
        errorTitle="Não consegui buscar seus ingredientes agora."
        getRowKey={(insumo) => insumo.id}
        columns={[
          {
            id: 'nome',
            header: 'Nome',
            cell: (insumo) =>
              insumo.estoqueNegativo ? (
                <span className="flex flex-col items-start gap-1">
                  <span>{insumo.nome}</span>
                  {insumo.id === primeiroNegativo ? (
                    <Termo id="estoque-negativo">
                      <EstoqueNegativoBadge />
                    </Termo>
                  ) : (
                    <EstoqueNegativoBadge />
                  )}
                  <span className="text-small font-semibold text-danger tabular-nums">
                    Saldo:{' '}
                    {formatQuantidade(
                      insumo.quantidadeDisponivel,
                      insumo.unidade,
                    )}
                  </span>
                </span>
              ) : (
                insumo.nome
              ),
          },
          {
            id: 'quantidade',
            header: 'Quantidade',
            align: 'right',
            cell: (insumo) =>
              formatQuantidade(insumo.quantidadeBaseCusto, insumo.unidade),
          },
          {
            id: 'valorPago',
            header: 'Valor pago',
            align: 'right',
            cell: (insumo) => formatMoeda(insumo.valorPago),
          },
          {
            id: 'custoUnitario',
            // `custoUnitario` é o preço de hoje (`custoReposicao`, BE-29).
            header: 'Preço de hoje',
            align: 'right',
            // O valor gravado pelo backend, sem recalcular na tela.
            cell: (insumo) =>
              formatCustoUnitario(insumo.custoUnitario, insumo.unidade),
          },
          {
            id: 'acoes',
            header: 'Ações',
            acoes: true,
            cell: (insumo) => (
              <>
                <IconButton
                  aria-label={`Compras e preços de ${insumo.nome}`}
                  onClick={() => setDetalheId(insumo.id)}
                >
                  <IconDinheiro />
                </IconButton>
                <IconButton
                  aria-label={`Editar ${insumo.nome}`}
                  onClick={() => setFormulario({ aberto: true, insumo })}
                >
                  <IconEditar />
                </IconButton>
                <IconButton
                  aria-label={`Excluir ${insumo.nome}`}
                  onClick={() => setParaExcluir(insumo)}
                >
                  <IconExcluir />
                </IconButton>
              </>
            ),
          },
        ]}
      />

      <InsumoFormDialog
        // A key recria o formulário com os valores do insumo escolhido.
        key={formulario.insumo?.id ?? 'novo'}
        open={formulario.aberto}
        onOpenChange={alternarFormulario}
        insumo={formulario.insumo}
      />

      {detalhe ? (
        <InsumoDetalheDrawer
          open
          onOpenChange={(aberto) => {
            if (!aberto) fecharDetalhe();
          }}
          insumo={detalhe}
          abrirCompra={abrirCompraDe === detalhe.id}
        />
      ) : null}

      <ConfirmDialog
        open={paraExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setParaExcluir(null);
        }}
        title="Excluir ingrediente"
        description={`Deseja excluir "${paraExcluir?.nome ?? ''}"?`}
        confirmLabel="Excluir"
        // Rejeitar mantém o diálogo aberto, com a mensagem do backend.
        onConfirm={async () => {
          if (!paraExcluir) return;
          await excluir.mutateAsync(paraExcluir.id);
          toast.success('Ingrediente excluído.');
          setParaExcluir(null);
        }}
      />
    </>
  );
}
